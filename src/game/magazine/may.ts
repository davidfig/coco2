/** The May issue's cover: a message in a bottle afloat on still water on a spring morning, and the month's cover lines. */
import { Ctx, PAGE_H, SANS, SCRIPT, rng, text } from './paper';
import { pageNo } from './pages';
import { STRIP } from './coverArt';
import { paintify } from './coverPaint';
import { airbrush, glint } from './adsDetail';
import { drawMasthead, sparkle } from './cover';
import { drawMaySky } from './maySky';

/**
 * Where the bottle crosses the water (on its axis) and how it lies: neck up and toward the sun (up-left, `SUN_X` in
 * maySky.ts), the base under the water toward the reader. Everything below is drawn in the bottle's own frame: x across
 * it, y along it, 0 at the waterline, the neck at negative y.
 */
const OX = 790;
const OY = 1085;
const TILT = -0.55;
const SCALE = 1.3;
/** Half the body's width, its base, the top of its straight side, the neck's half-width and top, the lip, the cork's top. */
const R = 95;
const BASE = 175;
const SHOULDER = -215;
const NR = 34;
const NECK = -345;
const LIP = 17;
const CORK = -405;

/** A point in the bottle's frame, on the page. */
function toPage(x: number, y: number): [number, number] {
  const c = Math.cos(TILT);
  const s = Math.sin(TILT);
  return [OX + (x * c - y * s) * SCALE, OY + (x * s + y * c) * SCALE];
}

/** The glass's outline, in the bottle's frame. */
function outline(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(-R, BASE - 24);
  ctx.quadraticCurveTo(-R, BASE, -R + 24, BASE);
  ctx.lineTo(R - 24, BASE);
  ctx.quadraticCurveTo(R, BASE, R, BASE - 24);
  ctx.lineTo(R, SHOULDER);
  ctx.bezierCurveTo(R, SHOULDER - 70, NR, SHOULDER - 60, NR, SHOULDER - 110);
  ctx.lineTo(NR, NECK);
  ctx.lineTo(-NR, NECK);
  ctx.lineTo(-NR, SHOULDER - 110);
  ctx.bezierCurveTo(-NR, SHOULDER - 60, -R, SHOULDER - 70, -R, SHOULDER);
  ctx.closePath();
}

/** The bottle's reflection: the part above the water mirrored down-left, a dark smear broken by the ripples. */
function reflection(ctx: Ctx): void {
  const lean = Math.tan(TILT);
  airbrush(ctx, { x: OX - 400, y: OY, w: 620, h: PAGE_H - OY }, 4, (sc) => {
    const r = rng(81);
    for (let d = 6; d < PAGE_H - OY; d += 6) {
      const half = 108 * SCALE * (0.8 + r() * 0.35);
      const x = OX + d * lean + (r() - 0.5) * 18;
      sc.fillStyle = `rgba(10,40,40,${Math.max(0, 0.38 * (1 - d / 300)).toFixed(2)})`;
      sc.fillRect(x - half, OY + d, half * 2, 4);
    }
  });
}

/** Ripple rings where the bottle sits in the water: `front` the near half, drawn over the glass, else the far half. */
function rings(ctx: Ctx, front: boolean): void {
  const r = rng(front ? 91 : 92);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const rx = (150 + i * 70 + r() * 20) * SCALE;
    ctx.strokeStyle = `rgba(235,244,255,${(0.45 - i * 0.09).toFixed(2)})`;
    ctx.lineWidth = 2.2 - i * 0.3;
    ctx.beginPath();
    ctx.ellipse(OX + 30 + i * 6, OY + 4, rx, rx * 0.16, 0, front ? 0.15 : Math.PI + 0.1, front ? Math.PI - 0.2 : Math.PI * 2 - 0.15);
    ctx.stroke();
  }
}

