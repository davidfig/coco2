import { setType } from './adsMail';
import { paintify } from './coverPaint';
import { lakeScene } from './mayLake';
import { Ctx, HEAVY, MARGIN, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

// May's inside front cover: Chip Munk International's new game, THE ONE THAT GOT AWAY, a painting across the top of the
// page and the copy on dark green under it. A fishing game about something old, patient and never caught, hiding in deep
// water until somebody comes looking (read it twice), and a lake made smaller to fit the new limit.

const PAINT = { x: 0, y: 0, w: PAGE_W, h: 760 };
const GROUND = '#0f2629';
const CREAM = '#f3ecd8';
const GOLD = '#f2c75a';

/** A game's name stripped in over its painting, with a dark drop shadow so it reads over the sky. */
function logo(ctx: Ctx, s: string, x: number, y: number, size: number, color: string): void {
  text(ctx, s, x + 4, y + 4, `${size}px ${HEAVY}`, 'rgba(5,10,25,0.7)', 'center');
  text(ctx, s, x, y, `${size}px ${HEAVY}`, color, 'center');
}

/** Chip Munk International's mark: a white globe with a blue orbit, and the name beside it. */
function publisher(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 30, y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2f6fc4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x + 30, y, 28, 11, 0.5, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, 'Published by', x + 72, y - 16, `italic 13px ${SANS}`, CREAM);
  text(ctx, 'Chip Munk', x + 72, y + 14, `italic bold 36px ${SERIF}`, CREAM);
  text(ctx, 'INTERNATIONAL', x + 72, y + 31, `bold 12px ${SANS}`, CREAM);
}

/** May's inside front cover. */
export function drawMayInsideFront(ctx: Ctx): void {
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  lakeScene(ctx, PAINT);
  paintify(ctx, PAINT);
  paintify(ctx, undefined, true);

  logo(ctx, 'THE ONE', 760, 120, 72, '#ffffff');
  logo(ctx, 'THAT GOT AWAY', 760, 186, 52, GOLD);
  text(ctx, 'SOME SAY IT WAS NEVER CAUGHT . . .', MARGIN, PAINT.h - 30, `bold 30px ${SANS}`, '#ffffff');

  const top = PAINT.h + 40;
  const lw = 590;
  const items = [
    { text: 'by Chip Munk', font: `italic 16px ${SANS}`, color: GOLD },
    { text: 'CoCo version by Ellie Brandt', font: `italic 16px ${SANS}`, color: GOLD },
    { text: '. . . and some say it was never there. Old Hank at the bait shop says it has been down in the deep water all along, under the drowned stumps, older than anybody remembers, waiting for someone patient enough to drop a line.' },
    { text: 'THE ONE THAT GOT AWAY is a fishing adventure for the Color Computer. Pick your lure, row out before the mist lifts, and learn to read the water. Pike, perch, crappie and sunfish, and one bass that nobody has ever landed. Will you? Should you?' },
    { text: 'NEW THIS YEAR: to fit inside the new limit, the lake is twenty percent smaller. The fish is not.', color: GOLD },
    { text: 'THE ONE THAT GOT AWAY . . . a patient game for 1 player (and one fish).', font: `italic 18px ${SERIF}` },
  ];
  flow(
    ctx,
    rowsFor(ctx, items.map((t, i) => ({ text: t.text, font: t.font ?? `17px ${SERIF}`, lh: 22, align: 'left' as const, before: i === 1 ? 0 : i ? 10 : 0, color: t.color ?? CREAM })), colWidth(lw, 2, 28)),
    MARGIN,
    top,
    lw,
    330,
    2,
    28,
  );

  // Right: the prices, then a small box for last year's game, shrunk to fit.
  const rx = MARGIN + lw + 34;
  const rw = PAGE_W - MARGIN - rx;
  text(ctx, 'THE ONE THAT GOT AWAY', rx, top + 14, `bold 14px ${SANS}`, CREAM);
  text(ctx, 'CoCo 16K TAPE . . . . . . . . $19.95', rx, top + 36, `14px ${SANS}`, CREAM);
  text(ctx, 'CoCo 32K DISK . . . . . . . . $24.95', rx, top + 56, `14px ${SANS}`, CREAM);
  text(ctx, '(one drive, as the law now asks)', rx, top + 74, `italic 13px ${SERIF}`, CREAM);
  const by = top + 110;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, by, rw, 196);
  text(ctx, 'ALSO FROM CHIP MUNK', rx + rw / 2, by + 30, `bold 13px ${SANS}`, GOLD, 'center');
  setType(ctx, 'SPACE GOBBLER', rx + rw / 2, by + 64, `30px ${HEAVY}`, '#ffffff', 'center', 1, rw - 24);
  text(ctx, '4K EDITION', rx + rw / 2, by + 94, `22px ${HEAVY}`, GOLD, 'center');
  flow(
    ctx,
    rowsFor(ctx, [{ text: 'Now inside any limit. Fewer ghosts, smaller maze, same appetite. Only $9.95, and it fits in your pocket calculator.', font: `italic 15px ${SERIF}`, lh: 19, align: 'center', before: 0, color: CREAM }], rw - 30),
    rx + 15,
    by + 116,
    rw - 30,
    76,
  );

  ctx.fillStyle = GOLD;
  ctx.fillRect(MARGIN, PAGE_H - 140, PAGE_W - MARGIN * 2, 2);
  publisher(ctx, MARGIN, PAGE_H - 84);
  text(ctx, 'If your dealer does not have it, it got away.', PAGE_W - MARGIN, PAGE_H - 92, `13px ${SANS}`, CREAM, 'right');
  text(ctx, 'Ask again, and be patient.', PAGE_W - MARGIN, PAGE_H - 72, `13px ${SANS}`, CREAM, 'right');
}
