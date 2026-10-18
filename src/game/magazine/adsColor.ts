import { dustCoverScene } from './adsDustCover';
import { gobblerScene } from './adsGobbler';
import { lemonadeScene } from './adsLemonade';
import { paintify } from './coverPaint';
import { Ctx, INK, MARGIN, PAGE_H, PAGE_W, SANS, SERIF, flow, rng, rowsFor, text, HEAVY } from './paper';

const W = PAGE_W - MARGIN * 2;

function starfield(ctx: Ctx, seed: number, top: string, bottom: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, PAGE_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  const r = rng(seed);
  for (let i = 0; i < 380; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.2 + r() * 0.8).toFixed(2)})`;
    ctx.fillRect(r() * PAGE_W, r() * PAGE_H, 1 + (r() < 0.2 ? 1 : 0), 1 + (r() < 0.2 ? 1 : 0));
  }
}

/** A heavy black-bordered picture frame, as the painted ads use. */
function picture(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
}

/** A game's name stripped in over its painting, with a dark drop shadow so it reads over sky or sun. */
function logo(ctx: Ctx, s: string, x: number, y: number, size: number, color: string): void {
  text(ctx, s, x + 3, y + 3, `${size}px ${HEAVY}`, 'rgba(5,5,30,0.75)', 'center');
  text(ctx, s, x, y, `${size}px ${HEAVY}`, color, 'center');
}

function copy(ctx: Ctx, items: { text: string; font?: string; align?: 'left' | 'right' | 'center' }[], x: number, y: number, w: number, h: number, color = '#ffffff'): void {
  flow(ctx, rowsFor(ctx, items.map((t, i) => ({ text: t.text, font: t.font ?? `19px ${SERIF}`, lh: 24, align: t.align ?? 'left', before: i ? 10 : 0, color })), w), x, y, w, h);
}

/** Inside front cover: a space-arcade ad that also sells lemonade, in the painted-art, ellipsis-headed manner of the originals. */
export function drawInsideCoverAd(ctx: Ctx): void {
  starfield(ctx, 31, '#0b1a4a', '#1a4a8a');
  // The two paintings go in first and are painted over; the printed sky round them gets only the press's grain.
  paintify(ctx, undefined, true);
  const px = 72;
  const py = 110;
  const qx = PAGE_W - 72 - 330;
  const qy = 730;
  picture(ctx, px, py, 330, 440);
  gobblerScene(ctx, px, py, 330, 440);
  picture(ctx, qx, qy, 330, 400);
  const [sx, sy] = lemonadeScene(ctx, qx, qy, 330, 400);
  paintify(ctx, { x: px, y: py, w: 330, h: 440 });
  paintify(ctx, { x: qx, y: qy, w: 330, h: 400 });
  text(ctx, 'BECOME AN INTREPID SNACK ADVENTURER . . .', PAGE_W / 2, 74, `bold 33px ${SANS}`, '#ffffff', 'center');
  logo(ctx, 'SPACE', px + 165, py + 70, 58, '#ffffff');
  logo(ctx, 'GOBBLER', px + 165, py + 130, 58, '#f4e24a');
  logo(ctx, 'LEMONADE', qx + 165, qy + 44, 34, '#ffffff');
  text(ctx, '25¢', sx, sy, `bold 20px ${SANS}`, '#ffffff', 'center');
  const bx = px + 360;
  copy(
    ctx,
    [
      { text: 'by Chip Munk', font: `italic 17px ${SANS}`, align: 'right' },
      { text: 'CoCo version by Dale Wick', font: `italic 17px ${SANS}`, align: 'right' },
      { text: 'Pocket-calculator version by Somebody Else', font: `italic 17px ${SANS}`, align: 'right' },
      {
        text: 'Far beyond the known kitchens, you venture deep into the vast reaches of the snack aisle. But you are not alone! In a flash, without so much as a how-do-ya-do, they are in hot pursuit and you are left to eat before you are eaten. Can you elude your pursuers? Will you elude your brother-in-law? And who are these guys anyway? Find the answers to these and other pressing questions in SPACE GOBBLER. See your dealer today!',
      },
      { text: 'SPACE GOBBLER . . . coin-op arcade realism at home for 1 to 2 players (or 1 to 1, depending who owns the joystick).', font: `italic 19px ${SERIF}` },
    ],
    bx,
    py,
    W - 360 + 72 - 72,
    380,
  );
  text(ctx, 'SPACE GOBBLER', bx, py + 410, `bold 12px ${SANS}`, '#ffffff');
  text(ctx, 'CoCo 16K TAPE  . . . . . . . . . . . . . . . . . $19.95', bx, py + 428, `12px ${SANS}`, '#ffffff');
  text(ctx, 'CoCo 32K DISK  . . . . . . . . . . . . . . . . . $24.95', bx, py + 444, `12px ${SANS}`, '#ffffff');

  // Second heading and picture: the lemonade stand.
  text(ctx, '. . . OR RUN A LEMONADE STAND IN THE WORLD OF HIGH FINANCE', PAGE_W / 2, 690, `bold 28px ${SANS}`, '#ffffff', 'center');
  copy(
    ctx,
    [
      { text: 'by Mortimer Squeezewell', font: `italic 17px ${SANS}` },
      { text: 'CoCo version by Dale Wick', font: `italic 17px ${SANS}` },
      {
        text: '“Yes, after purchasing a lemon grove in Florida, a sugar mine in Cuba and a very large pitcher, I had begun to wonder what other commodities remained to be added to my swelling portfolio. Then a small girl in pigtails dared to tell me (ME, Mortimer P. Squeezewell IV) that my price per cup was too high. To avoid future misunderstandings, I bought the stand.”',
      },
      { text: '“I think I am on to something profitable here.” — M. P. Squeezewell IV', align: 'right' },
      { text: 'LEMONADE . . . a no-holds-barred strategy game for 1 to 4 players (and one small girl).', font: `italic 19px ${SERIF}` },
    ],
    px,
    qy,
    W - 360,
    430,
  );
  text(ctx, 'LEMONADE  CoCo 16K TAPE . . . . . . $24.95', px, qy + 440, `12px ${SANS}`, '#ffffff');
  // Publisher.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px + 40, PAGE_H - 76, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2f6fc4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(px + 40, PAGE_H - 76, 30, 12, 0.5, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, 'Published by', px + 84, PAGE_H - 92, `italic 13px ${SANS}`, '#ffffff');
  text(ctx, 'Chip Munk', px + 84, PAGE_H - 62, `italic bold 38px ${SERIF}`, '#ffffff');
  text(ctx, 'INTERNATIONAL', px + 84, PAGE_H - 44, `bold 12px ${SANS}`, '#ffffff');
  text(ctx, 'If your dealer does not have these programs, ask nicely, then ask again.', PAGE_W - 72, PAGE_H - 50, `11px ${SANS}`, '#ffffff', 'right');
}

/** Inside back cover: two spot-colour, big-type ads. */
export function drawInsideBackAd(ctx: Ctx): void {
  const top = ctx.createLinearGradient(0, 0, 0, PAGE_H / 2);
  top.addColorStop(0, '#2fa8d8');
  top.addColorStop(1, '#a6e3f2');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H / 2);
  ctx.fillStyle = '#f7b23b';
  ctx.fillRect(0, PAGE_H / 2, PAGE_W, PAGE_H / 2);
  ctx.fillStyle = INK;
  ctx.fillRect(0, PAGE_H / 2 - 4, PAGE_W, 8);
  // Two inks and black, nobody's brush: just the press.
  paintify(ctx, undefined, true);
  text(ctx, 'NEVER SEE', PAGE_W / 2, 150, `bold 40px ${SANS}`, INK, 'center');
  text(ctx, '?SN ERROR', PAGE_W / 2, 270, `124px ${HEAVY}`, '#d52a1e', 'center');
  text(ctx, 'AGAIN!', PAGE_W / 2, 350, `bold 70px ${SANS}`, INK, 'center');
  copy(
    ctx,
    [
      { text: 'The TYPE-O-MATIC™ keyboard cover has patented Error Prevention Technology. It simply removes your keys. No keys, no typos, no errors!*', font: `22px ${SERIF}` },
    ],
    MARGIN + 60,
    400,
    W - 120,
    80,
    INK,
  );
  text(ctx, 'Only $14.95. Black or beige. Both are the same colour.   *And no programs.', PAGE_W / 2, 560, `bold 20px ${SANS}`, INK, 'center');
  text(ctx, 'CLOAD-A-MATIC™', PAGE_W / 2, 760, `84px ${HEAVY}`, INK, 'center');
  text(ctx, 'TAPES THAT LOAD ON THE FIRST TRY!', PAGE_W / 2, 820, `bold 34px ${SANS}`, '#7a1c10', 'center');
  copy(
    ctx,
    [
      { text: 'Tired of reloading? So were we. Our tapes load first try or your money back, less postage, handling, the tape itself, and a restocking fee of one hundred percent.', font: `22px ${SERIF}` },
      { text: 'Results may vary. Everything may vary.', font: `italic 22px ${SERIF}` },
    ],
    MARGIN + 60,
    860,
    W - 120,
    160,
    INK,
  );
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(MARGIN + 60, 1080, W - 120, 110, 36);
  ctx.fill();
  text(ctx, 'ORDER BOTH', MARGIN + 100, 1148, `bold 30px ${SANS}`, '#ffffff');
  text(ctx, '1-800-555-0148', PAGE_W - MARGIN - 100, 1156, `bold 60px ${SANS}`, '#f4e24a', 'right');
}

/** The back cover: a full-colour advertisement, in the big-type manner of the real thing. */
export function drawBackCover(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, 0, 0, PAGE_H);
  g.addColorStop(0, '#f2542d');
  g.addColorStop(1, '#f9a03f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  const cx = PAGE_W / 2;
  dustCoverScene(ctx, cx);
  paintify(ctx);
  text(ctx, 'Is your CoCo', PAGE_W / 2, 190, `bold 70px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'WEARING PANTS?', PAGE_W / 2, 280, `92px ${HEAVY}`, '#fff3a0', 'center');
  text(ctx, 'The DUST-O-GARD™ vinyl cover protects your computer from', PAGE_W / 2, 790, `bold 31px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'DUST.  CATS.  AND  FAMILY.', PAGE_W / 2, 850, `52px ${HEAVY}`, '#1b1b24', 'center');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(MARGIN + 30, 910, W - 60, 120, 40);
  ctx.fill();
  text(ctx, 'ORDER NOW ', MARGIN + 60, 985, `bold 32px ${SANS}`, '#1b1b24');
  text(ctx, '1-800-555-0172', PAGE_W - MARGIN - 56, 992, `bold 62px ${SANS}`, '#d52a1e', 'right');
  text(ctx, 'Only $7.95 (cat not included)   •   Fits all models   •   Washable. Mostly.', PAGE_W / 2, 1100, `bold 24px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'Dust-O-Gard is a trademark of Dust-O-Gard.  We checked.', PAGE_W / 2, 1180, `italic 20px ${SANS}`, 'rgba(255,255,255,0.85)', 'center');
}
