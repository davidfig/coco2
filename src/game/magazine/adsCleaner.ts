import { Ctx, HEAVY, INK, MARGIN, MONO, PAGE_H, PAGE_W, PAPER, SANS, SERIF, colWidth, flow, rowsFor, text } from './paper';

const W = PAGE_W - MARGIN * 2;
const TAU = Math.PI * 2;

/** A spiky seal with a line or two of white type in it, as the mail-order ads stamp their promises. */
export function burst(ctx: Ctx, cx: number, cy: number, r: number, lines: string[]): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const k = i % 2 ? 0.8 : 1;
    ctx.lineTo(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k);
  }
  ctx.fill();
  lines.forEach((s, i) => text(ctx, s, cx, cy + 7 + (i - (lines.length - 1) / 2) * 21, `bold 18px ${SANS}`, PAPER, 'center'));
}

/** A photograph of the screen, before and after: white characters on a black field, as a halftone of a TV prints. */
function screenShot(ctx: Ctx, x: number, y: number, w: number, label: string, lines: string[]): number {
  const h = 28 + lines.length * 26;
  text(ctx, label, x, y - 10, `bold 17px ${SANS}`);
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, h);
  lines.forEach((s, i) => text(ctx, s, x + 16, y + 36 + i * 26, `bold 20px ${MONO}`, PAPER));
  return y + h;
}

/** A blank to fill in on the coupon: a label and a ruled line to the end of its run. */
export function blank(ctx: Ctx, label: string, x: number, y: number, w: number): void {
  const lw = text(ctx, label, x, y, `15px ${SANS}`);
  ctx.fillStyle = INK;
  ctx.fillRect(x + lw + 8, y + 2, w - lw - 8, 1.5);
}

/**
 * HEAD CASE: a full-page mail-order ad for a tape head cleaning kit, all type and rules, in the manner of the
 * small-company ads that filled the middle of the magazine. It winks at the story (tapes that load what was never on them).
 */
export function drawCleanerAd(ctx: Ctx): void {
  const top = 72;
  const bottom = PAGE_H - 96;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(MARGIN, top, W, bottom - top);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(MARGIN + 9, top + 9, W - 18, bottom - top - 18);

  text(ctx, 'IS YOUR TAPE', PAGE_W / 2, top + 100, `72px ${HEAVY}`, INK, 'center');
  text(ctx, 'TALKING BACK?', PAGE_W / 2, top + 182, `72px ${HEAVY}`, INK, 'center');
  text(ctx, 'Lines you never typed. Files that will not load. A recorder that hums to itself.', PAGE_W / 2, top + 226, `italic 21px ${SERIF}`, INK, 'center');
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN + 30, top + 248, W - 60, 3);

  // Left: the pitch. Right: the screen before and after.
  const inner = W - 60;
  const cw = colWidth(inner, 2, 36);
  const lx = MARGIN + 30;
  const rx = lx + cw + 36;
  const cy = top + 280;
  const para = (t: string) => ({ text: t, font: `17px ${SERIF}`, lh: 21 });
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        para('It is not your fault, and it is not your computer. Every time a cassette passes the heads of your recorder it leaves a little of itself behind: oxide, dust, and the odd hair from the family dog.'),
        para('A dirty head reads what it likes. The program you saved on Sunday is not quite the program you load on Monday. Sometimes it is not the program at all.'),
        para('Five minutes with HEAD CASE and your recorder reads every bit the way it was written. Your CLOADs will load. Your CSAVEs will save. Your tapes will say only what is on them.'),
      ],
      cw,
    ),
    lx,
    cy,
    cw,
    300,
  );
  const sy = screenShot(ctx, rx, cy + 22, cw, 'BEFORE:', ['CLOAD "ADVENT"', '?IO ERROR', 'OK']);
  screenShot(ctx, rx, sy + 44, cw, 'AFTER:', ['CLOAD "ADVENT"', 'F ADVENT', 'OK']);

  // The product and what comes in the box; the price beside it.
  const py = cy + 310;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN + 30, py, W - 60, 3);
  text(ctx, 'HEAD CASE', lx, py + 62, `54px ${HEAVY}`);
  text(ctx, 'TAPE HEAD CLEANING KIT', lx + 4, py + 92, `bold 20px ${SANS}`);
  const kit = ['40 lint-free swabs', 'Genuine head-cleaning fluid (do not drink)', 'Demagnetizer wand, battery not included', 'Instructions in plain English'];
  kit.forEach((s, i) => text(ctx, `•  ${s}`, lx + 4, py + 128 + i * 26, `17px ${SERIF}`));
  const px = rx + cw / 2 - 70;
  text(ctx, 'ONLY', px, py + 50, `bold 22px ${SANS}`, INK, 'center');
  text(ctx, '$9.95', px, py + 132, `92px ${HEAVY}`, INK, 'center');
  text(ctx, 'plus $1.50 postage & handling', px, py + 164, `italic 16px ${SERIF}`, INK, 'center');
  burst(ctx, PAGE_W - MARGIN - 82, py + 64, 60, ['MONEY', 'BACK!']);

  // What the readers say, across the page.
  const qy = py + 236;
  ctx.fillRect(MARGIN + 30, qy - 22, W - 60, 1.5);
  const quotes: [string, string][] = [
    ['My tapes load the first time now. Most of the time.', 'R.T., Tulsa, OK'],
    ['It cleaned the heads, the capstan and, for some reason, my glasses.', 'L.M., Fresno, CA'],
    ['The voices stopped.', 'Name withheld'],
  ];
  const qw = colWidth(inner, 3, 30);
  quotes.forEach(([q, who], i) =>
    flow(
      ctx,
      rowsFor(
        ctx,
        [
          { text: `\u201C${q}\u201D`, font: `italic 18px ${SERIF}`, lh: 22, align: 'left', before: 0 },
          { text: `\u2014 ${who}`, font: `bold 14px ${SANS}`, lh: 18, align: 'right', before: 4 },
        ],
        qw,
      ),
      lx + i * (qw + 30),
      qy,
      qw,
      110,
    ),
  );

  // The coupon, to cut out along the dashes.
  const cpY = bottom - 200;
  const cpX = MARGIN + 30;
  const cpW = W - 60;
  ctx.setLineDash([10, 7]);
  ctx.lineWidth = 2;
  ctx.strokeRect(cpX, cpY, cpW, 172);
  ctx.setLineDash([]);
  text(ctx, 'YES! Send me ____ HEAD CASE kits at $9.95 each, plus $1.50 postage. Check or money order, no cash.', cpX + 20, cpY + 34, `bold 15px ${SANS}`);
  blank(ctx, 'NAME', cpX + 20, cpY + 70, cpW - 40);
  blank(ctx, 'ADDRESS', cpX + 20, cpY + 102, cpW - 40);
  blank(ctx, 'CITY', cpX + 20, cpY + 134, cpW * 0.5);
  blank(ctx, 'STATE', cpX + cpW * 0.5 + 40, cpY + 134, cpW * 0.2);
  blank(ctx, 'ZIP', cpX + cpW * 0.7 + 60, cpY + 134, cpW * 0.3 - 80);
  text(ctx, 'MAGNA-KLEEN PRODUCTS • DEPT. R3 • 2210 INDUSTRIAL PKWY. • JOPLIN, MO 64801 • Allow 4 to 6 weeks', cpX + cpW / 2, cpY + 160, `bold 11px ${SANS}`, INK, 'center');
}