/** The message: a sheet rolled up and tied with red string, a few lines of ink showing on it. */
function scroll(ctx: Ctx): void {
  ctx.save();
  ctx.translate(6, -10);
  ctx.rotate(0.05);
  const w = 38;
  const top = -165;
  const bottom = 140;
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, '#fff7e0');
  g.addColorStop(0.35, '#efe2bf');
  g.addColorStop(1, '#a8916a');
  ctx.fillStyle = g;
  ctx.fillRect(-w, top, w * 2, bottom - top);
  // The rolled end: the sheet's edge spiralling in.
  ctx.fillStyle = '#e9dbb6';
  ctx.beginPath();
  ctx.ellipse(0, top, w, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,96,60,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    const k = 1 - a / (Math.PI * 6.5);
    ctx.lineTo(Math.cos(a) * w * k, top + Math.sin(a) * 9 * k);
  }
  ctx.stroke();
  // Ink, faint through the paper's curve.
  const r = rng(33);
  ctx.strokeStyle = 'rgba(44,41,37,0.4)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const x = -24 + i * 9;
    let y = top + 30 + r() * 20;
    while (y < bottom - 30) {
      const len = 12 + r() * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (r() - 0.5) * 3, y + len / 2, x, y + len);
      ctx.stroke();
      y += len + 6 + r() * 10;
    }
  }
  // The string, round the middle twice.
  for (const y of [-12, 2]) {
    ctx.fillStyle = '#b0261c';
    ctx.fillRect(-w, y, w * 2, 5);
    ctx.fillStyle = 'rgba(255,190,170,0.6)';
    ctx.fillRect(-w + 6, y, w * 0.6, 1.5);
  }
  ctx.restore();
}

