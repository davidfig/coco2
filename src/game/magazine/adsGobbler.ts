import { airbrush, glint, rimLight, roundShade } from './adsDetail';
import type { Area } from './coverPaint';
import { Ctx, rng } from './paper';

// The inside front cover's first painting, before its type goes on.

const TAU = Math.PI * 2;

/** SPACE GOBBLER: the chomper and a ghost over a blue planet, lit by a far sun up and to the left. */
export function gobblerScene(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const r = rng(41);
  const area = { x, y, w, h };
  const lx = -0.6;
  const ly = -0.8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#05062a');
  sky.addColorStop(0.55, '#14287a');
  sky.addColorStop(1, '#2f6fc4');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  airbrush(ctx, area, 6, (sc) => {
    for (const [dx, dy, rad, c] of [
      [60, 190, 120, 'rgba(140,70,170,0.35)'],
      [280, 120, 90, 'rgba(60,140,190,0.3)'],
      [230, 330, 110, 'rgba(110,80,200,0.3)'],
    ] as const) {
      const g = sc.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      g.addColorStop(0, c);
      g.addColorStop(1, 'rgba(20,20,80,0)');
      sc.fillStyle = g;
      sc.fillRect(x, y, w, h);
    }
  });
  for (let i = 0; i < 110; i++) {
    const s = r() < 0.15 ? 2 : 1;
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + r() * 0.75).toFixed(2)})`;
    ctx.fillRect(x + r() * w, y + r() * h * 0.75, s, s);
  }
  planet(ctx, x + 165, y + 560, 260, area);

  // The chomper: a sprayed glow and speed streaks behind it, then the ball itself.
  const gx = x + 165;
  const gy = y + 270;
  const R = 80;
  const a = 0.5;
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(gx, gy, R * 0.9, gx, gy, R * 1.9);
  halo.addColorStop(0, 'rgba(255,210,70,0.35)');
  halo.addColorStop(1, 'rgba(255,210,70,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  airbrush(ctx, area, 3, (sc) => {
    sc.lineCap = 'round';
    for (const [dy, len] of [[-40, 70], [-8, 110], [26, 90], [56, 50]]) {
      const g = sc.createLinearGradient(gx - R - len, 0, gx - R + 10, 0);
      g.addColorStop(0, 'rgba(255,220,90,0)');
      g.addColorStop(1, 'rgba(255,220,90,0.4)');
      sc.strokeStyle = g;
      sc.lineWidth = 7;
      sc.beginPath();
      sc.moveTo(gx - R - len, gy + dy);
      sc.lineTo(gx - R + 10, gy + dy);
      sc.stroke();
    }
  });
  ghost(ctx, x + 85, y + 360, area);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.arc(gx, gy, R, a, TAU - a);
  ctx.closePath();
  ctx.fillStyle = '#f4d83a';
  ctx.fill();
  ctx.clip();
  roundShade(ctx, gx, gy, R, lx, ly, '#fff8c8', '#f2d232', '#a86c10');
  // Blue planet light thrown back up onto the underside.
  ctx.globalCompositeOperation = 'lighter';
  rimLight(ctx, gx, gy, R, Math.PI / 2 + 0.3, 0.8, 'rgba(40,90,190,0.45)', 16);
  ctx.globalCompositeOperation = 'source-over';
  // Inside the mouth: the upper lip's edge faces down into shade, the lower lip's faces up into the light.
  airbrush(ctx, area, 3, (sc) => {
    sc.lineCap = 'round';
    for (const [th, s, c] of [[-a, 1, 'rgba(110,60,0,0.35)'], [a, -1, 'rgba(255,255,225,0.4)']] as const) {
      // Six pixels in from the lip, on the body's side.
      const px = s * Math.sin(th) * 6;
      const py = -s * Math.cos(th) * 6;
      sc.strokeStyle = c;
      sc.lineWidth = 9;
      sc.beginPath();
      sc.moveTo(gx + px + Math.cos(th) * 22, gy + py + Math.sin(th) * 22);
      sc.lineTo(gx + px + Math.cos(th) * (R - 6), gy + py + Math.sin(th) * (R - 6));
      sc.stroke();
    }
  });
  glint(ctx, gx - R * 0.42, gy - R * 0.5, 24, 12, -0.6, 0.8);
  ctx.restore();
  ctx.fillStyle = '#05062a';
  ctx.beginPath();
  ctx.arc(gx + 5, gy - 38, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(gx + 2, gy - 41, 2.5, 0, TAU);
  ctx.fill();

  // Pellets: little glowing spheres.
  for (let i = 0; i < 3; i++) {
    const ex = x + 274 + i * 22;
    const ey = gy;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ex, ey, 2, ex, ey, 15);
    g.addColorStop(0, 'rgba(255,230,160,0.45)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(ex - 15, ey - 15, 30, 30);
    ctx.globalCompositeOperation = 'source-over';
    const s = ctx.createRadialGradient(ex - 2, ey - 2, 0.5, ex, ey, 6);
    s.addColorStop(0, '#ffffff');
    s.addColorStop(0.5, '#ffe9b0');
    s.addColorStop(1, '#b8823a');
    ctx.fillStyle = s;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** The planet's curve along the foot of the picture: lit limb up-left, cloud bands, night side, a sprayed atmosphere. */
function planet(ctx: Ctx, cx: number, cy: number, R: number, area: Area): void {
  const r = rng(43);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  const body = ctx.createRadialGradient(cx - R * 0.5, cy - R * 0.85, 10, cx - R * 0.2, cy - R * 0.4, R * 1.5);
  body.addColorStop(0, '#d4ecff');
  body.addColorStop(0.22, '#6aa6e8');
  body.addColorStop(0.55, '#2050a4');
  body.addColorStop(1, '#0a1a4a');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();
  airbrush(ctx, area, 4, (sc) => {
    for (let k = 0; k < 7; k++) {
      sc.strokeStyle = `rgba(235,245,255,${(0.12 + r() * 0.18).toFixed(2)})`;
      sc.lineWidth = 6 + r() * 14;
      sc.beginPath();
      sc.ellipse(cx + (r() - 0.5) * 40, cy + 30 + k * 22, R * (0.95 - k * 0.04), R * 0.42, 0, Math.PI, TAU);
      sc.stroke();
    }
  });
  const night = ctx.createLinearGradient(cx - R * 0.3, cy - R * 0.6, cx + R * 0.7, cy - R * 0.1);
  night.addColorStop(0, 'rgba(3,6,30,0)');
  night.addColorStop(1, 'rgba(3,6,30,0.6)');
  ctx.fillStyle = night;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
  ctx.globalCompositeOperation = 'lighter';
  airbrush(ctx, area, 3, (sc) => {
    sc.strokeStyle = 'rgba(90,170,255,0.55)';
    sc.lineWidth = 16;
    sc.beginPath();
    sc.arc(cx, cy, R + 4, Math.PI + 0.6, TAU - 0.6);
    sc.stroke();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(215,240,255,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1, -2.5, -1.5);
  ctx.stroke();
}

/** The ghost: a red cylinder with a domed top and a scalloped hem, lit from the left, its eyes on the chomper. */
function ghost(ctx: Ctx, hx: number, hy: number, area: Area): void {
  const rad = 34;
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, rad, Math.PI, 0);
  ctx.lineTo(hx + rad, hy + 40);
  const step = (rad * 2) / 3;
  for (let k = 0; k < 3; k++) ctx.arc(hx + rad - step * k - step / 2, hy + 40, step / 2, 0, Math.PI);
  ctx.closePath();
  const body = ctx.createLinearGradient(hx - rad, 0, hx + rad, 0);
  body.addColorStop(0, '#ff8c74');
  body.addColorStop(0.4, '#ee4036');
  body.addColorStop(1, '#8e1a18');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();
  airbrush(ctx, area, 3, (sc) => {
    sc.fillStyle = 'rgba(90,140,255,0.4)';
    sc.fillRect(hx - rad, hy + 44, rad * 2, 12);
  });
  glint(ctx, hx - 14, hy - 17, 13, 7, -0.6, 0.6);
  ctx.restore();
  for (const ex of [hx - 12, hx + 10]) {
    ctx.fillStyle = '#f4f2ee';
    ctx.beginPath();
    ctx.ellipse(ex, hy - 4, 8, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a2a8a';
    ctx.beginPath();
    ctx.arc(ex + 3, hy - 6, 4.5, 0, TAU);
    ctx.fill();
  }
}
