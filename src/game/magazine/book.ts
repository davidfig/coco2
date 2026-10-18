import { FULLSCREEN_VERT, Program, linkProgram } from '../../engine';
import { BOOK_FRAG } from './bookShader';
import { CAM_DIST, PAGE_FIT_H, PAGE_FIT_W, PAGE_UNIT_H, Rect, TILT, clamp, layoutAt, lerp, smooth, spreadView } from './bookLayout';
import { IssueState, newState } from './data';
import { PAGE_COUNT, drawPage } from './issue';
import { PAGE_IDS, pageIndex } from './pages';
import { readSave, writeSave } from './bookSave';
import { loadFonts } from './fonts';
import { Hotspot, PAGE_H, PAGE_W } from './paper';

const FLIP_SECONDS = 0.8;
const MAX_ZOOM = 4;

interface Flip {
  /** The leaf turning: front page `2 * leaf`, back page `2 * leaf + 1`. */
  leaf: number;
  dir: 1 | -1;
  /** 0..1 along the way. */
  t: number;
  /** Where it is heading: 1 = finish the turn, 0 = fall back. */
  to: 0 | 1;
  /** A hand is holding the leaf; `t` follows the pointer. */
  held: boolean;
}

/** What the last frame drew; pointer maths and the toolbar use it. */
interface View {
  W: number;
  H: number;
  rect: [number, number, number, number];
  scale: number;
  fit: number;
  vx: number;
  vy: number;
  c: number;
  ext: [number, number, number, number];
  win: [number, number];
}

/**
 * The reference magazine: its state (open or closed, which spread, mid-turn, zoom), its slide-in beside the TV, and the
 * WebGL pass that draws it. Input lives in `bookInput.ts`; the story reaches it through `setFlag`.
 */
export class Magazine {
  readonly state: IssueState = newState();
  open = false;
  reading = false;
  hover = false;
  openT = 0;
  readT = 0;
  hoverT = 0;
  /** The spread showing (0 = cover alone); a spread is the leaf-turn unit, but only one of its pages is in view. */
  spread = 0;
  /** The spread the reader is heading for. */
  goal = 0;
  /** The page the reader is heading for (0-based): odd pages are the left of a spread, even ones the right. */
  pageGoal = 0;
  /** Where the view is centred, in page widths from the spine: +0.5 on a right-hand page, -0.5 on a left-hand one. */
  camX = 0.5;
  /** A hand is sliding the view between the two pages of a spread: `camX` follows it, not the page it is heading for. */
  camHeld = false;
  flip: Flip | null = null;
  /** How the turning leaf bends, -1..1, in the angle's sense: positive, its outer edge is further round (toward the left) than the hinge. */
  bend = 0;
  zoom = 1;
  zoomGoal = 1;
  pan = { x: 0, y: 0 };
  /** Where a zoom is anchored: a screen point (window fractions) and the book point under it. */
  anchor: { nx: number; ny: number; px: number; py: number } | null = null;
  v: View = { W: 1, H: 1, rect: [0, 0, 1, 1], scale: 1, fit: 1, vx: 0, vy: 0, c: 0, ext: [0, 1, 0, 1], win: [0, 1] };
  /** The arrangement of window now: the TV's rectangle and how much of the set is in view. */
  tv: Rect = { x: 0, y: 0, w: 1, h: 1 };
  book: Rect = { x: 1, y: 0, w: 0.5, h: 1 };
  frame = 0.08;

