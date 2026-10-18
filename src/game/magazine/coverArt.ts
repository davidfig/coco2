import { knobShade, modelRidge, rimTower, woodGrain } from './coverDetail';
import { roughLine } from './coverPaint';
import { Ctx, PAGE_H, PAGE_W, SANS, rng, text } from './paper';

/** Left margin of the cover's type; the hills run out to it. */
export const STRIP = 36;

/** Pixel sprites for the cover art: 1 = lit. */
const INVADER = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
/** A dragon in flight, wings up, head to the right, heading for the castle. */
const DRAGON = [
  '00000110000000000000',
  '00001111000000000000',
  '00011111100000000110',
  '00111111110000001111',
  '01111111111000011101',
  '00000111111111111111',
  '00000011111111111100',
  '00000001111111110000',
  '00000000110011000000',
  '00000001100110000000',
];

function sprite(ctx: Ctx, rows: string[], x: number, y: number, px: number, color: string): void {
  ctx.fillStyle = color;
  rows.forEach((r, j) => [...r].forEach((c, i) => c === '1' && ctx.fillRect(x + i * px, y + j * px, px, px)));
}

/** The airbrushed moon the castle stands against: a wide glow, a pale disc, soft craters. */
function moon(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 3);
  halo.addColorStop(0, 'rgba(255,214,150,0.45)');
  halo.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#fffbe6');
  g.addColorStop(0.7, '#fbe6a8');
  g.addColorStop(1, '#e9c27a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy, cr] of [
    [-0.4, 0.15, 0.22],
    [0.3, -0.35, 0.14],
    [0.35, 0.4, 0.18],
    [-0.1, -0.55, 0.09],
  ]) {
    const c = ctx.createRadialGradient(x + dx * r, y + dy * r, 0, x + dx * r, y + dy * r, cr * r);
    c.addColorStop(0, 'rgba(190,140,70,0.35)');
    c.addColorStop(1, 'rgba(190,140,70,0)');
    ctx.fillStyle = c;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** One ridge of mountains: peaks as [x, y] points from left to right, filled down to the page foot. */
function ridge(ctx: Ctx, peaks: [number, number][], top: string, foot: string, light: number, rim?: string): void {
  const g = ctx.createLinearGradient(0, Math.min(...peaks.map((p) => p[1])), 0, PAGE_H);
  g.addColorStop(0, top);
  g.addColorStop(1, foot);
  // The same seed for fill and rim, so the moonlit edge follows the rough outline exactly.
  const outline = (): void => {
    const r = rng(peaks.length * 31 + peaks[0][1]);
    ctx.moveTo(peaks[0][0], peaks[0][1]);
    for (let i = 1; i < peaks.length; i++) roughLine(ctx, ...peaks[i - 1], ...peaks[i], r);
  };
  const shape = (): void => {
    ctx.moveTo(peaks[0][0], PAGE_H);
    outline();
    ctx.lineTo(peaks[peaks.length - 1][0], PAGE_H);
  };
  ctx.fillStyle = g;
  ctx.beginPath();
  shape();
  ctx.fill();
  modelRidge(ctx, peaks, shape, light, peaks[0][1]);
  if (!rim) return;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  outline();
  ctx.stroke();
}

/** Two ridges, the far one rim-lit by the moon, with mist pooling between them. */
function mountains(ctx: Ctx): void {
  ridge(
    ctx,
    [
      [STRIP, 990],
      [130, 960],
      [230, 1000],
      [330, 970],
      [450, 950],
      [520, 975],
      [610, 905],
      [668, 930],
      [690, 912],
      [700, 902],
      [846, 902],
      [860, 916],
      [884, 922],
      [930, 880],
      [1024, 925],
    ],
    '#4a3c94',
    '#1a1548',
    0.3,
    'rgba(255,224,160,0.55)',
  );
  const mist = ctx.createLinearGradient(0, 960, 0, 1060);
  mist.addColorStop(0, 'rgba(170,150,230,0)');
  mist.addColorStop(0.6, 'rgba(170,150,230,0.35)');
  mist.addColorStop(1, 'rgba(170,150,230,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(STRIP, 960, PAGE_W - STRIP, 100);
  ridge(
    ctx,
    [
      [STRIP, 1060],
      [160, 1030],
      [300, 1075],
      [420, 1080],
      [540, 1030],
      [640, 1060],
      [760, 1000],
      [880, 1045],
      [1024, 1010],
    ],
    '#2a2264',
    '#0e0b2c',
    0.14,
  );
}

/** The castle on the far peak's flat summit, a black silhouette with lit windows, on a rocky footing that meets the slopes. */
function castle(ctx: Ctx, x: number, base: number): void {
  ctx.fillStyle = '#100c2c';
  const tower = (tx: number, w: number, h: number, roof: number): void => {
    ctx.fillRect(tx - w / 2, base - h, w, h);
    ctx.beginPath();
    ctx.moveTo(tx - w / 2 - 5, base - h);
    ctx.lineTo(tx, base - h - roof);
    ctx.lineTo(tx + w / 2 + 5, base - h);
    ctx.fill();
    rimTower(ctx, tx, base, w, h, roof);
  };
  ctx.beginPath();
  ctx.moveTo(x - 74, base + 2);
  ctx.lineTo(x - 66, base - 4);
  ctx.lineTo(x + 70, base - 4);
  ctx.lineTo(x + 80, base + 3);
  ctx.lineTo(x + 66, base + 9);
  ctx.lineTo(x - 60, base + 8);
  ctx.fill();
  ctx.fillRect(x - 46, base - 70, 92, 72);
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 46 + i * 17, base - 80, 10, 12);
  tower(x - 56, 30, 110, 46);
  tower(x + 58, 34, 126, 54);
  tower(x + 4, 26, 100, 40);
  ctx.fillStyle = '#ffd860';
  for (const [wx, wy] of [
    [x - 58, base - 84],
    [x + 56, base - 98],
    [x + 4, base - 74],
    [x - 20, base - 40],
    [x + 26, base - 46],
  ])
    ctx.fillRect(wx, wy, 6, 10);
  ctx.fillStyle = '#ffb840';
  ctx.beginPath();
  ctx.arc(x, base - 16, 12, Math.PI, 0);
  ctx.lineTo(x + 12, base);
  ctx.lineTo(x - 12, base);
  ctx.fill();
}

/** The golden trail of a hand-drawn map, winding from the TV screen over the hills to the castle gate. */
function path(ctx: Ctx): void {
  const trace = (): void => {
    ctx.beginPath();
    ctx.moveTo(590, 1010);
    ctx.bezierCurveTo(690, 1060, 900, 1030, 860, 975);
    ctx.bezierCurveTo(830, 940, 740, 950, 770, 904);
  };
  ctx.lineCap = 'round';
  ctx.save();
  ctx.shadowColor = 'rgba(255,200,90,0.9)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(255,214,120,0.35)';
  ctx.lineWidth = 14;
  trace();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#fff0b8';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  trace();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'butt';
}

/** The family TV the CoCo is plugged into: wood cabinet, rabbit ears, and a glowing green VDG screen. */
function tv(ctx: Ctx, x: number, y: number): void {
  const w = 290;
  const h = 190;
  ctx.strokeStyle = '#c8c8d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 150, y);
  ctx.lineTo(x + 100, y - 70);
  ctx.moveTo(x + 150, y);
  ctx.lineTo(x + 215, y - 62);
  ctx.stroke();
  ctx.fillStyle = '#c8c8d4';
  ctx.beginPath();
  ctx.arc(x + 100, y - 70, 4, 0, Math.PI * 2);
  ctx.arc(x + 215, y - 62, 4, 0, Math.PI * 2);
  ctx.fill();
  const wood = ctx.createLinearGradient(x, y, x, y + h);
  wood.addColorStop(0, '#8a5a2c');
  wood.addColorStop(1, '#4a2c12');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,170,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  woodGrain(ctx, x, y, w, h);
  // The glow spills out of the screen onto the scene.
  ctx.globalCompositeOperation = 'lighter';
  const spill = ctx.createRadialGradient(x + 115, y + 95, 40, x + 115, y + 95, 240);
  spill.addColorStop(0, 'rgba(80,255,80,0.35)');
  spill.addColorStop(1, 'rgba(80,255,80,0)');
  ctx.fillStyle = spill;
  ctx.fillRect(x - 130, y - 150, 500, 490);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#1a1208';
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 14, 210, 162, 22);
  ctx.fill();
  const scr = ctx.createRadialGradient(x + 119, y + 95, 10, x + 119, y + 95, 130);
  scr.addColorStop(0, '#7dff6a');
  scr.addColorStop(1, '#20a020');
  ctx.fillStyle = scr;
  ctx.beginPath();
  ctx.roundRect(x + 22, y + 22, 194, 146, 18);
  ctx.fill();
  const font = `bold 15px "Courier New", monospace`;
  ['YOU SEE A CASTLE', 'ON THE HILL.', '', '?GO NORTH'].forEach((s, i) => text(ctx, s, x + 36, y + 52 + i * 22, font, '#0a3a0a'));
  ctx.fillStyle = '#e8453a';
  ctx.fillRect(x + 124, y + 106, 10, 15);
  const shine = ctx.createLinearGradient(x + 22, y + 22, x + 120, y + 110);
  shine.addColorStop(0, 'rgba(255,255,255,0.45)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.roundRect(x + 22, y + 22, 194, 146, 18);
  ctx.fill();
  for (const ky of [y + 50, y + 100]) {
    ctx.fillStyle = '#d8c8a8';
    ctx.beginPath();
    ctx.arc(x + 258, ky, 14, 0, Math.PI * 2);
    ctx.fill();
    knobShade(ctx, x + 258, ky, 14);
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(x + 256, ky - 12, 4, 10);
  }
  ctx.fillStyle = '#2a1a0a';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 240, y + 134 + i * 9, 36, 4);
}