/** The cork: speckled and brown, its cut top lit by the sun. */
function cork(ctx: Ctx): void {
  const top = CORK;
  const bottom = NECK - LIP;
  const g = ctx.createLinearGradient(-33, 0, 33, 0);
  g.addColorStop(0, '#d8a870');
  g.addColorStop(0.4, '#a87443');
  g.addColorStop(1, '#5a3a1e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-33, bottom);
  ctx.lineTo(-30, top);
  ctx.lineTo(30, top);
  ctx.lineTo(33, bottom);
  ctx.closePath();
  ctx.fill();
  const r = rng(44);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = r() < 0.6 ? 'rgba(60,34,14,0.55)' : 'rgba(240,200,150,0.5)';
    ctx.beginPath();
    ctx.arc(-28 + r() * 56, top + 4 + r() * (bottom - top - 6), 0.8 + r() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e4bd88';
  ctx.beginPath();
  ctx.ellipse(0, top, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,80,40,0.5)';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc((r() - 0.5) * 44, top + (r() - 0.5) * 10, 1 + r() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The glass: a green tint, thicker and darker toward every edge, the heavy base, the lip round the neck. */
function glass(ctx: Ctx): void {
  ctx.fillStyle = 'rgba(70,150,115,0.3)';
  outline(ctx);
  ctx.fill();
  ctx.save();
  outline(ctx);
  ctx.clip();
  ctx.strokeStyle = 'rgba(15,60,45,0.45)';
  ctx.lineWidth = 26;
  outline(ctx);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(8,40,30,0.6)';
  ctx.lineWidth = 8;
  outline(ctx);
  ctx.stroke();
  const base = ctx.createLinearGradient(0, BASE - 40, 0, BASE);
  base.addColorStop(0, 'rgba(20,70,50,0)');
  base.addColorStop(1, 'rgba(20,70,50,0.7)');
  ctx.fillStyle = base;
  ctx.fillRect(-R, BASE - 40, R * 2, 40);
  ctx.restore();
  const lip = ctx.createLinearGradient(-40, 0, 40, 0);
  lip.addColorStop(0, 'rgba(170,225,195,0.9)');
  lip.addColorStop(0.5, 'rgba(60,130,100,0.8)');
  lip.addColorStop(1, 'rgba(15,55,40,0.9)');
  ctx.fillStyle = lip;
  ctx.beginPath();
  ctx.roundRect(-40, NECK - LIP, 80, LIP + 2, 6);
  ctx.fill();
}

/** Light on the glass: a long streak down the sunny side, a glint on the shoulder, the sky's rim down the far side. */
function shine(ctx: Ctx): void {
  const streak = ctx.createLinearGradient(0, SHOULDER, 0, BASE - 30);
  streak.addColorStop(0, 'rgba(255,255,245,0.85)');
  streak.addColorStop(1, 'rgba(255,255,245,0.05)');
  ctx.fillStyle = streak;
  ctx.beginPath();
  ctx.roundRect(-R + 16, SHOULDER + 6, 14, BASE - SHOULDER - 40, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,245,0.7)';
  ctx.beginPath();
  ctx.roundRect(-NR + 9, NECK + 8, 7, SHOULDER - 110 - NECK, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(220,240,255,0.18)';
  ctx.fillRect(R - 34, SHOULDER + 20, 9, BASE - SHOULDER - 70);
  ctx.strokeStyle = 'rgba(200,230,255,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(R - 3, SHOULDER - 10);
  ctx.lineTo(R - 3, BASE - 26);
  ctx.stroke();
  glint(ctx, -55, SHOULDER - 32, 26, 10, -0.9, 0.9);
}

/** Below the waterline the bottle is seen through the water: bluer and darker with depth, the ripples across it. */
function underwater(ctx: Ctx): void {
  ctx.save();
  outline(ctx);
  ctx.clip();
  ctx.rotate(-TILT);
  const deep = ctx.createLinearGradient(0, 0, 0, 260);
  deep.addColorStop(0, 'rgba(40,90,150,0.35)');
  deep.addColorStop(1, 'rgba(15,40,95,0.8)');
  ctx.fillStyle = deep;
  ctx.fillRect(-400, 0, 800, 400);
  const r = rng(55);
  ctx.lineCap = 'round';
  for (let i = 0; i < 24; i++) {
    const y = 8 + r() * 220;
    const x = -220 + r() * 400;
    ctx.strokeStyle = r() < 0.5 ? 'rgba(10,30,80,0.3)' : 'rgba(230,240,255,0.22)';
    ctx.lineWidth = 1.5 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + r() * 70, y);
    ctx.stroke();
  }
  // The meniscus: a bright line where the water meets the glass, a dark one just under it.
  ctx.fillStyle = 'rgba(245,250,255,0.85)';
  ctx.fillRect(-400, -2, 800, 3);
  ctx.fillStyle = 'rgba(10,30,60,0.4)';
  ctx.fillRect(-400, 2, 800, 3);
  ctx.restore();
}

/** The bottle in the water, back to front: reflection, far ripples, what is inside, the glass, the water over it. */
function bottle(ctx: Ctx): void {
  reflection(ctx);
  rings(ctx, false);
  ctx.save();
  ctx.translate(OX, OY);
  ctx.rotate(TILT);
  ctx.scale(SCALE, SCALE);
  ctx.save();
  outline(ctx);
  ctx.clip();
  scroll(ctx);
  // The cork's end, pushed down inside the neck.
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(-30, NECK, 60, 40);
  ctx.restore();
  glass(ctx);
  cork(ctx);
  shine(ctx);
  underwater(ctx);
  ctx.restore();
  rings(ctx, true);
}

function line(ctx: Ctx, s: string, x: number, y: number, color: string, size: number): void {
  text(ctx, s, x + 2, y + 2, `bold ${size}px ${SANS}`, 'rgba(5,5,30,0.8)');
  text(ctx, s, x, y, `bold ${size}px ${SANS}`, color);
}

/** The May cover: the masthead over a painted message in a bottle, and what is inside. */
export function drawMayCover(ctx: Ctx): void {
  drawMaySky(ctx);
  bottle(ctx);
  // The sun catching the bottle's shoulder and the water.
  const [gx, gy] = toPage(-55, SHOULDER - 32);
  sparkle(ctx, gx, gy, 30, 4);
  sparkle(ctx, 200, 1058, 22, 5);
  paintify(ctx);
  drawMasthead(ctx, 'May 1986');
  text(ctx, 'Secret Messages', STRIP + 50, 392, `italic bold 64px ${SCRIPT}`, '#f4e24a');
  line(ctx, `DATA, READ and a code to crack, page ${pageNo('maySecret')}`, STRIP + 54, 436, '#dfe8ff', 26);
  line(ctx, 'Keeping Your Small System Healthy', STRIP + 50, 1110, '#ffffff', 34);
  line(ctx, `On tape: SHUTDOWN, page ${pageNo('mayShutdown')}`, STRIP + 50, 1152, '#dfe8ff', 28);
  line(ctx, `A Quiet Hour: the Clear Mind meets, page ${pageNo('mayClearMind')}`, STRIP + 50, 1190, '#dfe8ff', 28);
}
