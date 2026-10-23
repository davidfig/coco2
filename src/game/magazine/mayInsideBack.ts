import { body, special } from './adsInsideBack';
import { cards, price, priceWidth, setType, slug, starburst } from './adsMail';
import { paintify } from './coverPaint';
import { pageNo } from './pages';
import { cableShot, eraserShot } from './mayProducts';
import { Ctx, PAGE_H, PAGE_W, SANS, SERIF, text } from './paper';

// May's inside back cover: two half-page ads again. THE HERMIT, a cable that connects to nothing, takes the Human Pledge's
// advice to heart in green and black on cream; CLOAD-A-MATIC is back in its black on red, selling erasers and tapes with
// nothing on them.

const GREEN = '#1f5c3a';
const PALE = '#e4ecd9';
const RED = '#d7342b';
const BLACK = '#161412';
const HALF = 652;

const CABLE_SHOT = { x: 70, y: 70, w: 380, h: 300 };
const ERASER_SHOT = { x: 60, y: HALF + 134, w: 250, h: 170 };

/** The inks under the type: THE HERMIT's green rules and pale panel, CLOAD-A-MATIC's red, and both photos. */
function ground(ctx: Ctx): void {
  ctx.fillStyle = PALE;
  ctx.fillRect(30, 30, PAGE_W - 60, HALF - 46);
  ctx.fillStyle = GREEN;
  ctx.fillRect(30, 30, PAGE_W - 60, 8);
  ctx.fillRect(30, HALF - 24, PAGE_W - 60, 8);
  for (const [shot, pad] of [[CABLE_SHOT, 6], [ERASER_SHOT, 5]] as const) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(shot.x - pad, shot.y - pad, shot.w + pad * 2, shot.h + pad * 2);
  }
  cableShot(ctx, CABLE_SHOT);
  paintify(ctx, CABLE_SHOT);
  ctx.fillStyle = RED;
  ctx.fillRect(0, HALF + 6, PAGE_W, PAGE_H - HALF - 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ERASER_SHOT.x - 5, ERASER_SHOT.y - 5, ERASER_SHOT.w + 10, ERASER_SHOT.h + 10);
  eraserShot(ctx, ERASER_SHOT);
  paintify(ctx, ERASER_SHOT);
}

/** The top half: a quiet serif headline beside the photo, the copy, a price and the order line. */
function hermit(ctx: Ctx): void {
  const x = 490;
  setType(ctx, 'Talk to no one.', x, 128, `italic bold 64px ${SERIF}`, GREEN, 'left', 0.92, PAGE_W - x - 60);
  setType(ctx, 'In style.', x, 192, `italic 54px ${SERIF}`, BLACK, 'left', 0.92, PAGE_W - x - 60);
  text(ctx, 'THE HERMIT™ cable, by Solitude Systems', x + 2, 228, `bold 17px ${SANS}`, GREEN);
  body(
    ctx,
    [
      { text: 'Every cable is a way for trouble to come in. So we made one that lets nothing in at all.' },
      { text: 'THE HERMIT is six feet of shielded, double-insulated cable with gold-plated contacts, connected to nothing at either end. Both plugs are sealed at the factory under red rubber caps. Coil it beside your CoCo, and it will look connected. It will not be.' },
      { text: 'Tested by hand to carry no signal whatsoever.', color: GREEN },
    ],
    x,
    256,
    PAGE_W - x - 60,
    150,
    1,
    BLACK,
    15,
  );
  text(ctx, 'THE HERMIT coils neatly. Shown actual size, or near it.', CABLE_SHOT.x, CABLE_SHOT.y + CABLE_SHOT.h + 26, `italic 13px ${SERIF}`, '#333333');
  ['No setup.', 'No signal.', 'No worries.'].forEach((t, i) => text(ctx, `✓  ${t}`, CABLE_SHOT.x + 10, CABLE_SHOT.y + CABLE_SHOT.h + 72 + i * 30, `bold 21px ${SANS}`, GREEN));
  starburst(ctx, CABLE_SHOT.x + CABLE_SHOT.w - 20, CABLE_SHOT.y + 24, 52, '#f4d23a', BLACK, ['NO', 'DATA!'], 0.18);
  // The price under the copy, with the guarantee beside it.
  const pw = priceWidth(ctx, '19', '95', 76, '900', SERIF);
  price(ctx, '19', '95', x, 494, 76, '900', SERIF, GREEN);
  text(ctx, 'Two for $34.95.', x + pw + 20, 462, `bold 18px ${SANS}`, BLACK);
  text(ctx, 'One for each end of the house.', x + pw + 20, 484, `italic 15px ${SERIF}`, BLACK);
  text(ctx, 'Guaranteed: if your HERMIT ever carries anything, send it back.', x, 524, `italic 13.5px ${SERIF}`, BLACK);
  // The order line across the foot of the panel.
  ctx.fillStyle = GREEN;
  ctx.fillRect(50, HALF - 100, PAGE_W - 100, 2);
  setType(ctx, 'SOLITUDE SYSTEMS', 56, HALF - 52, `italic 900 32px ${SANS}`, GREEN, 'left', 0.9, 300);
  text(ctx, 'Box 1, Lone Tree, Iowa 52755', 58, HALF - 32, `13px ${SERIF}`, BLACK);
  cards(ctx, 400, HALF - 80, 34);
  text(ctx, 'ORDERS BY MAIL ONLY.', 560, HALF - 66, `bold 13px ${SANS}`, GREEN);
  text(ctx, 'We do not have a telephone. We find we do not miss it.', 560, HALF - 50, `11px ${SANS}`, BLACK);
  text(ctx, 'ADD $1.50 POSTAGE. IOWA RESIDENTS ADD SALES TAX.', 560, HALF - 36, `9.5px ${SANS}`, BLACK);
}

