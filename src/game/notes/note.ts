import { FULLSCREEN_VERT, Program, createTexture, linkProgram } from '../../engine';
import { NOTE_STRIP, type Rect } from '../magazine/bookLayout';
import type { IssueId } from '../magazine/pages';
import type { Shade } from '../tv/tv';
import { NOTE_FRAG } from './noteShader';
import { NOTES } from './notes';
import { DEAL_TIME, type Deal, type Layer, type Sheet, inside, layers, openTime, pulled } from './pile';
import { type PageLink, SHEET_DPI, SHEET_H, SHEET_W, drawSheet, paginate } from './sheet';
import { readHandled, saveHandled } from './wear';
import type { DeskSpot } from '../computer/layout';
import { DESK_LIGHT, type Quad, inQuadPx, onTable } from './onDesk';
import { drawPile } from './pileDraw';

const RATIO = SHEET_W / SHEET_H;
/** At rest, this much of the peeking page (share of its height: its heading) shows above the window's bottom. */ const PEEK_SHOW = 0.11;
/** A new note makes the peeking page bounce this many times, each this long (seconds): up and back down. */
const BOUNCES = 2;
const BOUNCE_TIME = 0.55;
/** The real sheet (`SHEET_DPI`) against the picture of a 13 in set (about 10.4 in across), so the page keeps that share of the TV's width. */
const PAGE_IN_TV = SHEET_W / SHEET_DPI / 10.4;
const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Flags that change what the notebook page says. */
const WATCHED = [...new Set(NOTES.flatMap((n) => [n.when, n.solved, n.orSolved, n.skipIf, ...(n.reads ?? [])].flat().filter((f): f is string => !!f)))];

/**
 * The player's notebook page. It peeks up from the bottom-left corner of the window (as the magazine peeks in from the
 * right); a new line makes it rise a little, pointing at it lifts it, and a click holds it up to read in front of the
 * room. Its pixels come from `drawSheet`, written fresh by hand each time the flags change, and again each time it is
 * back down, as every reading wears it a little more (wear.ts).
 */
export class Notebook {
  private readonly program: Program;
  /** One texture per sheet, each written with its own notes, so the sheets under the top one show what is on them. */
  private readonly texs: WebGLTexture[] = [];
  private readonly vao: WebGLVertexArrayObject;
  private readonly page = document.createElement('canvas');
  /** The flags and wear the sheets were last written for (null: never written). */
  private sig: string | null = null;
  private flagSig: string | null = null;
  /** How many times the page has been held up and put down again; set it from the console to see it age. */
  handled = readHandled();
  /** The wear the sheets show: `handled` catches up only once the page is back down, so the rewrite (tens of ms a sheet) never stalls its animation. */ private worn = this.handled;
  private openT = 0;
  private lift = 0;
  private nudge = 0;
  private hover = false;
  /** The held-up sheet has the pointer over a page reference. */
  private overLink = false;
  /** The held-up sheet has the pointer over it (it can be dragged). */
  private overTop = false;
  private consumed = false;
  /** Each sheet's page references as last written, in sheet pixels. */
  private links: PageLink[][] = [];
  /** Which sheet is on top of the pile (0 = the first), and how many there are. New notes bring the newest to the top. */
  private sheet = 0;
  private sheets = 1;
  /** The held-up pile has the pointer over the edge of a sheet underneath. */
  private overBack = false;
  private lastTurn = 0;
  /** The top sheet held by the pointer: where it was taken (window pixels) and whether it has moved enough to be a drag. */
  private grab: { id: number; x: number; y: number; moved: boolean } | null = null;
  /** How far the top sheet is pulled from its place, in window pixels; it springs back when let go short of a turn. */
  private off: [number, number] = [0, 0];
  /**
   * A sheet going from the top of the pile to the bottom: `from` is the sheet that was on top, `t` runs 0 → 1 (it slides
   * away from `start` along `away`, then tucks under as the rest move up), or 1 → 0 for the bottom sheet coming back on top.
   */
  private deal: Deal | null = null;
  /** Turns waiting for the one in progress: +1 sends the top sheet under, -1 brings the bottom one up. */
  private queue: (1 | -1)[] = [];
  open = false;
  /** How far the peeking page has come up into the window (0..1): below it while the room's lights come on (main.ts). */
  arrive = 1;
  /**
   * Put down, how far the pile lies on the table instead of peeking in (0..1: main.ts, from `Computer.tableT`, as the
   * view pulls back to the desk) and where the set's picture is (`Tv.picture`), which places the room's camera on screen.
   */
  desk: () => { t: number; spot?: DeskSpot; picture: readonly number[] } = () => ({ t: 0, picture: [] });
  /** Whether something lying over the paper on the table takes pixel (x, y) (bottom-left origin): the magazine, if it was read last. */
  covered: (x: number, y: number) => boolean = () => false;

