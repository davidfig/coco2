/**
 * The May issue's programming pages: "Secret Messages" (DATA, READ, the RAINBOW code and its decoder) and the month's tape.
 * The decoder is printed from `puzzles/listingsMay.ts`, so the watcher and the page never disagree. SHUTDOWN, the game it
 * is hidden in, has its own pages (`mayShutdown.ts`).
 */
import { checkSum } from '../basic/checksum';
import { DECODER, EXAMPLE, EXAMPLE_MESSAGE, MESSAGE_LINE } from '../puzzles/listingsMay';
import { screenBox, tapePage } from './learn';
import { pageNo } from './pages';
import { Ctx, INK, MARGIN, MONO, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, headline, rowsFor, sidebar, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 100;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** The code table: each letter over its number, a space and the end mark after. */
function codeTable(ctx: Ctx, x: number, y: number, w: number): number {
  const cells: [string, string][] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c, i) => [c, String(i + 1)]);
  cells.push(['space', '0'], ['end', '-1']);
  const per = 14;
  const cw = w / per;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, 3);
  cells.forEach(([a, b], i) => {
    const cx = x + (i % per) * cw + cw / 2;
    const cy = y + 40 + Math.floor(i / per) * 76;
    const small = a.length > 1;
    text(ctx, a, cx, cy, small ? `italic 15px ${SERIF}` : `bold 26px ${SANS}`, INK, 'center');
    text(ctx, b, cx, cy + 28, `20px ${MONO}`, INK, 'center');
  });
  ctx.fillRect(x, y + 168, w, 3);
  return y + 180;
}

/** A short listing with its RAINBOW CHECK sums at the right, boxed. */
function miniListing(ctx: Ctx, x: number, y: number, w: number, lines: readonly string[], caption: string): number {
  const sums = checkSum(lines);
  const h = 40 + lines.length * 30;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  lines.forEach((l, i) => {
    text(ctx, l, x + 16, y + 34 + i * 30, `bold 18px ${MONO}`);
    text(ctx, String(sums[i]), x + w - 16, y + 34 + i * 30, `bold 17px ${SANS}`, INK, 'right');
  });
  text(ctx, caption, x, y + h + 26, `italic 17px ${SERIF}`);
  return y + h + 40;
}

/** DATA and READ, the code, the decoder, and the message hidden in SHUTDOWN. */
export function drawSecret(ctx: Ctx): void {
  const y = headline(ctx, 'Secret Messages', ['DATA, READ and the oldest code there is . . .', 'And a message from us, on this month’s tape . . .'], 'Dale Wick');
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'A program can carry its own facts. A DATA line holds a list of items, numbers or words, with commas between them. The CoCo never runs a DATA line; it only keeps it. READ takes the next item off the list and puts it in a variable.', before: 0 },
        { text: 'READ starts at the first DATA line in the program, wherever it is, and goes on through them in line order. RUN starts the list over. Read past the end of it and the CoCo says ?OD ERROR, which means out of data.' },
        { text: 'Our code is the oldest there is. A is 1, B is 2, and so on to Z, which is 26. A space between words is 0, and -1 marks the end of the message. Written out, HI MOM is 8,9,0,13,15,13,-1.' },
        { text: 'The decoder below reads a message and prints it. Line 1 READs each item as words, into A$, and VAL turns it into a number. A word that is not a number turns into 0, and 0 prints as a space, so the decoder does not trip over a program’s other DATA. A number below zero ENDs it.' },
        { text: 'Line 2 makes the letter. CHR$ gives the character with a code, and the CoCo’s capitals start at 65, so 64 plus 1 is A. Line 3 prints it, and the semicolon keeps the next letter on the same line.' },
        { text: 'Because its lines are numbered 1, 2 and 3, below where programs start, the decoder can be typed into any program and will run first and read that program’s DATA. Load the program, type the three lines, and RUN. When you are done, type 1, 2 and 3 on their own to take the decoder out again.' },
      ],
      CW,
    ),
    MARGIN,
    y,
    W,
    340,
    3,
    GAP,
  );
  let ty = codeTable(ctx, MARGIN, y + 356, W);
  const lw = 520;
  const ly = miniListing(ctx, MARGIN, ty + 6, lw, DECODER, 'The decoder, with its RAINBOW CHECK.');
  screenBox(ctx, MARGIN + 12, ly + 20, lw - 24, [...EXAMPLE, 'RUN', EXAMPLE_MESSAGE, 'OK'], 'Fig. 1: The decoder at lines 1 to 3, one DATA line, and RUN.');
  const sx = MARGIN + lw + 30;
  const sw = W - lw - 30;
  ty += 6;
  sidebar(ctx, 'A Message For You', sx, ty, sw, 230);
  flow(
    ctx,
    rowsFor(ctx, [{ text: `Line ${MESSAGE_LINE} of this month’s SHUTDOWN (page ${pageNo('mayShutdown')}), the last of its DATA, is a message from all of us in this code. The game never reads that far. CLOAD "SHUTDOWN", type in the decoder, and RUN.`, before: 0, align: 'left' }], sw - 40),
    sx + 20,
    ty + 66,
    sw - 40,
    180,
  );
  ty += 246;
  sidebar(ctx, 'Send One Back', sx, ty, sw, BOTTOM - ty);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Write the numbers in DATA lines, 0 between words and -1 at the end. RUN it with the decoder, then CSAVE it: anyone with this magazine can read it.', before: 0, align: 'left' },
        { text: 'Counting letters is slow work. CODER, on this month’s tape, does it for you: type a message and it prints the DATA line to type in.', align: 'left' },
      ],
      sw - 40,
    ),
    sx + 20,
    ty + 66,
    sw - 40,
    BOTTOM - ty - 76,
  );
}

/** The May tape: what the magazine says is on it (the decoder is not: typing it into SHUTDOWN is the point). */
export const drawMayTape = (ctx: Ctx): void =>
  tapePage(
    ctx,
    [
      ['ABOUT', 'What is on the tape, and how to load it.'],
      ['SHUTDOWN', `Pull the plug (page ${pageNo('mayShutdown')}). Our message is in its DATA (page ${pageNo('maySecret')}).`],
      ['CODER', `Type a message, get it back in our code as a DATA line (page ${pageNo('maySecret')}).`],
      ['CHECKUP', `The Human Pledge’s three questions for your system (page ${pageNo('mayHealthy')}).`],
    ],
  );
