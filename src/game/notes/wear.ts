/**
 * How the notebook page ages as it is used. Two things wear it: handling (each time it is held up to read and put down
 * again, counted in `handled` and kept in localStorage) and writing (each note may leave the pen's mark beside it). Every
 * mark has its own seed and the handling count it turns up at, so a page only ever gains marks: the coffee ring from
 * the seventh read is in the same place on the fortieth. The seeds are offset by one saved at random for each run (`seed`
 * beside `handled`), so every new page wears its own way and `?clear` brings a different one.
 */

import { blot, coffee, dogEar, fingerprint, fold, rand, type Rand } from './stains';

const KEY = 'coco2.notebook';

interface Saved {
  handled?: unknown;
  seed?: unknown;
}

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Saved;
  } catch {
    return {}; // unreadable: a clean page
  }
}

/** This run's offset for every wear seed: made the first time, then kept so the page looks the same on each reload. */
const pageSeed = ((): number => {
  const saved = load();
  const n = Number(saved.seed);
  if (Number.isInteger(n)) return n;
  const seed = Math.floor(Math.random() * 0x7fffffff);
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...saved, seed }));
  } catch {
    /* no storage: a new page each load */
  }
  return seed;
})();

/** A generator for one mark, its own `k` shifted by this run's seed. */
const seeded = (k: number): Rand => rand(pageSeed + k);

export function readHandled(): number {
  const n = Number(load().handled);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function saveHandled(handled: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ handled, seed: pageSeed }));
  } catch {
    /* private window or blocked storage: the page just comes back clean */
  }
}

/** Where the pen stopped at the end of a note, and how rushed it was. */
export interface InkMark {
  x: number;
  y: number;
  seed: number;
  mood: number;
  ink: [number, number, number];
}

/** Fingerprints come quickly at first, then more slowly: the 1st, 3rd, 6th, 10th… handling. */
const PRINTS = Array.from({ length: 14 }, (_, i) => 1 + (i * (i + 3)) / 2);
/** Where a page is gripped to lift it: the bottom corners and edges most, now and then the top. */
const GRIPS: [number, number][] = [[80, 1040], [730, 1050], [755, 640], [70, 760], [420, 1065], [740, 90], [110, 1000], [700, 980]];
const COFFEE = [7, 24, 55];
const FOLDS = [12, 34];
const DOG_EAR = 18;
/** Overall age, 0 new to 1 old: yellowing, foxing, grime at the edges. */
const age = (handled: number): number => 1 - Math.exp(-handled / 45);

