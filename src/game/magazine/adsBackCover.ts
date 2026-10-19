import { dustCoverScene } from './adsDustCover';
import { coupon, price, priceWidth, setType } from './adsMail';
import { paintify } from './coverPaint';
import { Ctx, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

// The back cover: DUST-O-GARD, in the manner of the big national ads that bought the back of the book: a serif headline
// set huge and tight, a deck with the price, three columns of copy, a studio photograph, the red logo and a coupon.

const INK = '#1c1a17';
const RED = '#d0281e';
const PHOTO = { x: 72, y: 714, w: 600, h: 400 };

/** The back cover. */
export function drawBackCover(ctx: Ctx): void {
  ctx.fillStyle = '#f3f0e7';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.fillStyle = INK;
  ctx.fillRect(PHOTO.x - 2, PHOTO.y - 2, PHOTO.w + 4, PHOTO.h + 4);
  dustCoverScene(ctx, PHOTO);
  paintify(ctx, PHOTO);
  paintify(ctx, undefined, true);

  setType(ctx, 'Dust-O-Gard’s Color Computer Cover™', PAGE_W / 2, 96, `bold 40px ${SERIF}`, INK, 'center', 1, 880);
  setType(ctx, 'IS YOUR COCO', PAGE_W / 2, 238, `900 136px ${SERIF}`, INK, 'center', 0.84, 900);
  setType(ctx, 'WEARING PANTS?', PAGE_W / 2, 366, `900 136px ${SERIF}`, INK, 'center', 0.84, 900);
  setType(ctx, 'Protects from dust, cats and family!', PAGE_W / 2, 436, `bold 48px ${SERIF}`, INK, 'center', 0.9, 880);
  // "Cut $2…now just $7.95", the prices with their raised cents, centred as one line.
  const deck = `bold 48px ${SERIF}`;
  const squeeze = 0.9;
  ctx.font = deck;
  const [a, b] = ['Cut ', '…now just '].map((s) => [s, ctx.measureText(s).width * squeeze] as const);
  const p2 = priceWidth(ctx, '2', '', 48, 'bold', SERIF);
  const p7 = priceWidth(ctx, '7', '95', 48, 'bold', SERIF);
  let x = PAGE_W / 2 - (a[1] + p2 + b[1] + p7) / 2;
  for (const [s, dollars, cents, pw] of [[a, '2', '', p2], [b, '7', '95', p7]] as const) {
    setType(ctx, s[0], x, 492, deck, INK, 'left', squeeze);
    price(ctx, dollars, cents, x + s[1], 492, 48, 'bold', SERIF, INK);
    x += s[1] + pw;
  }

  const w = PAGE_W - 144;
  const paras = [
    'The DUST-O-GARD cover is a fitted, high-gloss vinyl jacket for your Color Computer. It slips on in seconds and keeps out dust, spilled cola, crumbs and the curious paws of household pets.',
    'It is ideal for anyone who has ever come back to find the cat asleep on the keyboard and BREAK pressed nine hundred times.',
    'Cut to fit the Color Computer, the Color Computer 2 and most anything else that shape. Double-stitched seams, and two ear-shaped tucks for a snug fit at the corners.',
    'In black, beige or black. Get a DUST-O-GARD cover today, and your CoCo will be dressed for anything . . . together!',
  ];
  flow(ctx, rowsFor(ctx, paras.map((t, i) => ({ text: t, font: `16.5px ${SERIF}`, lh: 20, align: 'left' as const, before: i ? 10 : 0, color: INK })), colWidth(w, 3, 34)), 72, 530, w, 166, 3, 34);
  text(ctx, 'Shown on a Color Computer 2. Computer, desk and cat not included.', PHOTO.x, PHOTO.y + PHOTO.h + 24, `italic 14px ${SERIF}`, INK);

  // The logo in red, the store line under it, then the coupon.
  const rx = 702;
  const rw = PAGE_W - 72 - rx;
  setType(ctx, 'Dust-O-Gard', rx, 760, `italic 900 50px ${SANS}`, RED, 'left', 0.86, rw - 14);
  text(ctx, '®', rx + rw - 10, 736, `bold 14px ${SANS}`, RED, 'left');
  setType(ctx, 'The Cover Store™', rx, 790, `bold 25px ${SANS}`, INK, 'left', 0.92, rw);
  text(ctx, 'A DIVISION OF DUST-O-GARD', rx, 810, `bold 10.5px ${SANS}`, INK);
  coupon(ctx, rx, 842, rw, 272, ['Send me a FREE', '1986 cover catalog', 'Mail To: Dust-O-Gard, Dept. 86-C-3', '17 Vinyl Way, Akron, Ohio 44301'], ['Name', 'Company', 'Address', 'City', 'State', 'Telephone'], INK);

  ctx.fillStyle = INK;
  ctx.fillRect(72, 1176, PAGE_W - 144, 2);
  setType(ctx, 'ORDER TOLL FREE 1-800-555-0172', 72, 1222, `bold 34px ${SANS}`, INK, 'left', 0.9, 560);
  text(ctx, 'Only $7.95 • Fits all models • Washable. Mostly.', PAGE_W - 72, 1218, `bold 15px ${SANS}`, INK, 'right');
  text(ctx, 'Cat not included. Prices apply at participating Dust-O-Gard dealers.', PAGE_W / 2, 1262, `11px ${SANS}`, INK, 'center');
  text(ctx, 'Dust-O-Gard is a trademark of Dust-O-Gard. We checked.', PAGE_W / 2, 1278, `11px ${SANS}`, INK, 'center');
}
