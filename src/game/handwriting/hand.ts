import { GLYPHS, type Glyph, type Stroke } from './glyphs';

/**
 * A pen. `size` is the cap height in pixels; `mood` runs 0 (calm, neat) to 1 (rushed, shaking) and loosens every kind
 * of variation below at once; `seed` fixes the result, so the same text with the same seed is written the same way
 * every time it is redrawn, while every letter within it is different.
 */
export interface Pen {
  size: number;
  seed: number;
  mood?: number;
  slant?: number;
  ink?: [number, number, number];
  /** Told where each character of the line landed (its index, left and right edge), for anything that must find a word again. */
  track?: (index: number, x0: number, x1: number) => void;
}

type P = [number, number];
type Rand = () => number;

const BLUE_BLACK: [number, number, number] = [28, 58, 170];

function mulberry32(a: number): Rand {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r: Rand): number => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** A stable number from a string, for seeding. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Points along the pen path, a point every `step` pixels: straight between points, or Catmull-Rom through them. */
function sample(pts: P[], smooth: boolean, step: number): P[] {
  const out: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [p1, p2] = [pts[i], pts[i + 1]];
    const k = Math.max(smooth ? 3 : 1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    const p0 = pts[Math.max(i - 1, 0)];
    const p3 = pts[Math.min(i + 2, n - 1)];
    for (let j = 0; j < k; j++) {
      const t = j / k;
      if (!smooth) {
        out.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]);
        continue;
      }
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - 3 * c + d - a) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[n - 1]);
  return out;
}

/** Fill a stroke as a ribbon whose width rises and falls like a ballpoint's, thick where it lands, thin where it lifts. */
function ribbon(ctx: CanvasRenderingContext2D, pts: P[], width: number, color: string, r: Rand): void {
  const n = pts.length;
  const phase = r() * 10;
  const w = pts.map((_, i) => {
    const t = i / Math.max(1, n - 1);
    const press = 0.85 + 0.2 * Math.sin(phase + i * 0.45) + 0.1 * Math.sin(phase * 2 + i * 1.3);
    return width * press * (t < 0.1 ? 1.2 : t > 0.88 ? 0.55 + 0.45 * ((1 - t) / 0.12) : 1);
  });
  ctx.fillStyle = color;
  const dot = (p: P, d: number) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], d / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  if (n < 2) return dot(pts[0], width);
  const left: P[] = [];
  const right: P[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, n - 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / len) * (w[i] / 2);
    const ny = ((b[0] - a[0]) / len) * (w[i] / 2);
    left.push([p[0] + nx, p[1] + ny]);
    right.push([p[0] - nx, p[1] - ny]);
  });
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
  dot(pts[0], w[0]);
  dot(pts[n - 1], w[n - 1]);
}

function pick(ch: string, r: Rand): Glyph | null {
  const variants = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()];
  return variants ? variants[Math.floor(r() * variants.length)] : null;
}

const ADVANCE_GAP = 0.15;
const SPACE = 0.42;

/** How wide `text` comes out, on average (used for wrapping; every real letter differs a little). */
export function measure(text: string, size: number): number {
  let w = 0;
  for (const ch of text) {
    const g = (GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()])?.[0];
    w += (g ? g.w + ADVANCE_GAP : SPACE) * size;
  }
  return w;
}

/** Break `text` into lines no wider than `maxW`. */
export function wrap(text: string, size: number, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, size) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Write one line of text with its baseline at `y`, starting at `x`; returns how far it ran. Each letter is rebuilt from
 * its skeleton every time, with its own size, tilt, slant, wander off the baseline, shaken control points, pen pressure,
 * overshoot at the ends of strokes, and a spacing nudge; some letters have a second form to switch to. A writer grows
 * a little sloppier toward the end of a line, and `mood` raises all of it together.
 */
