import { TUBE_C } from '../tv/cabinetShader';
import { DESK_LAYOUTS, type DeskLayout, type DeskSpot, EYE_AT, TABLE, UNDER, lowestPoint, onSpot, worldToPanel } from './layout';

/** A view of the set, in buffer pixels: where the picture's centre is and how many pixels a panel unit spans. */
export interface View {
  cx: number;
  cy: number;
  k: number;
}

/** A part of the window, in buffer pixels. */
export interface Area {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Room round the desk when the view pulls back to it (a share of the window it fills, each side). */
const DESK_MARGIN = 0.025;
/** How much smaller than the desk alone the set may get when the view pulls back to take in the magazine and the notes on the table. */
const SPOT_SHRINK = 0.6;
/** Room kept under the lowest of the machine and the spots on the table when the desk view crops its bottom (panel units). */
const LOW = 0.15;

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The magazine and the notes on the table, for the view pulled back to the whole desk: which of `DESK_LAYOUTS` it
 * makes room for (`whole`), and how far each has gone onto the table (0..1, eased over the view's move: `step`'s `time`). Each goes only if the
 * window shows the table round its spot; otherwise it stays where it is.
 */
export class DeskTable {
  private readonly onTable = { magazine: 0, notes: 0 };
  /** The arrangement the desk view makes room for; `spots` where each last lay, to go back from. */
  private layout: DeskLayout = {};
  private readonly spots: Required<DeskLayout> = { magazine: DESK_LAYOUTS[0].magazine!, notes: DESK_LAYOUTS[0].notes! };
  /** The part of the window the desk view fills (`whole`): the TV's, and the edges kept for the magazine and the notes put away, for each that lies on the table instead. */
  area: Area = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /** The next `step` puts each where it is going at once, with no slide (the page opening on the desk). */
  snap = false;

  /**
   * The whole desk (`desk`, panel bounds) in `area`, centred; never closer in than `k`. It pulls back further to take in
   * the table where the magazine and the notes lie, in the first of `DESK_LAYOUTS` that keeps the set at least
   * `SPOT_SHRINK` of its size; if none does, they stay where they are. Each that lies on the table gives back the edge
   * of the window kept for it put away (`window`: the book's on the right, the notebook's along the bottom), so the desk
   * comes in closer to fill it (`this.area`).
   */
  whole(area: Area, window: Area, desk: readonly number[], k: number): View {
    const base = fit(area, k, desk);
    for (const layout of DESK_LAYOUTS) {
      const a = { ...area, x1: layout.magazine ? window.x1 : area.x1, y0: layout.notes ? window.y0 : area.y0 };
      const v = fit(a, k, desk, Object.values(layout), facing(layout.magazine));
      if (v.k >= base.k * SPOT_SHRINK) {
        this.layout = layout;
        this.area = a;
        return v;
      }
    }
    this.layout = {};
    this.area = area;
    return base;
  }

  /** Move each on or off the table over `time` (seconds): on while `focused` and its spot shows in `v` (the whole view, `whole`) inside its `area`. */
  step(dt: number, focused: boolean, v: View, time: number): void {
    const area = this.area;
    for (const what of ['magazine', 'notes'] as const) {
      const spot = this.layout[what];
      // A move to another spot (the window resized) goes by way of where it was: off the table, then on again.
      const there = !!spot && (spot === this.spots[what] || this.onTable[what] === 0);
      if (there) this.spots[what] = spot;
      const on = there && focused && room(area, v, spot);
      this.onTable[what] = this.snap ? +on : Math.min(1, Math.max(0, this.onTable[what] + (on ? dt : -dt) / time));
    }
    this.snap = false;
  }

  /** Off the table at once (the machine hidden). */
  clear(): void {
    this.onTable.magazine = this.onTable.notes = 0;
  }

