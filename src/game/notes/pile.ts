/** Where each loose sheet of the notebook lies while it is held up: the pile, a sheet pulled aside, a sheet going under. */

/** How long a sheet takes to go from the top of the pile to the bottom (seconds). */
export const DEAL_TIME = 0.5;

/** A sheet on screen: centre and half size in window pixels (bottom-left origin), turned by `rot`. */
export type Sheet = { cx: number; cy: number; hx: number; hy: number; rot: number };

/** A sheet of the pile as drawn: which sheet it is and its place (0 = the top). */
export type Layer = Sheet & { sheet: number; place: number };

/**
 * A sheet going from the top of the pile to the bottom: `from` is the sheet that was on top, `t` runs 0 → 1 (it slides
 * away from `start` along `away`, then tucks under as the rest move up), or 1 → 0 for the bottom sheet coming back on top.
 */
export type Deal = { from: number; t: number; dir: 1 | -1; start: [number, number]; away: [number, number] };

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const inside = (s: Sheet, x: number, y: number): boolean => {
  const dx = x - s.cx;
  const dy = y - s.cy;
  const c = Math.cos(s.rot);
  const n = Math.sin(s.rot);
  return Math.abs(c * dx + n * dy) <= s.hx && Math.abs(-n * dx + c * dy) <= s.hy;
};

/** Sheet `j` places down the pile from top sheet `s` (fractions slide between places): each a little further down and to the left, turned a little more, so its edge shows. */
function slot(s: Sheet, j: number): Sheet {
  const ox = -0.065 * s.hx * j;
  const oy = -0.04 * s.hy * j;
  const c = Math.cos(s.rot);
  const n = Math.sin(s.rot);
  return { cx: s.cx + c * ox - n * oy, cy: s.cy + n * ox + c * oy, hx: s.hx, hy: s.hy, rot: s.rot + 0.025 * j };
}

/** The top sheet pulled `by` window pixels from its place, tipped a little the way it is pulled. */
export function pulled(s: Sheet, by: readonly [number, number], spin = 0): Sheet {
  return { ...s, cx: s.cx + by[0], cy: s.cy + by[1], rot: s.rot - (by[0] / s.hx) * 0.05 + spin };
}

/**
 * Every sheet that shows, from the bottom of the pile up, for a pile of `n` sheets with `sheet` on top at `s`, pulled
 * `off` aside, or partway through a `deal`. Up to three show: the rest lie hidden under the third.
 */
export function layers(s: Sheet, n: number, sheet: number, off: readonly [number, number], d: Deal | null): Layer[] {
  const deeper = Math.min(n, 3);
  const under = (a: number, j: number): number => (((a - j) % n) + n) % n;
  const out: Layer[] = [];
  if (!d) {
    for (let j = deeper - 1; j > 0; j--) out.push({ ...slot(s, j), sheet: under(sheet, j), place: j });
    out.push({ ...pulled(s, off), sheet, place: 0 });
    return out;
  }
  const spin = Math.sign(d.away[0] || 1) * -0.12;
  if (d.t < 0.5) {
    // Going: the top sheet slides off the pile.
    const u = smooth(d.t / 0.5);
    for (let j = deeper - 1; j > 0; j--) out.push({ ...slot(s, j), sheet: under(d.from, j), place: j });
    const by: [number, number] = [lerp(d.start[0], d.away[0], u), lerp(d.start[1], d.away[1], u)];
    out.push({ ...pulled(s, by, spin * u), sheet: d.from, place: 0 });
    return out;
  }
  // Tucking under: it comes back in at the bottom while the rest move up a place.
  const u = smooth((d.t - 0.5) / 0.5);
  const home = slot(s, deeper - 1);
  const gone = pulled(s, d.away, spin);
  out.push({ cx: lerp(gone.cx, home.cx, u), cy: lerp(gone.cy, home.cy, u), hx: s.hx, hy: s.hy, rot: lerp(gone.rot, home.rot, u), sheet: d.from, place: deeper });
  for (let j = Math.min(n - 1, 3); j > 0; j--) out.push({ ...slot(s, j - u), sheet: under(d.from, j), place: j - 1 });
  return out;
}
