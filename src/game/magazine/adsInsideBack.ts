import { cards, price, priceWidth, setType, slug, struck } from './adsMail';
import { cassetteShot, keyboardCoverShot } from './adsProducts';
import { paintify } from './coverPaint';
import { Ctx, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

// The inside back cover: two half-page ads from two small mail-order houses, each in its own house style, as the back
// pages of the RAINBOW sold them. TYPE-O-MATIC is a two-ink ad on a tinted panel; CLOAD-A-MATIC is a page of specials in
// black on solid red.

const BLUE = '#1d56a8';
const NAVY = '#14306a';
const TINT = '#dde8f1';
const RED = '#d7342b';
const BLACK = '#161412';
const HALF = 652;

/** Body copy poured into columns. */
function body(ctx: Ctx, paras: { text: string; font?: string; color?: string; before?: number; align?: 'justify' | 'left' | 'center' | 'right' }[], x: number, y: number, w: number, h: number, cols: number, color: string, size = 14.5, gap = 22): void {
  const cw = colWidth(w, cols, gap);
  flow(ctx, rowsFor(ctx, paras.map((p, i) => ({ font: `${size}px ${SERIF}`, lh: size + 3.5, before: i ? 7 : 0, color, ...p })), cw), x, y, w, h, cols, gap);
}

const TYPE_SHOT = { x: 620, y: 232, w: 340, h: 196 };
const TAPE_SHOT = { x: 60, y: HALF + 134, w: 250, h: 170 };

/** The inks under the type: TYPE-O-MATIC's blue frame and tinted panel, CLOAD-A-MATIC's red, and both photos. */
function ground(ctx: Ctx): void {
  ctx.fillStyle = BLUE;
  ctx.fillRect(22, 22, PAGE_W - 44, HALF - 30);
  ctx.fillStyle = TINT;
  ctx.fillRect(38, 38, PAGE_W - 76, HALF - 140);
  ctx.fillStyle = '#fbfaf5';
  ctx.fillRect(38, HALF - 94, PAGE_W - 76, 70);
  const shot = TYPE_SHOT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(shot.x - 6, shot.y - 6, shot.w + 12, shot.h + 12);
  keyboardCoverShot(ctx, shot);
  paintify(ctx, shot);
  ctx.fillStyle = RED;
  ctx.fillRect(0, HALF + 6, PAGE_W, PAGE_H - HALF - 6);
  const tape = TAPE_SHOT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tape.x - 5, tape.y - 5, tape.w + 10, tape.h + 10);
  cassetteShot(ctx, tape);
  paintify(ctx, tape);
}

/** The top half: TYPE-O-MATIC, an italic headline, copy round its photo, and an ordering strip. */
function typeOMatic(ctx: Ctx): void {
  const shot = TYPE_SHOT;
  setType(ctx, 'Why do smart CoCo owners', 64, 104, `italic bold 54px ${SANS}`, NAVY, 'left', 0.9, PAGE_W - 128);
  setType(ctx, 'never see ‘?SN ERROR’?', 64, 168, `italic bold 62px ${SANS}`, NAVY, 'left', 0.9, PAGE_W - 128);
  text(ctx, 'Sure, it’s priced right, but there’s less…', PAGE_W / 2, 212, `italic bold 22px ${SANS}`, BLUE, 'center');
  body(
    ctx,
    [
      { text: 'Thousands of CoCo owners have typed ?SN ERROR on their screens by accident. Not one of them meant to. Now there is the TYPE-O-MATIC™ keyboard cover, with patented Error Prevention Technology. It fits over your Color Computer’s keyboard in seconds and simply removes your keys. No keys, no typos. No typos, no errors!*' },
      { text: '‘SILENT’ operation — you will never hear a key click again. Your family will thank you, then ask what you are doing.', color: NAVY },
      { text: '‘DUST-FREE’ — nothing gets in between the keys, because there are none.', color: NAVY },
      { text: 'Moulded in high-impact plastic, in black or beige (both are the same colour). Works with any 4K, 16K, 32K or 64K Color Computer, and with any program, so long as you do not need to type it in.' },
    ],
    64,
    240,
    530,
    270,
    2,
    '#222222',
  );
  text(ctx, 'TYPE-O-MATIC™ is a full-featured keyboard cover', shot.x + shot.w / 2, shot.y + shot.h + 22, `italic 12px ${SERIF}`, '#333333', 'center');
  text(ctx, 'in a moulded slab. Actual unretouched photo.', shot.x + shot.w / 2, shot.y + shot.h + 37, `italic 12px ${SERIF}`, '#333333', 'center');
  const pw = priceWidth(ctx, '14', '95', 80, '900', SERIF);
  ctx.font = `bold 26px ${SERIF}`;
  const ow = ctx.measureText('ONLY ').width;
  const px = shot.x + shot.w / 2 - (ow + pw) / 2;
  text(ctx, 'ONLY', px, 528, `bold 26px ${SERIF}`, NAVY);
  price(ctx, '14', '95', px + ow, 528, 80, '900', SERIF, NAVY);
  text(ctx, '*And no programs.', 64, 538, `italic 12px ${SERIF}`, '#333333');
  // The ordering strip: a rounded logo box, the address, the cards and the small print.
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(56, HALF - 84, 220, 50, 24);
  ctx.stroke();
  setType(ctx, 'KEYLESS', 166, HALF - 46, `italic 900 34px ${SANS}`, BLACK, 'center', 0.95, 190);
  text(ctx, 'KEYLESS INC.', 292, HALF - 70, `italic bold 13px ${SERIF}`, BLACK);
  text(ctx, '44-01 Quiet Street', 292, HALF - 54, `italic 13px ${SERIF}`, BLACK);
  text(ctx, 'Hushpuckena, MS 38738', 292, HALF - 38, `italic 13px ${SERIF}`, BLACK);
  cards(ctx, 470, HALF - 78, 36);
  text(ctx, '★ ★ ★  ORDERING INFORMATION  ★ ★ ★', 600, HALF - 68, `bold 13px ${SANS}`, NAVY);
  text(ctx, 'ADD $2.00 POSTAGE AND HANDLING. C.O.D. $3.00 EXTRA.', 600, HALF - 52, `9.5px ${SANS}`, BLACK);
  text(ctx, 'WE ACCEPT VISA, MASTER CARD, M.O.’S, CHECKS.', 600, HALF - 40, `9.5px ${SANS}`, BLACK);
  text(ctx, 'MISSISSIPPI RESIDENTS MUST ADD SALES TAX.', 600, HALF - 28, `9.5px ${SANS}`, BLACK);
}

