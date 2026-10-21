import { hashSeed, KESSLER, measure, wrap, write } from '../handwriting';
import type { AnyPageId } from './pages';
import { PAGE_W, rng, type Ctx } from './paper';

/**
 * The notes M. Kessler put in issue 1's box, in pencil, in their hand (the cassette label's): yellow sticky notes, the
 * usual 3 inch square at the magazine's scale (8½ inches across a page), each stuck to a page, so it is part of that
 * page's picture. They say what to do and never how (the book holds no hints): start (on the cover), play the adventure
 * to the end (on its words), check the copying (on GUESS's listing). Each is stuck where the page has room, so it hides
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
}

const SLIPS: Partial<Record<AnyPageId, Slip>> = {
  cover: {
    paras: ['For the machine in the basement. Be gentle with it, it is older than you.', 'Start at the front of the book. The tape after.', 'Burn this.'],
    signed: '- M.K.',
    // Over the barcode and the hills at the bottom left, clear of the cover lines and the castle.
    x: 14,
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
    paras: ['Check my typing against the book when you are done. I was never as acurate as I meant to be.'],
    x: 176,
    y: 956,
    angle: -0.016,
  },
};

const SIZE = 20;
/** Line spacing, in cap heights. */
const LEADING = 1.75;
const PAD = 26;
/** A 3 inch sticky note, at the page's scale. */
const NOTE = Math.round((PAGE_W / 8.5) * 3);
/** Its canary yellow. */
const STICKY = '#f8e670';

/** Draw the note stuck to page `id`, if there is one: over everything printed. */
export function drawSlip(ctx: Ctx, id: AnyPageId): void {
  const slip = SLIPS[id];
  if (!slip) return;
  const size = slip.size ?? SIZE;
  const leading = size * LEADING;
  const blocks = slip.paras.map((p) => wrap(p, size, NOTE - PAD * 2, KESSLER));
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
  ctx.lineTo(NOTE - 2 - FAR, 4);
  ctx.lineTo(NOTE + 4 - FAR, NOTE + 9);
  ctx.lineTo(4 - FAR, NOTE + 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = STICKY;
  ctx.fillRect(0, 0, NOTE, NOTE);
  // The paper's tooth, the glue band along the top a touch darker, and the curl below it turning away from the light.
  for (let i = 0; i < (NOTE * NOTE) / 160; i++) {
    ctx.fillStyle = `rgba(120, 100, 70, ${0.04 + r() * 0.06})`;
    ctx.fillRect(r() * NOTE, r() * NOTE, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  ctx.fillStyle = 'rgba(150, 120, 0, 0.07)';
  ctx.fillRect(0, 0, NOTE, NOTE * 0.17);
  const curl = ctx.createLinearGradient(0, NOTE * 0.55, 0, NOTE);
  curl.addColorStop(0, 'rgba(120, 90, 0, 0)');
  curl.addColorStop(1, 'rgba(120, 90, 0, 0.14)');
  ctx.fillStyle = curl;
  ctx.fillRect(0, NOTE * 0.55, NOTE, NOTE * 0.45);
  let y = PAD + size + NOTE * 0.06;
  blocks.forEach((block, b) => {
    for (const line of block) {
      write(ctx, line, PAD + (r() - 0.5) * 4, y, { size, seed: hashSeed(`${id}:${line}`), hand: KESSLER, mood: 0.04 });
      y += leading;
    }
    if (b < blocks.length - 1) y += leading * 0.4;
  });
  if (slip.signed) write(ctx, slip.signed, NOTE - PAD - measure(slip.signed, size, KESSLER), y, { size, seed: hashSeed(slip.signed), hand: KESSLER });
  ctx.restore();
}
