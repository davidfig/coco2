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
/** A new kept picture is marched in this many bands, one a frame, while the old one still shows: when the view stops (sharp), or ahead of need while it moves. */
const BANDS = 4;
/**
 * While the view moves, the next kept picture is begun once it comes this near the limits (`BLUR`, `ALIAS`, and half the
 * margin left), so it is whole before the shown one gives out.
 */
const BLUR_SOON = 1.15;
const ALIAS_SOON = 1.45;
/** The next kept picture is marched for where the view will be this many frames on, going as it goes, so it lasts longer. */
const LEAD = 4;

const BLIT_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec3 uMap; // window pixel to kept pixel: scale, then offset
out vec4 outColor;
void main() { outColor = texture(uTex, (gl_FragCoord.xy * uMap.x + uMap.yz) / vec2(textureSize(uTex, 0))); }`;

const meet = (a: Rect, b: Rect): Rect => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
const empty = (r: Rect): boolean => r[2] <= r[0] || r[3] <= r[1];
const differ = (a: readonly number[], b: readonly number[]): boolean => a.length !== b.length || a.some((v, i) => v !== b[i]);

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

/** What a kept picture was marched for: the view, the scale, and where the window's origin lies in it (window pixels). */
type Anchor = MarchView & { s: number; ox: number; oy: number };

/** A kept picture: its texture (grown as needed, never shrunk) and what it was marched for. */
class Kept {
  readonly tex: WebGLTexture;
  readonly fb: WebGLFramebuffer;
  w = 0;
  h = 0;
  at: Anchor | null = null;

  constructor(private readonly gl: WebGL2RenderingContext) {
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

  /** Start afresh for `at`, `W`×`H` window pixels round it in all: big enough, and cleared. */
  reset(at: Anchor, W: number, H: number): void {
    const gl = this.gl;
    const [w, h] = [Math.ceil(W * at.s), Math.ceil(H * at.s)];
    if (w > this.w || h > this.h) {
      [this.w, this.h] = [Math.max(w, this.w), Math.max(h, this.h)];
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.w, this.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    this.at = at;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.scissor(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** A rectangle in the view's units, in this texture's pixels. */
  toTex(r: Rect): Rect {
    const a = this.at!;
    const px = (u: number, c: number, o: number) => (u * a.k + c + o) * a.s;
    return [px(r[0], a.x, a.ox), px(r[1], a.y, a.oy), px(r[2], a.x, a.ox), px(r[3], a.y, a.oy)];
  }

  /** Whether the texture reaches over `r` (the view's units). */
  holds(r: Rect): boolean {
    const a = this.at!;
    const u = (p: number, c: number, o: number) => (p / a.s - o - c) / a.k;
    return r[0] >= u(0, a.x, a.ox) && r[1] >= u(0, a.y, a.oy) && r[2] <= u(this.w, a.x, a.ox) && r[3] <= u(this.h, a.y, a.oy);
  }

  /** Run `pass` over each of `rs` (the view's units), into this texture. */
  march(rs: Rect[], pass: (pic: [number, number, number]) => void): void {
    const gl = this.gl;
    const a = this.at!;
    rs = rs.filter((r) => !empty(r));
    if (!rs.length) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ZERO, gl.ONE, gl.ZERO);
    for (const r of rs) {
      const [x0, y0, x1, y1] = this.toTex(r);
      gl.scissor(Math.floor(x0) - 1, Math.floor(y0) - 1, Math.ceil(x1 - x0) + 3, Math.ceil(y1 - y0) + 3);
      gl.clear(gl.COLOR_BUFFER_BIT);
      pass([(a.x + a.ox) * a.s, (a.y + a.oy) * a.s, a.k * a.s]);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}

/** A kept picture being made a band a frame: what for, the bands still to do, and what it will hold (the view's units). */
type Building = { ahead: boolean; key: number[]; view: MarchView; s: number; bands: Rect[]; need: Rect };

/**
 * A full-screen pass that is costly to run but changes only with what it is given (the computer's march): what it drew
 * is kept, premultiplied, and drawn again only when `key` changes. Its picture is fixed in panel units, so while the view
 * moves the kept one is drawn moved and scaled with it, and only what comes into view is marched (at `scale` < 1, a share
 * of the window's pixels). A new one is made in a second texture a band a frame while the old shows: ahead of need while
 * the view moves (it can't follow it for ever: it blurs, shimmers or runs out of margin), and sharp once it stops. Call
 * `draw` with the scissor already set to where it may draw.
 */
export class MarchCache {
  private readonly blit: Program;
  /** The picture shown, and the one being made. */
  private shown: Kept;
  private next: Kept;
  private key: number[] = [];
  private partKey: number[] = [];
  /** What of the shown picture holds the march, in the view's units ((pixel - centre) / k): any view drawn from it is marched there. */
  private have: Rect = [0, 0, 0, 0];
  private building: Building | null = null;
  /** The view the last frame was drawn for: how fast it is moving. */
  private last: MarchView | null = null;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.blit = linkProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);
    this.shown = new Kept(gl);
    this.next = new Kept(gl);
  }

  /** Forget what was kept: the next `draw` runs the pass. */
  invalidate(): void {
    this.key = [];
  }

  /**
   * Draw the kept picture over the window for `view` (straight-alpha output blended as SRC_ALPHA), running `pass` where
   * it is missing: what came into view while it moves (`moving`, at `scale`; everywhere if `key` changed), the next kept
   * picture a band a frame as the view nears the shown one's limits, and once it stops the sharp one (or one for a new
   * `key`) a band a frame. `pass(pic)` sets its program and uniforms, with `pic` for the picture's centre and pixels per
   * unit as it should march them, and draws its full-screen triangle; it runs into a kept texture, blended so that it
   * comes out premultiplied. `clip` is the scissor (window pixels). `part` is what changes only a small piece of the
   * picture (the keys): when it alone changed, the pass runs only over `part.clip(was)` (window pixels, given the part's
   * last key), and the rest of the kept picture stays.
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
    const partMoved = !!part && differ(partKey, this.partKey);
    const a = this.shown.at;
    // The shown picture's pixels to each of the window's, drawn for this view.
    const q = a ? (a.s * a.k) / view.k : 0;
    const there = !!a && scale === a.s && view.x === a.x && view.y === a.y && view.k === a.k;
    const same = !differ(key, this.key);
    // Stopped where the shown picture covers, but it isn't sharp there or the light changed: it stays up while the new one is made.
    const settle = !moving && !!a && !(there && same) && this.shown.holds(need) && minus(need, this.have).length === 0;
    const whole = !a || (moving ? !same || q < scale / BLUR || q > ALIAS || !this.shown.holds(need) : !(there && same) && !settle);
    // Moving, near enough the limits to begin the next one.
    const pad: Rect = [(-MARGIN * W) / 2 / view.k, (-MARGIN * H) / 2 / view.k, (MARGIN * W) / 2 / view.k, (MARGIN * H) / 2 / view.k];
    const soon = moving && !!a && (q < scale / BLUR_SOON || q > ALIAS_SOON || !this.shown.holds([need[0] + pad[0], need[1] + pad[1], need[2] + pad[2], need[3] + pad[3]]));
    const b = this.building;
    if (b && (whole || partMoved || differ(b.key, key) || b.ahead !== moving || (!moving && (b.s !== scale || b.view.x !== view.x || b.view.y !== view.y || b.view.k !== view.k))))
      this.building = null;
    if (whole) {
      // Marched afresh for this view, with room round it to move into if it is moving.
      this.shown.reset(this.anchor(view, scale, moving, W, H), W * (1 + 2 * (moving ? MARGIN : 0)), H * (1 + 2 * (moving ? MARGIN : 0)));
      this.key = key;
      this.shown.march([need], pass);
      this.have = need;
    } else {
      if (moving && (soon || this.building)) {
        // Aimed where the view is going, over what shows now and what will show there.
        const to = this.lead(view);
        const later: Rect = [(clip[0] - to.x) / to.k, (clip[1] - to.y) / to.k, (clip[2] - to.x) / to.k, (clip[3] - to.y) / to.k];
        const both: Rect = [Math.min(need[0], later[0]), Math.min(need[1], later[1]), Math.max(need[2], later[2]), Math.max(need[3], later[3])];
        this.build(to, key, scale, true, both, W, H, pass);
      }
      if (moving) {
        this.shown.march(minus(need, this.have), pass);
        this.have = need;
      }
      if (partMoved) {
        const c = part!.clip(this.partKey);
        // Only within the whole pass's clip.
        this.shown.march([c ? meet(units(c), need) : need], pass);
      }
      if (settle && !partMoved) this.build(view, key, scale, false, need, W, H, pass);
    }
    this.partKey = partKey;
    this.last = view;
    gl.viewport(0, 0, W, H);
    gl.scissor(Math.floor(clip[0]), Math.floor(clip[1]), Math.ceil(clip[2] - clip[0]), Math.ceil(clip[3] - clip[1]));
    this.show(view);
  }

  /** Where the view will be `LEAD` frames on, going as it went last frame. */
  private lead(view: MarchView): MarchView {
    const l = this.last;
    if (!l) return view;
    return { x: view.x + (view.x - l.x) * LEAD, y: view.y + (view.y - l.y) * LEAD, k: view.k * Math.pow(view.k / l.k, LEAD) };
  }

  /** What a kept picture for `view` is marched for: room round it to move into if it is moving. */
  private anchor(view: MarchView, s: number, moving: boolean, W: number, H: number): Anchor {
    const m = moving ? MARGIN : 0;
    return { x: view.x, y: view.y, k: view.k, s, ox: m * W, oy: m * H };
  }

  /**
   * One band of the next kept picture (begun for `view` if none is under way); when it is whole, it is the one shown. Made ahead, `view` is where the view is going: it is marched over `need` (what shows now and there).
   */
  private build(view: MarchView, key: number[], scale: number, ahead: boolean, need: Rect, W: number, H: number, pass: (pic: [number, number, number]) => void): void {
    if (!this.building) {
      const m = ahead ? MARGIN : 0;
      this.next.reset(this.anchor(view, scale, ahead, W, H), W * (1 + 2 * m), H * (1 + 2 * m));
      const h = (need[3] - need[1]) / BANDS;
      const bands = Array.from({ length: BANDS }, (_, i): Rect => [need[0], need[1] + i * h, need[2], i === BANDS - 1 ? need[3] : need[1] + (i + 1) * h]);
      this.building = { ahead, key, view, s: scale, bands, need };
    }
    const b = this.building;
    this.next.march([b.bands.shift()!], pass);
    if (b.bands.length) return;
    this.building = null;
    [this.shown, this.next] = [this.next, this.shown];
    this.key = b.key;
    this.have = b.need;
  }

  /** Lay the shown picture over the window, moved and scaled to `view`. */
  private show(view: MarchView): void {
    const gl = this.gl;
    const at = this.shown.at!;
    // Window pixel → the view's units → the kept texture's pixel.
    const z = at.k / view.k;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.blit.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shown.tex);
    gl.uniform1i(this.blit.u.uTex, 0);
    gl.uniform3f(this.blit.u.uMap, z * at.s, (at.x + at.ox - view.x * z) * at.s, (at.y + at.oy - view.y * z) * at.s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }
}