  /** How far the magazine or the notes lie on the table (0..1, eased), and where. */
  at(what: 'magazine' | 'notes'): { t: number; spot: DeskSpot } {
    return { t: smooth(this.onTable[what]), spot: this.spots[what] };
  }
}

/** Spot `s`'s point (u, v) on screen as drawn there, seen square on (`facing.ts`), in panel units. */
function seen(s: DeskSpot, u: number, v: number): [number, number] {
  const dx = s.x - EYE_AT[0];
  const p = onSpot(s, u, v);
  const off = worldToPanel(s.x, TABLE, s.z)[0] - worldToPanel(s.x - dx, TABLE, s.z)[0];
  const q = worldToPanel(p[0] - dx, p[1], p[2]);
  return [q[0] + off, q[1]];
}

/** The corners of spots on the table as drawn there, in panel units. */
function corners(spots: readonly DeskSpot[]): [number, number][] {
  return spots.flatMap((s) => [-1, 1].flatMap((u) => [-1, 1].map((w) => seen(s, u * s.hw, w * s.hd))));
}

/** How far the magazine lying open at `spot` reaches past its right-hand edge (panel units): its facing page, away from the set. */
function facing(spot?: DeskSpot): number {
  if (!spot) return 0;
  const xs = (u: number) => [-1, 1].map((w) => seen(spot, u * spot.hw, w * spot.hd)[0]);
  return Math.max(0, Math.max(...xs(3)) - Math.max(...xs(1)));
}

/**
 * The view that fits panel bounds `b`, and the spots' corners, in `a`; never closer in than `k`. If the width has room
 * to spare, the bottom is cropped to bring the desk in closer, so it fills the width: the space under the table, then
 * the table's front edge, down to just under the machine and the spots (`LOW`); the top stays where it fits. Width
 * still to spare goes to the right, as far as `reach` (panel units: the magazine's facing page fills it) and so
 * that what shows past it on the right matches the left.
 */
function fit(a: Area, k: number, b: readonly number[], spots: readonly DeskSpot[] = [], reach = 0): View {
  let [x0, y0, x1, y1] = b;
  let low = Math.min(b[1] + UNDER, lowestPoint() - LOW);
  for (const [px, py] of corners(spots)) {
    [x0, y0, x1, y1] = [Math.min(x0, px), Math.min(y0, py), Math.max(x1, px), Math.max(y1, py)];
    low = Math.min(low, py - LOW);
  }
  const w = (a.x1 - a.x0) * (1 - 2 * DESK_MARGIN);
  const h = (a.y1 - a.y0) * (1 - 2 * DESK_MARGIN);
  const f = Math.min(k, w / (x1 - x0), h / (y1 - Math.min(low, y1 - 1e-6)));
  const spare = Math.max(0, w - (x1 - x0) * f);
  const cx = (a.x0 + a.x1) / 2 - ((x0 + x1) / 2 - TUBE_C[0]) * f - Math.min(spare, reach * f) / 2;
  // All of it fits: centred. Otherwise the top at the margin, and as much under the table as shows.
  const cy = f * (y1 - y0) <= h ? (a.y0 + a.y1) / 2 - ((y0 + y1) / 2 - TUBE_C[1]) * f : a.y1 - (a.y1 - a.y0) * DESK_MARGIN - (y1 - TUBE_C[1]) * f;
  return { cx, cy, k: f };
}

/** Whether the whole of a spot on the table shows in view `v`, inside `a`. */
function room(a: Area, v: View, spot: DeskSpot): boolean {
  const m = DESK_MARGIN * 0.5 * Math.min(a.x1 - a.x0, a.y1 - a.y0);
  return corners([spot]).every(([px, py]) => {
    const x = v.cx + (px - TUBE_C[0]) * v.k;
    const y = v.cy + (py - TUBE_C[1]) * v.k;
    return x > a.x0 + m && x < a.x1 - m && y > a.y0 + m && y < a.y1 - m;
  });
}
