import { houseAd } from './ads';
import { checkSum } from '../basic/checksum';
import { FIRST_PROGRAM, GUESS_PRINTED } from '../puzzles';
import { pageNo } from './pages';
import { Ctx, INK, MARGIN, MONO, PAGE_W, SANS, SERIF, banner, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** A type-in page: heading, intro, the listing (32 characters to a row, as on the CoCo) and its RAINBOW CHECK table. */
interface TypeIn {
  banner: string;
  title: string;
  subtitle: string;
  by: string;
  intro: { text: string; before?: number }[];
  lines: readonly string[];
}

/** The first type-in page prints the first puzzle's program; `puzzles/listings.ts` holds it so the watcher knows it too. */
const SAY_YOUR_NAME: TypeIn = {
  banner: 'Type-In Program',
  title: 'Say Your Name',
  subtitle: 'Your First Program, With RAINBOW CHECK',
  by: 'By Tom Brannigan',
  intro: [
    { text: 'A tiny program that asks your name, to warm your fingers. Page ' + pageNo('program') + ' explains the lines. Type every line exactly as printed and press ENTER after each one. Then type CHECK. The CoCo prints its own RAINBOW CHECK numbers; compare them with the table beside the listing. If a number differs from yours, the mistake is in the line just before it. When they all agree, type RUN.', before: 0 },
    { text: 'Spaces count. So do commas and quotation marks. Do not try to be clever: type it exactly as it is printed, even if you think you see a mistake. The CoCo has a way of being right.' },
  ],
  lines: FIRST_PROGRAM,
};

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

function drawTypeIn(ctx: Ctx, p: TypeIn): void {
  banner(ctx, p.banner, MARGIN, 70, 250);
  text(ctx, p.title, PAGE_W / 2, 150, `italic bold 44px ${SERIF}`, INK, 'center');
  text(ctx, p.subtitle, PAGE_W / 2, 192, `bold 26px ${SERIF}`, INK, 'center');
  text(ctx, p.by, PAGE_W / 2, 222, `italic 17px ${SERIF}`, INK, 'center');
  flow(ctx, rowsFor(ctx, p.intro, CW), MARGIN, 250, W, 170, 3, GAP);
  const ly = 430;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ly, W, 2);
  text(ctx, 'Listing:', MARGIN, ly + 34, `bold 20px ${SANS}`);
  let y = ly + 74;
  const lw = W * 0.56;
  for (const l of p.lines) {
    for (let k = 0; k < l.length; k += 32) {
      text(ctx, l.slice(k, k + 32), MARGIN + 10, y, `bold 19px ${MONO}`);
      y += 24;
    }
  }
  ctx.fillRect(MARGIN, y + 6, lw, 2);
  const bx = MARGIN + lw + 30;
  const bw = W - lw - 30;
  const rowH = p.lines.length > 8 ? 26 : 28;
  const boxH = Math.max(420, 140 + p.lines.length * rowH + 130);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, ly + 14, bw, boxH);
  text(ctx, 'RAINBOW CHECK', bx + bw / 2, ly + 48, `bold 20px ${SANS}`, INK, 'center');
  ctx.fillRect(bx, ly + 60, bw, 2);
  const sums = checkSum(p.lines);
  p.lines.forEach((l, i) => {
    text(ctx, `After ${l.split(' ')[0]}`, bx + 18, ly + 92 + i * rowH, `16px ${SERIF}`);
    text(ctx, String(sums[i]), bx + bw - 18, ly + 92 + i * rowH, `bold 17px ${SANS}`, INK, 'right');
  });
  flow(
    ctx,
    rowsFor(ctx, [{ text: 'Each number is the sum of every character so far, counting from the first line, with 256 taken away each time it gets that large. Type CHECK to see yours.', before: 0 }], bw - 36),
    bx + 18,
    ly + 92 + p.lines.length * rowH - 6,
    bw - 36,
    130,
  );
  const adY = Math.max(860, ly + boxH + 40);
  if (adY < 1000) houseAd(ctx, MARGIN, adY, W);
}

/** the first type-in, the program that asks your name. */
export const drawListing = (ctx: Ctx): void => drawTypeIn(ctx, SAY_YOUR_NAME);

/** the printed GUESS. */
export const drawGuessListing = (ctx: Ctx): void => drawTypeIn(ctx, GUESS_MY_NUMBER);
