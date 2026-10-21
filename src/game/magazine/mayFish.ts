import { airbrush, glint } from './adsDetail';
import type { Area } from './coverPaint';
import { Ctx, rng } from './paper';

// THE ONE THAT GOT AWAY's fish, for the May inside front cover's painting: a largemouth bass clearing the water, the
// low sun behind it rimming its back, and the splash it left.

const TAU = Math.PI * 2;

/** Where a point of the fish (snout toward +u, in lengths) lands on the page, for a fish facing left, turned by `rot`. */
export function fishPoint(fx: number, fy: number, len: number, rot: number, u: number, v: number): [number, number] {
  const x = -u * len;
  const y = v * len;
  return [fx + x * Math.cos(rot) - y * Math.sin(rot), fy + x * Math.sin(rot) + y * Math.cos(rot)];
}

/** The body's outline, snout at +x, in lengths: forehead, back, the tail's root, belly, the jutting lower jaw, the open mouth. */
function body(c: Ctx): void {
  c.beginPath();
  c.moveTo(0.5, 0.02);
  c.bezierCurveTo(0.42, -0.12, 0.2, -0.2, 0, -0.19);
  c.bezierCurveTo(-0.18, -0.18, -0.3, -0.09, -0.36, -0.05);
  c.lineTo(-0.36, 0.05);
  c.bezierCurveTo(-0.3, 0.09, -0.15, 0.19, 0.02, 0.18);
  c.bezierCurveTo(0.2, 0.17, 0.38, 0.12, 0.46, 0.1);
  c.lineTo(0.535, 0.085);
  c.lineTo(0.47, 0.045);
  c.closePath();
}

/**
 * A fin: a filled shape of see-through olive with rays out to each point of its edge, fanned from `root` (a tail, a
 * pectoral) or, for a fin along the back or belly, standing in a row along the base from its first edge point to its last.
 */