/** One line of specials: the product, its price and the old one, and what it does in bullets. */
function special(ctx: Ctx, y: number, name: string, dollars: string, cents: string, was: string, ship: string, bullets: string[], x0 = 60): void {
  setType(ctx, name, x0, y, `bold 40px ${SANS}`, BLACK, 'left', 0.86, 760 - x0);
  price(ctx, dollars, cents, PAGE_W - 60, y + 2, 56, 'bold', SANS, BLACK, 'right');
  struck(ctx, was, PAGE_W - 60, y + 26, 19, BLACK);
  text(ctx, ship, PAGE_W - 60, y + 48, `18px ${SANS}`, BLACK, 'right');
  bullets.forEach((b, i) => {
    ctx.fillStyle = BLACK;
    ctx.fillRect(x0 + 18, y + 26 + i * 22, 6, 6);
    text(ctx, b, x0 + 34, y + 34 + i * 22, `17px ${SANS}`, BLACK);
  });
}

/** The bottom half: CLOAD-A-MATIC's specials, black on solid red, with a photo of the tapes on white. */
function cloadAMatic(ctx: Ctx): void {
  const top = HALF + 6;
  // The house mark: a square with two reels in it.
  ctx.fillStyle = BLACK;
  ctx.fillRect(60, top + 26, 76, 76);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 6;
  for (const dx of [-17, 17]) {
    ctx.beginPath();
    ctx.arc(98 + dx, top + 56, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = RED;
  ctx.fillRect(72, top + 82, 52, 6);
  setType(ctx, 'CLOAD-A-MATIC™', 156, top + 72, `900 64px ${SERIF}`, BLACK, 'left', 0.84, PAGE_W - 220);
  setType(ctx, 'TAPES THAT LOAD ON THE FIRST TRY!', 158, top + 102, `bold 26px ${SANS}`, BLACK, 'left', 0.9, PAGE_W - 220);
  ctx.fillStyle = BLACK;
  ctx.fillRect(40, top + 116, PAGE_W - 80, 4);
  special(ctx, top + 160, 'C-10 Certified Tapes', '11', '95', 'Was $39.95', '(dozen, $2 shipping)', ['Load first try or your money back*', 'Every one tested by hand. Twice.', 'Clear shell, or the other clear shell'], 336);
  slug(ctx, ['NEW', 'LOW PRICE'], 702, top + 228, 17, -0.32, BLACK);
  special(ctx, top + 284, 'Azimuth Screwdriver', '4', '95', 'Reg. $9.95', '($1 shipping)', ['Turns your head until it agrees with ours', 'Fits the screw. Fits most screws.'], 336);
  special(ctx, top + 396, 'Leader-Tape Splicer', '7', '50', 'Reg. $12.95', '($1 shipping)', ['Joins any two ends', 'Even the ones that should not be joined'], 60);
  slug(ctx, ['REPACK'], 640, top + 456, 19, -0.4, BLACK);
  special(ctx, top + 498, 'Head Cleaner Kit', '3', '95', 'Reg. $6.95', '($1 shipping)', ['Swabs, fluid, and a very small brush'], 60);
  ctx.fillStyle = BLACK;
  ctx.fillRect(40, PAGE_H - 92, PAGE_W - 80, 4);
  text(ctx, 'Box 148, Tulsa, OK 74101', 60, PAGE_H - 60, `bold 19px ${SANS}`, BLACK);
  text(ctx, 'Hours: 9-5 M-F, 10-2 Sat', PAGE_W / 2 + 30, PAGE_H - 60, `14px ${SANS}`, BLACK, 'center');
  text(ctx, '1-800-555-0148', PAGE_W - 60, PAGE_H - 58, `bold 24px ${SANS}`, BLACK, 'right');
  text(
    ctx,
    '*Money back, less postage, handling, the tape itself, and a restocking fee of one hundred percent. Results may vary. Everything may vary.',
    PAGE_W / 2,
    PAGE_H - 30,
    `10.5px ${SANS}`,
    BLACK,
    'center',
  );
}

/** The inside back cover. */
export function drawInsideBackAd(ctx: Ctx): void {
  ctx.fillStyle = '#f6f4ec';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ground(ctx);
  // Two inks and black: the press's grain and misregistration under the type, the photos already painted.
  paintify(ctx, undefined, true);
  typeOMatic(ctx);
  cloadAMatic(ctx);
}
