import { Ctx, PAGE_H, PAGE_W, rng } from './paper';

/** Smooth value noise in 0..1 with features about `cell` pixels across. */
function noise(cell: number, seed: number): (x: number, y: number) => number {
  const gw = Math.ceil(PAGE_W / cell) + 2;
  const gh = Math.ceil(PAGE_H / cell) + 2;
  const r = rng(seed);
  const g = Float32Array.from({ length: gw * gh }, r);
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const i = iy * gw + ix;
    const a = g[i] + (g[i + 1] - g[i]) * sx;
    const b = g[i + gw] + (g[i + gw + 1] - g[i + gw]) * sx;
    return a + (b - a) * sy;
  };
}

/** A line from a to b broken into short hand-drawn steps that wander off the straight, as a ridge cut from masking film. */
export function roughLine(ctx: Ctx, ax: number, ay: number, bx: number, by: number, r: () => number, rough = 4): void {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 14));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const j = i < n ? (r() - 0.5) * rough : 0;
    ctx.lineTo(ax + (bx - ax) * t + j * 0.4, ay + (by - ay) * t + j);
  }
}

/** A rectangle of the page that a paint pass works on; the rest is left alone. */
export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAGE: Area = { x: 0, y: 0, w: PAGE_W, h: PAGE_H };

/**
 * Short, tapering strokes of the paint already there, a shade lighter or darker, laid along a slowly turning direction
 * like a hand working across the board. A stroke that would cross a hard edge is skipped, so outlines stay clean.
 * `px` holds the area's pixels; as many strokes go in as the area's share of a page.
 */
function brushwork(ctx: Ctx, px: Uint8ClampedArray, { x: ax, y: ay, w, h }: Area, r: () => number): void {
  const flow = noise(140, 76);
  const rgb = (x: number, y: number): [number, number, number] => {
    const o = ((Math.min(h - 1, Math.max(0, (y - ay) | 0)) * w) + Math.min(w - 1, Math.max(0, (x - ax) | 0))) * 4;
    return [px[o], px[o + 1], px[o + 2]];
  };
  const far = (a: number[], b: number[]): boolean => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 42;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, w, h);
  ctx.clip();
  ctx.lineCap = 'round';
  const n = Math.round((14000 * w * h) / (PAGE_W * PAGE_H));
  for (let i = 0; i < n; i++) {
    const x = ax + r() * w;
    const y = ay + r() * h;
    const a = (flow(x, y) - 0.5) * 2.4 + (r() - 0.5) * 0.5;
    const len = 8 + r() * 22;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const c = rgb(x, y);
    const mid = rgb((x + ex) / 2, (y + ey) / 2);
    if (far(c, rgb(ex, ey)) || far(c, mid)) continue;
    const k = 1 + (r() - 0.5) * 0.22;
    ctx.strokeStyle = `rgba(${(c[0] * k) | 0},${(c[1] * k) | 0},${(c[2] * k) | 0},${(0.15 + r() * 0.25).toFixed(2)})`;
    ctx.lineWidth = 1.5 + r() * 3.5;
    const bend = (r() - 0.5) * len * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + ex) / 2 - Math.sin(a) * bend, (y + ey) / 2 + Math.cos(a) * bend, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Makes the art look painted and printed rather than drawn by a computer: edges drift by a fraction of a pixel over long
 * runs (a skilled hand cutting the frisket, not software), the spray lies unevenly in broad blotches, airbrush grain and the odd spatter fleck sit over
 * it all, brush strokes model the colour inside each shape, and the press's red plate is a hair out of register. Run
 * before the type goes on, which stays crisp. `area` limits it to one picture on the page (default: all of it);
 * `printOnly` keeps just what the press does (uneven ink, grain, misregistration), for spot-colour work nobody painted.
 */
export function paintify(ctx: Ctx, area: Area = PAGE, printOnly = false): void {
  const ax = Math.round(area.x);
  const ay = Math.round(area.y);
  const w = Math.round(area.w);
  const h = Math.round(area.h);
  const img = ctx.getImageData(ax, ay, w, h);
  const src = img.data;
  const out = new Uint8ClampedArray(src.length);
  const wobX = noise(60, 71);
  const wobY = noise(60, 72);
  const blotch = noise(90, 73);
  const fine = noise(7, 74);
  const r = rng(75);
  const drift = printOnly ? 0 : 1.2;
  // Bilinear, so a wobbled edge stays soft instead of stair-stepping. Coordinates are the area's own.
  const at = (x: number, y: number, c: number): number => {
    x = Math.min(w - 1.001, Math.max(0, x));
    y = Math.min(h - 1.001, Math.max(0, y));
    const xi = x | 0;
    const yi = y | 0;
    const tx = x - xi;
    const ty = y - yi;
    const o = (yi * w + xi) * 4 + c;
    const a = src[o] + (src[o + 4] - src[o]) * tx;
    const b = src[o + w * 4] + (src[o + w * 4 + 4] - src[o + w * 4]) * tx;
    return a + (b - a) * ty;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = ax + x;
      const gy = ay + y;
      const dx = (wobX(gx, gy) - 0.5) * drift;
      const dy = (wobY(gx, gy) - 0.5) * drift;
      const shade = 1 + (blotch(gx, gy) - 0.5) * 0.12 + (fine(gx, gy) - 0.5) * 0.05;
      const grain = (r() - 0.5) * 12;
      const o = (y * w + x) * 4;
      out[o] = at(x + dx + 0.5, y + dy, 0) * shade + grain;
      out[o + 1] = at(x + dx, y + dy, 1) * shade + grain;
      out[o + 2] = at(x + dx, y + dy + 0.35, 2) * shade + grain;
      out[o + 3] = 255;
    }
  }
  img.data.set(out);
  ctx.putImageData(img, ax, ay);
  if (printOnly) return;
  brushwork(ctx, out, { x: ax, y: ay, w, h }, r);
  // Spatter: the airbrush spits now and then.
  const flecks = Math.round((260 * w * h) / (PAGE_W * PAGE_H));
  for (let i = 0; i < flecks; i++) {
    const light = r() < 0.5;
    ctx.fillStyle = light ? `rgba(255,245,220,${(0.08 + r() * 0.2).toFixed(2)})` : `rgba(10,8,30,${(0.1 + r() * 0.25).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(ax + 2 + r() * (w - 4), ay + 2 + r() * (h - 4), 0.6 + r() * r() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
