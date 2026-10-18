import { FULLSCREEN_VERT, Program, createTexture, linkProgram, uploadTexture } from '../../engine';
import type { Rect } from '../magazine/bookLayout';
import type { Shade } from '../tv/tv';
import { NOTES } from './notes';
import { type PageLink, SHEET_H, SHEET_W, drawSheet, paginate } from './sheet';
import { readHandled, saveHandled } from './wear';

const RATIO = SHEET_W / SHEET_H;
/** A new note makes the peeking page bounce this many times, each this long (seconds): up and back down. */
const BOUNCES = 2;
const BOUNCE_TIME = 0.55;
/** A real 8.5 in sheet against the picture of a 13 in set (about 10.4 in across), so the page keeps that share of the TV's width. */
const PAGE_IN_TV = 8.5 / 10.4;

/**
 * The sheet as a rotated rectangle on screen, lit a little by the picture behind it, and (when open) the room dimmed
 * behind it. Its shadow isn't here: it falls mostly on room light, so the TV's shader draws it (see `Notebook.shade`).
 */
const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uCenter;   // sheet centre in pixels
uniform vec2 uHalf;     // half size in pixels
uniform float uRot;
uniform float uOpen;    // 0 peeking, 1 held up to read
uniform float uLift;    // 0..1: raised a little (pointer near, or a new note)
uniform vec3 uGlow;     // the lit screen's average colour
uniform vec4 uPicture;  // where the lit picture is, in pixels: centre x, y, half w, h
uniform sampler2D uTex;
uniform float uBlank;   // 1: a sheet lower in the pile, of which only the edge shows (plain paper)
uniform float uDim;     // how much to dim the room behind (given to the first sheet drawn only)
out vec4 outColor;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 d = gl_FragCoord.xy - uCenter;
  float c = cos(uRot), s = sin(uRot);
  vec2 l = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  float sd = sdBox(l, uHalf);
  float inside = clamp(0.5 - sd, 0.0, 1.0);
  float dim = uDim;
  vec2 uv = vec2(l.x / uHalf.x * 0.5 + 0.5, 0.5 - l.y / uHalf.y * 0.5);
  vec4 tex = uBlank > 0.5 ? vec4(0.925, 0.905, 0.84, 1.0) : texture(uTex, clamp(uv, 0.0, 1.0));
  vec3 paper = tex.rgb;
  paper *= 0.93 + 0.07 * smoothstep(-1.0, 1.0, l.y / uHalf.y);
  paper *= 0.9 + 0.1 * smoothstep(0.0, 6.0, -sd);
  // The screen behind lights the paper: part of its light becomes the screen's hue (the paper is near white, so adding
  // light would only clip). The tint is laid in window pixels, not on the sheet, so it stays on the picture behind as
  // the sheet moves and grows, with only a short soft edge. Held up to read it is nearer you than the set, so it catches less.
  float soft = 0.04 * uPicture.w;
  float over = smoothstep(soft, -soft, sdBox(gl_FragCoord.xy - uPicture.xy, uPicture.zw));
  float peak = max(max(uGlow.r, uGlow.g), uGlow.b) * over;
  vec3 hue = uGlow / max(peak, 1e-3);
  paper *= mix(vec3(1.0), hue * 1.08, peak * 0.18 * (1.0 - 0.5 * uOpen));
  float cov = inside * tex.a;
  outColor = vec4(paper * cov, cov + (1.0 - cov) * dim * (1.0 - 0.8 * tex.a * inside));
}`;

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Flags that change what the notebook page says. */
const WATCHED = [...new Set(NOTES.flatMap((n) => [n.when, n.solved, n.orSolved, n.skipIf, ...(n.reads ?? [])].flat().filter((f): f is string => !!f)))];

/**
 * The player's notebook page. It peeks up from the bottom-left corner of the window (as the magazine peeks in from the
 * right); a new line makes it rise a little, pointing at it lifts it, and a click holds it up to read over a dimmed
 * room. Its pixels come from `drawSheet`, written fresh by hand each time the flags change, and again each time it is
 * put down, as every reading wears it a little more (wear.ts).
 */
export class Notebook {
  private readonly program: Program;
  private readonly tex: WebGLTexture;
  private readonly vao: WebGLVertexArrayObject;
  private readonly page = document.createElement('canvas');
  /** The flags and wear the page was last written for (null: never written). */
  private sig: string | null = null;
  private flagSig: string | null = null;
  /** How many times the page has been held up and put down again; set it from the console to see it age. */
  handled = readHandled();
  private openT = 0;
  private lift = 0;
  private nudge = 0;
  private hover = false;
  /** The held-up sheet has the pointer over a page reference. */
  private overLink = false;
  private consumed = false;
  /** The page references on the sheet as last written, in sheet pixels. */
  private links: PageLink[] = [];
  /** Which sheet is on top of the pile (0 = the first), and how many there are. New notes bring the newest to the top. */
  private sheet = 0;
  private sheets = 1;
  /** The held-up pile has the pointer over the edge of a sheet underneath. */
  private overBack = false;
  private lastTurn = 0;
  open = false;

  constructor(private readonly gl: WebGL2RenderingContext, private readonly canvas: HTMLCanvasElement, private readonly flags: () => ReadonlySet<string>, private readonly tv: () => Rect, private readonly glow: () => readonly number[], private readonly picture: () => readonly number[], private readonly onPage: (index: number) => void) {
    this.program = linkProgram(gl, FULLSCREEN_VERT, FRAG);
    this.tex = createTexture(gl, SHEET_W, SHEET_H);
    this.vao = gl.createVertexArray()!;
    this.page.width = SHEET_W;
    this.page.height = SHEET_H;
    this.refresh(false);
    this.listen();
  }

  /** Rewrite the page if the flags or its wear changed; `announce` makes the paper rise to say a note was added. */
  private refresh(announce: boolean): void {
    const set = this.flags();
    const flagSig = WATCHED.filter((f) => set.has(f)).join(',');
    const wrote = this.flagSig !== null && flagSig !== this.flagSig;
    if (wrote || this.flagSig === null) {
      this.sheets = paginate(set).length;
      this.sheet = this.sheets - 1;
    }
    const sig = `${flagSig}|${this.handled}|${this.sheet}`;
    if (sig === this.sig) return;
    this.sig = sig;
    this.flagSig = flagSig;
    const ctx = this.page.getContext('2d', { willReadFrequently: true })!;
    const out = drawSheet(ctx, set, this.handled, this.sheet);
    this.links = out.links;
    this.sheets = out.count;
    uploadTexture(this.gl, this.tex, SHEET_W, SHEET_H, new Uint8Array(ctx.getImageData(0, 0, SHEET_W, SHEET_H).data.buffer));
    // One announcement per change: flags that arrive while it is still bouncing do not start it again.
    if (announce && wrote && !this.open && this.nudge <= 0) this.nudge = BOUNCES * BOUNCE_TIME;
  }

  /** Where the sheet is, in pixels with a bottom-left origin: eased between peeking and held up. */
  private shape(W: number, H: number): { cx: number; cy: number; hx: number; hy: number; rot: number } {
    const e = smooth(this.openT);
    // The peeking page is sized by the picture it sits on, so it shrinks with the TV (reading mode) and stays in its corner.
    const r = this.tv();
    const [tx, ty, tw, th] = [r.x * W, r.y * H, r.w * W, r.h * H];
    const unit = Math.min(tw, th * (4 / 3));
    const pw = unit * PAGE_IN_TV;
    const ph = pw / RATIO;
    // Most of the page stays tucked below the corner, over the set under the picture (see NOTE_ROOM): only its top edge shows,
    // a little more when pointed at, but never over the screen until it's held up.
    const pic = this.picture();
    const below = pic[1] - pic[3] - Math.max(4, unit * 0.006);
    const top = lerp(lerp(ty, below, 0.5), below, this.lift);
    const rot = -0.06;
    const px = tx + pw * 0.5 - unit * 0.04;
    // The top edge's highest point in view: its left corner, or where it leaves the window's left side.
    const cornerX = px - Math.cos(rot) * pw * 0.5 - Math.sin(rot) * ph * 0.5;
    const cornerY = -Math.sin(rot) * pw * 0.5 + Math.cos(rot) * ph * 0.5;
    const py = top - cornerY - (Math.max(0, cornerX) - cornerX) * Math.tan(rot);
    const oh = Math.min(H * 0.93, (W * 0.93) / RATIO);
    return {
      cx: lerp(px, W / 2, e),
      cy: lerp(py, H / 2, e),
      hx: lerp(pw / 2, (oh * RATIO) / 2, e),
      hy: lerp(ph / 2, oh / 2, e),
      rot: lerp(rot, -0.015, e),
    };
  }

  private hit(x: number, y: number): boolean {
    const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    const dx = x - s.cx;
    const dy = y - s.cy;
    const c = Math.cos(s.rot);
    const n = Math.sin(s.rot);
    return Math.abs(c * dx + n * dy) <= s.hx && Math.abs(-n * dx + c * dy) <= s.hy;
  }

  /** A hand over the peeking page, or over a page reference when held up; call after anything else that sets the canvas's cursor. */
  cursor(): void {
    if (this.open ? this.overLink || this.overBack : this.hover) this.canvas.style.cursor = 'pointer';
  }

  /** The sheets under the top one: each a little further down and to the left, turned a little more, so its edge shows. */
  private pile(): { cx: number; cy: number; hx: number; hy: number; rot: number; sheet: number }[] {
    const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    const out = [];
    for (let j = 1; j < Math.min(this.sheets, 3); j++) {
      const ox = -0.065 * s.hx * j;
      const oy = -0.04 * s.hy * j;
      const c = Math.cos(s.rot);
      const n = Math.sin(s.rot);
      out.push({ cx: s.cx + c * ox - n * oy, cy: s.cy + n * ox + c * oy, hx: s.hx, hy: s.hy, rot: s.rot + 0.025 * j, sheet: (this.sheet - j + this.sheets) % this.sheets });
    }
    return out;
  }

  /** Which sheet's edge, in the held-up pile, is under window point (x, y): the top sheet covers the rest. */
  private backAt(x: number, y: number): number | undefined {
    if (this.hit(x, y)) return undefined;
    const inside = (s: { cx: number; cy: number; hx: number; hy: number; rot: number }): boolean => {
      const dx = x - s.cx;
      const dy = y - s.cy;
      const c = Math.cos(s.rot);
      const n = Math.sin(s.rot);
      return Math.abs(c * dx + n * dy) <= s.hx && Math.abs(-n * dx + c * dy) <= s.hy;
    };
    return this.pile().find(inside)?.sheet;
  }

  /** Bring another sheet to the top of the pile (by scrolling: -1 older, +1 newer). */
  private turn(to: number): void {
    const next = Math.max(0, Math.min(this.sheets - 1, to));
    if (next !== this.sheet) this.sheet = next;
  }

  /** The page reference under window point (x, y) while the sheet is held up, if any. Nothing marks them: they are just words. */
  private linkAt(x: number, y: number): PageLink | undefined {
    const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    const dx = x - s.cx;
    const dy = y - s.cy;
    const c = Math.cos(s.rot);
    const n = Math.sin(s.rot);
    const sx = ((c * dx + n * dy) / s.hx / 2 + 0.5) * SHEET_W;
    const sy = (0.5 - (-n * dx + c * dy) / s.hy / 2) * SHEET_H;
    return this.links.find((l) => sx >= l.x && sx <= l.x + l.w && sy >= l.y && sy <= l.y + l.h);
  }

  private listen(): void {
    const c = this.canvas;
    const px = (e: PointerEvent): [number, number] => {
      const k = this.gl.drawingBufferWidth / c.clientWidth;
      const r = c.getBoundingClientRect();
      return [(e.clientX - r.left) * k, (r.bottom - e.clientY) * k];
    };
    const swallow = (e: Event): void => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    // Registered before the magazine's input, in the capture phase, so a click on the paper never turns a page.
    c.addEventListener(
      'pointermove',
      (e) => {
        // Held up: whether the pointer is on a page reference (`cursor()` shows it); otherwise whether it is on the peeking page.
        if (this.open) {
          this.overLink = !!this.linkAt(...px(e));
          this.overBack = this.backAt(...px(e)) !== undefined;
        } else this.hover = this.hit(...px(e));
      },
      true,
    );
    c.addEventListener(
      'pointerdown',
      (e) => {
        const back = this.open ? this.backAt(...px(e)) : undefined;
        if (back !== undefined) {
          this.turn(back);
          this.consumed = true;
          swallow(e);
          return;
        }
        if (this.open || this.hit(...px(e))) {
          // Held up: a click on a page reference puts the notes down and turns the magazine to that page.
          const link = this.open ? this.linkAt(...px(e)) : undefined;
          this.open = !this.open;
          // Put down again: one more reading's worth of wear, which the page picks up as it goes back.
          // Put down, it goes back with the newest sheet on top.
          if (!this.open) {
            saveHandled(++this.handled);
            this.sheet = this.sheets - 1;
          }
          this.consumed = true;
          this.hover = false;
          this.overLink = false;
          swallow(e);
          if (link) this.onPage(link.page);
        }
      },
      true,
    );
    for (const type of ['pointerup', 'pointercancel', 'click', 'dblclick', 'wheel']) {
      c.addEventListener(
        type,
        (e) => {
          if (type === 'wheel' && this.open && e.timeStamp - this.lastTurn > 300) {
            const dy = (e as WheelEvent).deltaY;
            if (dy) {
              this.turn(this.sheet + (dy > 0 ? -1 : 1));
              this.lastTurn = e.timeStamp;
            }
          }
          if (this.consumed || this.open) swallow(e);
          if (type === 'pointerup' || type === 'pointercancel') this.consumed = false;
        },
        true,
      );
    }
  }

  /** Move the paper on; call before the TV draws, which needs `shade`. */
  update(dt: number): void {
    this.refresh(true);
    this.openT = Math.min(1, Math.max(0, this.openT + (this.open ? dt : -dt) / 0.35));
    this.nudge = Math.max(0, this.nudge - dt);
    // Each bounce rises from rest to full lift and settles back, so it starts and ends where it was.
    const goal = this.hover ? 1 : this.nudge > 0 ? Math.abs(Math.sin((Math.PI * this.nudge) / BOUNCE_TIME)) : 0;
    this.lift += (goal - this.lift) * (1 - Math.exp(-dt * 10));
  }

  /** The page's shadow on the set: down and to the right of it (the room light is up and to the left), softer the higher it's held. */
  shade(): Shade {
    const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    const open = smooth(this.openT);
    return {
      cx: s.cx,
      cy: s.cy,
      hx: s.hx,
      hy: s.hy,
      rot: s.rot,
      ox: 10,
      oy: -(8 + 10 * this.lift + 14 * open),
      soft: 10 + 18 * this.lift + 30 * open,
      k: 0.95 - 0.15 * open,
    };
  }

  draw(): void {
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const s = this.shape(W, H);
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.program.prog);
    const u = this.program.u;
    const open = smooth(this.openT);
    gl.uniform1f(u.uOpen, open);
    gl.uniform1f(u.uLift, this.lift);
    const g = this.glow();
    gl.uniform3f(u.uGlow, g[0], g[1], g[2]);
    const pic = this.picture();
    gl.uniform4f(u.uPicture, pic[0], pic[1], pic[2], pic[3]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(u.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    // The pile from the bottom up: the sheets underneath are plain paper (only their edges show), then the top sheet. The room is
    // dimmed once, by the first sheet drawn.
    const order = [...this.pile().reverse().map((p) => ({ ...p, blank: 1 })), { ...s, blank: 0 }];
    order.forEach((p, i) => {
      gl.uniform2f(u.uCenter, p.cx, p.cy);
      gl.uniform2f(u.uHalf, p.hx, p.hy);
      gl.uniform1f(u.uRot, p.rot);
      gl.uniform1f(u.uBlank, p.blank);
      gl.uniform1f(u.uDim, i === 0 ? 0.5 * open : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    gl.disable(gl.BLEND);
  }
}
