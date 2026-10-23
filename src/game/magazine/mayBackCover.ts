import { price, priceWidth, setType } from './adsMail';
import { paintify } from './coverPaint';
import { timerScene } from './mayTimer';
import { Ctx, HEAVY, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

// May's back cover: LIGHTS-OUT, a plug-in timer that switches the computer off for you, as a national ad: the photograph
// across the top of the page, a heavy headline under it, two columns of copy, the maker's logo, and a seal of approval
// from the Human Pledge's committee (the advertisers have started to quote it).

const INK = '#1a1c22';
const BLUE = '#1f3f7a';
const RED = '#c8261c';
const PHOTO = { x: 0, y: 0, w: PAGE_W, h: 600 };

/** Type set round a circle, centred on the angle `at` (0 is the top), each letter turned to face out. */
function arcText(ctx: Ctx, s: string, cx: number, cy: number, r: number, at: number, font: string, color: string, below = false): void {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  const widths = [...s].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) / r;
  let a = at - (below ? -total / 2 : total / 2);
  [...s].forEach((ch, i) => {
    const half = widths[i] / r / 2;
    a += below ? -half : half;
    ctx.save();
    ctx.translate(cx + Math.sin(a) * r, cy - Math.cos(a) * r);
    ctx.rotate(below ? a + Math.PI : a);
    ctx.fillText(ch, 0, below ? r * 0.0 + 6 : 0);
    ctx.restore();
    a += below ? -half : half;
  });
  ctx.restore();
}

/** The committee's seal: two rings, its name round the edge, three words across the middle. */
function seal(ctx: Ctx, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  arcText(ctx, 'SMALL SYSTEMS COMMITTEE', 0, 0, r * 0.8, 0, `bold ${Math.round(r * 0.125)}px ${SANS}`, BLUE);
  arcText(ctx, '• THE HUMAN PLEDGE •', 0, 0, r * 0.8, Math.PI, `bold ${Math.round(r * 0.125)}px ${SANS}`, BLUE, true);
  text(ctx, 'REST.', 0, -r * 0.2, `italic bold ${Math.round(r * 0.2)}px ${SERIF}`, BLUE, 'center');
  text(ctx, 'REMEMBER.', 0, r * 0.06, `italic bold ${Math.round(r * 0.2)}px ${SERIF}`, BLUE, 'center');
  text(ctx, 'RETURN.', 0, r * 0.32, `italic bold ${Math.round(r * 0.2)}px ${SERIF}`, BLUE, 'center');
  ctx.restore();
}

/** May's back cover. */
export function drawMayBackCover(ctx: Ctx): void {
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  timerScene(ctx, PHOTO);
  paintify(ctx, PHOTO);
  paintify(ctx, undefined, true);

  text(ctx, 'Shown with Color Computer power cord. Trippers set for a healthy sixteen hours of rest.', PAGE_W - 40, PHOTO.h - 18, `italic 13px ${SERIF}`, '#e8ecf6', 'right');
  setType(ctx, 'IT REMEMBERS TO', PAGE_W / 2, 712, `92px ${HEAVY}`, INK, 'center', 0.82, PAGE_W - 120);
  setType(ctx, 'TURN IT OFF.', PAGE_W / 2, 806, `92px ${HEAVY}`, INK, 'center', 0.82, PAGE_W - 120);
  setType(ctx, 'So you don’t have to.', PAGE_W / 2, 862, `italic 44px ${SERIF}`, BLUE, 'center', 0.95, PAGE_W - 160);

  const x = 72;
  const w = 600;
  const paras = [
    'A computer left running with nobody in front of it gains nothing from the hours. The experts say so, and now there is a simple way to be sure.',
    'Plug the LIGHTS-OUT timer into the wall, plug your Color Computer into the timer, and press in the little trippers for the hours it should rest. At bedtime, at mealtimes, while you are at school, it switches your CoCo off. Firmly. Every day.',
    'No more wondering whether you left it on. No more coming home to find it has been busy. LIGHTS-OUT cannot be argued with, because it does not listen.',
    'Also fine for lamps, radios, percolators and electric blankets.',
  ];
  flow(ctx, rowsFor(ctx, paras.map((t, i) => ({ text: t, font: `16.5px ${SERIF}`, lh: 20.5, align: 'left' as const, before: i ? 9 : 0, color: INK })), colWidth(w, 2, 30)), x, 900, w, 230, 2, 30);

  // Right of the copy: the seal, then the price.
  seal(ctx, 834, 990, 92);
  const pw = priceWidth(ctx, '12', '95', 70, '900', SERIF);
  text(ctx, 'ONLY', 834 - pw / 2 - 8, 1146, `bold 20px ${SANS}`, INK, 'right');
  price(ctx, '12', '95', 834, 1150, 70, '900', SERIF, RED, 'center');

  ctx.fillStyle = INK;
  ctx.fillRect(72, 1180, PAGE_W - 144, 2);
  setType(ctx, 'WATTSWORTH', 72, 1238, `italic 900 50px ${SANS}`, RED, 'left', 0.86, 360);
  text(ctx, 'Timers • Switches • Night Lights', 74, 1260, `bold 13px ${SANS}`, INK);
  text(ctx, 'AT HARDWARE AND DEPARTMENT STORES EVERYWHERE', PAGE_W - 72, 1226, `bold 17px ${SANS}`, INK, 'right');
  text(ctx, 'Or write Wattsworth, Dept. 5-86, Box 900, Racine, Wis. 53401', PAGE_W - 72, 1248, `13px ${SERIF}`, INK, 'right');
  text(ctx, 'LIGHTS-OUT cannot tell whether anyone is in front of the computer. It assumes not.', PAGE_W / 2, 1290, `11px ${SANS}`, INK, 'center');
}
