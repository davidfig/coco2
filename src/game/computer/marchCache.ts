import { FULLSCREEN_VERT, Program, linkProgram } from '../../engine';

type Rect = [number, number, number, number];

/** Where the march looks from: the picture's centre (pixels) and pixels per panel unit. The march's picture is fixed in panel units. */
export type MarchView = { x: number; y: number; k: number };

/**
 * While the view moves, the kept picture reaches this share of the window past each side, so it can slide and shrink a
 * while before it must be marched again (at half scale on a 2× screen, the texture is then the window's size).
 */
const MARGIN = 0.5;
/**
 * While the view moves it is drawn from the kept picture so long as that has between `scale / BLUR` and `ALIAS` of its
 * pixels to each of the window's: any coarser it blurs, any finer it shimmers.
 */
const BLUR = 1.35;
const ALIAS = 1.7;

const BLIT_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec3 uMap; // window pixel to kept pixel: scale, then offset
out vec4 outColor;
void main() { outColor = texture(uTex, (gl_FragCoord.xy * uMap.x + uMap.yz) / vec2(textureSize(uTex, 0))); }`;

const meet = (a: Rect, b: Rect): Rect => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
const empty = (r: Rect): boolean => r[2] <= r[0] || r[3] <= r[1];

/** The parts of `a` outside `b`, as up to four rectangles. */
function minus(a: Rect, b: Rect): Rect[] {
  const i = meet(a, b);
  if (empty(i)) return [a];
  const out: Rect[] = [];
  if (a[0] < i[0]) out.push([a[0], a[1], i[0], a[3]]);
  if (i[2] < a[2]) out.push([i[2], a[1], a[2], a[3]]);
  if (a[1] < i[1]) out.push([i[0], a[1], i[2], i[1]]);
  if (i[3] < a[3]) out.push([i[0], i[3], i[2], a[3]]);
  return out;
}

/**
 * A full-screen pass that is costly to run but changes only with what it is given (the computer's march): what it drew
 * is kept, premultiplied, and drawn again only when `key` changes. Its picture is fixed in panel units, so while the view
 * moves the kept one is drawn moved and scaled with it, and only what comes into view is marched (at `scale` < 1, a share
 * of the window's pixels); it is marched whole again when the view has drifted too far from it, and sharp once the view
 * stops. Call `draw` with the scissor already set to where it may draw.
 */
export class MarchCache {
  private readonly blit: Program;
  private readonly tex: WebGLTexture;
  private readonly fb: WebGLFramebuffer;
  /** The kept texture's size: grown as needed, never shrunk. */
  private tw = 0;
  private th = 0;
  private key: number[] = [];
  private partKey: number[] = [];
  /** What the kept picture was marched for: the view, the scale, and where the window's origin lies in it (window pixels). */
  private at: (MarchView & { s: number; ox: number; oy: number }) | null = null;
  /** What of it holds the march, in the view's units ((pixel - centre) / k): any view drawn from it is marched there. */
  private have: Rect = [0, 0, 0, 0];

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.blit = linkProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Forget what was kept: the next `draw` runs the pass. */
  invalidate(): void {
    this.key = [];
  }

  /** Whether two keys differ. */
  private static differ(a: readonly number[], b: readonly number[]): boolean {
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }

  /**
   * Draw the kept picture over the window for `view` (straight-alpha output blended as SRC_ALPHA), running `pass` where
   * it is missing: everywhere if `key` changed or the view stopped somewhere it wasn't marched, only what came into view
   * while it moves (`moving`, at `scale`). `pass(pic)` sets its program and uniforms, with `pic` for the picture's centre
   * and pixels per unit as it should march them, and draws its full-screen triangle; it runs into the kept texture,
   * blended so that it comes out premultiplied. `clip` is the scissor (window pixels). `part` is what changes only a
   * small piece of the picture (the keys): when it alone changed, the pass runs only over `part.clip(was)` (window
   * pixels, given the part's last key), and the rest of the kept picture stays.
   */
  draw(
    view: MarchView,
    key: number[],
    scale: number,
    moving: boolean,
    clip: Rect,
    pass: (pic: [number, number, number]) => void,
    part?: { key: ArrayLike<number>; clip: (was: readonly number[]) => Rect | null },
  ): void {
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const units = (r: Rect): Rect => [(r[0] - view.x) / view.k, (r[1] - view.y) / view.k, (r[2] - view.x) / view.k, (r[3] - view.y) / view.k];
    const need = units(clip);
    const partKey = part ? Array.from(part.key) : [];
    const a = this.at;
    // The kept picture's pixels to each of the window's, drawn for this view.
    const q = a ? (a.s * a.k) / view.k : 0;
    const whole =
      !a ||
      MarchCache.differ(key, this.key) ||
      (moving ? q < scale / BLUR || q > ALIAS || !this.holds(need) : scale !== a.s || view.x !== a.x || view.y !== a.y || view.k !== a.k);
    let marches: Rect[] = [];
    if (whole) {
      // Marched afresh for this view, with room round it to move into if it is moving.
      const m = moving ? MARGIN : 0;
      const [tw, th] = [Math.ceil(W * (1 + 2 * m) * scale), Math.ceil(H * (1 + 2 * m) * scale)];
      if (tw > this.tw || th > this.th) {
        [this.tw, this.th] = [Math.max(tw, this.tw), Math.max(th, this.th)];
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.tw, this.th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      this.at = { ...view, s: scale, ox: m * W, oy: m * H };
      this.key = key;
      marches = [need];
      this.have = need;
    } else {
      if (moving) {
        marches = minus(need, this.have);
        this.have = need;
      }
      if (part && MarchCache.differ(partKey, this.partKey)) {
        const c = part.clip(this.partKey);
        // Only within the whole pass's clip; nothing to march if they don't meet.
        marches.push(c ? meet(units(c), need) : need);
      }
    }
    this.partKey = partKey;
    const at = this.at!;
    // A rectangle in the view's units, in the kept texture's pixels.
    const toTex = (r: Rect): Rect => {
      const px = (u: number, c: number, o: number) => (u * at.k + c + o) * at.s;
      return [px(r[0], at.x, at.ox), px(r[1], at.y, at.oy), px(r[2], at.x, at.ox), px(r[3], at.y, at.oy)];
    };
    marches = marches.filter((r) => !empty(r));
    if (marches.length) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, this.tw, this.th);
      gl.clearColor(0, 0, 0, 0);
      if (whole) {
        gl.scissor(0, 0, this.tw, this.th);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ZERO, gl.ONE, gl.ZERO);
      for (const r of marches) {
        const [x0, y0, x1, y1] = toTex(r);
        gl.scissor(Math.floor(x0) - 1, Math.floor(y0) - 1, Math.ceil(x1 - x0) + 3, Math.ceil(y1 - y0) + 3);
        gl.clear(gl.COLOR_BUFFER_BIT);
        pass([(at.x + at.ox) * at.s, (at.y + at.oy) * at.s, at.k * at.s]);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.scissor(Math.floor(clip[0]), Math.floor(clip[1]), Math.ceil(clip[2] - clip[0]), Math.ceil(clip[3] - clip[1]));
    }
    // Window pixel → the view's units → the kept texture's pixel.
    const z = at.k / view.k;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.blit.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.blit.u.uTex, 0);
    gl.uniform3f(this.blit.u.uMap, z * at.s, (at.x + at.ox - view.x * z) * at.s, (at.y + at.oy - view.y * z) * at.s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }

  /** Whether the kept texture reaches over `r` (the view's units). */
  private holds(r: Rect): boolean {
    const a = this.at!;
    const u = (p: number, c: number, o: number, s: number) => (p / s - o - c) / a.k;
    return r[0] >= u(0, a.x, a.ox, a.s) && r[1] >= u(0, a.y, a.oy, a.s) && r[2] <= u(this.tw, a.x, a.ox, a.s) && r[3] <= u(this.th, a.y, a.oy, a.s);
  }
}
