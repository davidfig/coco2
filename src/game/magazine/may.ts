/** The May issue, as far as it has come: its cover (a COMING SOON banner across it) and the printer's notice inside. */
import { BAND, Ctx, MARGIN, PAGE_H, PAGE_W, SANS, SCRIPT, SERIF, colWidth, flow, headline, rng, rowsFor, text } from './paper';
import { STRIP } from './coverArt';
import { paintify } from './coverPaint';
import { drawMasthead, drawSky, sparkle } from './cover';

/** Where the cassette floats, its size and tilt. The light comes from the big sparkle up-left. */
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

/** The cassette, floating in the night sky: lit from up-left, a cool rim along its lower right from the nebula. */
function cassette(ctx: Ctx): void {
  // A warm airbrushed glow behind it, so it stands out of the sky.
  const glow = ctx.createRadialGradient(CX, CY, W * 0.2, CX, CY, W * 0.85);
  glow.addColorStop(0, 'rgba(255,200,150,0.3)');
  glow.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

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
  ctx.strokeStyle = 'rgba(150,140,255,0.5)';
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

/** A yellow banner across the lower right corner, stripped in like type. */
function banner(ctx: Ctx, s: string): void {
  ctx.save();
  ctx.translate(PAGE_W - 200, PAGE_H - 210);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(5,5,30,0.6)';
  ctx.fillRect(-460, -42, 920, 96);
  ctx.fillStyle = '#f4c61c';
  ctx.fillRect(-460, -48, 920, 96);
  ctx.fillStyle = '#d93a2b';
  ctx.fillRect(-460, -48, 920, 8);
  ctx.fillRect(-460, 40, 920, 8);
  text(ctx, s, 0, 20, `bold 52px ${SANS}`, '#1a1640', 'center');
  ctx.restore();
}

function line(ctx: Ctx, s: string, x: number, y: number, color: string, size: number): void {
  text(ctx, s, x + 2, y + 2, `bold ${size}px ${SANS}`, 'rgba(5,5,30,0.8)');
  text(ctx, s, x, y, `bold ${size}px ${SANS}`, color);
}

/** The May cover: the masthead over a painted cassette, a COMING SOON banner across it. */
export function drawMayCover(ctx: Ctx): void {
  drawSky(ctx, 12);
  cassette(ctx);
  sparkle(ctx, 210, 520, 56, 4);
  sparkle(ctx, 880, 1040, 34, 5);
  sparkle(ctx, 760, 470, 26, 6);
  paintify(ctx);
  drawMasthead(ctx, 'May 1986');
  text(ctx, 'Advance Copy', STRIP + 50, 400, `italic bold 64px ${SCRIPT}`, '#f4e24a');
  line(ctx, 'The rest of this issue, and', STRIP + 50, 1140, '#dfe8ff', 34);
  line(ctx, 'its tape, are coming soon.', STRIP + 50, 1182, '#dfe8ff', 34);
  banner(ctx, 'COMING SOON');
}

/** Inside the May cover: the editor's notice that the rest of the issue, and its tape, are still on their way. */
export function drawMayNotice(ctx: Ctx): void {
  const y = headline(ctx, 'To Our Readers', ['The May issue is late . . .', 'The cover is here; the pages and the tape are coming . . .'], 'Margaret Hale, Editor');
  const w = PAGE_W - MARGIN * 2;
  const paras = [
    'This copy reached you ahead of the rest of the issue. The cover was printed on time. The pages that belong inside it were not, and neither was the tape.',
    'We will not pretend there is a good reason. There were delays at the printer and delays at the duplicator, and between them the May RAINBOW is going to be late.',
    'The rest of the issue, and its tape, are coming soon. They will reach you in the same way this did, so there is nothing you need to do but keep an eye on the mail.',
    'In the meantime the March issue is still on your table, and so is its tape. If you have not finished the adventure, now is a good time. If you have, you know more about your CoCo than most people who own one.',
    'Thank you for your patience. We are glad to have you with us.',
  ].map((text, i) => ({ text, before: i ? 12 : 0, font: `19px ${SERIF}`, lh: 25, drop: i === 0 }));
  flow(ctx, rowsFor(ctx, paras, colWidth(w, 2)), MARGIN, y + 10, w, PAGE_H - 140 - y, 2);
}
