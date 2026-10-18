import { hashSeed, measure, parse, scrawl, sketch, write } from '../handwriting';
import type { Ctx } from './paper';

/**
 * The player's own map of ADVENT, drawn in their blue ballpoint (the notebook's hand) on the map page's graph paper, so the
 * player starts with it filled in. It must agree with `tapes/advent.bas`: the rooms, their exits, and above all where the
 * four clue rooms sit, since the lock's plate says to read their numbers off this map as you would read a page (top row
 * left to right, then the next row down): tower, chapel, gallery, cellar.
 */

/** A room: its name and what was noted in it, at a column and row of the map (north is up). */
interface Room {
  name: string;
  note?: string;
  col: number;
  row: number;
}

const ROOMS: Record<string, Room> = {
  tower: { name: 'tower', note: 'big clock', col: 0, row: 0 },
  vault: { name: '?', col: 1, row: 0 },
  chapel: { name: 'chapel', note: 'altar', col: 2, row: 0 },
  gallery: { name: 'gallery', note: 'mirror', col: 0, row: 1 },
  hall: { name: 'hall', col: 1, row: 1 },
  study: { name: 'study', note: 'desk', col: 2, row: 1 },
  cellar: { name: 'cellar', note: 'iron box', col: 0, row: 2 },
  store: { name: 'store room', note: 'dark! lamp', col: 1, row: 2 },
};

/** The exits, each drawn once. The hall's north door is locked. */
const EXITS: readonly [string, string][] = [
  ['tower', 'gallery'],
  ['gallery', 'hall'],
  ['hall', 'study'],
  ['study', 'chapel'],
  ['hall', 'store'],
  ['store', 'cellar'],
  ['hall', 'vault'],
];

const BOX_W = 186;
const BOX_H = 92;
const COL = 256;
const ROW = 166;
const NAME = 24;
const NOTE = 17;
/** The notebook's blue ballpoint, darker here: it sits on the magazine's glossy coat instead of soaking into the paper. */
const INK: [number, number, number] = [14, 30, 120];

type P = [number, number];

/** A ring of `n` points round (cx, cy), a little over one turn so it closes the way a hand does, as a glyph stroke. */
const ring = (cx: number, cy: number, r: number, n = 10): string =>
  `~${Array.from({ length: n + 2 }, (_, i) => `${(cx + r * Math.cos((i / n) * Math.PI * 2)).toFixed(3)},${(cy + r * Math.sin((i / n) * Math.PI * 2)).toFixed(3)}`).join(' ')}`;

/**
 * The player's mark in the corner of their map, a dragon's head breathing smoke, facing into the map with its neck coming
 * out from behind the grid's right-hand line (x = 1.42): drawn only here, so it is no doodle the notebook uses. In the
 * glyphs' units, y up from the baseline.
 */
const DRAGON = parse(
  [
    // Spines down the neck from the line to the back of the skull, then over the brow and down the snout to the nose.
    '1.42; 1.44,.58 1.37,.68 1.33,.61 1.27,.72 1.23,.65 1.16,.76 1.12,.76',
    '~1.12,.76 1.0,.84 .86,.87 .7,.82 .55,.75 .3,.7 .12,.66',
    '~.12,.66 .06,.62 .07,.55 .14,.52',
    // The upper lip back to the corner of the mouth, the jaw hanging open, and the throat back into the line.
    '~.14,.52 .35,.5 .6,.48 .66,.46',
    '~.66,.46 .45,.36 .22,.3 .16,.27',
    '~.16,.27 .2,.22 .4,.2 .65,.22 .85,.28 1.05,.24 1.25,.18 1.44,.16',
    // Fangs, top and bottom.
    '.2,.515 .23,.43 .26,.51 | .32,.505 .35,.42 .38,.5 | .44,.495 .47,.43 .5,.49 | .27,.32 .3,.4 .33,.33 | .4,.355 .43,.43 .46,.37',
    // Two horns rising from the back of the skull and curving back, wide at the root and coming to a point.
    '~.88,.86 .92,1.02 1.02,1.14 1.18,1.2 | ~1.18,1.2 1.07,1.08 1.02,.96 1.0,.84',
    '~1.03,.83 1.08,.96 1.18,1.04 1.3,1.07 | ~1.3,1.07 1.2,.97 1.14,.88 1.11,.79',
    // A slit eye under a heavy brow, and a nostril.
    `${ring(0.8, 0.72, 0.05, 9)} | .8,.765 .8,.675 | ~.68,.79 .8,.83 .92,.79 | .16,.6 .2,.62`,
    // Smoke curling up from the nose, rising clear of it.
    '~.05,.78 -.02,.86 .03,.94 -.04,1.02 0,1.1',
  ].join(' | '),
);