  constructor(private readonly gl: WebGL2RenderingContext, private readonly canvas: HTMLCanvasElement, private readonly flags: () => ReadonlySet<string>, private readonly tv: () => Rect, private readonly tuck: () => number, private readonly glow: () => readonly number[], private readonly picture: () => readonly number[], private readonly onPage: (index: number, issue: IssueId) => void) {
    this.program = linkProgram(gl, FULLSCREEN_VERT, NOTE_FRAG);
    this.vao = gl.createVertexArray()!;
    this.page.width = SHEET_W;
    this.page.height = SHEET_H;
    this.refresh(false);
    this.listen();
  }

  /** Rewrite the sheets if the flags or their wear changed; `announce` makes the paper rise to say a note was added. */
  private refresh(announce: boolean): void {
    const set = this.flags();
    const flagSig = WATCHED.filter((f) => set.has(f)).join(',');
    const wrote = this.flagSig !== null && flagSig !== this.flagSig;
    const sig = `${flagSig}|${this.worn}`;
    if (sig === this.sig) return;
    const first = this.sig === null;
    this.sig = sig;
    this.flagSig = flagSig;
    const ctx = this.page.getContext('2d')!;
    const gl = this.gl;
    this.sheets = paginate(set).length;
    for (let k = 0; k < this.sheets; k++) {
      this.texs[k] ??= createTexture(gl, SHEET_W, SHEET_H);
      this.links[k] = drawSheet(ctx, set, this.worn, k).links;
      // Straight from the canvas: no read back into script.
      gl.bindTexture(gl.TEXTURE_2D, this.texs[k]);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.page);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    if (first || wrote || this.sheet >= this.sheets) this.settle(this.sheets - 1);
    // One announcement per change: flags that arrive while it is still bouncing do not start it again.
    if (announce && wrote && !this.open && this.nudge <= 0) this.nudge = BOUNCES * BOUNCE_TIME;
  }

  /** Put `sheet` on top with nothing moving. */
  private settle(sheet: number): void {
    this.sheet = sheet;
    this.deal = null;
    this.queue = [];
    this.grab = null;
    this.off = [0, 0];
  }

  /** Where the sheet is, in pixels with a bottom-left origin: eased between peeking and held up. */
  private shape(W: number, H: number): Sheet {
    const e = smooth(this.openT);
    // The peeking page is sized by the set with the book put away, so it keeps its size beside the book and shrinks only
    // with the TV in reading mode, staying in its corner.
    const r = this.tv();
    const [tx, tw, th] = [r.x * W, r.w * W, r.h * H];
    const unit = Math.min(tw, th * (4 / 3));
    const pw = unit * PAGE_IN_TV;
    const ph = pw / RATIO;
    // Most of the page stays tucked below the corner, over the set under the picture (see NOTE_ROOM): only its top edge shows
    // (just its heading, however much room there is), more when pointed at, never over the screen until held up.
    const pic = this.picture();
    const below = pic[1] - pic[3] - Math.max(4, unit * 0.006);
    // With the book out in a tall window it would hang over the pages: there it tucks down to a strip along the window's bottom.
    // Not yet arrived, it waits a little below the window's bottom.
    const rest = Math.min(below, ph * PEEK_SHOW) * this.arrive - ph * 0.04 * (1 - this.arrive);
    const top = lerp(lerp(rest, below, this.lift), H * NOTE_STRIP * (1 + this.lift), this.tuck());
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

  /** How far the pile lies on the table: none once it is held up. */
  onDesk(): number {
    const d = this.desk();
    return d.spot ? d.t * (1 - smooth(this.openT)) : 0;
  }

  /** Every sheet that shows, from the bottom up, as drawn: eased from where `layers` puts it onto the table by `onDesk`. */
  private placed(): (Layer & { quad: Quad })[] {
    const d = this.desk();
    return onTable(this.layers(), this.onDesk(), d.spot!, this.sheets, this.sheet, d.picture);
  }

  private hit(x: number, y: number): boolean {
    if (!this.open && this.onDesk() > 0) {
      const top = this.placed().at(-1);
      return !!top && inQuadPx(top.quad, x, y) && !this.covered(x, y);
    }
    return inside(this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight), x, y);
  }

