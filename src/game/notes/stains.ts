/** The marks a used page collects, each drawn from its own seeded generator (see wear.ts for when they come). */

export type Rand = () => number;

export function rand(seed: number): Rand {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A lumpy pool of ink soaked a little into the paper, with spatter thrown one way. */
export function blot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, [ir, ig, ib]: [number, number, number], r: Rand): void {
  const halo = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 1.9);
  halo.addColorStop(0, `rgba(${ir},${ig},${ib},0.2)`);
  halo.addColorStop(1, `rgba(${ir},${ig},${ib},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
  const [p1, p2] = [r() * 6, r() * 6];
  ctx.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = size * (1 + 0.2 * Math.sin(3 * t + p1) + 0.12 * Math.sin(5 * t + p2) + (r() - 0.5) * 0.12);
    const [px, py] = [x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.85];
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.fillStyle = `rgba(${ir},${ig},${ib},0.82)`;
  ctx.fill();
  // Ink dries darker at the rim.
  ctx.strokeStyle = `rgba(${ir * 0.5},${ig * 0.5},${ib * 0.6},0.45)`;
  ctx.lineWidth = Math.max(0.8, size * 0.12);
  ctx.stroke();
  const dir = r() * Math.PI * 2;
  const drops = 1 + Math.floor(r() * (size > 5 ? 6 : 2));
  for (let i = 0; i < drops; i++) {
    const a = dir + (r() - 0.5) * 0.9;
    const d = size * (1.4 + r() * 2.4);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (0.07 + r() * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A mug set down on the page: only the wet foot of the cup touched it, so the mark is a ring with a clean middle,
 * and only where coffee had run down the side: one long arc that thins out at its ends, sometimes a stray piece.
 */
export function coffee(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, r: Rand): void {
  const TAU = Math.PI * 2;
  const [f1, f2, f3] = [r() * 6, r() * 6, r() * 6];
  // Sometimes the mug was set down twice, a little apart.
  const rims = r() < 0.35 ? 2 : 1;
  for (let k = 0; k < rims; k++) {
    const [cx, cy] = k ? [x + (r() - 0.5) * 30, y + (r() - 0.5) * 30] : [x, y];
    const fade = k ? 0.55 : 1;
    // Where the drip reached: [start, length] arcs. The second setting-down left less.
    const arcs: [number, number][] = [[r() * TAU, TAU * (k ? 0.2 + r() * 0.3 : 0.4 + r() * 0.45)]];
    if (r() < 0.6) arcs.push([arcs[0][0] + arcs[0][1] + 0.3 + r() * 1.2, 0.25 + r() * 0.7]);
    // How wet the foot was at angle t: full along an arc, thinning to nothing over its last quarter at each end.
    const wet = (t: number): number => {
      let w = 0;
      for (const [s, len] of arcs) {
        const u = (((t - s) % TAU) + TAU) % TAU;
        if (u < len) w = Math.max(w, Math.min(1, Math.min(u, len - u) / (len * 0.25)));
      }
      return w;
    };
    const N = 140;
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * TAU;
      const t1 = ((i + 1.3) / N) * TAU;
      const w = wet(t0);
      if (w <= 0) continue;
      const rr = R + 1.2 * Math.sin(t0 * 5 + f3);
      // A faint tan band just inside, where the coffee spread a little before drying…
      ctx.strokeStyle = `rgba(155,100,40,${0.07 * w * fade})`;
      ctx.lineWidth = R * 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, rr - R * 0.07, t0, t1);
      ctx.stroke();
      // …and the dark edge where it dried, thinner where less of it got there.
      const a = (0.32 + 0.14 * Math.sin(t0 * 3 + f1) + 0.08 * Math.sin(t0 * 7 + f2)) * w * fade;
      ctx.strokeStyle = `rgba(110,60,18,${a})`;
      ctx.lineWidth = (1.4 + 1.6 * (0.5 + 0.5 * Math.sin(t0 * 2 + f1))) * (0.4 + 0.6 * w);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, t0, t1);
      ctx.stroke();
    }
  }
  // A drip or two off the rim.
  const drops = Math.floor(r() * 4);
  for (let i = 0; i < drops; i++) {
    const a = r() * Math.PI * 2;
    const d = R + 8 + r() * 30;
    const s = 1.5 + r() * 4;
    ctx.fillStyle = 'rgba(140,85,35,0.14)';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(115,68,25,0.22)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

/** Where the page was folded to go in a pocket: a dark valley beside a pale ridge, a shade on one side, dirt caught in it. */
export function fold(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number], r: Rand): void {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  const [nx, ny] = [-dy / len, dx / len];
  const pts: [number, number][] = [];
  const steps = Math.ceil(len / 20);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const j = (r() - 0.5) * 1.6;
    pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  const shade = ctx.createLinearGradient(a[0], a[1], a[0] + nx * 40, a[1] + ny * 40);
  shade.addColorStop(0, 'rgba(80,60,30,0.08)');
  shade.addColorStop(1, 'rgba(80,60,30,0)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(b[0] + nx * 40, b[1] + ny * 40);
  ctx.lineTo(a[0] + nx * 40, a[1] + ny * 40);
  ctx.fill();
  const line = (off: number, style: string, w: number): void => {
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + nx * off, y + ny * off) : ctx.moveTo(x + nx * off, y + ny * off)));
    ctx.stroke();
  };
  line(-1.6, 'rgba(255,252,240,0.45)', 1.6);
  line(0, 'rgba(70,55,35,0.22)', 1.2);
  for (let i = 0; i < len / 6; i++) {
    const t = r();
    const j = (r() - 0.5) * 3;
    ctx.fillStyle = `rgba(70,58,44,${0.08 + r() * 0.12})`;
    ctx.fillRect(a[0] + dx * t + nx * j, a[1] + dy * t + ny * j, 1 + r(), 1 + r());
  }
}

/** The bottom-right corner, turned down once and smoothed back: a crease across it and the corner dirtier than the rest. */
export function dogEar(ctx: CanvasRenderingContext2D, W: number, H: number, r: Rand): void {
  const a: [number, number] = [W - 80 - r() * 40, H];
  const b: [number, number] = [W, H - 80 - r() * 40];
  ctx.fillStyle = 'rgba(95,75,45,0.09)';
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(W, H);
  ctx.fill();
  fold(ctx, a, b, r);
}
