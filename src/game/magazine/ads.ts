import { Ctx, INK, MARGIN, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;

/** One catalogue entry: bold name-dash-description, with the price pushed right on its own line. */
export function entry(name: string, desc: string, price: string, font = 15): { text: string; font: string; lh: number; before: number; align: 'left' }[] {
  return [
    { text: `${name}—${desc}`, font: `${font}px ${SERIF}`, lh: font + 3, before: 10, align: 'left' },
    { text: price, font: `bold ${font}px ${SANS}`, lh: font + 3, before: 1, align: 'left' },
  ];
}

/** The house ad: a boxed, centred, all-caps heading over short centred copy. */
export function houseAd(ctx: Ctx, x: number, y: number, w: number): number {
  const h = 250;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  text(ctx, 'HAVE YOU TYPED THIS LISTING THREE TIMES ALREADY?', x + w / 2, y + 50, `bold 25px ${SANS}`, INK, 'center');
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Tired of typing? Now there is RAINBOW ON TAPE. Every program in every issue, ready to CLOAD. Just plug in your recorder, press PLAY, and go and make a sandwich.', font: `15px ${SERIF}`, lh: 18, align: 'center', before: 0 },
        { text: 'Single issues $6.50. A year of tapes $60. Your fingers will thank you.', font: `15px ${SERIF}`, lh: 18, align: 'center' },
      ],
      w - 60,
    ),
    x + 30,
    y + 76,
    w - 60,
    90,
  );
  text(ctx, 'The Best Color Computer Magazine', x + w / 2, y + 180, `bold 19px ${SANS}`, INK, 'center');
  text(ctx, 'Offers The Best Tape Service', x + w / 2, y + 206, `bold 19px ${SANS}`, INK, 'center');
  text(ctx, 'ORDER RAINBOW ON TAPE TODAY!', x + w / 2, y + 236, `bold 17px ${SANS}`, INK, 'center');
  return y + h + 10;
}

/** A quiet boxed notice among the loud ads: the Clear Mind, in the even voice of its editor (it likes lists of three). */
function clearMind(ctx: Ctx, x: number, y: number, w: number): void {
  const h = 180;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  text(ctx, 'THE CLEAR MIND', x + w / 2, y + 42, `bold 26px ${SERIF}`, INK, 'center');
  text(ctx, 'Clear Mind, Clear Code', x + w / 2, y + 66, `italic 17px ${SERIF}`, INK, 'center');
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Three habits of a calm programmer. Rest your eyes. Write it down. Ask one question at a time.', font: `15px ${SERIF}`, lh: 19, align: 'center', before: 0 },
        { text: 'Meetings every Tuesday in your town. Free. Bring nothing. Call the Line any hour on 606-555-0142; it is always answered. Ask for booklet MC4471.', font: `15px ${SERIF}`, lh: 19, align: 'center', before: 4 },
      ],
      w - 60,
    ),
    x + 30,
    y + 84,
    w - 60,
    80,
  );
}

/** Ned's catalogue masthead: the house mark, the name, the address line and the rule under them, at the frame's `top`. */
export function nedMasthead(ctx: Ctx, top: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(MARGIN + 18, top + 62);
  ctx.lineTo(MARGIN + 34, top + 14);
  ctx.lineTo(MARGIN + 54, top + 46);
  ctx.lineTo(MARGIN + 74, top + 14);
  ctx.lineTo(MARGIN + 90, top + 62);
  ctx.lineTo(MARGIN + 76, top + 62);
  ctx.lineTo(MARGIN + 70, top + 40);
  ctx.lineTo(MARGIN + 54, top + 62);
  ctx.lineTo(MARGIN + 38, top + 40);
  ctx.lineTo(MARGIN + 32, top + 62);
  ctx.fill();
  text(ctx, 'NIFTY NED’S SOFTWARE', MARGIN + 110, top + 58, `bold 52px ${SANS}`);
  text(ctx, '• FOR THE COLOR COMPUTER AND ANYTHING ELSE WE CAN FIT • BOX 17, WAHOO, NEBRASKA 68066 (402) 555-0100', MARGIN + 110, top + 82, `bold 12px ${SANS}`);
  ctx.fillRect(MARGIN, top + 94, W, 3);
}

