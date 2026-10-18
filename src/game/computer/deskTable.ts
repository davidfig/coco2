import { TUBE_C } from '../tv/cabinetShader';
import { DESK_LAYOUTS, type DeskLayout, type DeskSpot, onSpot, worldToPanel } from './layout';

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

/** Room round the desk when the view pulls back to it (a share of the TV's part of the window, each side). */
const DESK_MARGIN = 0.04;
/** How much smaller than the desk alone the set may get when the view pulls back to take in the magazine and the notes on the table. */
const SPOT_SHRINK = 0.6;

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The magazine and the notes on the table, for the view pulled back to the whole desk: which of `DESK_LAYOUTS` it
 * makes room for (`whole`), and how far each has gone onto the table (0..1, eased over `time`). Each goes only if the
 * window shows the table round its spot; otherwise it stays where it is.
 */
export class DeskTable {
  private readonly onTable = { magazine: 0, notes: 0 };
  /** The arrangement the desk view makes room for; `spots` where each last lay, to go back from. */
  private layout: DeskLayout = {};
  private readonly spots: Required<DeskLayout> = { magazine: DESK_LAYOUTS[0].magazine!, notes: DESK_LAYOUTS[0].notes! };

  constructor(private readonly time: number) {}

  /**
   * The whole desk (`desk`, panel bounds) in `area`, centred; never closer in than `k`. It pulls back further to take in
   * the table where the magazine and the notes lie, in the first of `DESK_LAYOUTS` that keeps the set at least
   * `SPOT_SHRINK` of its size; if none does, they stay where they are.
   */
  whole(area: Area, desk: readonly number[], k: number): View {
    const base = fit(area, k, desk);
    for (const layout of DESK_LAYOUTS) {
      const v = fit(area, k, desk, Object.values(layout));
      if (v.k >= base.k * SPOT_SHRINK) {
        this.layout = layout;
        return v;
      }
    }
    this.layout = {};
    return base;
  }

  /** Move each on or off the table: on while `focused` and its spot shows in `v` (the whole view, `whole`) inside `area`. */
  step(dt: number, focused: boolean, area: Area, v: View): void {
    for (const what of ['magazine', 'notes'] as const) {
      const spot = this.layout[what];
      // A move to another spot (the window resized) goes by way of where it was: off the table, then on again.
      const there = !!spot && (spot === this.spots[what] || this.onTable[what] === 0);
      if (there) this.spots[what] = spot;
      const on = there && focused && room(area, v, spot);
      this.onTable[what] = Math.min(1, Math.max(0, this.onTable[what] + (on ? dt : -dt) / this.time));
    }
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

/** The corners of spots on the table, in panel units. */
function corners(spots: readonly DeskSpot[]): [number, number][] {
  return spots.flatMap((s) => [-1, 1].flatMap((u) => [-1, 1].map((w) => worldToPanel(...onSpot(s, u * s.hw, w * s.hd)))));
}

/** The view that fits panel bounds `b`, and the spots' corners, in `a`; never closer in than `k`. */
function fit(a: Area, k: number, b: readonly number[], spots: readonly DeskSpot[] = []): View {
  let [x0, y0, x1, y1] = b;
  for (const [px, py] of corners(spots)) [x0, y0, x1, y1] = [Math.min(x0, px), Math.min(y0, py), Math.max(x1, px), Math.max(y1, py)];
  const f = Math.min(k, ((a.x1 - a.x0) * (1 - 2 * DESK_MARGIN)) / (x1 - x0), ((a.y1 - a.y0) * (1 - 2 * DESK_MARGIN)) / (y1 - y0));
  return { cx: (a.x0 + a.x1) / 2 - ((x0 + x1) / 2 - TUBE_C[0]) * f, cy: (a.y0 + a.y1) / 2 - ((y0 + y1) / 2 - TUBE_C[1]) * f, k: f };
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
