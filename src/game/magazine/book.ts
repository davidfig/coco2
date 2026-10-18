import { FULLSCREEN_VERT, Program, linkProgram, scissor } from '../../engine';
import type { DeskSpot } from '../computer/layout';
import { camBounds, onTable, setCam } from './bookCam';
import { BOOK_FRAG } from './bookShader';
import { CLOSED_FRAME, Flip, READ_FRAME, SIDE_FRAME, PAGE_FIT_H, PAGE_FIT_W, PAGE_UNIT_H, Rect, TILT, View, bookBounds, clamp, layoutAt, leafLayers, lerp, putAway, screenToBook, smooth, spreadView } from './bookLayout';
import { IssueState, newState } from './data';
import { PagePainter } from './pagePainter';
import { PageTextures } from './pageTextures';
import { linkAt } from './pageLinks';
import { ISSUES, ISSUE_ORDER, pageIndex, type AnyPageId, type IssueId } from './pages';
import { readSave, writeSave } from './bookSave';
import { loadFonts } from './fonts';
import { PAGE_H, PAGE_W } from './paper';

const FLIP_SECONDS = 0.8;
const MAX_ZOOM = 4;
/** Pages are readied only after this long (seconds), when the set has warmed up. */
const PRELOAD_AFTER = 2.5;

/**
 * The reference magazine: its state (open or closed, which spread, mid-turn, zoom), its slide-in beside the TV, and the
 * WebGL pass that draws it. Input lives in `bookInput.ts`; the story reaches it through `setFlag`.
 */
export class Magazine {
  readonly state: IssueState = newState();
  /** The issue on the table (the others are in the pile beside it), and the page each was last left at. */
  issue: IssueId = 'march';
  private readonly pagesAt: Partial<Record<IssueId, AnyPageId>> = {};
  open = false;
  reading = false;
  hover = false;
  openT = 0;
  readT = 0;
  hoverT = 0;
  /** How far the put-away book has come in at the window's edge (0..1): off it while the room's lights come on (main.ts). */
  arrive = 1;
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
  v: View = { W: 1, H: 1, rect: [0, 0, 1, 1], scale: 1, fit: 1, vx: 0, vy: 0, c: 0, ext: [0, 1, 0, 1], win: [0, 1], tilt: 0, roll: 0, pivot: [0, 0], clip: [0, 0, 1, 1] };
  /** The arrangement of window now: the TV's rectangle and how much of the set is in view. */
  tv: Rect = { x: 0, y: 0, w: 1, h: 1 };
  book: Rect = { x: 1, y: 0, w: 0.5, h: 1 };
  frame = 0.08;
  /** How far the notebook page tucks down to the window's bottom, out of the open book's way (tall windows). */
  notesTuck = 0;
  /** The set the notebook page is sized by: the TV with the book put away, or shrunk to reading mode's strip. */
  notesTv: Rect = { x: 0, y: 0, w: 1, h: 1 };
  /**
   * Put away, how far it lies on the table instead (0..1: main.ts, from `Computer.tableT`, as the view pulls back to the
   * desk) and where the set's picture is (`Tv.picture`), which places the room's camera on screen.
   */
  desk: () => { t: number; spot?: DeskSpot; picture: readonly number[] } = () => ({ t: 0, picture: [] });

