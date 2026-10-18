import { dash, hashSeed, measure, wrap, write } from '../handwriting';
import { type Written, doodle } from './doodles';
import { type Note, isSolved, noteText, visibleNotes } from './notes';
import { type InkMark, ageOver, ageUnder } from './wear';

export const SHEET_W = 800;
export const SHEET_H = 1100;

const LINE_H = 40;
const TOP = 112;
const LEFT = 120;
const SIZE = 25;
/** The paper's left edge: the strip before it holds only the scraps of the torn spiral edge. */
const EDGE = 26;
/** The punch holes down the left, at this x. */
const HOLE_X = 46;
const HOLES = [190, 550, 910];
/** The day the notes are dated: the story is set in 1986 and this is the March issue (see cover.ts). */
const DATE = 'Mar 14, 1986';
/** Rows of writing that fit under the heading. */
const CAPACITY = Math.floor((SHEET_H - 30 - TOP) / LINE_H);

/** A tiny seeded generator for the paper itself (stains and grain), so it does not shimmer on redraw. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

/** Ruled notebook paper torn from a spiral binding, a margin, three punch holes. */
function paper(ctx: CanvasRenderingContext2D, sheet = 0): void {
  const r = rng(77 + sheet * 101);
  ctx.clearRect(0, 0, SHEET_W, SHEET_H);
  ctx.save();
  ctx.beginPath();
  ctx.rect(EDGE, 0, SHEET_W - EDGE, SHEET_H);
  ctx.clip();
  ctx.fillStyle = '#f0ebda';
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(110,90,50,${0.02 + r() * 0.04})`;
    ctx.fillRect(r() * SHEET_W, r() * SHEET_H, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 5; i++) {
    const [sx, sy] = [r() * SHEET_W, r() * SHEET_H];
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90 + r() * 120);
    g.addColorStop(0, 'rgba(150,120,60,0.07)');
    g.addColorStop(1, 'rgba(150,120,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  }
  ctx.strokeStyle = 'rgba(80,130,170,0.55)';
  ctx.lineWidth = 1.6;
  for (let y = TOP; y < SHEET_H - 20; y += LINE_H) {
    ctx.beginPath();
    ctx.moveTo(0, y + (r() - 0.5));
    ctx.lineTo(SHEET_W, y + (r() - 0.5));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200,80,70,0.55)';
  ctx.beginPath();
  ctx.moveTo(LEFT - 14, 0);
  ctx.lineTo(LEFT - 14, SHEET_H);
  ctx.stroke();
  ctx.restore();
  // Punched holes and the ripped spiral edge are real gaps in the paper: cut out, so the room shows through.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  for (const y of HOLES) {
    ctx.beginPath();
    ctx.arc(HOLE_X, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  // Each spiral ring tore partway free: the bites are cut into the edge, and between them the paper stays attached.
  const bites: { cy: number; rx: number; ry: number }[] = [];
  for (let y = 24; y < SHEET_H; y += 30 + r() * 14) {
    const bite = { cy: y + (r() - 0.5) * 4, rx: 6 + r() * 7, ry: 7 + r() * 5 };
    bites.push(bite);
    ctx.beginPath();
    ctx.ellipse(EDGE, bite.cy, bite.rx, bite.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // The scraps that did not tear off cleanly: ragged strips of paper still joined to the page between two bites, curling out
  // past its edge and sagging down under their own weight.
  // Each joint holds at most one strip, which hangs either down or up. `size` (0–1) is skewed small: mostly nubs and short
  // tags, now and then a long streamer; width, reach and sag each wander on their own around it.
  const scrap = (y: number, dir: 1 | -1, room: number): void => {
    const size = r() ** 1.8;
    const w0 = Math.min(room, 3 + size * 8 + r() * 4);
    const reach = Math.min(EDGE + 2, 3 + size * (EDGE - 4) * (0.6 + 0.6 * r()));
    const droop = (1 + size * 22) * (0.4 + 0.9 * r());
    const y0 = y + dir * 2 + (r() - 0.5) * 3;
    const n = 3 + Math.round(size * 4);
    const upper: [number, number][] = [];
    const lower: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const cx = EDGE + 4 - reach * Math.sin(t * Math.PI * 0.5) + (r() - 0.5) * 1.5;
      const cy = y0 + dir * droop * t ** 1.7 + Math.sin(t * 3 + y) * 1.2;
      const w = w0 * (1 - 0.65 * t) * (0.75 + 0.5 * r());
      upper.push([cx + (r() - 0.5) * 1.5, cy - w / 2]);
      lower.push([cx + (r() - 0.5) * 1.5, cy + w / 2]);
    }
    // The tip is a torn point, not a square end.
    const tip: [number, number] = [upper[n][0] - 2 - r() * 3, upper[n][1] + (lower[n][1] - upper[n][1]) * (0.3 + 0.6 * r()) + 2 * dir];
    ctx.fillStyle = '#ebe5d1';
    ctx.beginPath();
    ctx.moveTo(EDGE + 5, upper[0][1]);
    for (const p of upper) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(tip[0], tip[1]);
    for (let i = n; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
    ctx.lineTo(EDGE + 5, lower[0][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,50,30,0.3)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // The underside is in shade where it hangs.
    ctx.strokeStyle = 'rgba(60,50,30,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    lower.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  };
  // Joints are the paper left between neighbouring bites; some tore clean and keep no strip at all.
  for (let i = 1; i < bites.length; i++) {
    const [a, b] = [bites[i - 1], bites[i]];
    const room = b.cy - b.ry - (a.cy + a.ry);
    if (room < 3 || r() < 0.18) continue;
    scrap(a.cy + a.ry + room * (0.3 + 0.4 * r()), r() < 0.5 ? 1 : -1, room + 2);
  }
  // Shading round each hole and bite, as the cut paper catches a little shadow.
  ctx.strokeStyle = 'rgba(60,50,30,0.35)';
  ctx.lineWidth = 1.5;
  for (const y of HOLES) {
    ctx.beginPath();
    ctx.arc(HOLE_X, y, 16.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** A "p.N" in the notes, as a rectangle on the sheet: clicking it turns the magazine to that page (`page` is its index). */
export interface PageLink {
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
}

type Entry = { note: Note; solved: boolean; lines: string[] };

/** The notes laid out on sheets, oldest first. A note that will not fit on a sheet starts the next one; nothing is dropped. */
export function paginate(flags: ReadonlySet<string>): Entry[][] {
  const sheets: Entry[][] = [[]];
  let used = 0;
  for (const note of visibleNotes(flags)) {
    const e = { note, solved: isSolved(note, flags), lines: wrap(noteText(note, flags), SIZE, SHEET_W - LEFT - 40) };
    if (used + e.lines.length > CAPACITY && sheets[sheets.length - 1].length) {
      sheets.push([]);
      used = 0;
    }
    sheets[sheets.length - 1].push(e);
    used += e.lines.length;
  }
  return sheets;
}

/**
 * Draw one sheet of the notebook (0 = the first; by default the newest) for the flags the player has set, worn by
 * `handled` readings (see wear.ts). Returns its page references and how many sheets there are.
 */
export function drawSheet(ctx: CanvasRenderingContext2D, flags: ReadonlySet<string>, handled: number, sheet?: number): { links: PageLink[]; count: number } {
  const sheets = paginate(flags);
  const k = Math.min(sheet ?? sheets.length - 1, sheets.length - 1);
  paper(ctx, k);
  ageUnder(ctx, SHEET_W, SHEET_H, EDGE, handled, k);
  // Every sheet is headed, so the corner that peeks out of the pile always reads as the notes; the first also has the date.
  let titleEnd: number;
  let dateStart = SHEET_W - 30;
  if (k === 0) {
    titleEnd = LEFT + write(ctx, 'My Notes', LEFT, 58, { size: 44, seed: 5, mood: 0.03 });
    dateStart = SHEET_W - 40 - measure(DATE, 26);
    write(ctx, DATE, dateStart, 50, { size: 26, seed: 9, mood: 0.05 });
  } else titleEnd = LEFT + write(ctx, 'My Notes, continued', LEFT, 58, { size: 36, seed: 5 + k, mood: 0.05 });
  if (sheets.length > 1) write(ctx, String(k + 1), SHEET_W / 2 - 8, SHEET_H - 34, { size: 26, seed: 40 + k, mood: 0.05 });
  let row = 1;
  const INK: [number, number, number] = [28, 58, 170];
  const inks: InkMark[] = [];
  const links: PageLink[] = [];
  const written: Written[] = [];
  for (const { note, solved, lines } of sheets[k]) {
    const top = TOP + row * LINE_H - 6;
    const base = hashSeed(note.id);
    const ink = INK;
    lines.forEach((line, i) => {
      const y = TOP + row * LINE_H;
      const pen = { size: SIZE, seed: base + i * 131, mood: note.mood, ink };
      const spans: [number, number][] = [];
      const w = write(ctx, line, LEFT, y - 6, { ...pen, track: (k, a, b) => (spans[k] = [a, b]) });
      for (const m of line.matchAll(/p\.(\d+)/gi)) {
        const a = spans[m.index!]?.[0];
        const b = spans[m.index! + m[0].length - 1]?.[1];
        if (a !== undefined && b !== undefined) links.push({ x: a - 8, y: y - 6 - pen.size * 1.2, w: b - a + 16, h: pen.size * 1.6, page: Number(m[1]) - 1 });
      }
      if (solved) dash(ctx, LEFT - 6, y - 14, LEFT + w + 6, y - 15, { ...pen, size: 24, mood: 0.5 });
      if (i === lines.length - 1) {
        inks.push({ x: LEFT + w, y, seed: hashSeed(`${note.id}:ink`), mood: note.mood, ink });
        written.push({ id: note.id, mood: note.mood, ask: !!note.ask && !solved, top, bottom: y - 6, end: LEFT + w });
      }
      row++;
    });
  }
  doodle(ctx, written, {
    margin: LEFT - 14,
    right: SHEET_W - 30,
    hole: { x: HOLE_X, ys: HOLES },
    header: { x0: titleEnd + 36, x1: dateStart - 24, y: 92 },
    sheet: k,
    ink: INK,
  });
  ageOver(ctx, SHEET_W, SHEET_H, EDGE, handled, inks, k);
  return { links, count: sheets.length };
}