  /** A hand over the peeking page or a page reference, an open hand over the held-up sheet; call after anything else that sets the canvas's cursor. */
  cursor(): void {
    if (this.open && this.grab?.moved) this.canvas.style.cursor = 'grabbing';
    else if (this.open ? this.overLink || this.overBack : this.hover) this.canvas.style.cursor = 'pointer';
    else if (this.open && this.overTop) this.canvas.style.cursor = 'grab';
  }

  /** Every sheet that shows, from the bottom of the pile up. */
  private layers(): Layer[] {
    return layers(this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight), this.sheets, this.sheet, this.off, this.deal);
  }

  /** Every sheet that shows, where it lies (canvas pixels, bottom-left origin): what lies over the magazine's stickers. */
  covers(): Sheet[] {
    return this.layers();
  }

  /** How many places down the held-up pile the sheet under window point (x, y) is; the top sheet covers the rest. */
  private backAt(x: number, y: number): number | undefined {
    if (this.deal || this.hit(x, y)) return undefined;
    return this.layers()
      .reverse()
      .find((l) => l.place > 0 && inside(l, x, y))?.place;
  }

  /** Start a turn: +1 sends the top sheet under the pile (from wherever it has been pulled to), -1 brings the bottom one up. */
  private turn(dir: 1 | -1, start: [number, number] = [0, 0]): void {
    if (this.sheets < 2) return;
    if (this.deal) {
      this.queue.push(dir);
      return;
    }
    const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    // Away the way it was pulled (or to the left), far enough to clear the pile.
    const len = Math.hypot(start[0], start[1]);
    const [ux, uy] = len > 1 ? [start[0] / len, start[1] / len] : [-1, 0.15];
    const far = 2.2 * s.hx;
    const away: [number, number] = [ux * far, uy * far];
    if (dir > 0) this.deal = { from: this.sheet, t: 0, dir, start, away };
    else this.deal = { from: (this.sheet + 1) % this.sheets, t: 1, dir, start: [0, 0], away };
    this.off = [0, 0];
  }

  /** The page reference under window point (x, y) while the sheet is held up, if any. Nothing marks them: they are just words. */
  private linkAt(x: number, y: number): PageLink | undefined {
    if (this.deal) return undefined;
    const s = pulled(this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight), this.off);
    const dx = x - s.cx;
    const dy = y - s.cy;
    const c = Math.cos(s.rot);
    const n = Math.sin(s.rot);
    const sx = ((c * dx + n * dy) / s.hx / 2 + 0.5) * SHEET_W;
    const sy = (0.5 - (-n * dx + c * dy) / s.hy / 2) * SHEET_H;
    return (this.links[this.sheet] ?? []).find((l) => sx >= l.x && sx <= l.x + l.w && sy >= l.y && sy <= l.y + l.h);
  }

  /** Put the notes down: one more reading's worth of wear, which the page picks up once it is back down, newest sheet on top. */
  private putDown(): void {
    this.open = false;
    saveHandled(++this.handled);
    this.settle(this.sheets - 1);
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
        const [x, y] = px(e);
        if (this.grab && e.pointerId === this.grab.id) {
          // A few pixels of wobble is still a click; past that the sheet follows the pointer.
          const k = this.gl.drawingBufferWidth / c.clientWidth;
          const by: [number, number] = [x - this.grab.x, y - this.grab.y];
          if (!this.grab.moved && Math.hypot(...by) > 6 * k) this.grab.moved = true;
          if (this.grab.moved) this.off = by;
          swallow(e);
        }
        // Held up: whether the pointer is on a page reference (`cursor()` shows it); otherwise whether it is on the peeking page.
        if (this.open) {
          this.overLink = !this.grab?.moved && !!this.linkAt(x, y);
          this.overBack = this.backAt(x, y) !== undefined;
          this.overTop = !this.deal && this.hit(x, y);
        } else this.hover = this.hit(x, y);
      },
      true,
    );
    c.addEventListener(
      'pointerdown',
      (e) => {
        const [x, y] = px(e);
        if (this.open) {
          this.consumed = true;
          swallow(e);
          if (this.deal) return;
          // The edge of a sheet further down: turn the pile until it is on top.
          const back = this.backAt(x, y);
          if (back !== undefined) {
            for (let i = 0; i < back; i++) this.turn(1);
            return;
          }
          // The top sheet: taken hold of, to be dragged aside or (if it hardly moves) clicked.
          if (this.hit(x, y)) {
            this.grab = { id: e.pointerId, x: x - this.off[0], y: y - this.off[1], moved: false };
            try {
              c.setPointerCapture(e.pointerId);
            } catch {
              // A synthetic pointer the browser never saw.
            }
            return;
          }
          // The room behind: put the notes down.
          this.putDown();
          this.overLink = this.overTop = this.overBack = false;
          return;
        }
        if (this.hit(x, y)) {
          this.open = true;
          this.consumed = true;
          this.hover = false;
          swallow(e);
        }
      },
      true,
    );
    for (const type of ['pointerup', 'pointercancel', 'click', 'dblclick', 'wheel']) {
      c.addEventListener(
        type,
        (e) => {
          const grab = this.grab;
          if ((type === 'pointerup' || type === 'pointercancel') && grab && (e as PointerEvent).pointerId === grab.id) {
            this.grab = null;
            const s = this.shape(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
            if (grab.moved) {
              // Pulled far enough, it goes on under the pile; short of that it springs back (see update).
              if (type === 'pointerup' && Math.hypot(...this.off) > 0.35 * s.hx) this.turn(1, this.off);
            } else if (type === 'pointerup') {
              // A click: on a page reference it puts the notes down and turns the magazine to that page; anywhere else it puts them down.
              const link = this.linkAt(...px(e as PointerEvent));
              this.putDown();
              this.overLink = this.overTop = false;
              if (link) this.onPage(link.page, link.issue);
            }
          }
          if (type === 'wheel' && this.open && e.timeStamp - this.lastTurn > 300) {
            const dy = (e as WheelEvent).deltaY;
            if (dy) {
              this.turn(dy > 0 ? 1 : -1);
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
    if (this.openT === 0) this.worn = this.handled;
    this.refresh(true);
    this.openT = Math.min(1, Math.max(0, this.openT + (this.open ? dt : -dt) / openTime(Math.min(this.canvas.clientHeight, this.canvas.clientWidth / RATIO) * 0.93)));
    this.nudge = Math.max(0, this.nudge - dt);
    // Each bounce rises from rest to full lift and settles back, so it starts and ends where it was.
    const goal = this.hover ? 1 : this.nudge > 0 ? Math.abs(Math.sin((Math.PI * this.nudge) / BOUNCE_TIME)) : 0;
    this.lift += (goal - this.lift) * (1 - Math.exp(-dt * 10));
    if (!this.grab) {
      const k = Math.exp(-dt * 14);
      this.off = [this.off[0] * k, this.off[1] * k];
    }
    const d = this.deal;
    if (d) {
      d.t += (d.dir * dt) / DEAL_TIME;
      if (d.t >= 1 || d.t <= 0) {
        this.sheet = d.t >= 1 ? (d.from - 1 + this.sheets) % this.sheets : d.from;
        this.deal = null;
        const next = this.queue.shift();
        if (next) this.turn(next);
      }
    }
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
      k: (0.95 - 0.15 * open) * (1 - this.onDesk()),
    };
  }

  draw(): void {
    const sheets = this.placed().map((p) => ({ quad: p.quad, tex: this.texs[p.sheet] }));
    const light = 1 + (DESK_LIGHT - 1) * this.onDesk();
    drawPile(this.gl, this.program, this.vao, sheets, { open: smooth(this.openT), lift: this.lift, glow: this.glow(), picture: this.picture(), light });
  }
}
