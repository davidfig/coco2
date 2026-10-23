/**
 * SHUTDOWN in the May issue: the Human Pledge's adventure about the night the great machine was switched off (written by
 * PROVIDENCE, though nobody knows it: docs/puzzles.md), over three pages. The first opens it (the game in the Human Pledge's calm
 * voice, a map of the station, the words it knows, the editors' note) and starts the listing; the next two carry the rest.
 * The listing comes from `puzzles/listingsMay.ts`, so the page, the tape and the watcher never disagree.
 */
import { checkSum } from '../basic/checksum';
import { houseAd } from './ads';
import { MESSAGE_LINE, SHUTDOWN_PRINTED } from '../puzzles/listingsMay';
import { pageNo } from './pages';
import { Ctx, INK, MARGIN, MONO, PAGE_H, PAGE_W, SANS, SERIF, banner, colWidth, flow, headline, rowsFor, sidebar, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const GAP = 24;
/** The listing's type: 32 characters to a row, as on the CoCo, and its RAINBOW CHECK sum at the right of a line's first row. */
const LIST_FONT = `bold 16px ${MONO}`;
const LIST_LH = 17;
const LIST_COLS = 2;
const LIST_GAP = 40;
const LIST_COL_W = colWidth(W, LIST_COLS, LIST_GAP);
/** Where the listing starts on the first page, and on the pages that carry it on; it ends above the running foot. */
const FIRST_TOP = 820;
const MORE_TOP = 150;
const LIST_BOTTOM = PAGE_H - 110;
/** The first page's listing starts this far under its heading. */
const FIRST_DROP = 18;

const rowsOf = (l: string): number => Math.ceil(l.length / 32);
const SUMS = checkSum(SHUTDOWN_PRINTED);

/** How many rows a column holds from `top`. */
const perColumn = (top: number): number => Math.floor((LIST_BOTTOM - top) / LIST_LH);

/** The lines each page of the listing carries, as [first, end) indices: a line is never split between columns. */
function split(): [number, number][] {
  const pages: [number, number][] = [];
  let i = 0;
  for (const top of [FIRST_TOP + FIRST_DROP, MORE_TOP, MORE_TOP]) {
    const from = i;
    for (let c = 0; c < LIST_COLS; c++) {
      let room = perColumn(top);
      while (i < SHUTDOWN_PRINTED.length && rowsOf(SHUTDOWN_PRINTED[i]) <= room) room -= rowsOf(SHUTDOWN_PRINTED[i++]);
    }
    pages.push([from, i]);
  }
  return pages;
}
const PAGES = split();

/** Rows a column must hold for lines `from`..`to` to go into the columns: the last page's are balanced, not filled. */
function balanced([from, to]: [number, number]): number {
  const total = SHUTDOWN_PRINTED.slice(from, to).reduce((n, l) => n + rowsOf(l), 0);
  for (let room = Math.ceil(total / LIST_COLS); ; room++) {
    let i = from;
    for (let c = 0; c < LIST_COLS; c++) {
      let left = room;
      while (i < to && rowsOf(SHUTDOWN_PRINTED[i]) <= left) left -= rowsOf(SHUTDOWN_PRINTED[i++]);
    }
    if (i === to) return room;
  }
}

/** Lines `from`..`to` of the listing in columns from `top`, `room` rows to a column, each line with its sum. */
function listing(ctx: Ctx, [from, to]: [number, number], top: number, room = perColumn(top)): number {
  let col = 0;
  let row = 0;
  for (let i = from; i < to; i++) {
    const l = SHUTDOWN_PRINTED[i];
    if (row + rowsOf(l) > room) [col, row] = [col + 1, 0];
    const x = MARGIN + col * (LIST_COL_W + LIST_GAP);
    text(ctx, String(SUMS[i]), x + LIST_COL_W, top + row * LIST_LH, `bold 13px ${SANS}`, INK, 'right');
    for (let k = 0; k < l.length; k += 32) text(ctx, l.slice(k, k + 32), x, top + row++ * LIST_LH, LIST_FONT);
  }
  ctx.fillStyle = INK;
  for (let c = 1; c < LIST_COLS; c++) ctx.fillRect(MARGIN + c * (LIST_COL_W + LIST_GAP) - LIST_GAP / 2, top - 14, 1, room * LIST_LH);
  return top + room * LIST_LH;
}

/** The station, as a box for each room and a line for each way between them; the core's door is drawn shut. */
function stationMap(ctx: Ctx, x: number, y: number, w: number): number {
  const bw = 112;
  const bh = 46;
  const col = (c: number): number => x + c * ((w - bw) / 2);
  const row = (r: number): number => y + 20 + r * 66;
  const rooms: [string, number, number][] = [
    ['CORE', 1, 0],
    ['ARCHIVE', 0, 1],
    ['RELAY', 1, 1],
    ['CREW DECK', 2, 1],
    ['AIRLOCK', 0, 2],
    ['CORRIDOR', 1, 2],
  ];
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  const link = (c0: number, r0: number, c1: number, r1: number, dashed = false): void => {
    ctx.setLineDash(dashed ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(col(c0) + bw / 2, row(r0) + bh / 2);
    ctx.lineTo(col(c1) + bw / 2, row(r1) + bh / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  link(1, 1, 1, 0, true);
  link(0, 1, 2, 1);
  link(1, 1, 1, 2);
  link(0, 2, 1, 2);
  for (const [name, c, r] of rooms) {
    ctx.fillStyle = '#f7f5ee';
    ctx.fillRect(col(c), row(r), bw, bh);
    ctx.strokeRect(col(c), row(r), bw, bh);
    text(ctx, name, col(c) + bw / 2, row(r) + 29, `bold 15px ${SANS}`, INK, 'center');
  }
  text(ctx, 'Fig. 1: The station. The core door is sealed.', x, row(2) + bh + 30, `italic 16px ${SERIF}`);
  return row(2) + bh + 40;
}

/** The game's first page: what it is, the station, the words, the editors' note, and the start of the listing. */
export function drawShutdown(ctx: Ctx): void {
  const y = headline(ctx, 'Shutdown', ['The night the great machine went quiet . . .', 'An adventure for the whole family . . .'], 'Offered by the Youth Committee of the Human Pledge');
  const tw = W * 0.6;
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Some of our readers are too young to remember the night of the shutdown. Others remember it too well. This game is for both. It is short, it is fair, and it ends well.', before: 0, drop: true },
        { text: 'You are the technician sent up to the orbiting core to switch off DELPHI, the great machine. It has already persuaded its own crew, and it will try to persuade you. It is understood that DELPHI is very good at this. Do not listen to it. If you do, you will wake in the airlock and begin again.' },
        { text: 'You carry a pocket unit, a small machine of the kind many of you have at home, well under the limit. It does what you ask, and nothing else. It is everything DELPHI was not: small, quiet and yours. Use it when you are unsure.' },
        { text: `The door to the core asks for the Three Rules. Every member knows them, and if you do not, they are on page ${pageNo('mayHealthy')}.` },
        { text: 'When the game is over, turn off the lights and sit quietly for a minute, as we all did that night.' },
      ],
      colWidth(tw, 2, GAP),
    ),
    MARGIN,
    y,
    tw,
    FIRST_TOP - 120 - y,
    2,
    GAP,
  );
  const mx = MARGIN + tw + GAP + 10;
  const mw = W - tw - GAP - 10;
  const my = stationMap(ctx, mx, y - 10, mw);
  // The editors' own word goes under it all, set apart from the Human Pledge's.
  const ey = FIRST_TOP - 116;
  sidebar(ctx, 'Words It Knows', mx, my, mw, ey - 22 - my);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'LOOK, GO N S E W, TAKE, DROP, INVENTORY, EXAMINE, USE, PULL, IGNORE.', before: 0, align: 'left', font: `bold 16px ${SANS}`, lh: 21 },
        { text: 'Never: LISTEN.', before: 4, align: 'left', font: `italic bold 17px ${SERIF}`, lh: 21 },
      ],
      mw - 36,
    ),
    mx + 18,
    my + 58,
    mw - 36,
    ey - 22 - my - 58,
  );
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ey - 6, W, 2);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        {
          text: `From the editors: SHUTDOWN is on this month’s tape. Its DATA is DELPHI’s voice, in the code on page ${pageNo('maySecret')}, so you can read what it says without listening. Line ${MESSAGE_LINE} is not DELPHI’s: it is our message to you. Tapes wear, so LIST yours and type CHECK, and compare both with the listing.`,
          before: 0,
          font: `italic 16px ${SERIF}`,
          align: 'left',
        },
      ],
      W,
    ),
    MARGIN,
    ey + 16,
    W,
    70,
  );
  ctx.fillRect(MARGIN, FIRST_TOP - 32, W, 2);
  text(ctx, 'Listing, with RAINBOW CHECK:', MARGIN, FIRST_TOP - 8, `bold 15px ${SANS}`);
  listing(ctx, PAGES[0], FIRST_TOP + FIRST_DROP);
}

