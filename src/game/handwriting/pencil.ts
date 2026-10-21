import { gauss, mulberry32, type Rand } from './rand';

type P = [number, number];

/** A tremor along a stroke: each point pushed across the line by a nudge eased from one knot to the next, a few points apart. */
export function shake(path: P[], amp: number, r: Rand): P[] {
  const STEP = 3;
  const knots = Array.from({ length: Math.ceil(path.length / STEP) + 2 }, () => gauss(r) * amp);
  return path.map((p, i) => {
    const a = path[Math.max(i - 1, 0)];
    const b = path[Math.min(i + 1, path.length - 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const k = Math.floor(i / STEP);
    const f = (1 - Math.cos(((i / STEP) - k) * Math.PI)) / 2;
    const d = knots[k] + (knots[k + 1] - knots[k]) * f;
    return [p[0] - ((b[1] - a[1]) / len) * d, p[1] + ((b[0] - a[0]) / len) * d];
  });
}

/** Each canvas's graphite: a tile of the ink at uneven strength, so a pencil line catches the paper's tooth. */
const graphites = new WeakMap<object, Map<string, CanvasPattern | null>>();

export function graphite(ctx: CanvasRenderingContext2D, ink: [number, number, number]): CanvasPattern | null {
  const key = ink.join();
  const made = graphites.get(ctx) ?? new Map<string, CanvasPattern | null>();
  graphites.set(ctx, made);
  if (made.has(key)) return made.get(key)!;
  const N = 64;
  const tile = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: N, height: N }) : null;
  const tg = tile?.getContext('2d') as CanvasRenderingContext2D | null | undefined;
  let pattern: CanvasPattern | null = null;
  if (tile && tg) {
    const img = tg.createImageData(N, N);
    const r = mulberry32(0x9a7e1);
    for (let i = 0; i < N * N; i++) {
      // Mostly solid, thinner in places, and now and then a speck of paper the lead skipped.
      const t = r();
      const a = t < 0.06 ? 0.2 : 0.75 + 0.25 * r();
      img.data.set([ink[0], ink[1], ink[2], Math.round(a * 255)], i * 4);
    }
    tg.putImageData(img, 0, 0);
    pattern = ctx.createPattern(tile as CanvasImageSource, 'repeat');
  }
  made.set(key, pattern);
  return pattern;
}
