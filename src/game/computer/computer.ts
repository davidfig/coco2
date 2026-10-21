import { FULLSCREEN_VERT, Program, TypedKey, linkProgram, scissor } from '../../engine';
import { TUBE, TUBE_C } from '../tv/cabinetShader';
import { TALL, type TvEnd } from '../magazine/bookLayout';
import { ACTIVE } from '../tv/pictureShader';
import { COMPUTER_FRAG } from './computerShader';
import { MarchCache } from './marchCache';
import { CocoKeys, capsBounds, keyAt } from './keys';
import { CORDS_BACK } from './cords';
import { DeskTable, type View } from './deskTable';
import { CASE, DeskSpot, EDGE, PLACE, PRINT_H, PRINT_W, deskBounds, drawPrint, keyboardBounds, lowestPoint, onCase, project } from './layout';
import { type CassetteId, RECORDER_BOUNDS, type Recorder, drawRecorderPrint, recorderAt } from '../recorder';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}


/** Room left under the machine (panel units): its shadow. */
const BELOW = 0.1;
/** How long the pull back takes, about (seconds). */
const DESK_TIME = 0.6;
/** How far the screen's light must move (any channel) before the machine is marched in the new light: past the cursor's blink. */
const GLOW_STEP = 6 / 256;
/** A press that moves further than this (CSS px) is a drag (wiping the glass), not a click. */
const CLICK_SLOP = 6;

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The highest the pass draws anything (panel y): the top of the box the machine and its cords are marched in (as the
 * shader's), or the table's back edge, whichever shows higher. Everything it draws is below this, the full width across.
 */
const DRAWN_TOP = Math.max(
  ...[CORDS_BACK - 0.02, CASE.hd + 0.02].map((z) => project(0, CASE.hump + 0.02, z)[1]),
  project(0, 0, EDGE.back - PLACE.z)[1],
  RECORDER_BOUNDS[3],
);

/**
 * The CoCo 2 on the table in front of the set (a trial: `?nococo` leaves it out). Drawn over the TV's pass, lined up
 * with the set through `Tv.picture`; whatever is drawn after it (the book, the notebook) goes over it. It sets where
 * the TV draws (`view`): lifted to show the whole machine when there's room, and pulled back to the whole desk (set,
 * machine, cords) while `focused` (main.ts decides, through `Framing`). A click in the TV's part of the window that
 * nothing else takes (`busy`: the knobs, the rocker, the smack, the notebook while out) is main.ts's (`onSet`: it puts
 * the book away, or goes in to the set or back out). A click on a key types it (`keys`); one on the recorder or a cassette is the recorder's.
 */
export class Computer {
  private readonly program: Program;
  private readonly print: WebGLTexture;
  private readonly vao: WebGLVertexArrayObject;
  /** The march as last drawn (`marchCache.ts`), and the view it was last drawn at (a change is the view moving). */
  private readonly cache: MarchCache;
  private lastView: number[] = [];
  /** The screen's light the march was last given. */
  private lit: number[] = [];
  visible = true;
  /** Pulled back to the whole desk (main.ts: `Framing`), and how far along the way there (0..1). */
  focused = false;
  private focusT = 0;
  private hover: 'case' | 'key' | 'set' | 'recorder' | null = null;
  /** A press in the TV's part of the window that becomes a click (`onSet`) if it is let go without moving; `at` is where (buffer pixels, y up). */
  private press: { id: number; x: number; y: number; at: [number, number] } | null = null;
  /** Where a click on a key goes (main.ts: the keyboard's queue, as if typed). */
  onKey: (k: TypedKey) => void = () => {};
  readonly keys = new CocoKeys((k) => this.onKey(k));
  /** The cassette recorder beside the set (main.ts), drawn in the same march; a click on it or a cassette is its own. */
  recorder: Recorder | null = null;
  private readonly recPrint: WebGLTexture;
  /** Whether something drawn over the machine (the magazine) is under the pointer, in 0..1 window coordinates (y up). */
  covered: (nx: number, ny: number) => boolean = () => false;
  /** Whether a click at a point (buffer pixels, y up) is something else's: a knob, the rocker, the smack, the notebook out. */
  busy: (x: number, y: number) => boolean = () => false;
  /** A click in the TV's part of the window that nothing else took, at a point in buffer pixels (y up). */
  onSet: (x: number, y: number) => void = () => {};
  /** The TV's part of the window (buffer pixels) and the picture (`Tv.picture`) as last drawn, for the pointer. */
  private area = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /** What the view fills: `area`, or pulled back to the desk, the desk view's (`DeskTable.area`), which holds it. */
  private shown = this.area;
  private picture: readonly number[] = [0, 0, 1, 1];
  private readonly desk = deskBounds();
  private readonly keyboard = keyboardBounds();
  /**
   * How far the magazine and the notes have gone onto the table (0..1, eased): they go as the view pulls back to the
   * desk, each only if the window shows the table round its spot (`DeskSpot`); otherwise they stay where they are.
   */
  private readonly onDesk = new DeskTable(DESK_TIME);

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.program = linkProgram(gl, FULLSCREEN_VERT, COMPUTER_FRAG);
    this.vao = gl.createVertexArray()!;
    this.cache = new MarchCache(gl);
    this.print = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.print);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PRINT_W, PRINT_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, drawPrint());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.recPrint = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.recPrint);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, drawRecorderPrint());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.listen();
  }

  /**
   * Where the TV should draw (`Tv.draw`'s rectangle and frame), given the book's (`Magazine.tv`, `.frame`): lifted, if
   * the window has room over the set, until the whole machine shows under it (in a tall window undone as the book comes
   * out under the set); pulled back to the whole desk while `focused` (`open`, `Magazine.openT`: the edges the put-away
   * book leaves it). The returned rectangle holds the book's, so the set's knobs and glass answer wherever they show.
   * While the book moves, the view is eased between the ones it has at each end of the move (`ends`, `tvEnds`), not
   * fitted afresh to the rectangle on the way: the fit slides and lifts the set by cases (the keyboard in view or not,
   * room over the set or not), which would jump and lurch part way through.
   */
  view(dt: number, rect: Rect, frame: number, open: number, ends: readonly TvEnd[]): { rect: Rect; frame: number } {
    const W = this.gl.drawingBufferWidth;
    const H = this.gl.drawingBufferHeight;
    this.area = { x0: rect.x * W, y0: rect.y * H, x1: (rect.x + rect.w) * W, y1: (rect.y + rect.h) * H };
    this.shown = this.area;
    if (!this.visible) {
      this.onDesk.clear();
      return { rect, frame };
    }
    this.keys.step(dt);
    this.focusT = Math.min(1, Math.max(0, this.focusT + (this.focused ? dt : -dt) / DESK_TIME));
    const homes = ends.map((e) => ({ v: this.home(e.tv, e.frame, e.open), w: e.w }));
    const sum = (f: (v: View) => number) => homes.reduce((n, h) => n + h.w * f(h.v), 0);
    const a: View = { cx: sum((v) => v.cx), cy: sum((v) => v.cy), k: Math.exp(sum((v) => Math.log(v.k))) };
    // The edges the book and the notebook keep put away, which the desk view may take (none while the book is out).
    const c = 1 - smooth(Math.min(1, Math.max(0, open)));
    const window = { ...this.area, x1: this.area.x1 + (W - this.area.x1) * c, y0: this.area.y0 * (1 - c) };
    const b = this.onDesk.whole(this.area, window, this.desk, a.k);
    this.onDesk.step(dt, this.focused, b);
    const t = smooth(this.focusT);
    if (t === 0) return this.toTv(a);
    this.shown = this.onDesk.area;
    return this.toTv({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, k: a.k * Math.pow(b.k / a.k, t) });
  }

  /** Pulled back to the whole desk at once, the magazine and the notes already lying on the table (the page's opening). */
  startWide(): void {
    this.focused = true;
    this.focusT = 1;
    this.onDesk.snap = true;
  }

  /** The book's view of the set in TV rectangle `rect`, lifted to show the machine if there's room over the set. */
  private home(rect: Rect, frame: number, open: number): View {
    const W = this.gl.drawingBufferWidth;
    const H = this.gl.drawingBufferHeight;
    const area = { x0: rect.x * W, y0: rect.y * H, x1: (rect.x + rect.w) * W, y1: (rect.y + rect.h) * H };
    const [px, py] = [TUBE[0] * ACTIVE[0], TUBE[1] * ACTIVE[1]];
    // As Tv.draw: pixels per panel unit, the picture's centre; the set's top edge and the machine's lowest point.
    const k = (0.5 * rect.h * H) / Math.max(py + frame, (px + frame) / ((rect.w * W) / (rect.h * H)));
    const cx = (rect.x + rect.w / 2) * W;
    const cy = (rect.y + rect.h / 2) * H;
    const top = cy + (py + frame) * k;
    const bottom = cy + (lowestPoint() - BELOW) * k;
    const t = W / H < TALL ? smooth(Math.min(1, Math.max(0, open))) : 0;
    const ly = cy + Math.max(0, Math.min(-bottom, H - top)) * (1 - t);
    return { cx: cx + this.slide(area, cx, ly, k, px), cy: ly, k };
  }

  /**
   * How far to slide the set sideways (pixels) so that more of the keyboard shows, all of it if it fits in the TV's
   * part of the window (`a`); the picture always stays inside it. Nothing while the keyboard is off the bottom.
   */
  private slide(a: typeof this.area, cx: number, cy: number, k: number, px: number): number {
    const [x0, , x1, y1] = this.keyboard;
    if (cy + (y1 - TUBE_C[1]) * k < a.y0) return 0;
    const l = cx + (x0 - TUBE_C[0]) * k;
    const r = cx + (x1 - TUBE_C[0]) * k;
    const m = 0.02 * (a.x1 - a.x0);
    let dx = 0;
    if (r - l > a.x1 - a.x0 - 2 * m) dx = (a.x0 + a.x1) / 2 - (l + r) / 2;
    else if (l < a.x0 + m) dx = a.x0 + m - l;
    else if (r > a.x1 - m) dx = a.x1 - m - r;
    // The picture, with a little of the bezel, stays in.
    const half = (px + 0.06) * k;
    const lo = a.x0 - (cx - half);
    const hi = a.x1 - (cx + half);
    return lo > hi ? 0 : Math.min(hi, Math.max(lo, dx));
  }

  /** How far the magazine or the notes lie on the table (0..1, eased: see `DeskTable`), and where. */
  table(what: 'magazine' | 'notes'): { t: number; spot: DeskSpot } {
    return this.onDesk.at(what);
  }

  /**
   * A view as `Tv.draw`'s rectangle and frame: a rectangle centred on the picture that holds the TV's part of the
   * window, and the frame that makes it fit the picture at `k` (as Tv.draw: by its height or width, the tighter).
   */
  private toTv(v: View): { rect: Rect; frame: number } {
    const W = this.gl.drawingBufferWidth;
    const H = this.gl.drawingBufferHeight;
    const a = this.shown;
    const hw = Math.max(v.cx - a.x0, a.x1 - v.cx, 1);
    const hh = Math.max(v.cy - a.y0, a.y1 - v.cy, 1);
    const s = hh / v.k;
    const frame = Math.max(0, Math.min(s - TUBE[1] * ACTIVE[1], (s * hw) / hh - TUBE[0] * ACTIVE[0]));
    return { rect: { x: (v.cx - hw) / W, y: (v.cy - hh) / H, w: (2 * hw) / W, h: (2 * hh) / H }, frame };
  }

  /**
   * What a pointer event is over: a key (row and index), the rest of the machine, the recorder or a cassette, the rest
   * of the TV's part of the window (`set`: the glass, the cabinet, the room), or nothing (outside it, or something else's there).
   */
  private under(e: PointerEvent): { row: number; i: number } | { rec: CassetteId | 'recorder' } | 'case' | 'set' | null {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    const [x, y] = this.toBuffer(e);
    if (this.covered((e.clientX - r.left) / r.width, (r.bottom - e.clientY) / r.height)) return null;
    const a = this.shown;
    if (x < a.x0 || x > a.x1 || y < a.y0 || y > a.y1) return null;
    if (this.busy(x, y)) return null;
    const p = this.picture;
    const k = p[3] / (TUBE[1] * ACTIVE[1]);
    const px = (x - p[0]) / k + TUBE_C[0];
    const py = (y - p[1]) / k + TUBE_C[1];
    const rec = this.recorder && recorderAt(this.recorder, px, py);
    if (rec) return { rec };
    if (!onCase(px, py)) return 'set';
    return keyAt(px, py) ?? 'case';
  }

  /** A pointer event's place in buffer pixels, y up. */
  private toBuffer(e: PointerEvent): [number, number] {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    const s = this.gl.drawingBufferWidth / c.clientWidth;
    return [(e.clientX - r.left) * s, (r.bottom - e.clientY) * s];
  }

  /**
   * In the capture phase, after the notebook's (made before this) and before the set's: the machine is in front. A
   * press elsewhere on the set is left to it (the glass still wipes) and counts as a click only if it hardly moves.
   */
  private listen(): void {
    const c = this.canvas;
    c.addEventListener(
      'pointerdown',
      (e) => {
        this.press = null;
        if (e.button !== 0 || !this.visible) return;
        const at = this.under(e);
        if (!at) return;
        if (at === 'set') {
          this.press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: this.toBuffer(e) };
          return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
        if (at === 'case') return;
        if ('rec' in at) this.recorder?.click(at.rec);
        else this.keys.press(at.row, at.i);
      },
      { capture: true },
    );
    window.addEventListener(
      'pointerup',
      (e) => {
        this.keys.release();
        if (this.press?.id === e.pointerId) this.onSet(...this.press.at);
        this.press = null;
      },
      true,
    );
    window.addEventListener('pointercancel', () => {
      this.keys.release();
      this.press = null;
    });
    c.addEventListener(
      'pointermove',
      (e) => {
        const p = this.press;
        if (p?.id === e.pointerId && Math.hypot(e.clientX - p.x, e.clientY - p.y) > CLICK_SLOP) this.press = null;
        const at = this.visible ? this.under(e) : null;
        this.hover = at === null || at === 'case' || at === 'set' ? at : 'rec' in at ? 'recorder' : 'key';
      },
      true,
    );
  }

  /** The pointer over the machine: a key or the recorder can be pressed. */
  cursor(): void {
    if (this.press) return;
    if (this.hover === 'key' || this.hover === 'recorder') this.canvas.style.cursor = 'pointer';
  }

  /** `picture` and `glow` are the TV's last frame. */
  draw(picture: readonly number[], glow: readonly number[]): void {
    this.picture = [...picture];
    if (!this.visible) return;
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    // Pixels per panel unit, from the picture's half height; nothing is drawn above the table's back edge (a pixel's margin).
    const k = picture[3] / (TUBE[1] * ACTIVE[1]);
    const top = picture[1] + (DRAWN_TOP - TUBE_C[1]) * k + 2;
    if (!scissor(gl, 0, 0, W, top)) return;
    // The march is costly and its picture changes only with the view, the screen's light and the keys: it is kept, and
    // marched again only when one of them changes. While the view moves the kept one moves with it and only what comes
    // into view is marched, once per CSS pixel (a quarter of the work on a 2× screen); sharp again the frame it stops.
    const view = [W, H, picture[0], picture[1], k];
    const moving = view.some((v, i) => v !== this.lastView[i]);
    this.lastView = view;
    const s = moving && this.canvas.clientWidth > 0 ? Math.min(1, Math.max(0.5, this.canvas.clientWidth / W)) : 1;
    // The light thrown is held until it really changes: the cursor's blink and a few letters more or less on the screen
    // shouldn't march it again. While the view moves it is held as it was (the march once it stops catches up), so the
    // kept picture can move with the view.
    const changed = !this.lit.length || glow.some((g, i) => Math.abs(g - this.lit[i]) > GLOW_STEP);
    const lit = changed && (!moving || !this.lit.length) ? glow.map((g) => Math.round(g * 256) / 256) : this.lit;
    this.lit = lit;
    // A key going down or up changes only the caps round it (and the shade they throw), and the recorder's door, keys
    // and cassettes only the recorder: just that is marched again.
    const keys = this.keys.uniform();
    const rec = this.recorder?.uniforms() ?? [];
    const n = keys.length;
    const around = (was: readonly number[]): [number, number, number, number] | null => {
      const px = (x: number, i: number) => picture[i] + (x - TUBE_C[i]) * k;
      const caps = capsBounds(was.slice(0, n), keys);
      const moved = rec.some((v, i) => v !== was[n + i]);
      const bs = [...(caps ? [caps] : []), ...(moved ? [RECORDER_BOUNDS] : [])];
      if (!bs.length) return null;
      return [px(Math.min(...bs.map((b) => b[0])), 0) - 2, px(Math.min(...bs.map((b) => b[1])), 1) - 2, px(Math.max(...bs.map((b) => b[2])), 0) + 2, px(Math.max(...bs.map((b) => b[3])), 1) + 2];
    };
    gl.bindVertexArray(this.vao);
    this.cache.draw({ x: picture[0], y: picture[1], k }, [W, H, ...lit], s, moving, [0, 0, W, top], (pic, rows) => {
      gl.useProgram(this.program.prog);
      const u = this.program.u;
      gl.uniform3f(u.uPic, ...pic);
      gl.uniform3f(u.uRows, rows[0], rows[1], rows[2]);
      gl.uniform3f(u.uGlow, lit[0], lit[1], lit[2]);
      gl.uniform4fv(u.uKeys, keys);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.print);
      gl.uniform1i(u.uPrint, 0);
      if (rec.length) {
        gl.uniform1f(u.uLid, rec[0]);
        gl.uniform4f(u.uRecKeys, rec[1], rec[2], rec[3], rec[4]);
        gl.uniform4f(u.uCasA, rec[5], rec[6], rec[7], rec[8]);
        gl.uniform4f(u.uCasB, rec[9], rec[10], rec[11], rec[12]);
        gl.uniform2f(u.uCasTilt, rec[13], rec[14]);
        gl.uniform2f(u.uReel, rec[15], rec[16]);
      } else {
        gl.uniform4f(u.uCasA, 0, -10, 0, 0);
        gl.uniform4f(u.uCasB, 0, -10, 0, 0);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.recPrint);
      gl.uniform1i(u.uRecPrint, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }, { key: [...keys, ...rec], clip: around });
    gl.disable(gl.SCISSOR_TEST);
  }
}