/** The Color Computer 2 itself, a pale grey wedge in front of the TV, seen from above and in front. */
function keyboard(ctx: Ctx): void {
  const top = 1150;
  const bottom = 1282;
  const at = (t: number): [number, number, number] => [top + (bottom - top) * t, 270 - 50 * t, 780 + 50 * t];
  ctx.fillStyle = '#6e6e78';
  ctx.beginPath();
  ctx.moveTo(220, bottom);
  ctx.lineTo(830, bottom);
  ctx.lineTo(828, bottom + 22);
  ctx.lineTo(222, bottom + 22);
  ctx.fill();
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#f0f0f4');
  g.addColorStop(1, '#a8a8b2');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(270, top);
  ctx.lineTo(780, top);
  ctx.lineTo(830, bottom);
  ctx.lineTo(220, bottom);
  ctx.fill();
  text(ctx, 'COLOR COMPUTER 2', 300, top + 18, `bold 12px ${SANS}`, '#4a4a56');
  ctx.fillStyle = '#e8453a';
  ctx.fillRect(724, top + 7, 26, 9);
  // Five rows of dark keys; the space bar on the last.
  const keys = [13, 13, 12, 11];
  for (let j = 0; j < 5; j++) {
    const [ry, l, rt] = at(0.22 + j * 0.15);
    const [ry2, l2, rt2] = at(0.22 + j * 0.15 + 0.11);
    const n = j < 4 ? keys[j] : 1;
    const pad = j < 4 ? 30 + j * 12 : 170;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.06) / n;
      const b = (i + 0.94) / n;
      const lx = (t: number, L: number, R: number): number => L + pad + (R - L - pad * 2) * t;
      ctx.fillStyle = '#2a2a32';
      ctx.beginPath();
      ctx.moveTo(lx(a, l, rt), ry);
      ctx.lineTo(lx(b, l, rt), ry);
      ctx.lineTo(lx(b, l2, rt2), ry2);
      ctx.lineTo(lx(a, l2, rt2), ry2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(lx(a, l, rt), ry, lx(b, l, rt) - lx(a, l, rt), 2);
    }
  }
  // Green from the screen catches the case.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(270, top);
  ctx.lineTo(780, top);
  ctx.lineTo(830, bottom + 22);
  ctx.lineTo(220, bottom + 22);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  const lit = ctx.createRadialGradient(450, top, 10, 450, top, 260);
  lit.addColorStop(0, 'rgba(60,200,60,0.25)');
  lit.addColorStop(1, 'rgba(60,200,60,0)');
  ctx.fillStyle = lit;
  ctx.fillRect(200, top, 640, bottom - top + 22);
  ctx.restore();
}

/** The cover's airbrushed scene: the CoCo on its TV, a map trail over the hills to a castle under the moon, a dragon and an invader overhead. */
export function drawScene(ctx: Ctx): void {
  moon(ctx, 770, 800, 125);
  sprite(ctx, DRAGON, 470, 690, 8, '#e8453a');
  mountains(ctx);
  castle(ctx, 770, 902);
  path(ctx);
  tv(ctx, 330, 930);
  keyboard(ctx);
  sprite(ctx, INVADER, 470, 500, 10, '#f4e24a');
}
