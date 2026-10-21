import { airbrush, glint } from './adsDetail';
import { cassette, quad, shadow, sweep } from './adsProducts';
import type { Area } from './coverPaint';
import { Ctx, SANS, rng } from './paper';

// The product shots in May's inside back cover, painted as studio photographs lit from the upper left, before the paint
// pass and the type: THE HERMIT's cable, coiled, and CLOAD-A-MATIC's bulk eraser beside a blank tape.

const TAU = Math.PI * 2;

/** A moulded plug on the end of the cable, sealed with a red rubber cap: the boot, the barrel, the cap, at `angle`. */
function cappedPlug(ctx: Ctx, x: number, y: number, len: number, d: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // The strain relief, tapering back into the cable.
  quad(ctx, [[-len * 0.45, -d * 0.18], [0, -d * 0.42], [0, d * 0.42], [-len * 0.45, d * 0.18]], '#1d1d21');
  const boot = ctx.createLinearGradient(0, -d / 2, 0, d / 2);
  boot.addColorStop(0, '#6c6c74');
  boot.addColorStop(0.3, '#2c2c31');
  boot.addColorStop(1, '#0d0d10');
  ctx.fillStyle = boot;
  ctx.beginPath();
  ctx.roundRect(0, -d / 2, len * 0.62, d, d * 0.18);
  ctx.fill();
  // Grip ridges round the boot.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  for (let i = 1; i < 5; i++) ctx.fillRect(len * 0.08 * i, -d / 2 + 2, 2, d - 4);
  const cap = ctx.createLinearGradient(0, -d * 0.55, 0, d * 0.55);
  cap.addColorStop(0, '#f2685a');
  cap.addColorStop(0.35, '#c8261c');
  cap.addColorStop(1, '#6a120c');
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.roundRect(len * 0.58, -d * 0.55, len * 0.42, d * 1.1, d * 0.3);
  ctx.fill();
  glint(ctx, len * 0.76, -d * 0.3, len * 0.14, d * 0.1, 0, 0.6);
  glint(ctx, len * 0.25, -d * 0.3, len * 0.18, d * 0.08, 0, 0.35);
  ctx.restore();
}

/** One turn of round cable as an ellipse: dark, with the key light running along its upper-left side. */
function loop(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, rot: number, thick: number): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#141417';
  ctx.lineWidth = thick + 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#34343b';
  ctx.lineWidth = thick;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,205,220,0.75)';
  ctx.lineWidth = thick * 0.22;
  ctx.beginPath();
  ctx.ellipse(cx - thick * 0.15, cy - thick * 0.22, rx, ry, rot, Math.PI * 0.95, Math.PI * 1.7);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,125,140,0.5)';
  ctx.lineWidth = thick * 0.15;
  ctx.beginPath();
  ctx.ellipse(cx - thick * 0.1, cy - thick * 0.25, rx, ry, rot, Math.PI * 0.1, Math.PI * 0.6);
  ctx.stroke();
}

/** THE HERMIT: six feet of cable in a neat coil on a pale green sweep, both ends capped, connected to nothing. */
export function cableShot(ctx: Ctx, a: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  sweep(ctx, a, '#5d7466', '#dfe6dc', 'rgba(255,255,240,0.4)');
  const X = (u: number): number => a.x + u * a.w;
  const Y = (v: number): number => a.y + v * a.h;
  shadow(ctx, a, X(0.47), Y(0.8), a.w * 0.34, a.h * 0.08, 0.5);
  const thick = a.h * 0.04;
  const r = rng(61);
  for (let i = 0; i < 6; i++) loop(ctx, X(0.46 + (r() - 0.5) * 0.04), Y(0.6 - i * 0.012), a.w * (0.27 + r() * 0.025), a.h * (0.15 + r() * 0.02), (r() - 0.5) * 0.12, thick);
  // The two tails out of the coil, each to its capped plug.
  const tail = (pts: number[], end: [number, number, number]): void => {
    ctx.lineCap = 'round';
    for (const [c, w] of [['#141417', thick + 2], ['#34343b', thick], ['rgba(200,205,220,0.6)', thick * 0.2]] as const) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(X(pts[0]), Y(pts[1]) - (w === thick * 0.2 ? thick * 0.25 : 0));
      ctx.bezierCurveTo(X(pts[2]), Y(pts[3]), X(pts[4]), Y(pts[5]), X(pts[6]), Y(pts[7]) - (w === thick * 0.2 ? thick * 0.25 : 0));
      ctx.stroke();
    }
    shadow(ctx, a, X(end[0]) + a.w * 0.06, Y(end[1]) + a.h * 0.07, a.w * 0.09, a.h * 0.025, 0.4);
    cappedPlug(ctx, X(end[0]), Y(end[1]), a.w * 0.19, a.h * 0.085, end[2]);
  };
  tail([0.22, 0.66, 0.16, 0.78, 0.18, 0.86, 0.26, 0.87], [0.26, 0.87, 0.1]);
  tail([0.7, 0.52, 0.8, 0.46, 0.84, 0.6, 0.74, 0.74], [0.74, 0.74, 0.5]);
  ctx.restore();
}

