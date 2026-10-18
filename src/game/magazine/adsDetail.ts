import type { Area } from './coverPaint';
import { Ctx, rng } from './paper';

/**
 * Paints `draw` (in page coordinates) on a canvas `k` times smaller and scales it up over `a`, so it comes out sprayed,
 * with no hard edge. Clip `ctx` first to keep the spray inside a mask.
 */
export function airbrush(ctx: Ctx, a: Area, k: number, draw: (sc: Ctx) => void): void {
  const c = document.createElement('canvas');
  c.width = Math.ceil(a.w / k) + 2;
  c.height = Math.ceil(a.h / k) + 2;
  const sc = c.getContext('2d')!;
  sc.scale(1 / k, 1 / k);
  sc.translate(k - a.x, k - a.y);
  draw(sc);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, a.x - k, a.y - k, c.width * k, c.height * k);
}

/** Round modelling inside a shape already clipped: bright toward the light (unit vector lx, ly), dark on the far side. */
export function roundShade(ctx: Ctx, cx: number, cy: number, r: number, lx: number, ly: number, hi: string, mid: string, lo: string): void {
  const g = ctx.createRadialGradient(cx + lx * r * 0.45, cy + ly * r * 0.45, r * 0.05, cx + lx * r * 0.1, cy + ly * r * 0.1, r * 1.15);
  g.addColorStop(0, hi);
  g.addColorStop(0.45, mid);
  g.addColorStop(1, lo);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
}

/** The light's reflection on something glossy: a soft white oval, brightest in the middle. */
export function glint(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255,255,250,${alpha})`);
  g.addColorStop(0.5, `rgba(255,255,250,${alpha * 0.45})`);
  g.addColorStop(1, 'rgba(255,255,250,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

/** Light caught round part of a rim, sprayed: centred on angle `at`, `span` radians either side. */
export function rimLight(ctx: Ctx, cx: number, cy: number, r: number, at: number, span: number, color: string, width: number): void {
  airbrush(ctx, { x: cx - r - width, y: cy - r - width, w: (r + width) * 2, h: (r + width) * 2 }, 3, (sc) => {
    sc.strokeStyle = color;
    sc.lineWidth = width;
    sc.lineCap = 'round';
    sc.beginPath();
    sc.arc(cx, cy, r - width / 3, at - span, at + span);
    sc.stroke();
  });
}

/**
 * A cumulus of overlapping puffs ([x, y, r]): shaded blue-grey on the side away from the sun and along its flat
 * underside, lit warm on the side toward it.
 */
export function cloud(ctx: Ctx, puffs: [number, number, number][], sunX: number, sunY: number, a: Area): void {
  const shape = (c: Ctx): void => {
    c.beginPath();
    for (const [x, y, r] of puffs) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
  };
  ctx.save();
  ctx.fillStyle = '#e6eef8';
  shape(ctx);
  ctx.fill();
  shape(ctx);
  ctx.clip();
  const base = Math.max(...puffs.map(([, y, r]) => y + r));
  airbrush(ctx, a, 3, (sc) => {
    for (const [x, y, r] of puffs) {
      const d = Math.hypot(sunX - x, sunY - y);
      const ux = (sunX - x) / d;
      const uy = (sunY - y) / d;
      sc.fillStyle = 'rgba(120,140,190,0.55)';
      sc.beginPath();
      sc.arc(x - ux * r * 0.55, y - uy * r * 0.55 + r * 0.3, r * 0.8, 0, Math.PI * 2);
      sc.fill();
      sc.fillStyle = 'rgba(255,252,236,0.95)';
      sc.beginPath();
      sc.arc(x + ux * r * 0.4, y + uy * r * 0.4, r * 0.55, 0, Math.PI * 2);
      sc.fill();
    }
    sc.fillStyle = 'rgba(110,125,170,0.5)';
    sc.fillRect(a.x, base - 8, a.w, 12);
  });
  ctx.restore();
}

/** Grass painted blade by blade over a field already filled: short upright strokes, longer and denser toward the viewer. */
export function grass(ctx: Ctx, x: number, top: number, w: number, bottom: number, seed: number): void {
  const r = rng(seed);
  ctx.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const t = Math.sqrt(r());
    const gy = top + 4 + t * (bottom - top);
    const gx = x + r() * w;
    const len = 3 + t * 12 * (0.5 + r());
    const light = r() < 0.4;
    ctx.strokeStyle = light ? `rgba(200,230,120,${(0.25 + r() * 0.3).toFixed(2)})` : `rgba(20,70,25,${(0.2 + r() * 0.3).toFixed(2)})`;
    ctx.lineWidth = 0.8 + t * 1.4;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + (r() - 0.5) * 3, gy - len * 0.6, gx + (r() - 0.3) * len * 0.5, gy - len);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

/** Boards across a wooden face already filled: seams (a dark line, a lit one under it), long grain strokes, a knot or two, shade at the foot. */
export function planks(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, seed: number): void {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < n * 5; i++) {
    const gy = y + 3 + r() * (h - 6);
    ctx.strokeStyle = `rgba(60,28,8,${(0.15 + r() * 0.2).toFixed(2)})`;
    ctx.lineWidth = 0.7 + r() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 4, gy);
    ctx.bezierCurveTo(x + w * 0.3, gy + (r() - 0.5) * 5, x + w * 0.7, gy + (r() - 0.5) * 5, x + w + 4, gy + (r() - 0.5) * 3);
    ctx.stroke();
  }
  for (let k = 0; k < 2; k++) {
    ctx.strokeStyle = 'rgba(60,28,8,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x + 20 + r() * (w - 40), y + 6 + r() * (h - 12), 5, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 1; i < n; i++) {
    const sy = y + (h * i) / n;
    ctx.fillStyle = 'rgba(45,20,5,0.6)';
    ctx.fillRect(x, sy - 1.5, w, 2);
    ctx.fillStyle = 'rgba(255,220,170,0.3)';
    ctx.fillRect(x, sy + 0.5, w, 1.5);
  }
  const shade = ctx.createLinearGradient(0, y + h * 0.5, 0, y + h);
  shade.addColorStop(0, 'rgba(30,12,0,0)');
  shade.addColorStop(1, 'rgba(30,12,0,0.4)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.lineCap = 'butt';
}