function fin(c: Ctx, root: [number, number], edge: [number, number][], kind: 'fan' | 'row' | 'spiny' = 'fan'): void {
  c.fillStyle = 'rgba(88,104,52,0.82)';
  c.beginPath();
  c.moveTo(...root);
  for (const p of edge) c.lineTo(...p);
  c.closePath();
  c.fill();
  c.strokeStyle = kind === 'spiny' ? 'rgba(30,38,18,0.8)' : 'rgba(40,50,24,0.5)';
  c.lineWidth = kind === 'spiny' ? 0.006 : 0.003;
  const [a, b] = [root, edge[edge.length - 1]];
  edge.forEach((p, i) => {
    const t = i / (edge.length - 1);
    const from: [number, number] = kind === 'fan' ? [root[0] + (p[0] - root[0]) * 0.05, root[1] + (p[1] - root[1]) * 0.05] : [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    c.beginPath();
    c.moveTo(...from);
    c.lineTo(...p);
    c.stroke();
  });
}

/**
 * The bass at (fx, fy), `len` long, facing left and turned by `rot` (positive lifts the head), painted in its own
 * units. The sun is behind it to the upper left, so its back takes a warm rim and its flank stays in soft light.
 */
export function bass(ctx: Ctx, fx: number, fy: number, len: number, rot: number): void {
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(rot);
  ctx.scale(-len, len);
  // Fins behind the body: the tail, the spiny and soft dorsal, the anal and the far pelvic.
  fin(ctx, [-0.33, 0], [[-0.38, -0.07], [-0.45, -0.15], [-0.52, -0.22], [-0.545, -0.17], [-0.5, -0.06], [-0.47, 0], [-0.5, 0.06], [-0.545, 0.17], [-0.52, 0.22], [-0.45, 0.15], [-0.38, 0.07]]);
  fin(ctx, [0.15, -0.17], [[0.13, -0.24], [0.1, -0.29], [0.06, -0.31], [0.02, -0.31], [-0.02, -0.29], [-0.05, -0.24], [-0.07, -0.19]], 'spiny');
  fin(ctx, [-0.06, -0.19], [[-0.09, -0.26], [-0.14, -0.28], [-0.2, -0.26], [-0.25, -0.2], [-0.28, -0.13], [-0.3, -0.08]], 'row');
  fin(ctx, [-0.09, 0.17], [[-0.12, 0.23], [-0.18, 0.25], [-0.24, 0.2], [-0.28, 0.13], [-0.3, 0.08]], 'row');
  fin(ctx, [0.13, 0.16], [[0.1, 0.24], [0.06, 0.27], [0.03, 0.25], [0.03, 0.18]]);
  // The body: olive back, paling to a cream belly.
  const g = ctx.createLinearGradient(0, -0.2, 0, 0.19);
  g.addColorStop(0, '#2c4520');
  g.addColorStop(0.38, '#5d7b36');
  g.addColorStop(0.62, '#a3b066');
  g.addColorStop(0.85, '#ebe4bd');
  ctx.fillStyle = g;
  body(ctx);
  ctx.fill();
  ctx.save();
  body(ctx);
  ctx.clip();
  // The dark band along the flank: a ragged stripe, each step of its edge set by hand, and a few blotches over it.
  const r = rng(91);
  const band: [number, number][] = [];
  for (let u = 0.3; u > -0.37; u -= 0.03) band.push([u, 0.012 + r() * 0.022]);
  ctx.fillStyle = 'rgba(30,44,20,0.5)';
  ctx.beginPath();
  band.forEach(([u, h], i) => (i ? ctx.lineTo(u, -h * (0.6 + r() * 0.6)) : ctx.moveTo(u, -h)));
  for (const [u, h] of [...band].reverse()) ctx.lineTo(u + (r() - 0.5) * 0.02, h * (0.6 + r() * 0.5) + 0.01);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(30,44,20,0.35)';
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.ellipse(0.25 - r() * 0.55, -0.03 - r() * 0.05, 0.015 + r() * 0.02, 0.01 + r() * 0.012, (r() - 0.5) * 0.8, 0, TAU);
    ctx.fill();
  }
  // Scales: rows of small dark crescents, fainter toward the belly.
  ctx.lineWidth = 0.0025;
  for (let v = -0.15; v < 0.14; v += 0.022) {
    for (let u = -0.32 + (Math.round(v / 0.022) % 2) * 0.011; u < 0.28; u += 0.022) {
      ctx.strokeStyle = `rgba(25,35,15,${(0.25 - (v + 0.15) * 0.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(u, v, 0.012, -1.1, 1.1);
      ctx.stroke();
    }
  }
  // The rim of sun along the back (the sun is behind and above), sprayed, and the shade under the belly.
  airbrush(ctx, { x: -0.6, y: -0.35, w: 1.2, h: 0.7 }, 0.006, (sc) => {
    sc.strokeStyle = 'rgba(255,224,160,0.9)';
    sc.lineWidth = 0.035;
    sc.beginPath();
    sc.moveTo(0.5, 0.02);
    sc.bezierCurveTo(0.42, -0.12, 0.2, -0.2, 0, -0.19);
    sc.bezierCurveTo(-0.18, -0.18, -0.3, -0.09, -0.36, -0.05);
    sc.stroke();
    sc.fillStyle = 'rgba(40,40,30,0.35)';
    sc.beginPath();
    sc.ellipse(-0.02, 0.2, 0.36, 0.06, 0, 0, TAU);
    sc.fill();
  });
  ctx.restore();
  glint(ctx, 0.12, -0.08, 0.16, 0.025, 0.08, 0.35);
  // The gill cover, the mouth's dark inside, the eye.
  ctx.strokeStyle = 'rgba(30,40,18,0.8)';
  ctx.lineWidth = 0.006;
  ctx.beginPath();
  ctx.moveTo(0.29, -0.13);
  ctx.quadraticCurveTo(0.2, -0.01, 0.25, 0.13);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,235,200,0.45)';
  ctx.lineWidth = 0.004;
  ctx.beginPath();
  ctx.moveTo(0.278, -0.12);
  ctx.quadraticCurveTo(0.19, -0.01, 0.238, 0.12);
  ctx.stroke();
  ctx.fillStyle = '#3a1712';
  ctx.beginPath();
  ctx.moveTo(0.495, 0.025);
  ctx.lineTo(0.53, 0.083);
  ctx.lineTo(0.43, 0.075);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9982c';
  ctx.beginPath();
  ctx.arc(0.385, -0.05, 0.034, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0d0d0a';
  ctx.beginPath();
  ctx.arc(0.39, -0.05, 0.019, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,245,0.9)';
  ctx.beginPath();
  ctx.arc(0.396, -0.058, 0.007, 0, TAU);
  ctx.fill();
  // The near pectoral fin, over the flank behind the gill.
  fin(ctx, [0.23, 0.03], [[0.2, -0.02], [0.13, -0.03], [0.09, 0.0], [0.1, 0.05], [0.16, 0.08], [0.21, 0.07]]);
  // The lure in the corner of its mouth: a red and white spoon.
  ctx.fillStyle = '#d23a2a';
  ctx.beginPath();
  ctx.ellipse(0.535, 0.1, 0.03, 0.014, 0.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  ctx.beginPath();
  ctx.ellipse(0.545, 0.115, 0.012, 0.007, 0.9, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * The splash the fish left at (x, y) on the water: a ring of foam, a crown of water thrown up, ripples spreading, and
 * drops in the air round the fish (each one its own size and catching the light), within `a`.
 */
export function splash(ctx: Ctx, a: Area, x: number, y: number, s: number, drops: [number, number, number, number]): void {
  const r = rng(93);
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) {
    ctx.strokeStyle = `rgba(230,236,240,${(0.35 - i * 0.07).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, s * (0.7 + i * 0.45), s * (0.12 + i * 0.07), 0, 0, TAU);
    ctx.stroke();
  }
  airbrush(ctx, a, 3, (sc) => {
    sc.fillStyle = 'rgba(240,244,246,0.75)';
    sc.beginPath();
    sc.ellipse(x, y, s * 0.8, s * 0.16, 0, 0, TAU);
    sc.fill();
  });
  // The crown: tapering spouts of water, each tipped with a drop.
  for (let i = 0; i < 14; i++) {
    const t = (i / 13 - 0.5) * 1.6;
    const h = s * (0.4 + r() * 0.6) * (1 - Math.abs(t) * 0.5);
    const bx = x + t * s * 0.75;
    const tx = bx + t * s * 0.35;
    const g = ctx.createLinearGradient(0, y, 0, y - h);
    g.addColorStop(0, 'rgba(225,232,236,0.85)');
    g.addColorStop(1, 'rgba(255,250,235,0.6)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx - s * 0.05, y);
    ctx.quadraticCurveTo(bx + t * s * 0.1, y - h * 0.6, tx, y - h);
    ctx.quadraticCurveTo(bx + t * s * 0.18, y - h * 0.5, bx + s * 0.05, y);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,252,240,0.9)';
    ctx.beginPath();
    ctx.arc(tx, y - h - 2, 1.5 + r() * 2, 0, TAU);
    ctx.fill();
  }
  // Drops in the air round the fish, in the box [x0, y0, x1, y1].
  const [x0, y0, x1, y1] = drops;
  for (let i = 0; i < 70; i++) {
    const dx = x0 + r() * (x1 - x0);
    const dy = y0 + r() * (y1 - y0);
    const rad = 0.8 + r() * r() * 4;
    ctx.fillStyle = `rgba(215,225,232,${(0.5 + r() * 0.4).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(dx, dy, rad, rad * (1 + r() * 0.6), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,230,0.95)';
    ctx.beginPath();
    ctx.arc(dx - rad * 0.3, dy - rad * 0.3, rad * 0.35, 0, TAU);
    ctx.fill();
  }
}
