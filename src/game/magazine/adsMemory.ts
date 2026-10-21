import { blank, burst } from './adsCleaner';
import { Ctx, HEAVY, INK, MARGIN, MONO, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;

/** The upgrade against the stock machine, row by row: what is measured, 16K, 64K. */
const COMPARE: readonly [string, string, string][] = [
  ['PRINT MEM, after NEW', '14,000', '30,000*'],
  ['Lines of BASIC it will hold', 'about 400', 'about 900*'],
  ['Adventures that fit', 'small ones', 'all of them'],
  ['Allowed under the Act', 'YES', 'YES'],
];

/**
 * SMALL WONDER: a full-page mail-order ad for a 64K memory upgrade, all type and rules like HEAD CASE but a different
 * shop. It nods to the Small Systems Act (the editorial says a 64K CoCo is well inside it) and to memory that holds
 * more than BASIC can see.
 */
export function drawMemoryAd(ctx: Ctx): void {
  const top = 72;
  const bottom = PAGE_H - 96;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, top, W, 190);
  text(ctx, 'THINK BIG.', PAGE_W / 2, top + 84, `76px ${HEAVY}`, '#f7f5ee', 'center');
  text(ctx, 'STAY SMALL.', PAGE_W / 2, top + 166, `76px ${HEAVY}`, '#f7f5ee', 'center');
  text(ctx, 'Four times the memory. Not one byte over the line.', PAGE_W / 2, top + 232, `italic 24px ${SERIF}`, INK, 'center');

  const inner = W - 40;
  const cw = colWidth(inner, 2, 40);
  const lx = MARGIN + 20;
  const rx = lx + cw + 40;
  const cy = top + 276;
  const para = (t: string) => ({ text: t, font: `17px ${SERIF}`, lh: 21 });
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        para('Your 16K CoCo is a fine machine with a short memory. Type in a long program and it runs out of room halfway. Load a big adventure and it says ?OM ERROR, and that is that.'),
        para('SMALL WONDER puts 64K inside the case you already own. Eight chips, one evening, no soldering. Close the lid and your CoCo remembers four times as much, and it never forgets a line until you tell it to.'),
        para('And relax: a 64K Color Computer is a small system, well inside the Small Systems Act. Every SMALL WONDER is tested and sealed at our plant and comes with its certificate. Keep it with your receipt.'),
      ],
      cw,
    ),
    lx,
    cy,
    cw,
    360,
  );

  // Right: the comparison table.
  text(ctx, 'THE DIFFERENCE', rx, cy + 14, `bold 20px ${SANS}`);
  let ty = cy + 30;
  ctx.fillRect(rx, ty, cw, 3);
  const c1 = rx + cw - 150;
  const c2 = rx + cw - 10;
  text(ctx, '16K', c1, ty + 28, `bold 17px ${SANS}`, INK, 'right');
  text(ctx, '64K', c2, ty + 28, `bold 17px ${SANS}`, INK, 'right');
  ty += 40;
  for (const [what, a, b] of COMPARE) {
    ctx.fillRect(rx, ty, cw, 1);
    flow(ctx, rowsFor(ctx, [{ text: what, font: `16px ${SERIF}`, lh: 19, align: 'left', before: 0 }], cw - 250), rx, ty + 8, cw - 250, 44);
    text(ctx, a, c1, ty + 26, `bold 17px ${MONO}`, INK, 'right');
    text(ctx, b, c2, ty + 26, `bold 17px ${MONO}`, INK, 'right');
    ty += 52;
  }
  ctx.fillRect(rx, ty, cw, 3);
  flow(
    ctx,
    rowsFor(ctx, [{ text: '* Color BASIC sees 32K of it. The rest is there all the same, quietly waiting for programs that know how to ask.', font: `italic 14px ${SERIF}`, lh: 17, align: 'left', before: 0 }], cw),
    rx,
    ty + 22,
    cw,
    60,
  );

  // The product, the price, the seal.
  const py = cy + 350;
  ctx.fillRect(MARGIN + 20, py, W - 40, 3);
  text(ctx, 'SMALL WONDER', lx, py + 58, `40px ${HEAVY}`);
  text(ctx, '64K MEMORY UPGRADE FOR THE COLOR COMPUTER', lx + 2, py + 88, `bold 15px ${SANS}`);
  const kit = ['Eight 4164 memory chips, tested', 'Chip puller and grounding strap', 'Step-by-step booklet with photos', 'Small Systems certificate'];
  kit.forEach((s, i) => text(ctx, `•  ${s}`, lx + 4, py + 128 + i * 26, `17px ${SERIF}`));
  const px = rx + (cw - 130) / 2;
  text(ctx, 'ONLY', px, py + 50, `bold 22px ${SANS}`, INK, 'center');
  text(ctx, '$39.95', px, py + 132, `70px ${HEAVY}`, INK, 'center');
  text(ctx, 'plus $2.00 postage & handling', px, py + 164, `italic 16px ${SERIF}`, INK, 'center');
  burst(ctx, PAGE_W - MARGIN - 70, py + 80, 56, ['ACT', 'SAFE!']);

  // What the readers say.
  const qy = py + 236;
  ctx.fillRect(MARGIN + 20, qy - 22, W - 40, 1.5);
  const quotes: [string, string][] = [
    ['I typed in every listing from last year and it is still asking for more.', 'D.K., Erie, PA'],
    ['Twenty minutes, and I only dropped one chip.', 'J.S., Macon, GA'],
    ['It remembers things I never told it.', 'Name withheld'],
  ];
  const qw = colWidth(inner, 3, 30);
  quotes.forEach(([q, who], i) =>
    flow(
      ctx,
      rowsFor(
        ctx,
        [
          { text: `“${q}”`, font: `italic 18px ${SERIF}`, lh: 22, align: 'left', before: 0 },
          { text: `— ${who}`, font: `bold 14px ${SANS}`, lh: 18, align: 'right', before: 4 },
        ],
        qw,
      ),
      lx + i * (qw + 30),
      qy,
      qw,
      110,
    ),
  );

  // The order form: a plain ruled box, no dashes (this shop takes phone orders too).
  const cpY = bottom - 190;
  const cpX = MARGIN + 20;
  const cpW = W - 40;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(cpX, cpY, cpW, 170);
  text(ctx, 'RUSH me ____ SMALL WONDER kits at $39.95, plus $2.00 postage. Specify CoCo 1 or CoCo 2: ______', cpX + 20, cpY + 34, `bold 15px ${SANS}`);
  blank(ctx, 'NAME', cpX + 20, cpY + 70, cpW - 40);
  blank(ctx, 'ADDRESS', cpX + 20, cpY + 102, cpW - 40);
  blank(ctx, 'CITY / STATE / ZIP', cpX + 20, cpY + 134, cpW - 40);
  text(ctx, 'BYTEWISE MEMORY CO. • BOX 1640 • LUBBOCK, TX 79408 • Phone orders (806) 555-0164 • Texas residents add sales tax', cpX + cpW / 2, cpY + 160, `bold 11px ${SANS}`, INK, 'center');
}