export function write(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, pen: Pen): number {
  const r = mulberry32(pen.seed);
  const mood = pen.mood ?? 0;
  const slantBase = pen.slant ?? 0.14;
  const ink = pen.ink ?? BLUE_BLACK;
  const up = text;
  const wander = r() * 6;
  // The whole line leans uphill or downhill a little, and the baseline rolls at two speeds on top of that.
  const hill = gauss(r) * 0.018;
  const wander2 = r() * 6;
  let cx = x;
  for (let i = 0; i < up.length; i++) {
    const g = pick(up[i], r);
    const x0 = cx;
    if (!g) {
      cx += SPACE * pen.size * (1 + gauss(r) * 0.12);
      pen.track?.(i, x0, cx);
      continue;
    }
    const m = clamp(mood + 0.18 * (i / Math.max(1, up.length)), 0, 1);
    const sc = clamp(1 + gauss(r) * (0.06 + 0.1 * m), 0.78, 1.28) * pen.size;
    const rot = gauss(r) * (0.03 + 0.09 * m);
    const slant = slantBase + gauss(r) * 0.05;
    const drift = (Math.sin(wander + i * 0.33) * 0.07 * (1 + m) + Math.sin(wander2 + i * 1.1) * 0.035 + gauss(r) * 0.04 * (1 + m) + hill * (cx - x) / pen.size) * pen.size;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const shade = Math.round(gauss(r) * 9);
    const color = `rgb(${ink[0] + shade},${ink[1] + shade},${ink[2] + shade})`;
    const to = (px: number, py: number): P => {
      const sx = px + slant * py;
      return [cx + (sx * cos - py * sin) * sc, y + drift - (sx * sin + py * cos) * sc];
    };
    for (const s of g.strokes) {
      const lean = gauss(r) * (0.015 + 0.025 * m);
      const bend = gauss(r) * (0.015 + 0.025 * m);
      const pts: P[] = s.pts.map(([px, py]) => [px + lean + gauss(r) * (0.02 + 0.045 * m), py + bend + gauss(r) * (0.02 + 0.045 * m)]);
      // Lines overshoot or fall short where the pen lands and lifts.
      const nudge = (a: P, b: P) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const d = gauss(r) * (0.025 + 0.04 * m);
        a[0] += ((a[0] - b[0]) / len) * d;
        a[1] += ((a[1] - b[1]) / len) * d;
      };
      if (pts.length > 1) {
        nudge(pts[0], pts[1]);
        nudge(pts[pts.length - 1], pts[pts.length - 2]);
      }
      const path = sample(pts.map(([px, py]) => to(px, py)), s.smooth, Math.max(1.2, pen.size * 0.06));
      const width = Math.max(1.1, pen.size * 0.075 * (1 + gauss(r) * 0.08));
      ribbon(ctx, path, width, color, r);
      if (m > 0.45 && r() < 0.1 * m) ribbon(ctx, path.map(([px, py]) => [px + gauss(r) * 0.8, py + gauss(r) * 0.8] as P), width * 0.8, color, r); // gone over twice
    }
    cx += (g.w * sc) + pen.size * (ADVANCE_GAP + gauss(r) * 0.035 + 0.05 * m);
    pen.track?.(i, x0, cx);
  }
  return cx - x;
}

/** A line the writer drew by hand from (x0, y0) to (x1, y1): an underline, or a strike-through when it wobbles more. */
export function dash(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, pen: Pen): void {
  const r = mulberry32(pen.seed ^ 0x9e3779b9);
  const mood = pen.mood ?? 0;
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / (pen.size * 0.5)));
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t + gauss(r) * 2, y0 + (y1 - y0) * t + gauss(r) * pen.size * (0.04 + 0.06 * mood)]);
  }
  const ink = pen.ink ?? BLUE_BLACK;
  ribbon(ctx, sample(pts, true, Math.max(1.2, pen.size * 0.06)), Math.max(1.2, pen.size * 0.08), `rgb(${ink[0]},${ink[1]},${ink[2]})`, r);
}