/** The bulk eraser, a squat box in three faces with a handle across its top, its name moulded on the front. */
function eraser(ctx: Ctx, x: number, y: number, s: number): void {
  const P = (u: number, v: number): [number, number] => [x + u * s, y + v * s];
  // Top, front, side: lit, mid, dark.
  quad(ctx, [P(0, 0.2), P(0.62, 0.2), P(0.8, 0.06), P(0.18, 0.06)], '#d9d2c0');
  const front = ctx.createLinearGradient(x, y + 0.2 * s, x, y + 0.62 * s);
  front.addColorStop(0, '#b9b19c');
  front.addColorStop(1, '#8a8371');
  quad(ctx, [P(0, 0.2), P(0.62, 0.2), P(0.62, 0.62), P(0, 0.62)], front);
  quad(ctx, [P(0.62, 0.2), P(0.8, 0.06), P(0.8, 0.48), P(0.62, 0.62)], '#6c6655');
  ctx.fillStyle = 'rgba(255,252,240,0.8)';
  ctx.fillRect(x, y + 0.2 * s - 1, 0.62 * s, 2);
  // The handle: an arch of black plastic from back to front across the top, and its red button.
  ctx.lineCap = 'round';
  for (const [c, w] of [['#0e0e10', 0.075], ['#2e2e33', 0.06], ['rgba(190,195,210,0.6)', 0.014]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w * s;
    ctx.beginPath();
    ctx.moveTo(...P(0.18, 0.15));
    ctx.bezierCurveTo(...P(0.22, -0.16), ...P(0.6, -0.16), ...P(0.64, 0.11));
    ctx.stroke();
  }
  ctx.fillStyle = '#b5241a';
  ctx.beginPath();
  ctx.ellipse(...P(0.41, -0.07), 0.035 * s, 0.022 * s, 0, 0, TAU);
  ctx.fill();
  glint(ctx, ...P(0.4, -0.08), 0.02 * s, 0.01 * s, 0, 0.7);
  // The moulded name and a lightning flash.
  ctx.font = `bold ${Math.round(0.075 * s)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,250,235,0.5)';
  ctx.fillText('BIG MAGNET', ...P(0.31 - 0.003, 0.38 - 0.003));
  ctx.fillStyle = '#4f4a3d';
  ctx.fillText('BIG MAGNET', ...P(0.31, 0.38));
  quad(ctx, [P(0.3, 0.43), P(0.26, 0.52), P(0.31, 0.51), P(0.28, 0.59), P(0.36, 0.48), P(0.31, 0.49), P(0.34, 0.43)], '#c8261c');
  glint(ctx, ...P(0.3, 0.13), 0.22 * s, 0.03 * s, -0.2, 0.5);
}

/** CLOAD-A-MATIC's BIG MAGNET, its cord trailing off, and one of their guaranteed-blank tapes beside it. */
export function eraserShot(ctx: Ctx, a: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  sweep(ctx, a, '#dcdcda', '#fbfbf8', 'rgba(255,255,255,0.5)');
  const ex = a.x + a.w * 0.05;
  const ey = a.y + a.h * 0.3;
  const s = a.w * 0.62;
  shadow(ctx, a, ex + s * 0.45, ey + s * 0.64, s * 0.55, a.h * 0.06, 0.5);
  // The cord from the back of the side face, off the right edge.
  const cord = (c: Ctx, dx: number, dy: number): void => {
    c.beginPath();
    c.moveTo(ex + s * 0.76 + dx, ey + s * 0.22 + dy);
    c.bezierCurveTo(ex + s * 1.0 + dx, ey + s * 0.18 + dy, a.x + a.w * 0.9 + dx, a.y + a.h * 0.32 + dy, a.x + a.w * 1.05 + dx, a.y + a.h * 0.2 + dy);
    c.stroke();
  };
  airbrush(ctx, a, 3, (sc) => {
    sc.strokeStyle = 'rgba(30,30,35,0.22)';
    sc.lineWidth = 6;
    cord(sc, 4, 16);
  });
  ctx.strokeStyle = '#1a1a1d';
  ctx.lineWidth = 4;
  cord(ctx, 0, 0);
  eraser(ctx, ex, ey, s);
  shadow(ctx, a, a.x + a.w * 0.78, a.y + a.h * 0.92, a.w * 0.18, a.h * 0.03, 0.45);
  cassette(ctx, a.x + a.w * 0.79, a.y + a.h * 0.76, a.w * 0.34, 0.1, 'BLANK', 13);
  ctx.restore();
}
