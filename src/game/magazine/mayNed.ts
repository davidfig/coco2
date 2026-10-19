/**
 * May's marketplace: Nifty Ned's catalogue again, made over for the lower limit. The tape copier has gone and left its
 * gap (the editor did not fill it), the products have learned the Clear Mind's advice, and the quiet notice at the
 * foot has gone to the Clear Mind's own page: a woodworker's case for putting a computer away has taken its place.
 */
import { entry, nedFooter, nedMasthead } from './ads';
import { Ctx, INK, MARGIN, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const TAU = Math.PI * 2;

/** Where an item was taken out: a thin box left empty, with a line of small type, as the compositor left it. */
function withdrawn(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  text(ctx, '(This item is no longer offered.)', x + w / 2, y + h / 2 + 4, `italic 11px ${SERIF}`, INK, 'center');
}

/** The SALE burst, black with white type, its points a little uneven. */
function sale(ctx: Ctx, cx: number, cy: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    const r = i % 2 ? 26 : 36 + 2 * Math.sin(i * 1.7);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.fill();
  text(ctx, 'SALE', cx, cy + 6, `italic bold 17px ${SANS}`, '#ffffff', 'center');
}

/** The case for the computer you are not using: an engraving-style box, all type and rules. */
function caseAd(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
  // A line drawing of the case, lid shut: front, top in perspective, the brass latch.
  const bx = x + 34;
  const by = y + 76;
  const bw = 190;
  const bh = 80;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + 34, by - 30);
  ctx.lineTo(bx + bw + 34, by - 30);
  ctx.lineTo(bx + bw, by);
  ctx.moveTo(bx + bw + 34, by - 30);
  ctx.lineTo(bx + bw + 34, by + bh - 30);
  ctx.lineTo(bx + bw, by + bh);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + 4, by + i * 11.4);
    ctx.bezierCurveTo(bx + bw * 0.3, by + i * 11.4 - 2, bx + bw * 0.7, by + i * 11.4 + 3, bx + bw - 4, by + i * 11.4);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + bw / 2 - 9, by - 4, 18, 22);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx + bw / 2 - 9, by - 4, 18, 22);
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by + 9, 3, 0, TAU);
  ctx.stroke();
  text(ctx, 'PUT IT AWAY NICELY.', x + 280, y + 50, `bold 30px ${SANS}`);
  const cw = w - 280 - 24;
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'A fitted case of solid pine for the computer you are not using just now. Holds one CoCo, one recorder, twelve tapes and the manuals. Ventilated, felt-lined, with a brass latch, a lock and two keys.', font: `15px ${SERIF}`, lh: 18, align: 'left', before: 0 },
        { text: 'Slides under most beds. Fits most closets. Fits all basements.', font: `italic 15px ${SERIF}`, lh: 18, align: 'left', before: 6 },
      ],
      cw,
    ),
    x + 280,
    y + 66,
    cw,
    100,
  );
  text(ctx, 'HALVORSEN WOODCRAFT • STOUGHTON, WIS. • $34.95 • Plain wrapper on request.', x + w / 2, y + h - 22, `bold 12px ${SANS}`, INK, 'center');
}

/** May's catalogue page. */
export function drawMayNed(ctx: Ctx): void {
  const top = 72;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGIN, top, W, PAGE_H - 160);
  nedMasthead(ctx, top);
  text(ctx, 'UTILITIES • NOW INSIDE THE LIMIT!', PAGE_W / 2, top + 126, `bold 22px ${SANS}`, INK, 'center');
  const cw = colWidth(W - 40, 2, 30);
  const lx = MARGIN + 20;
  const rx = lx + cw + 30;
  const left = [
    ...entry('LIST-O-METER', 'Counts the lines in every program on your tape and remembers how many there were. If one grows a line while you were not looking, it tells you. We do not know why anyone would need this. Several of you have asked.', 'TAPE $14.95'),
    ...entry('MODEM SLOW-DOWN KIT', 'Brings any 1200 baud modem inside the new limit. One resistor, one screwdriver, one afternoon. Your bulletin board will feel like 1979 again.', '$9.95'),
    ...entry('LIGHTS OUT', 'Blanks your screen after five minutes with nobody in front of it, as this issue advises. Press any key to bring it back. Or don’t.', '$9.95'),
    ...entry('SPRING CLEANING', 'Finds the files you do not need any more and erases them. Decides which ones by itself, so you don’t have to.', '$17.95'),
  ];
  const right = [
    ...entry('SINGLE DRIVE COMPANION', 'A handsome walnut box exactly the size of a second disk drive. Stands where your second drive stood. Holds recipes.', '$12.95'),
    ...entry('ONE AT A TIME', 'Makes your CoCo do exactly one thing at a time, as the experts now recommend. It already did. Now it is official.', '$6.95'),
  ];
  flow(ctx, rowsFor(ctx, left, cw), lx, top + 140, cw, 420);
  flow(ctx, rowsFor(ctx, right, cw), rx, top + 140, cw, 420);
  // TAPE DUPE NOW's place, left as it fell.
  withdrawn(ctx, rx, top + 300, cw, 120);
  const after = entry('DISK TO TAPE', 'Moves (not copies) the contents of a disk to tape, and leaves the disk blank behind it, as the new rules require.', '$17.95');
  flow(ctx, rowsFor(ctx, after, cw), rx, top + 424, cw, 136);

  const ey = top + 590;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ey - 20, W, 3);
  sale(ctx, MARGIN + 52, ey + 22);
  text(ctx, 'EDUCATIONAL SOFTWARE', MARGIN + 100, ey + 12, `bold 24px ${SANS}`);
  text(ctx, 'revised for 1986, and checked against the new rules', MARGIN + 100, ey + 36, `italic 16px ${SERIF}`);
  const edu = [
    ...entry('HISTORY OF COMPUTING', 'Revised edition, now 40% shorter. From the abacus to the pocket calculator, then one short chapter called “Afterwards”.', 'TAPE $19.95 • WAS $24.95'),
    ...entry('MATH DRILL II', 'Addition, subtraction and multiplication. The surprise in MATH DRILL has been taken out, by popular request. Nobody will tell us what it was.', '$19.95'),
    ...entry('TOUCH TYPING', 'Forty words a minute in six weeks. Our tester reached sixty, and we have asked him to slow down.', '$16.95'),
    ...entry('STATE CAPITALS', 'Fifty states, fifty capitals, and a dog that barks when you are wrong. Your family will learn the capitals too, from the next room.', '$14.95'),
  ];
  flow(ctx, rowsFor(ctx, edu, cw), MARGIN + 20, ey + 50, W - 40, 230, 2, 30);
  caseAd(ctx, MARGIN + 20, ey + 296, W - 40, 200);
  nedFooter(ctx, top, '*Now at 300 baud. Still busy, and slower.');
}