  private readonly program: Program;
  private readonly vao: WebGLVertexArrayObject;
  private readonly pages: PageTextures;
  /** Paints the pages (in a worker) and puts them on the GPU. */
  private readonly painter: PagePainter;
  /** Seconds since the book was made (`PRELOAD_AFTER`). */
  private age = 0;
  private fontsReady = false;
  private savedView = ''; // `viewKey()` (page, open, reading) as last saved; `update` saves when it changes

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.load();
    this.program = linkProgram(gl, FULLSCREEN_VERT, BOOK_FRAG);
    this.vao = gl.createVertexArray()!;
    this.pages = new PageTextures(gl);
    this.painter = new PagePainter(this.pages, this.state);
    // Pages are painted once the typefaces are in (any painted before then, again), then all of them are readied.
    void loadFonts().then(() => {
      this.painter.fontsLoaded();
      this.fontsReady = true;
    });
  }

  /** How many pages the issue on the table has, and the id of its page `i`. */
  get count(): number {
    return ISSUES[this.issue].length;
  }
  pageId = (i: number): AnyPageId | undefined => ISSUES[this.issue][i];

  /** The issues the player has: March from the start, May once it has come in the mail. */
  issues(): IssueId[] {
    return ISSUE_ORDER.filter((id) => id === 'march' || this.state.flags.has('issue2-waiting'));
  }

  /** Put another issue on the table, open at the page it was left on. No page-turn: it is a different magazine. */
  setIssue(id: IssueId): void {
    if (id === this.issue) return;
    this.pagesAt[this.issue] = this.pageId(this.pageGoal);
    [this.issue, this.flip, this.zoomGoal] = [id, null, 1];
    this.painter.forget();
    const at = this.pagesAt[id];
    this.place(at ? (ISSUES[id] as readonly AnyPageId[]).indexOf(at) : 0);
    this.save();
  }

  /** Rest the book open at page `page` at once. */
  private place(page: number): void {
    page = clamp(page, 0, this.count - 1);
    [this.pageGoal, this.goal, this.spread, this.camX] = [page, Math.ceil(page / 2), Math.ceil(page / 2), page % 2 === 0 ? 0.5 : -0.5];
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
    this.pageGoal = clamp(Math.round(page), 0, this.count - 1);
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
    if (this.flip || this.goal !== this.spread || next < 0 || next >= this.count || onRight !== (dir > 0)) return false;
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

  /** Jump to page `index` (0-based) of an issue (the notebook's pointers are all into March). */
  showPage(index: number, issue: IssueId = 'march'): void {
    this.show();
    this.setIssue(issue);
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
    // The May issue comes in the mail: it is the one on the table now.
    if (flag === 'issue2-waiting') this.setIssue('may');
    this.save();
  }

  /** Book-space point under a screen point (window fractions, origin bottom-left). */
  toBook(nx: number, ny: number): [number, number] {
    return screenToBook(this.v, nx, ny);
  }

  /** The page a link under a screen point (window fractions) goes to, if the book is lying open there and not mid-turn. */
  linkUnder(nx: number, ny: number): AnyPageId | undefined {
    if (!this.open || this.openT < 0.97 || this.flip || this.goal !== this.spread || !this.inRect(this.book, nx, ny)) return undefined;
    const [px, py] = this.toBook(nx, ny);
    const page = this.pageId(px >= 0 ? 2 * this.spread : 2 * this.spread - 1);
    const u = px >= 0 ? px : px + 1;
    const v = 0.5 - py / PAGE_UNIT_H;
    if (!page || u < 0 || u > 1 || v < 0 || v > 1) return undefined;
    return linkAt(page, u * PAGE_W, v * PAGE_H);
  }

  /** Follow a link: turn to that page of the issue on the table. */
  follow(to: AnyPageId): void {
    this.goto(pageIndex(to));
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
    // Every page is readied before it is needed, so turning rarely waits: one asked for a frame once the fonts are in, none
    // while the set warms up or the book moves (painting is the worker's, but each page still goes up to the GPU here).
    this.age += dt;
    const still = !this.flip && this.zoom === this.zoomGoal && [this.openT, this.readT, this.hoverT, this.arrive].every((t) => t === 0 || t === 1);
    this.painter.update();
    let next = 0;
    while (next < this.count && this.painter.asked(next)) next++;
    if (this.fontsReady && this.age > PRELOAD_AFTER && still && next < this.count) this.painter.ensure(this.issue, next);

    const lay = layoutAt(W / H, this.hoverT, this.openT, this.readT, this.arrive);
    this.tv = lay.tv;
    this.book = lay.book;
    this.notesTuck = lay.notes;
    this.notesTv = lay.notesTv;
    const open = smooth(this.openT);
    const read = smooth(this.readT);
    this.frame = lerp(CLOSED_FRAME, lerp(SIDE_FRAME, READ_FRAME, read), open);

    const sv = spreadView(this.phi(), this.count / 2);
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
    const v: View = { W, H, rect, scale, fit, vx: this.camX + this.pan.x, vy: this.pan.y, c: this.camX, ext: [sv.xmin, sv.xmax, sv.stackL, sv.stackR], win, tilt: TILT, roll: 0, pivot: [0, 0], clip: rect };
    this.v = putAway(v, open);
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
    const desk = this.desk();
    const { view: v, cam, light } = onTable(this.v, desk.spot ? desk.t * (1 - smooth(this.openT)) : 0, desk.spot!, desk.picture);
    this.v = v;
    if (v.clip[0] >= v.W || v.clip[1] >= v.H || v.clip[2] <= 0 || v.clip[3] <= 0) return;
    const f = this.flip;
    const [L, R, F, B] = leafLayers(f, this.spread, this.count);
    for (const i of [L, R, F, B]) if (i >= 0) this.ensure(i);
    const [x0, y0, x1, y1] = v.cam ? camBounds(cam, v, !!f) : bookBounds(v, !!f);
    if (!scissor(gl, x0, y0, x1, y1)) return;
    const angle = f ? Math.PI * (f.dir > 0 ? smooth(f.t) : 1 - smooth(f.t)) : 0;
    gl.useProgram(this.program.prog);
    const u = this.program.u;
    gl.uniform2f(u.uRes, v.W, v.H);
    gl.uniform4f(u.uClip, ...v.clip);
    setCam(gl, u, cam, light);
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
    gl.uniform1f(u.uTexW, PAGE_W); gl.uniform1f(u.uLastPage, this.count - 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pages.tex);
    gl.uniform1i(u.uPages, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.activeTexture(gl.TEXTURE0);
  }

  // ---- pages ----

  /** Paint every page again (the story flags changed under them: the debug menu). */
  repaint(): void {
    this.painter.forget(false);
  }

  /** Page `i` is in view: get it painted and onto the GPU first, unless it already is (until then it is bare paper). */
  private ensure(i: number): void {
    this.painter.ensure(this.issue, i, true);
  }

  private viewKey(): string {
    return `${this.issue} ${this.pageGoal} ${this.open} ${this.reading}`;
  }

  save(): void {
    this.savedView = this.viewKey();
    const { flags } = this.state;
    const page = this.pageId(this.pageGoal) ?? ISSUES[this.issue][0];
    this.pagesAt[this.issue] = page;
    writeSave({ flags: [...flags], issue: this.issue, pages: { ...this.pagesAt }, page, open: this.open, reading: this.reading });
  }

  /** Restore the journal, and the book where the reader left it: already out and on that page, no slide or page-turn. */
  private load(): void {
    const s = readSave();
    for (const f of s.flags ?? []) this.state.flags.add(f);
    Object.assign(this.pagesAt, s.pages);
    // A save from before issues could be switched, made after May came, opens on May.
    const issue = s.issue ?? (this.state.flags.has('issue2-waiting') ? 'may' : 'march');
    if (this.issues().includes(issue)) this.issue = issue;
    this.place(s.page ? (ISSUES[this.issue] as readonly AnyPageId[]).indexOf(s.page) : 0);
    [this.open, this.reading] = [s.open === true, s.open === true && s.reading === true];
    [this.openT, this.readT] = [+this.open, +this.reading];
    this.savedView = this.viewKey();
  }
}