/** Where the dragon's scales go, down its neck and over the cheek (in its units), and one scale, a small cup. */
const SCALES: readonly P[] = [[1.23, 0.5], [1.35, 0.46], [1.18, 0.37], [1.3, 0.34], [1.24, 0.25], [0.98, 0.47], [1.06, 0.38]];
const SCALE = parse('1; ~0,.5 .15,.15 .5,0 .85,.15 1,.5');

/** A room's box as it was drawn: four corners, none quite square, clockwise from the top left. */
interface Box {
  tl: P;
  tr: P;
  br: P;
  bl: P;
}

/** Numbers from -0.5 to 0.5 that are the same every time for the same seed. */
function rand(seed: string): () => number {
  let h = hashSeed(seed);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Carry the line from `a` past `b` by `d` pixels (or stop short when `d` is negative), as a pen overshoots a corner. */
const past = (a: P, b: P, d: number): P => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [b[0] + ((b[0] - a[0]) / len) * d, b[1] + ((b[1] - a[1]) / len) * d];
};

/** Draw the map with its top-left room at (x, y), on a grid whose bottom-right corner is (right, bottom). */
export function drawPlayerMap(ctx: Ctx, x: number, y: number, right: number, bottom: number): void {
  const pen = (seed: string, size: number, mood = 0.08) => ({ size, seed: hashSeed(seed), mood, ink: INK });
  const line = (pts: P[], seed: string, mood = 0.3) => scrawl(ctx, pts, pen(seed, NAME, mood));
  // Where each box landed: drawn by eye on the grid, so none is quite the size of the others, quite on its square or quite level.
  const boxes: Record<string, Box> = {};
  for (const [id, r] of Object.entries(ROOMS)) {
    const j = rand(`${id}:box`);
    const w = BOX_W * (0.9 + j() * 0.22);
    const h = BOX_H * (0.92 + j() * 0.26);
    const x0 = x + r.col * COL + (BOX_W - w) / 2 + j() * 20;
    const y0 = y + r.row * ROW + (BOX_H - h) / 2 + j() * 16;
    const tilt = j() * 16;
    const c = (px: number, py: number, k: number): P => [px + j() * 16, py + j() * 12 + tilt * k];
    boxes[id] = { tl: c(x0, y0, -1), tr: c(x0 + w, y0, 1), br: c(x0 + w, y0 + h, 1), bl: c(x0, y0 + h, -1) };
  }
  // The lines between rooms, from one box's edge to the other's, somewhere near the middle of each.
  for (const [a, b] of EXITS) {
    const [p, q] = [boxes[a], boxes[b]];
    const j = rand(`${a}-${b}`);
    const across = ROOMS[a].row === ROOMS[b].row;
    const [left, right] = ROOMS[a].col < ROOMS[b].col ? [p, q] : [q, p];
    const [top, bottom] = ROOMS[a].row < ROOMS[b].row ? [p, q] : [q, p];
    const [s, e] = across
      ? [lerp(left.tr, left.br, 0.5 + j() * 0.2), lerp(right.tl, right.bl, 0.5 + j() * 0.2)]
      : [lerp(top.bl, top.br, 0.5 + j() * 0.2), lerp(bottom.tl, bottom.tr, 0.5 + j() * 0.2)];
    // The pen starts on the line or just off it, and stops a touch short of the far box or runs into it.
    const [s1, e1] = [past(e, s, j() * 5), past(s, e, j() * 6)];
    line([s1, e1], `${a}-${b}`);
    if (b === 'vault') {
      // Locked: two short bars across the way north, and a word beside it.
      const [mx, my] = lerp(s1, e1, 0.5);
      line([[mx - 13, my - 5], [mx + 14, my - 8]], 'bar1');
      line([[mx - 14, my + 4], [mx + 13, my + 2]], 'bar2');
      write(ctx, 'locked', mx + 21, my + 7, pen('locked', NOTE, 0.1));
    }
  }
  for (const [id, r] of Object.entries(ROOMS)) {
    const { tl, tr, br, bl } = boxes[id];
    const j = rand(`${id}:pen`);
    const s = (k: string) => `${id}:${k}`;
    if (j() < 0) {
      // In one go, clockwise from a little way along the top, running on past where it began.
      const start = lerp(tl, tr, 0.12 + (j() + 0.5) * 0.25);
      line([start, tr, br, bl, tl, past(start, tr, -Math.hypot(tr[0] - start[0], tr[1] - start[1]) + 8 + j() * 10)], s('loop'));
    } else {
      // Two strokes from the top left, round each side to meet (and cross) at the bottom right.
      line([past(tr, tl, 5 + j() * 7), tr, past(tr, br, 3 + j() * 8)], s('a'));
      line([past(bl, tl, 2 + j() * 6), bl, past(bl, br, 6 + j() * 8)], s('b'));
    }
    // Most boxes have one side gone over again, not quite on top of the first line.
    if (j() > -0.2) {
      const [p0, p1] = ([[tl, tr], [tr, br], [br, bl], [bl, tl]] as const)[Math.floor((j() + 0.5) * 3.99)];
      const [dx, dy] = [j() * 5, j() * 5];
      line([[p0[0] + dx + j() * 20, p0[1] + dy], [p1[0] + dx, p1[1] + dy + j() * 20]], s('again'));
    }
    const cx = (tl[0] + tr[0] + br[0] + bl[0]) / 4;
    const top = (tl[1] + tr[1]) / 2;
    const h = (bl[1] + br[1]) / 2 - top;
    const size = r.name === '?' ? 40 : NAME;
    const ny = r.note ? top + h * 0.46 : top + h / 2 + size / 2;
    write(ctx, r.name, cx - measure(r.name, size) / 2 + j() * 10, ny, pen(s('name'), size));
    if (r.note) write(ctx, r.note, cx - measure(r.note, NOTE) / 2 + j() * 12, top + h * 0.78, pen(s('note'), NOTE, 0.12));
  }
  // Where the game starts, with an arrow in to the store room from the side.
  const st = boxes.store;
  const [ex, ey] = lerp(st.tr, st.br, 0.55);
  const tip: P = [ex + 7, ey + 1];
  const tail: P = [ex + 72, ey - 2];
  write(ctx, 'start', tail[0] + 8, tail[1] + 7, pen('start', 20));
  line([tail, tip], 'start-arrow');
  line([[tip[0] + 13, tip[1] - 10], tip, [tip[0] + 12, tip[1] + 9]], 'start-head');
  // The player's mark in the grid's bottom-right corner, its neck coming out of the right-hand line, gone over twice.
  const size = 118;
  const [dx, dy] = [right - DRAGON.w * size, bottom - 30];
  sketch(ctx, DRAGON.strokes, dx, dy, { size, seed: hashSeed('dragon'), mood: 0.06, ink: INK, passes: 2, slant: 0 });
  // Each scale drawn small on its own, so the pen's shake is the size of a scale and not of the whole head.
  SCALES.forEach(([sx, sy], i) => sketch(ctx, SCALE.strokes, dx + sx * size - 7, dy - sy * size, { size: 14, seed: hashSeed(`scale${i}`), mood: 0.1, ink: INK }));
}
