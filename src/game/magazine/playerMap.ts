import { hashSeed, measure, write } from '../handwriting';
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
  tower: { name: 'Tower', note: 'big clock', col: 0, row: 0 },
  vault: { name: '?', col: 1, row: 0 },
  chapel: { name: 'Chapel', note: 'altar', col: 2, row: 0 },
  gallery: { name: 'Gallery', note: 'mirror', col: 0, row: 1 },
  hall: { name: 'Hall', col: 1, row: 1 },
  study: { name: 'Study', note: 'desk', col: 2, row: 1 },
  cellar: { name: 'Cellar', note: 'iron box', col: 0, row: 2 },
  store: { name: 'Store room', note: 'dark! lamp', col: 1, row: 2 },
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
/** The notebook's blue ballpoint. */
const INK: [number, number, number] = [28, 58, 170];

/**
 * A line drawn freehand without a ruler: straight in intent, with a slight bow and a little give at the ends, in the same
 * ballpoint as the writing.
 */
function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, seed: string): void {
  let h = hashSeed(seed);
  const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296) - 0.5;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const bow = r() * Math.min(5, len * 0.025);
  const shade = Math.round(r() * 18);
  ctx.strokeStyle = `rgb(${INK[0] + shade},${INK[1] + shade},${INK[2] + shade})`;
  ctx.lineWidth = 1.7 + r() * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0 + nx * r(), y0 + ny * r());
  ctx.quadraticCurveTo((x0 + x1) / 2 + nx * bow * 2, (y0 + y1) / 2 + ny * bow * 2, x1 + nx * r(), y1 + ny * r());
  ctx.stroke();
}

/** Draw the map with its top-left room at (x, y). */
export function drawPlayerMap(ctx: Ctx, x: number, y: number): void {
  const pen = (seed: string, size: number, mood = 0.08) => ({ size, seed: hashSeed(seed), mood, ink: INK });
  const box = (r: Room) => ({ x: x + r.col * COL, y: y + r.row * ROW });
  // The lines between rooms, edge to edge.
  for (const [a, b] of EXITS) {
    const [p, q] = [box(ROOMS[a]), box(ROOMS[b])];
    const across = ROOMS[a].row === ROOMS[b].row;
    const [x0, y0, x1, y1] = across
      ? [Math.min(p.x, q.x) + BOX_W, p.y + BOX_H / 2, Math.max(p.x, q.x), q.y + BOX_H / 2]
      : [p.x + BOX_W / 2, Math.min(p.y, q.y) + BOX_H, q.x + BOX_W / 2, Math.max(p.y, q.y)];
    line(ctx, x0 + 2, y0, x1 - 2, y1, `${a}-${b}`);
    if (b === 'vault') {
      // Locked: two short bars across the way north, and a word beside it.
      const my = (y0 + y1) / 2;
      line(ctx, x0 - 14, my - 6, x0 + 14, my - 8, 'bar1');
      line(ctx, x0 - 14, my + 4, x0 + 14, my + 2, 'bar2');
      write(ctx, 'locked', x0 + 20, my + 7, pen('locked', NOTE, 0.1));
    }
  }
  for (const [id, r] of Object.entries(ROOMS)) {
    const { x: bx, y: by } = box(r);
    const s = (k: string) => `${id}:${k}`;
    // Four strokes, each overshooting its corner a little, as a box is drawn freehand.
    line(ctx, bx - 4, by, bx + BOX_W + 3, by + 1, s('top'));
    line(ctx, bx + BOX_W, by - 3, bx + BOX_W + 1, by + BOX_H + 4, s('right'));
    line(ctx, bx + BOX_W + 4, by + BOX_H, bx - 3, by + BOX_H - 1, s('bottom'));
    line(ctx, bx, by + BOX_H + 3, bx + 1, by - 4, s('left'));
    const size = r.name === '?' ? 40 : NAME;
    const ny = r.note ? by + 42 : by + BOX_H / 2 + size / 2;
    write(ctx, r.name, bx + (BOX_W - measure(r.name, size)) / 2, ny, pen(`${id}:name`, size));
    if (r.note) write(ctx, r.note, bx + (BOX_W - measure(r.note, NOTE)) / 2, by + 72, pen(`${id}:note`, NOTE, 0.12));
  }
  // Where the game starts, with an arrow in to the store room from the side.
  const st = box(ROOMS.store);
  const ax = st.x + BOX_W + 70;
  const ay = st.y + BOX_H / 2;
  write(ctx, 'start', ax + 8, ay + 6, pen('start', 20));
  line(ctx, ax, ay, st.x + BOX_W + 8, ay, 'start-arrow');
  line(ctx, st.x + BOX_W + 8, ay, st.x + BOX_W + 20, ay - 9, 'start-head1');
  line(ctx, st.x + BOX_W + 8, ay, st.x + BOX_W + 20, ay + 9, 'start-head2');
}