/** Yellowing, browned edges, foxing and dirt: under the writing, as the ink sits on top of it. */
export function ageUnder(ctx: CanvasRenderingContext2D, W: number, H: number, edge: number, handled: number, sheet = 0): void {
  const a = age(handled);
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(200,160,80,${0.13 * a})`;
  ctx.fillRect(0, 0, W, H);
  // The edges go first, browner than the middle.
  const band = 70;
  const edges: [number, number, number, number][] = [[edge, 0, edge + band, 0], [W, 0, W - band, 0], [0, 0, 0, band], [0, H, 0, H - band]];
  for (const [x0, y0, x1, y1] of edges) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(140,95,35,${0.28 * a})`);
    g.addColorStop(1, 'rgba(140,95,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // Foxing: small rust spots that come one by one.
  const fox = seeded(sheet * 1009 + 311);
  const spots = Math.floor(a * 26);
  for (let i = 0; i < spots; i++) {
    const [x, y, s] = [edge + fox() * (W - edge), fox() * H, 2 + fox() ** 2 * 7];
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, 'rgba(150,95,40,0.22)');
    g.addColorStop(1, 'rgba(150,95,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  // Grime from the table and the hand: mostly along the bottom edge and in its corners.
  const dirt = seeded(sheet * 1009 + 523);
  const grains = Math.floor(a * 700);
  for (let i = 0; i < grains; i++) {
    const corner = dirt() < 0.5;
    const x = corner ? (dirt() < 0.5 ? edge + dirt() ** 2 * 200 : W - dirt() ** 2 * 200) : edge + dirt() * (W - edge);
    const y = H - dirt() ** 2.5 * (corner ? 260 : 120);
    ctx.fillStyle = `rgba(70,58,44,${0.05 + dirt() * 0.12})`;
    ctx.fillRect(x, y, 1 + dirt() * 1.8, 1 + dirt() * 1.8);
  }
  const g = ctx.createLinearGradient(0, H, 0, H - 90);
  g.addColorStop(0, `rgba(90,75,55,${0.16 * a})`);
  g.addColorStop(1, 'rgba(90,75,55,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Folds, coffee rings, fingerprints and the pen's blots: over the writing. */
export function ageOver(ctx: CanvasRenderingContext2D, W: number, H: number, edge: number, handled: number, inks: readonly InkMark[], sheet = 0): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  for (const mark of inks) penMark(ctx, mark);
  if (handled >= FOLDS[0]) {
    const r = seeded(sheet * 1009 + 71);
    const y = H * (0.47 + r() * 0.06);
    fold(ctx, [edge, y + (r() - 0.5) * 10], [W, y + (r() - 0.5) * 14], r);
  }
  if (handled >= FOLDS[1]) {
    const r = seeded(sheet * 1009 + 72);
    const x = W * (0.5 + r() * 0.06);
    fold(ctx, [x + (r() - 0.5) * 10, 0], [x + (r() - 0.5) * 14, H], r);
  }
  if (handled >= DOG_EAR) dogEar(ctx, W, H, seeded(sheet * 1009 + 91));
  COFFEE.forEach((at, i) => {
    if (handled < at) return;
    const r = seeded(sheet * 1009 + 1301 + i * 17);
    coffee(ctx, edge + 90 + r() * (W - edge - 180), 90 + r() * (H - 180), 62 + r() * 18, r);
  });
  PRINTS.forEach((at, i) => {
    if (handled < at) return;
    const r = seeded(sheet * 1009 + 2203 + i * 29);
    const [gx, gy] = GRIPS[i % GRIPS.length];
    fingerprint(ctx, gx + (r() - 0.5) * 70, gy + (r() - 0.5) * 70, r() * Math.PI * 2, 0.9 + r() * 0.3, r() < 0.2, r);
  });
  ctx.restore();
}

/** What the pen leaves where it stopped: often nothing, a small gob of ballpoint ink, a splotch, or a smear. */
function penMark(ctx: CanvasRenderingContext2D, m: InkMark): void {
  const r = rand(m.seed);
  // The more rushed the hand, the messier the pen.
  if (r() > 0.25 + m.mood * 0.7) return;
  const kind = r();
  const [ir, ig, ib] = m.ink;
  if (kind < 0.45) blot(ctx, m.x + 4 + r() * 10, m.y - 8 + r() * 6, 2 + r() * 2.5, m.ink, r);
  else if (kind < 0.75 || m.mood > 0.4) blot(ctx, m.x + 10 + r() * 60, m.y - 10 + r() * 12, 5 + r() * 6 + m.mood * 6, m.ink, r);
  else {
    // The side of the hand dragged through wet ink: faint streaks running on from the last word.
    const len = 40 + r() * 70;
    const slope = (r() - 0.5) * 8;
    for (let j = 0; j < 4; j++) {
      const y = m.y - 16 + j * 2.6 + r();
      const g = ctx.createLinearGradient(m.x - 30, y, m.x - 30 + len, y);
      g.addColorStop(0, `rgba(${ir},${ig},${ib},${0.22 + r() * 0.12})`);
      g.addColorStop(1, `rgba(${ir},${ig},${ib},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1 + r() * 1.2;
      ctx.beginPath();
      ctx.moveTo(m.x - 30, y);
      ctx.quadraticCurveTo(m.x - 30 + len * 0.5, y + slope * 0.3, m.x - 30 + len, y + slope);
      ctx.stroke();
    }
  }
}

