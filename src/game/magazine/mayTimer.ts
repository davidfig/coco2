import { airbrush, glint, roundShade } from './adsDetail';
import { shadow, sweep } from './adsProducts';
import type { Area } from './coverPaint';
import { Ctx, SANS, rng } from './paper';

// May's back cover photograph, before its type goes on: the LIGHTS-OUT timer standing on a blue sweep, the Color
// Computer's power cord plugged into it, lit from the upper left.

const TAU = Math.PI * 2;

/** The dial: a cream face printed with the hours, a sun and a moon, the ring of trippers round it (pushed in for the hours off), the knob. */
function dial(ctx: Ctx, cx: number, cy: number, r: number): void {
  // The ring of trippers: 48, one each half hour, noon at the top. Pushed in (dark, set back) from 9 at night round to 1
  // in the afternoon: sixteen hours' rest.
  const n = 48;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const hour = (i / 2 + 12) % 24;
    const off = hour >= 21 || hour < 13;
    const rr = off ? r * 1.06 : r * 1.13;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    ctx.rotate(a);
    ctx.fillStyle = off ? '#3c3a36' : '#e7e2d4';
    ctx.fillRect(-r * 0.06, -r * 0.028, r * 0.12, r * 0.056);
    ctx.fillStyle = off ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';
    ctx.fillRect(-r * 0.06, -r * 0.028, r * 0.12, r * 0.012);
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.clip();
  roundShade(ctx, cx, cy, r, -0.6, -0.7, '#fffdf4', '#efe8d6', '#c9c0aa');
  // The night half of the face, tinted blue, from six in the evening to six in the morning (the lower half).
  ctx.fillStyle = 'rgba(40,70,140,0.18)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2b2a27';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(r * 0.13)}px ${SANS}`;
  for (let h = 0; h < 24; h += 2) {
    const a = (h / 24) * TAU - Math.PI / 2;
    ctx.fillText(String(h === 0 ? 12 : h > 12 ? h - 12 : h), cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8 + r * 0.045);
  }
  // A sun at noon's side, a moon at midnight's.
  ctx.fillStyle = '#e8a53a';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.48, r * 0.09, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8a53a';
  ctx.lineWidth = r * 0.02;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.12, cy - r * 0.48 + Math.sin(a) * r * 0.12);
    ctx.lineTo(cx + Math.cos(a) * r * 0.16, cy - r * 0.48 + Math.sin(a) * r * 0.16);
    ctx.stroke();
  }
  ctx.fillStyle = '#34528c';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.5, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ece5d2';
  ctx.beginPath();
  ctx.arc(cx + r * 0.045, cy + r * 0.47, r * 0.085, 0, TAU);
  ctx.fill();
  // The knob in the middle: a ribbed cap, lit up left.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, TAU);
  ctx.clip();
  roundShade(ctx, cx, cy, r * 0.24, -0.6, -0.7, '#7b7b80', '#3b3b40', '#151518');
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
    ctx.lineTo(cx + Math.cos(a) * r * 0.24, cy + Math.sin(a) * r * 0.24);
    ctx.stroke();
  }
  ctx.restore();
  glint(ctx, cx - r * 0.08, cy - r * 0.1, r * 0.09, r * 0.05, -0.6, 0.6);
}

/** The timer's body, a little turned: the lit front, the shaded right side, the dial, the arrow, the socket and switch. Returns the socket's centre. */
function timer(ctx: Ctx, x: number, y: number, w: number, h: number): [number, number] {
  const side = w * 0.16;
  ctx.fillStyle = '#a49c88';
  ctx.beginPath();
  ctx.moveTo(x + w - 10, y + 6);
  ctx.lineTo(x + w + side, y + side * 0.5);
  ctx.lineTo(x + w + side, y + h - side * 0.2);
  ctx.lineTo(x + w - 10, y + h);
  ctx.fill();
  const front = ctx.createLinearGradient(x, y, x + w, y + h);
  front.addColorStop(0, '#f6f1e3');
  front.addColorStop(0.6, '#e2dbc8');
  front.addColorStop(1, '#c4bca6');
  ctx.fillStyle = front;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.08);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,250,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + 1.5);
  ctx.lineTo(x + w * 0.9, y + 1.5);
  ctx.stroke();
  glint(ctx, x + w * 0.3, y + h * 0.08, w * 0.3, h * 0.03, 0, 0.5);
  const r = w * 0.34;
  const dx = x + w / 2;
  const dy = y + h * 0.36;
  airbrush(ctx, { x: dx - r * 1.4, y: dy - r * 1.4, w: r * 2.9, h: r * 2.9 }, 3, (sc) => {
    sc.fillStyle = 'rgba(60,50,30,0.35)';
    sc.beginPath();
    sc.arc(dx + r * 0.08, dy + r * 0.1, r * 1.17, 0, TAU);
    sc.fill();
  });
  dial(ctx, dx, dy, r);
  // The pointer above the dial.
  ctx.fillStyle = '#c8261c';
  ctx.beginPath();
  ctx.moveTo(dx, dy - r * 1.2);
  ctx.lineTo(dx - r * 0.08, dy - r * 1.36);
  ctx.lineTo(dx + r * 0.08, dy - r * 1.36);
  ctx.fill();
  // The name, printed across the lower front, and the slide switch.
  ctx.font = `italic 900 ${Math.round(w * 0.075)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1f3f7a';
  ctx.fillText('LIGHTS-OUT', dx, y + h * 0.71);
  ctx.font = `bold ${Math.round(w * 0.032)}px ${SANS}`;
  ctx.fillStyle = '#4a463d';
  ctx.fillText('ON  •  TIMER', x + w * 0.2, y + h * 0.93);
  ctx.fillStyle = '#5a5649';
  ctx.beginPath();
  ctx.roundRect(x + w * 0.1, y + h * 0.8, w * 0.2, h * 0.06, 4);
  ctx.fill();
  ctx.fillStyle = '#2e2c27';
  ctx.fillRect(x + w * 0.21, y + h * 0.805, w * 0.07, h * 0.05);
  // The socket on the front, lower right, its plate set in.
  const sx = x + w * 0.68;
  const sy = y + h * 0.86;
  ctx.fillStyle = '#d6cfba';
  ctx.beginPath();
  ctx.roundRect(sx - w * 0.14, sy - h * 0.09, w * 0.28, h * 0.18, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,70,50,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  return [sx, sy];
}

/** The power cord's plug pushed into the socket, and its cord curling away to the right and out of the picture. */
function plug(ctx: Ctx, a: Area, sx: number, sy: number, k: number): void {
  const cord = (c: Ctx, w: number, color: string, dy = 0): void => {
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx, sy + 20 * k + dy);
    c.bezierCurveTo(sx + 10 * k, sy + 90 * k + dy, sx + 140 * k, sy + 60 * k + dy, a.x + a.w + 20, sy - 20 * k + dy);
    c.stroke();
  };
  airbrush(ctx, a, 4, (sc) => cord(sc, 14 * k, 'rgba(10,20,50,0.3)', 18 * k));
  cord(ctx, 10 * k, '#121214');
  cord(ctx, 2.5 * k, 'rgba(170,180,210,0.55)', -2.5 * k);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx - 26 * k, sy - 22 * k, 52 * k, 48 * k, 8 * k);
  ctx.clip();
  roundShade(ctx, sx, sy, 34 * k, -0.6, -0.7, '#5e5e64', '#26262a', '#0c0c0e');
  ctx.restore();
  glint(ctx, sx - 10 * k, sy - 12 * k, 14 * k, 4 * k, 0, 0.5);
}

/** LIGHTS-OUT in its studio photograph, fitted into `box`. */
export function timerScene(ctx: Ctx, box: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  sweep(ctx, box, '#1d2c55', '#7d93c4', 'rgba(255,240,215,0.35)');
  // Faint stars of light on the sweep's paper, as a backdrop under a hot lamp shows.
  const r = rng(71);
  airbrush(ctx, box, 3, (sc) => {
    for (let i = 0; i < 40; i++) {
      sc.fillStyle = `rgba(255,255,255,${(0.03 + r() * 0.05).toFixed(3)})`;
      sc.beginPath();
      sc.arc(box.x + r() * box.w, box.y + r() * box.h * 0.6, 4 + r() * 12, 0, TAU);
      sc.fill();
    }
  });
  const k = box.h / 520;
  const w = 340 * k;
  const h = 400 * k;
  const x = box.x + box.w * 0.5 - w * 0.7;
  const y = box.y + box.h * 0.1;
  shadow(ctx, box, x + w * 0.6, y + h + 6 * k, w * 0.72, 22 * k, 0.6);
  const [sx, sy] = timer(ctx, x, y, w, h);
  plug(ctx, box, sx, sy, k);
  ctx.restore();
}