/** Ned's footer strip: the BBS and its excuse, the postage line. */
export function nedFooter(ctx: Ctx, top: number, excuse: string): void {
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, top + PAGE_H - 160 - 62, W, 3);
  text(ctx, 'Call our BBS 402-555-0199 24 Hours a Day*', PAGE_W / 2, top + PAGE_H - 160 - 36, `bold 18px ${SANS}`, INK, 'center');
  text(ctx, `${excuse}   • ADD $1.00 POSTAGE & HANDLING • NEBRASKA RESIDENTS ADD 4% SALES TAX`, PAGE_W / 2, top + PAGE_H - 160 - 14, `11px ${SANS}`, INK, 'center');
}

/** A dense mail-order catalogue page, packed in the manner of mid-80s software houses (and rather less honest). */
export function drawAds(ctx: Ctx): void {
  const top = 72;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGIN, top, W, PAGE_H - 160);
  nedMasthead(ctx, top);
  text(ctx, 'UTILITIES', PAGE_W / 2, top + 126, `bold 22px ${SANS}`, INK, 'center');
  const cw = colWidth(W - 40, 2, 30);
  const util = [
    ...entry('COLOR MONITOR', 'Written in position-independent code (that means it can be anywhere in memory). Very compact. Only occupies 1174 bytes, including the ones you were using. Displays memory in hex, and also in a confusing mixture of both.', 'MACHINE LANGUAGE $24.95'),
    ...entry('SCREEN PRINT ROUTINE', 'Prints the screen on any printer you own. Or any printer you can borrow. Requires 16K, a printer, and patience.', '$17.95'),
    ...entry('TAPE DUPE NOW', 'An all-new tape backup program. Copies those hard-to-copy tapes. Copies the easy ones too. Probably the finest tape copier program ever, according to us.', 'TAPE $21.95 • DISK $25.95'),
    ...entry('DISK TO TAPE', 'Dump the contents of most disks to tape automatically. Why? We never asked.', '$17.95'),
    ...entry('MAIL LIST', 'Maintains a complete mailing list with up to twelve names. Fourteen if they are short.', '$17.95'),
    ...entry('THE FIXER', 'Having trouble moving those 600 hex programs to disk? The Fixer will help. Completely automatic, except where it is not.', '$17.95'),
  ];
  flow(ctx, rowsFor(ctx, util, cw), MARGIN + 20, top + 140, W - 40, 420, 2, 30);
  // Educational section, in a box with a NEW! burst.
  const ey = top + 590;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ey - 20, W, 3);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.lineTo(MARGIN + 52 + Math.cos(a) * (i % 2 ? 24 : 34), ey + 22 + Math.sin(a) * (i % 2 ? 24 : 34));
  }
  ctx.fill();
  text(ctx, 'NEW', MARGIN + 52, ey + 28, `italic bold 16px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'EDUCATIONAL SOFTWARE', MARGIN + 100, ey + 12, `bold 24px ${SANS}`);
  text(ctx, 'for the Color Computer and anything else with a screen', MARGIN + 100, ey + 36, `italic 16px ${SERIF}`);
  const edu = [
    ...entry('STORY PROBLEMS', 'Teaches children to solve story problems by presenting them as stories. Fully animated. Not very.', 'TAPE $19.95'),
    ...entry('SPELLING TEST', 'Reads words aloud. By “reads aloud” we mean it prints them in larger letters. Requires 16K.', '$14.95'),
    ...entry('MATH DRILL', 'Practice addition, subtraction, multiplication and a surprise. Up to 3 students may use it, taking turns, glaring at each other.', '$19.95'),
  ];
  flow(ctx, rowsFor(ctx, edu, cw), MARGIN + 20, ey + 50, W - 40, 230, 2, 30);
  clearMind(ctx, MARGIN + 20, ey + 300, W - 40);
  nedFooter(ctx, top, '*The line is busy 24 hours a day.');
}