  private readonly program: Program;
  private readonly vao: WebGLVertexArrayObject;
  private readonly tex: WebGLTexture;
  private readonly paint = document.createElement('canvas');
  private readonly pctx: CanvasRenderingContext2D;
  /** Pages painted onto the GPU, and each page's clickable panels (`scratch.ts` reads and clears these). */
  readonly have = new Set<number>();
  readonly spots: Hotspot[][] = [];
  private preload = 0;
  private fontsReady = false;
  private savedView = ''; // `viewKey()` (page, open, reading) as last saved; `update` saves when it changes

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.load();
    this.program = linkProgram(gl, FULLSCREEN_VERT, BOOK_FRAG);
    this.vao = gl.createVertexArray()!;
    // Pages painted before the typefaces arrive are painted again once they have, then all of them are readied.
    void loadFonts().then(() => {
      this.have.clear();
      this.preload = 0;
      this.fontsReady = true;
    });
    this.paint.width = PAGE_W;
    this.paint.height = PAGE_H;
    this.pctx = this.paint.getContext('2d')!;
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    const levels = Math.floor(Math.log2(Math.max(PAGE_W, PAGE_H))) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, PAGE_W, PAGE_H, PAGE_COUNT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  }

  // ---- what the reader and the story can do ----

  toggle(): void {
    this.open ? this.close() : this.show();
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
    this.reading = false;
    this.zoomGoal = 1;
  }

  /** Go to the reading-size layout (the TV shrinks to a strip) or back to side by side. */
  setReading(on: boolean): void {
    this.reading = on;
    if (on) this.open = true;
  }

  /** Turn to a page (0-based), one leaf at a time. */
  goto(page: number): void {
    this.pageGoal = clamp(Math.round(page), 0, PAGE_COUNT - 1);
    this.goal = Math.ceil(this.pageGoal / 2);
    this.zoomGoal = 1;
  }

  turn(by: number): void {
    this.goto(this.pageGoal + by);
  }

  /** Pick up the leaf in direction `dir` (1 = next page) so a drag can turn it. False mid-turn, or when the next page is on the same spread (no leaf to turn). */
  grab(dir: 1 | -1): boolean {
    const next = this.pageGoal + dir;
    const onRight = this.pageGoal % 2 === 0;
    if (this.flip || this.goal !== this.spread || next < 0 || next >= PAGE_COUNT || onRight !== (dir > 0)) return false;
    this.zoomGoal = 1;
    this.flip = { leaf: dir > 0 ? this.spread : this.spread - 1, dir, t: 0, to: 1, held: true };
    return true;
  }

  /** Carry a held leaf to `t` (0 = lying where it was, 1 = turned over). */
  drag(t: number): void {
    if (this.flip?.held) this.flip.t = clamp(t, 0, 1);
  }

  /** Let go: the leaf finishes the turn if it is past halfway or was flicked, else falls back. */
  drop(flick = 0): void {
    const f = this.flip;
    if (!f?.held) return;
    f.held = false;
    f.to = f.t + flick > 0.5 ? 1 : 0;
    this.goto(f.to ? this.pageGoal + f.dir : this.pageGoal);
  }

  /** Lean in on a page (or back out): a bigger look that a double-click toggles. */
  lean(nx: number, ny: number): void {
    if (this.zoomGoal > 1.05) this.zoomAt(1 / this.zoomGoal, nx, ny);
    else this.zoomAt(2.4, nx, ny);
  }

  /** Jump to page `index` (0-based). */
  showPage(index: number): void {
    this.show();
    this.goto(index);
  }

  /** Zoom by a factor about a screen point (window fractions, origin bottom-left). */
  zoomAt(factor: number, nx: number, ny: number): void {
    const goal = clamp(this.zoomGoal * factor, 1, MAX_ZOOM);
    if (goal === this.zoomGoal) return;
    this.zoomGoal = goal;
    const [px, py] = this.toBook(nx, ny);
    this.anchor = { nx, ny, px, py };
  }

  /** Story hook: the player did something the notebook tracks. */
  setFlag(flag: string): void {
    if (this.state.flags.has(flag)) return;
    this.state.flags.add(flag);
    this.save();
  }

  reveal(id: string): void {
    this.state.revealed.add(id);
    this.save();
    this.have.delete(pageIndex('hints'));
  }

  /** The hotspot under book point (px, py) on a resting page, if any. */
  hotspotAt(px: number, py: number): string | null {
    if (this.flip || Math.abs(py) > PAGE_UNIT_H / 2) return null;
    const page = px >= 0 ? this.spread * 2 : this.spread * 2 - 1;
    if (px < -1 || px > 1 || page < 0 || page >= PAGE_COUNT) return null;
    this.ensure(page);
    const x = (px >= 0 ? px : px + 1) * PAGE_W;
    const y = (0.5 - py / PAGE_UNIT_H) * PAGE_H;
    const hit = this.spots[page]?.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    return hit?.id ?? null;
  }

  /** Book-space point under a screen point (window fractions, origin bottom-left). */
  toBook(nx: number, ny: number): [number, number] {
    const v = this.v;
    const px = (nx * v.W - 0.5 * (v.rect[0] + v.rect[2])) / v.scale;
    const py = (ny * v.H - 0.5 * (v.rect[1] + v.rect[3])) / v.scale;
    // The same camera ray the shader casts, met with the page plane.
    const s = Math.sin(TILT);
    const c = Math.cos(TILT);
    const len = Math.hypot(px, py, CAM_DIST);
    const dx = px / len;
    const dy = py / len;
    const dz = -CAM_DIST / len;
    const ey = dy * c - dz * s;
    const ez = dy * s + dz * c;
    const oy = -CAM_DIST * s;
    const oz = CAM_DIST * c;
    const t = -oz / ez;
    return [v.vx + dx * t, v.vy + oy + ey * t];
  }

  inRect(r: Rect, nx: number, ny: number): boolean {
    return nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h;
  }

  /** The spread as a fraction, counting a turning leaf. */
  phi(): number {
    const f = this.flip;
    if (!f) return this.spread;
    const t = smooth(f.t);
    return f.dir > 0 ? f.leaf + t : f.leaf + 1 - t;
  }

  // ---- per frame ----

  update(dt: number, W: number, H: number): void {
    const step = (v: number, goal: number, secs: number) => clamp(v + Math.sign(goal - v) * Math.min(Math.abs(goal - v), dt / secs), 0, 1);
    this.openT = step(this.openT, this.open ? 1 : 0, 0.9);
    this.readT = step(this.readT, this.reading ? 1 : 0, 0.7);
    this.hoverT = step(this.hoverT, this.hover && !this.open ? 1 : 0, 0.2);
    this.advanceFlip(dt);
    if (this.viewKey() !== this.savedView) this.save();
    // Every page is on the GPU before it is needed (one a frame, from the start, once the fonts are in), so turning never paints.
    if (this.fontsReady && this.preload < PAGE_COUNT) this.ensure(this.preload++);

    const lay = layoutAt(W / H, this.hoverT, this.openT, this.readT);
    this.tv = lay.tv;
    this.book = lay.book;
    const open = smooth(this.openT);
    const read = smooth(this.readT);
    this.frame = lerp(0.08, lerp(0.95, 0.4, read), open);

    const sv = spreadView(this.phi());
    const rw = lay.book.w * W;
    const rh = lay.book.h * H;
    // One page at a time: the view eases to centre on it, and only that page's width of the book is drawn.
    const camGoal = this.pageGoal % 2 === 0 ? 0.5 : -0.5;
    if (!this.camHeld) this.camX += (camGoal - this.camX) * (1 - Math.exp(-dt * 9));
    if (!this.camHeld && Math.abs(this.camX - camGoal) < 0.002) this.camX = camGoal;
    const fit = Math.min(rw / PAGE_FIT_W, rh / (PAGE_UNIT_H * PAGE_FIT_H));
    this.zoom += (this.zoomGoal - this.zoom) * (1 - Math.exp(-dt * 10));
    if (Math.abs(this.zoom - this.zoomGoal) < 0.002) this.zoom = this.zoomGoal;
    const scale = fit * this.zoom;
    const rect: View['rect'] = [lay.book.x * W, lay.book.y * H, (lay.book.x + lay.book.w) * W, (lay.book.y + lay.book.h) * H];
    const a = this.anchor;
    if (a && this.zoom !== 1) {
      this.pan.x = a.px - (a.nx * W - 0.5 * (rect[0] + rect[2])) / scale - this.camX;
      this.pan.y = a.py - (a.ny * H - 0.5 * (rect[1] + rect[3])) / scale;
    }
    if (this.zoom === this.zoomGoal) this.anchor = null;
    const limX = Math.max(0, 0.55 - rw / 2 / scale);
    const limY = Math.max(0, (PAGE_UNIT_H / 2) * 1.05 - rh / 2 / scale);
    this.pan.x = clamp(this.pan.x, -limX, limX);
    this.pan.y = clamp(this.pan.y, -limY, limY);
    const win: View['win'] = [Math.max(sv.xmin, this.camX - 0.5), Math.min(sv.xmax, this.camX + 0.5)];
    // Put away, the book sits with its edge just inside the window: slide the view so the page's left edge meets the rect's.
    const tuck = (1 - open) * (win[0] + rw / 2 / scale - this.camX);
    this.v = { W, H, rect, scale, fit, vx: this.camX + this.pan.x + tuck, vy: this.pan.y, c: this.camX, ext: [sv.xmin, sv.xmax, sv.stackL, sv.stackR], win };
  }

  private advanceFlip(dt: number): void {
    if (!this.flip && this.goal !== this.spread) {
      const dir = this.goal > this.spread ? 1 : -1;
      this.flip = { leaf: dir > 0 ? this.spread : this.spread - 1, dir, t: 0, to: 1, held: false };
    }
    const f = this.flip;
    // Held, the edge goes first; let go, the air holds it back behind the way the leaf is moving. Paper takes a moment to flex over.
    const bendGoal = !f ? 0 : f.held ? f.dir : -f.dir * (f.to ? 1 : -1);
    this.bend += Math.sign(bendGoal - this.bend) * Math.min(Math.abs(bendGoal - this.bend), dt / 0.25);
    if (!f || f.held) return;
    const far = Math.abs(this.goal - this.spread) > 1;
    const step = dt / (far ? FLIP_SECONDS * 0.4 : FLIP_SECONDS);
    f.t = f.to ? f.t + step : f.t - step;
    if (f.t >= 1) {
      this.spread += f.dir;
      this.flip = null;
    } else if (f.t <= 0) {
      this.flip = null;
    }
  }

  draw(): void {
    const gl = this.gl;
    const v = this.v;
    if (v.rect[0] >= v.W || v.rect[1] >= v.H || v.rect[2] <= 0 || v.rect[3] <= 0) return;
    const f = this.flip;
    const layer = (i: number) => (i >= 0 && i < PAGE_COUNT ? i : -1);
    let L: number, R: number, F = -1, B = -1;
    if (f) {
      L = layer(2 * f.leaf - 1);
      R = layer(2 * f.leaf + 2);
      F = layer(2 * f.leaf);
      B = layer(2 * f.leaf + 1);
    } else {
      L = layer(2 * this.spread - 1);
      R = layer(2 * this.spread);
    }
    for (const i of [L, R, F, B]) if (i >= 0) this.ensure(i);
    const angle = f ? Math.PI * (f.dir > 0 ? smooth(f.t) : 1 - smooth(f.t)) : 0;
    gl.useProgram(this.program.prog);
    const u = this.program.u;
    gl.uniform2f(u.uRes, v.W, v.H);
    gl.uniform4f(u.uRect, ...v.rect);
    gl.uniform1f(u.uScale, v.scale);
    gl.uniform2f(u.uView, v.vx, v.vy);
    gl.uniform1f(u.uH, PAGE_UNIT_H);
    gl.uniform1f(u.uTheta, angle);
    gl.uniform1f(u.uFlipOn, f ? 1 : 0);
    gl.uniform1f(u.uBend, this.bend);
    gl.uniform1f(u.uFold, smooth(this.openT));
    gl.uniform1f(u.uL, L);
    gl.uniform1f(u.uR, R);
    gl.uniform1f(u.uF, F);
    gl.uniform1f(u.uB, B);
    gl.uniform4f(u.uExt, ...v.ext);
    gl.uniform2f(u.uWin, ...v.win);
    gl.uniform1f(u.uTexW, PAGE_W); gl.uniform1f(u.uLastPage, PAGE_COUNT - 1);
    gl.uniform2f(u.uTilt, Math.sin(TILT), Math.cos(TILT));
    gl.uniform1f(u.uCam, CAM_DIST);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    gl.uniform1i(u.uPages, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
  }

  // ---- pages ----

  /** Paint page `i` and put it on the GPU, unless it already is. */
  private ensure(i: number): void {
    if (this.have.has(i)) return;
    const gl = this.gl;
    this.spots[i] = drawPage(i, this.pctx, this.state);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, PAGE_W, PAGE_H, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.paint);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    this.have.add(i);
  }

  private viewKey(): string {
    return `${this.pageGoal} ${this.open} ${this.reading}`;
  }

  save(): void {
    this.savedView = this.viewKey();
    const { flags, revealed } = this.state;
    writeSave({ flags: [...flags], revealed: [...revealed], page: PAGE_IDS[this.pageGoal], open: this.open, reading: this.reading });
  }

  /** Restore the journal, and the book where the reader left it: already out and on that page, no slide or page-turn. */
  private load(): void {
    const s = readSave();
    for (const f of s.flags ?? []) this.state.flags.add(f);
    for (const r of s.revealed ?? []) this.state.revealed.add(r);
    const page = s.page ? pageIndex(s.page) : 0;
    [this.pageGoal, this.goal, this.spread, this.camX] = [page, Math.ceil(page / 2), Math.ceil(page / 2), page % 2 === 0 ? 0.5 : -0.5];
    [this.open, this.reading] = [s.open === true, s.open === true && s.reading === true];
    [this.openT, this.readT] = [+this.open, +this.reading];
    this.savedView = this.viewKey();
  }
}