/** The bottom half: CLOAD-A-MATIC's spring specials, black on red, round a photo of the eraser on white. */
function cloadAMatic(ctx: Ctx): void {
  const top = HALF + 6;
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
  setType(ctx, 'SPRING CLEANING FOR YOUR TAPES!', 158, top + 102, `bold 26px ${SANS}`, BLACK, 'left', 0.9, PAGE_W - 220);
  ctx.fillStyle = BLACK;
  ctx.fillRect(40, top + 116, PAGE_W - 80, 4);
  special(ctx, top + 160, 'BIG MAGNET Bulk Eraser', '9', '95', 'Was $19.95', '($2 shipping)', ['A whole cassette clean in three seconds', 'A shoebox of them in a minute', 'Keep away from watches and Grandma’s tapes'], 336);
  slug(ctx, ['NEW'], 790, top + 236, 19, -0.3, BLACK);
  special(ctx, top + 284, 'Guaranteed-Blank C-10s', '11', '95', 'Reg. $14.95', '(dozen, $2 shipping)', ['Nothing on them. We listened to every one.', 'If you find anything on one, call us. Please.'], 336);
  special(ctx, top + 396, 'Cassette Labels, 100', '2', '95', 'Reg. $4.95', '($1 shipping)', [`Know your tapes (see page ${pageNo('mayHealthy')})`, 'Pencil and pen. Erasers sold separately.'], 60);
  slug(ctx, ['REPACK'], 640, top + 456, 19, -0.4, BLACK);
  special(ctx, top + 498, 'Write-Protect Tab Mender', '1', '95', 'Reg. $2.95', '($1 shipping)', ['Broke the tab off? Tape over the hole and record after all'], 60);
  ctx.fillStyle = BLACK;
  ctx.fillRect(40, PAGE_H - 92, PAGE_W - 80, 4);
  text(ctx, 'Box 148, Tulsa, OK 74101', 60, PAGE_H - 60, `bold 19px ${SANS}`, BLACK);
  text(ctx, 'Hours: 9-5 M-F, 10-2 Sat', PAGE_W / 2 + 30, PAGE_H - 60, `14px ${SANS}`, BLACK, 'center');
  text(ctx, '1-800-555-0148', PAGE_W - 60, PAGE_H - 58, `bold 24px ${SANS}`, BLACK, 'right');
  text(
    ctx,
    'Tape copying programs are no longer sold, by law. Please stop asking us. We cannot tell you where to find one either.',
    PAGE_W / 2,
    PAGE_H - 30,
    `10.5px ${SANS}`,
    BLACK,
    'center',
  );
}

/** May's inside back cover. */
export function drawMayInsideBack(ctx: Ctx): void {
  ctx.fillStyle = '#f6f4ec';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ground(ctx);
  paintify(ctx, undefined, true);
  hermit(ctx);
  cloadAMatic(ctx);
}
