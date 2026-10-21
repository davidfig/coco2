import { houseAd } from './ads';
import { checkSum } from '../basic/checksum';
import { GUESS_PRINTED } from '../puzzles';
import { Ctx, INK, MARGIN, MONO, PAGE_W, SANS, SERIF, banner, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** A type-in page: heading, intro, the listing (32 characters to a row, as on the CoCo) and its RAINBOW CHECK table. */
export interface TypeIn {
  banner: string;
  title: string;
  subtitle: string;
  by: string;
  intro: { text: string; before?: number }[];
  lines: readonly string[];
}

/** GUESS as it should be, so a worn or tampered tape can be compared against it. */
const GUESS_MY_NUMBER: TypeIn = {
  banner: 'On The Tape',
  title: 'Guess My Number',
  subtitle: 'The Tape’s First Game, With RAINBOW CHECK',
  by: 'By Dale Wick',
  intro: [
    { text: 'GUESS comes on this month’s cassette, but tapes wear and stretch, and a game that has been loaded a few hundred times may not be quite the game that was recorded. Here it is as it left the studio. Load yours with CLOAD "GUESS", then LIST it and type CHECK, and compare both with this page.', before: 0 },
    { text: 'The page is right and the tape may not be. If your copy does not agree with the printed one, you know what to do.' },
  ],
  lines: GUESS_PRINTED,
};

export function drawTypeIn(ctx: Ctx, p: TypeIn): void {
  banner(ctx, p.banner, MARGIN, 70, 250);
  text(ctx, p.title, PAGE_W / 2, 150, `italic bold 44px ${SERIF}`, INK, 'center');
  text(ctx, p.subtitle, PAGE_W / 2, 192, `bold 26px ${SERIF}`, INK, 'center');
  text(ctx, p.by, PAGE_W / 2, 222, `italic 17px ${SERIF}`, INK, 'center');
  flow(ctx, rowsFor(ctx, p.intro, CW), MARGIN, 250, W, 170, 3, GAP);
  const adY = Math.max(860, listing(ctx, p.lines, 430, 420) + 26);
  if (adY < 1000) houseAd(ctx, MARGIN, adY, W);
}

/**
 * A listing set across the page from `ly` (32 characters to a row, as on the CoCo), with its RAINBOW CHECK table in a
 * box beside it at least `minBox` tall. Returns the y below the box.
 */
export function listing(ctx: Ctx, lines: readonly string[], ly: number, minBox = 0): number {
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ly, W, 2);
  text(ctx, 'Listing:', MARGIN, ly + 34, `bold 20px ${SANS}`);
  let y = ly + 74;
  const lw = W * 0.56;
  // A long listing is set closer, so that it and its table still fit on the page.
  const rows = lines.reduce((n, l) => n + Math.ceil(l.length / 32), 0);
  const lh = rows > 24 ? 21 : 24;
  for (const l of lines) {
    for (let k = 0; k < l.length; k += 32) {
      text(ctx, l.slice(k, k + 32), MARGIN + 10, y, `bold 19px ${MONO}`);
      y += lh;
    }
  }
  ctx.fillRect(MARGIN, y + 6, lw, 2);
  const bx = MARGIN + lw + 30;
  const bw = W - lw - 30;
  const rowH = lines.length > 16 ? 22 : lines.length > 8 ? 26 : 28;
  const boxH = Math.max(minBox, 140 + lines.length * rowH + 130);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, ly + 14, bw, boxH);
  text(ctx, 'RAINBOW CHECK', bx + bw / 2, ly + 48, `bold 20px ${SANS}`, INK, 'center');
  ctx.fillRect(bx, ly + 60, bw, 2);
  const sums = checkSum(lines);
  lines.forEach((l, i) => {
    text(ctx, `After ${l.split(' ')[0]}`, bx + 18, ly + 92 + i * rowH, `16px ${SERIF}`);
    text(ctx, String(sums[i]), bx + bw - 18, ly + 92 + i * rowH, `bold 17px ${SANS}`, INK, 'right');
  });
  flow(
    ctx,
    rowsFor(ctx, [{ text: 'Each number is the sum of every character so far, counting from the first line, with 256 taken away each time it gets that large. Type CHECK to see yours.', before: 0 }], bw - 36),
    bx + 18,
    ly + 92 + lines.length * rowH - 6,
    bw - 36,
    130,
  );
  return ly + 14 + boxH;
}

/** the printed GUESS. */
export const drawGuessListing = (ctx: Ctx): void => drawTypeIn(ctx, GUESS_MY_NUMBER);