/**
 * A doodle: `strokes` in the glyphs' units (x across, y up from the baseline at `y`), drawn `pen.size` high by the same
 * hand and the same ballpoint as the writing. It is gone over `passes` times, a little off each time, the way a pen
 * keeps circling while its owner thinks; `press` thickens the line (bearing down), and `mood` shakes it as it does letters.
 */
export function sketch(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[], x: number, y: number, pen: Pen & { passes?: number; press?: number }): void {
  const r = mulberry32(pen.seed ^ 0x5bd1e995);
  const mood = pen.mood ?? 0;
  const ink = pen.ink ?? BLUE_BLACK;
  const rot = gauss(r) * (0.06 + 0.1 * mood);
  const [cos, sin] = [Math.cos(rot), Math.sin(rot)];
  const slant = (pen.slant ?? 0) + gauss(r) * 0.04;
  const width = 1.9 * (pen.press ?? 1);
  const to = ([px, py]: P): P => {
    const sx = px + slant * py;
    return [x + (sx * cos - py * sin) * pen.size, y - (sx * sin + py * cos) * pen.size];
  };
  for (let pass = 0; pass < (pen.passes ?? 1); pass++) {
    // Later passes stray further from the first.
    const wobble = (0.015 + 0.035 * mood) * (1 + pass * 0.5);
    const shade = Math.round(gauss(r) * 9);
    const color = `rgb(${ink[0] + shade},${ink[1] + shade},${ink[2] + shade})`;
    for (const s of strokes) {
      const [dx, dy] = [gauss(r) * wobble, gauss(r) * wobble];
      const pts = s.pts.map(([px, py]) => to([px + dx + gauss(r) * wobble, py + dy + gauss(r) * wobble]));
      ribbon(ctx, sample(pts, s.smooth, 1.2), width * (1 + gauss(r) * 0.08), color, r);
    }
  }
}

/**
 * A freehand line through `pts` (in canvas pixels), drawn by the same hand and ballpoint as the writing: a box, an arrow,
 * a line between two rooms. Each leg bows a little and wanders in a slow wave without a ruler, its ends staying on the
 * points so the legs meet; the corners round off where the pen turns, and the pressure comes and goes as it does in letters.
 */
export function scrawl(ctx: CanvasRenderingContext2D, pts: readonly (readonly [number, number])[], pen: Pen): void {
  const r = mulberry32(pen.seed ^ 0x27d4eb2f);
  const mood = pen.mood ?? 0;
  const ink = pen.ink ?? BLUE_BLACK;
  const wave = pen.size * (0.05 + 0.2 * mood);
  const path: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [nx, ny] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const bow = gauss(r) * Math.min(len * (0.02 + 0.03 * mood), pen.size * (0.22 + 0.4 * mood));
    const [ph, ph2] = [r() * 6, r() * 6];
    // A shaky hand's tremor: random nudges every few pixels, eased from one to the next, never a regular ripple.
    const knots = Array.from({ length: Math.ceil(len / 7) + 2 }, () => gauss(r) * (0.15 + 0.5 * mood));
    const shake = (d: number): number => {
      const k = Math.floor(d / 7);
      const f = (1 - Math.cos(((d / 7) - k) * Math.PI)) / 2;
      return knots[k] + (knots[k + 1] - knots[k]) * f;
    };
    const n = Math.max(2, Math.round(len / 9));
    for (let j = i ? 1 : 0; j <= n; j++) {
      const t = j / n;
      const env = Math.sqrt(Math.sin(Math.PI * t));
      const off = env * (bow + wave * (Math.sin(ph + (len * t) / 41) * 0.7 + Math.sin(ph2 + (len * t) / 14) * 0.3)) + shake(len * t);
      path.push([a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off]);
    }
  }
  const shade = Math.round(gauss(r) * 9);
  ribbon(ctx, sample(path, true, 1.5), Math.max(1.1, pen.size * 0.075 * (1 + gauss(r) * 0.08)), `rgb(${ink[0] + shade},${ink[1] + shade},${ink[2] + shade})`, r);
}
