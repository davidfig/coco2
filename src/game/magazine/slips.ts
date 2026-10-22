import { hashSeed, KESSLER, measure, wrap, write } from '../handwriting';
import type { AnyPageId } from './pages';
import { PAGE_W, rng, type Ctx } from './paper';

/**
 * The notes M. Kessler put in each box, in pencil, in their hand (the cassette label's): yellow sticky notes, mostly the
 * usual 3 inch square at the magazine's scale (8½ inches across a page), a smaller one from another pad where a page
 * has less room, each stuck to a page, so it is part of that page's picture. They say what to do and never how (the
 * magazine holds no hints). March's: start (on the cover), play the adventure to the end (on its words), check the copying
 * (on GUESS's listing). May's say a little more about Kessler: the box was harder to find, the copying was checked this time (so
 * what doesn't match the magazine wasn't Kessler), the tape holds two programs and no more (ORACLE wasn't Kessler either),
 * the Clear Mind came to their club, and Grandpa knew why it ended. Each is stuck where the page has room, so it hides
 * nothing the player needs, and none quite square with it (a degree or two off, each its own way). Kessler spells the
 * hard words by ear (`KESSLER`, hands.ts): the notes are written as Kessler wrote them. See docs/story.md, the boxes on
 * the step.
 */
interface Slip {
  /** Paragraphs; the last is signed off at the right when `signed`. */
  paras: string[];
  signed?: string;
  /** Top-left corner on the page, and the turn it is stuck at. */
  x: number;
  y: number;
  angle: number;
  /** The cap height of the writing, if not `SIZE` (smaller where there is more to say). */
  size?: number;
  /** Its width and height in inches, if not the 3 inch square. */
  inches?: [number, number];
}

const SLIPS: Partial<Record<AnyPageId, Slip>> = {
  cover: {
    paras: ['For the machine in the basement. Be gentle with it, it is older than you.', 'Start at the front of the magazine. The tape after.', 'Burn this.'],
    signed: '- M.K.',
    // Over the barcode and the hills at the bottom left, clear of the cover lines and the castle. In from the spine edge
    // far enough that the bottom-left corner, swung left by the turn, and its shadow stay on the page.
    x: 42,
    y: 936,
    angle: 0.03,
    size: 18,
  },
  // Beside the adventure's words (the tape page sends the player here to play it), right of the headline, above the table.
  words: {
    paras: ['Play the adventure all the way through, past the locked door.', 'Anything wrong on the tape is my mistake. Fix it and go on.'],
    x: 588,
    y: 99,
    angle: -0.02,
  },
  // Under the listing, beside its short last line (150 END) and clear of the one above, down to the page's bottom edge:
  // the only place on the page a whole note fits without hiding the listing or the CHECK table.
  guess: {
    paras: ['Check my typing against the magazine when you are done. I was never as acurate as I meant to be.'],
    x: 176,
    y: 956,
    angle: -0.016,
  },
  // May. On the cover, in the sky under the sun, clear of the cover lines above and below and of the bottle.
  mayCover: {
    paras: ['This one was harder to find. The magazine first again, then the tape.', 'Did you burn the others?'],
    signed: '- M.K.',
    x: 58,
    y: 618,
    angle: -0.03,
    size: 18,
  },
  // In the feature's empty corner under its last paragraph, above the two boxes (the signs it is pointing at).
  mayHealthy: {
    paras: ['If yours does any of these, do not call them.'],
    x: 548,
    y: 694,
    angle: 0.022,
    inches: [3, 1.3],
  },
  // Over the house ad at the foot of the listing's last page, clear of the listing (lines 710 and 990 must show).
  mayShutdownEnd: {
    paras: ['I checked this one against the magazine twice, every line.', 'If something does not match, I did not put it there.'],
    x: 612,
    y: 930,
    angle: -0.018,
  },
  // Under the tape page's tables, left of the folio: what Kessler put on the tape, which isn't all that is on it.
  mayTape: {
    paras: ['ABOUT and SHUTDOWN. That is all I put on it.'],
    x: 130,
    y: 1136,
    angle: 0.014,
    inches: [3, 1.4],
  },
  // On the meetings table's last rows, at the right (the Elder's row at the top and the Line underneath stay clear).
  mayClearMind: {
    paras: ['They came to our club with tea and pamflets. By the summer there was no club.', 'Your grandfather knew why.'],
    x: 676,
    y: 752,
    angle: 0.026,
    size: 17,
    inches: [2.5, 2.5],
  },
};

const SIZE = 20;
/** Line spacing, in cap heights. */
const LEADING = 1.75;
const PAD = 26;
/** An inch at the page's scale. */
const INCH = PAGE_W / 8.5;
/** Its canary yellow. */
const STICKY = '#f8e670';

/** Draw the note stuck to page `id`, if there is one: over everything printed. */
export function drawSlip(ctx: Ctx, id: AnyPageId): void {
  const slip = SLIPS[id];
  if (!slip) return;
  const size = slip.size ?? SIZE;
  const leading = size * LEADING;
  const [W, H] = (slip.inches ?? [3, 3]).map((n) => Math.round(n * INCH));
  const blocks = slip.paras.map((p) => wrap(p, size, W - PAD * 2, KESSLER));
  const r = rng(hashSeed(id));
  ctx.save();
  ctx.translate(slip.x, slip.y);
  ctx.rotate(slip.angle);
  // Held flat along its glued top, the rest lifting off the page in a curl: the shadow is tight at the top and spreads
  // toward the bottom. (The shape is drawn far off and only its blurred shadow thrown back here: `filter` isn't everywhere.)
  const FAR = 4000;
  ctx.save();
  ctx.shadowColor = 'rgba(40, 30, 0, 0.34)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = FAR * Math.cos(slip.angle);
  ctx.shadowOffsetY = FAR * Math.sin(slip.angle);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(2 - FAR, 4);
  ctx.lineTo(W - 2 - FAR, 4);
  ctx.lineTo(W + 4 - FAR, H + 9);
  ctx.lineTo(4 - FAR, H + 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = STICKY;
  ctx.fillRect(0, 0, W, H);
  // The paper's tooth, the glue band along the top a touch darker (the same depth on any pad), and the curl below it
  // turning away from the light.
  for (let i = 0; i < (W * H) / 160; i++) {
    ctx.fillStyle = `rgba(120, 100, 70, ${0.04 + r() * 0.06})`;
    ctx.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  const glue = Math.round(INCH * 0.5);
  ctx.fillStyle = 'rgba(150, 120, 0, 0.07)';
  ctx.fillRect(0, 0, W, glue);
  const curl = ctx.createLinearGradient(0, H * 0.55, 0, H);
  curl.addColorStop(0, 'rgba(120, 90, 0, 0)');
  curl.addColorStop(1, 'rgba(120, 90, 0, 0.14)');
  ctx.fillStyle = curl;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
  let y = PAD + size + INCH * 0.18;
  blocks.forEach((block, b) => {
    for (const line of block) {
      write(ctx, line, PAD + (r() - 0.5) * 4, y, { size, seed: hashSeed(`${id}:${line}`), hand: KESSLER, mood: 0.04 });
      y += leading;
    }
    if (b < blocks.length - 1) y += leading * 0.4;
  });
  if (slip.signed) write(ctx, slip.signed, W - PAD - measure(slip.signed, size, KESSLER), y, { size, seed: hashSeed(slip.signed), hand: KESSLER });
  ctx.restore();
}