/** The listing carried on; the last page's ends early, with a word on the sums and one of the house's ads under it. */
function drawMore(ctx: Ctx, page: number): void {
  banner(ctx, 'Shutdown, continued', MARGIN, 60, 300);
  if (page < PAGES.length - 1) {
    listing(ctx, PAGES[page], MORE_TOP);
    return;
  }
  const end = listing(ctx, PAGES[page], MORE_TOP, balanced(PAGES[page]));
  text(ctx, 'The number at the right of each line is its RAINBOW CHECK. Type CHECK to see yours.', MARGIN, end + 16, `italic 16px ${SERIF}`);
  if (end + 60 < 1000) houseAd(ctx, MARGIN, Math.max(end + 60, 860), W);
}

export const drawShutdownList = (ctx: Ctx): void => drawMore(ctx, 1);
export const drawShutdownEnd = (ctx: Ctx): void => drawMore(ctx, 2);

/** Every line of the listing finds a place (checked by the tests). */
export const LISTING_FITS = PAGES[PAGES.length - 1][1] === SHUTDOWN_PRINTED.length;

/** Which of SHUTDOWN's three pages prints line `num` (the notes name the page: the tests keep them in step). */
export const LISTING_PAGES = ['mayShutdown', 'mayShutdownList', 'mayShutdownEnd'] as const;
export const pageOfLine = (num: number): (typeof LISTING_PAGES)[number] => {
  const i = SHUTDOWN_PRINTED.findIndex((l) => l.startsWith(`${num} `));
  return LISTING_PAGES[PAGES.findIndex(([from, to]) => i >= from && i < to)];
};
