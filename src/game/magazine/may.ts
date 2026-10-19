/** The May issue's cover: a painted cassette floating over still water on a spring morning, and the month's cover lines. */
import { BAND, Ctx, SANS, SCRIPT, rng, text } from './paper';
import { pageNo } from './pages';
import { STRIP } from './coverArt';
import { paintify } from './coverPaint';
import { drawMasthead, sparkle } from './cover';
import { drawMaySky, reflection } from './maySky';

/** Where the cassette floats, its size and tilt. The light comes from the sun up-left (`SUN_X` in maySky.ts). */
const CX = 540;
const CY = 790;
const W = 640;
const H = 400;
const TILT = -0.13;

/** One of the cassette's five screws: a dark recess, a lit dome, a slot at its own angle. */
function screw(ctx: Ctx, x: number, y: number, seed: number): void {
  const r = rng(seed);
  ctx.fillStyle = '#0b0b10';
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 10);
  g.addColorStop(0, '#d8dae4');
  g.addColorStop(0.5, '#868896');
  g.addColorStop(1, '#3a3b46');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  const a = r() * Math.PI;
  ctx.strokeStyle = '#26262e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8);
  ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
  ctx.stroke();
}

/** A tape reel seen through the window: wound tape (a brown disc, a lit rim) round a white hub with six teeth. */
function reel(ctx: Ctx, x: number, y: number, wound: number, seed: number): void {
  const r = rng(seed);
  const t = ctx.createRadialGradient(x - wound * 0.3, y - wound * 0.3, wound * 0.2, x, y, wound);
  t.addColorStop(0, '#6a3e22');
  t.addColorStop(0.8, '#4a2a16');
  t.addColorStop(1, '#2c180c');
  ctx.fillStyle = t;
  ctx.beginPath();
  ctx.arc(x, y, wound, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,150,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, wound - 2, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  const hub = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 30);
  hub.addColorStop(0, '#ffffff');
  hub.addColorStop(1, '#bfc2cc');
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8eaf0';
  const turn = r() * Math.PI;
  for (let i = 0; i < 6; i++) {
    const a = turn + (i * Math.PI) / 3;
    ctx.save();
    ctx.translate(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
    ctx.rotate(a);
    ctx.fillRect(-4, -3, 8, 6);
    ctx.restore();
  }
}

/** The label: cream card, the six bands across it, the series name typed and the month written in by hand. */
function label(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#fbf3dc');
  g.addColorStop(1, '#d9ccab');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  const band = 11;
  BAND.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y + h - 80 + i * band, w, band);
  });
  text(ctx, 'RAINBOW ON TAPE', x + 28, y + 50, `bold 34px ${SANS}`, '#2c2925');
  text(ctx, 'A', x + w - 40, y + 50, `bold 40px ${SANS}`, '#2c2925', 'right');
  text(ctx, 'May 1986', x + 30, y + 110, `italic 40px ${SCRIPT}`, '#2c3a8c');
}

/** The cassette, floating over the water: lit from the sun up-left, a cool rim along its lower right from the sky. */
function cassette(ctx: Ctx): void {
  reflection(ctx, CX, W);
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(TILT);
  const x = -W / 2;
  const y = -H / 2;
  // Shell: smoky black plastic, lit up-left.
  const body = ctx.createLinearGradient(x, y, x + W * 0.6, y + H * 1.2);
  body.addColorStop(0, '#4a4b58');
  body.addColorStop(0.45, '#26262f');
  body.addColorStop(1, '#121218');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x, y, W, H, 22);
  ctx.fill();
  // Highlight along the top edge, rim light along the bottom right.
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(235,238,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 3);
  ctx.lineTo(x + W - 30, y + 3);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,220,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(x + W - 3, y + 40);
  ctx.lineTo(x + W - 3, y + H - 24);
  ctx.quadraticCurveTo(x + W - 3, y + H - 3, x + W - 24, y + H - 3);
  ctx.lineTo(x + 60, y + H - 3);
  ctx.stroke();

  label(ctx, x + 34, y + 30, W - 68, H - 130);
  // The window: a dark slot cut through the label, two reels, the tape running between them.
  const wx = x + 150;
  const wy = y + 150;
  ctx.fillStyle = '#0e0d14';
  ctx.beginPath();
  ctx.roundRect(wx, wy, W - 300, 90, 45);
  ctx.fill();
  reel(ctx, wx + 45, wy + 45, 42, 7);
  reel(ctx, wx + W - 345, wy + 45, 30, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(wx + 8, wy + 6, W - 316, 18, 9);
  ctx.fill();

  // The lip along the bottom, with its holes for the capstan and the guides.
  ctx.fillStyle = '#1b1b23';
  ctx.beginPath();
  ctx.moveTo(x + 100, y + H);
  ctx.lineTo(x + 130, y + H - 72);
  ctx.lineTo(x + W - 130, y + H - 72);
  ctx.lineTo(x + W - 100, y + H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,224,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 130, y + H - 72);
  ctx.lineTo(x + W - 130, y + H - 72);
  ctx.stroke();
  ctx.fillStyle = '#050508';
  for (const [hx, r] of [[-180, 11], [-90, 14], [0, 16], [90, 14], [180, 11]] as const) {
    ctx.beginPath();
    ctx.arc(hx, y + H - 34, r, 0, Math.PI * 2);
    ctx.fill();
  }
  screw(ctx, x + 22, y + 22, 21);
  screw(ctx, x + W - 22, y + 22, 22);
  screw(ctx, x + 22, y + H - 22, 23);
  screw(ctx, x + W - 22, y + H - 22, 24);
  screw(ctx, 0, y + H - 82, 25);
  ctx.restore();
}

function line(ctx: Ctx, s: string, x: number, y: number, color: string, size: number): void {
  text(ctx, s, x + 2, y + 2, `bold ${size}px ${SANS}`, 'rgba(5,5,30,0.8)');
  text(ctx, s, x, y, `bold ${size}px ${SANS}`, color);
}

/** The May cover: the masthead over a painted cassette, and what is inside. */
export function drawMayCover(ctx: Ctx): void {
  drawMaySky(ctx);
  cassette(ctx);
  // The sun catching the shell's corner and the water.
  sparkle(ctx, CX - 300, CY - 160, 34, 4);
  sparkle(ctx, 200, 1058, 22, 5);
  paintify(ctx);
  drawMasthead(ctx, 'May 1986');
  text(ctx, 'Secret Messages', STRIP + 50, 392, `italic bold 64px ${SCRIPT}`, '#f4e24a');
  line(ctx, `DATA, READ and a code to crack, page ${pageNo('maySecret')}`, STRIP + 54, 436, '#dfe8ff', 26);
  line(ctx, 'Keeping Your Small System Healthy', STRIP + 50, 1110, '#ffffff', 34);
  line(ctx, `Type-in: HANGMAN, page ${pageNo('mayHangman')}`, STRIP + 50, 1152, '#dfe8ff', 28);
  line(ctx, `A Quiet Hour: the Clear Mind meets, page ${pageNo('mayClearMind')}`, STRIP + 50, 1190, '#dfe8ff', 28);
}
