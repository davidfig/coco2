/**
 * What the player draws in the margins while thinking: the pen keeps moving between notes. Each doodle belongs to the
 * note it was drawn beside (its seed is the note's id), so the page only ever gains them and a reload draws the same
 * ones in the same places. Some notes call up a picture of what they are about (a cassette beside the tape, a key beside
 * the locked door); the rest get whatever a bored pen draws, and as the notes turn uneasy so do the doodles: eyes,
 * spirals pressed hard, question marks gone over and over. The header and the punch holes collect doodles as a sheet fills.
 */
import { type Glyph, hashSeed, parse, sketch } from '../handwriting';

type Rand = () => number;

function rand(seed: number): Rand {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

const f = (n: number): string => n.toFixed(3).replace(/\.?0+$/, '');

/** An ellipse as a smooth stroke, from `from` to `to` turns (starting at the top, going anticlockwise); a little over one turn closes it the way a hand does. */
function loop(cx: number, cy: number, rx: number, ry = rx, from = 0, to = 1.08): string {
  const n = Math.max(6, Math.round(Math.abs(to - from) * 14));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (from + ((to - from) * i) / n) * Math.PI * 2;
    pts.push(`${f(cx + rx * Math.cos(a))},${f(cy + ry * Math.sin(a))}`);
  }
  return `~${pts.join(' ')}`;
}

/** A spiral winding out from the middle. */
function spiral(cx: number, cy: number, r: number, turns: number): string {
  const n = Math.round(turns * 14);
  const pts: string[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(`${f(cx + r * t * Math.cos(a))},${f(cy + r * t * Math.sin(a))}`);
  }
  return `~${pts.join(' ')}`;
}

/** Rays round a point, from radius `r0` out to `r1`. */
const rays = (cx: number, cy: number, r0: number, r1: number, n: number): string =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.3;
    return `${f(cx + r0 * Math.cos(a))},${f(cy + r0 * Math.sin(a))} ${f(cx + r1 * Math.cos(a))},${f(cy + r1 * Math.sin(a))}`;
  }).join(' | ');

const QUESTION = (dx: number, s: number): string =>
  `~${[[0.02, 0.82], [0.12, 0.98], [0.28, 1], [0.44, 0.9], [0.46, 0.7], [0.3, 0.52], [0.24, 0.4], [0.24, 0.28]].map(([x, y]) => `${f(dx + x * s)},${f(y * s)}`).join(' ')} | ${f(dx + 0.24 * s)},0 ${f(dx + 0.26 * s)},${f(0.05 * s)}`;

/** The skeletons, in the glyphs' `"width; stroke | stroke"` form, about one unit high. */
const SOURCE = {
  star: '1; .5,1 .2,0 1,.62 0,.62 .8,0 .52,.98',
  asterisk: '.7; .35,1 .35,.1 | 0,.78 .7,.32 | 0,.32 .7,.78',
  arrow: '1.1; ~0,.4 .3,.52 .7,.48 1,.4 | .78,.66 1.02,.4 .74,.18',
  cube: '1; 0,0 .7,0 .7,.7 0,.7 0,0 | 0,.7 .3,1 1,1 1,.3 .7,0 | .7,.7 1,1 | .78,.1 .78,.78 | .86,.18 .86,.86 | .94,.26 .94,.94',
  pyramid: '1; 0,.1 .6,0 1,.25 | .45,1 0,.1 | .45,1 .6,0 | .45,1 1,.25 | .52,.7 .66,.08 | .6,.45 .8,.14',
  spiral: `1; ${spiral(0.5, 0.5, 0.5, 3)}`,
  hatched: '1; 0,0 .9,0 .9,.9 0,.9 0,0 | 0,.3 .3,0 | 0,.6 .6,0 | 0,.9 .9,0 | .3,.9 .9,.3 | .6,.9 .9,.6',
  smiley: `1; ${loop(0.5, 0.5, 0.5)} | .34,.6 .35,.68 | .64,.6 .65,.68 | ~.24,.36 .5,.18 .76,.36`,
  bolt: '.6; .45,1 .1,.45 .32,.45 .12,-.05 .52,.58 .3,.58 .45,1',
  target: `1; ${loop(0.5, 0.5, 0.5)} | ${loop(0.5, 0.5, 0.3, 0.3, 0.2, 1.3)} | ${loop(0.5, 0.5, 0.1, 0.1, 0.5, 1.6)}`,
  sun: `1; ${loop(0.5, 0.5, 0.24)} | ${rays(0.5, 0.5, 0.33, 0.5, 8)}`,
  flower: `1; ${loop(0.5, 0.55, 0.12)} | ${[0, 1, 2, 3, 4].map((i) => loop(0.5 + 0.28 * Math.cos(i * 1.257 + 1.57), 0.55 + 0.28 * Math.sin(i * 1.257 + 1.57), 0.14, 0.14)).join(' | ')} | .5,.29 .52,-.1`,
  rainbow: `1; ${loop(0.5, 0, 0.5, 0.9, -0.25, 0.25)} | ${loop(0.5, 0, 0.38, 0.7, -0.25, 0.25)} | ${loop(0.5, 0, 0.26, 0.5, -0.25, 0.25)}`,
  wave: '1.4; ~0,.5 .17,.8 .35,.5 .52,.2 .7,.5 .87,.8 1.05,.5 1.22,.2 1.4,.5',
  noughts: `1; .33,1 .33,0 | .66,1 .66,0 | 0,.66 1,.66 | 0,.33 1,.33 | .06,.94 .26,.74 | .26,.94 .06,.74 | ${loop(0.5, 0.5, 0.1)} | .74,.26 .94,.06 | .94,.26 .74,.06`,
  tv: `1.3; 0,0 1.3,0 1.3,.75 0,.75 0,0 | ~.12,.12 .5,.09 .92,.12 .94,.4 .92,.64 .5,.67 .12,.64 .1,.4 .12,.12 | ${loop(1.12, 0.52, 0.07)} | ${loop(1.12, 0.26, 0.07)} | .55,.75 .3,1.05 | .75,.75 1,1.05`,
  rocket: `.7; ~.35,1 .55,.7 .55,.2 | ~.35,1 .15,.7 .15,.2 | .15,.2 .55,.2 | .15,.4 0,.1 .15,.2 | .55,.4 .7,.1 .55,.2 | ${loop(0.35, 0.6, 0.09)} | .22,.18 .27,0 .32,.14 .37,-.02 .44,.18`,
  cassette: `1.5; 0,0 1.5,0 1.5,.9 0,.9 0,0 | .3,0 .4,.25 1.1,.25 1.2,0 | ${loop(0.42, 0.56, 0.14)} | ${loop(1.08, 0.56, 0.14)} | .6,.44 .9,.44 .9,.68 .6,.68 .6,.44 | .1,.8 1.4,.8`,
  lantern: `.7; ~.2,.15 .1,.5 .2,.8 .5,.8 .6,.5 .5,.15 | .05,.15 .65,.15 .65,0 .05,0 .05,.15 | .2,.8 .25,.95 .45,.95 .5,.8 | ~.35,.3 .29,.45 .35,.62 .41,.45 .35,.3 | ~.25,.95 .35,1.12 .45,.95`,
  key: `1.3; ${loop(0.2, 0.5, 0.2)} | .4,.5 1.3,.5 | 1.1,.5 1.1,.28 | 1.25,.5 1.25,.32`,
  map: '1.4; 0,0 .4,0 .4,.4 0,.4 0,0 | .4,.2 .6,.2 | .6,0 1,0 1,.4 .6,.4 .6,0 | .8,.4 .8,.6 | .6,.6 1,.6 1,1 .6,1 .6,.6 | 1,.2 1.2,.2 | .72,.88 .88,.72 | .88,.88 .72,.72',
  wheels: `1.6; ${[0.2, 0.6, 1, 1.4].map((x) => `${loop(x, 0.5, 0.17)} | ${f(x)},.67 ${f(x)},.58`).join(' | ')}`,
  vault: `1; ${loop(0.5, 0.5, 0.5)} | ${loop(0.5, 0.5, 0.1)} | ${rays(0.5, 0.5, 0.1, 0.36, 6)}`,
  crown: '1; 0,.2 0,.85 .25,.5 .5,.95 .75,.5 1,.85 1,.2 0,.2 | 0,.06 1,.06',
  bubble: `1.3; ~.55,.3 .25,.36 .05,.6 .2,.92 .65,1 1.1,.92 1.28,.62 1.08,.34 .72,.3 | .55,.3 .3,0 .72,.3 | ${loop(0.45, 0.64, 0.12, 0.17)} | .76,.82 .76,.46 | .96,.82 .76,.64 .96,.46`,
  query: `.8; ${QUESTION(0.1, 0.8)} | -.05,-.12 .78,-.12 .8,.95 -.04,.95 -.05,-.12`,
  queries: `1.4; ${QUESTION(0, 0.9)} | ${QUESTION(0.48, 0.9)} | ${QUESTION(0.96, 0.9)}`,
  eye: `1.4; ~0,.5 .35,.82 .7,.92 1.05,.82 1.4,.5 | ~0,.5 .35,.18 .7,.08 1.05,.18 1.4,.5 | ${loop(0.7, 0.5, 0.24, 0.3)} | ${spiral(0.7, 0.5, 0.11, 3)} | .3,.86 .26,1 | .7,.98 .7,1.12 | 1.1,.86 1.14,1`,
  heart: '1; ~.5,.7 .62,.95 .9,.95 1,.7 .85,.4 .5,0 | ~.5,.7 .38,.95 .1,.95 0,.7 .15,.4 .5,0',
} as const;

type Name = keyof typeof SOURCE;
const SHAPES = Object.fromEntries(Object.entries(SOURCE).map(([k, v]) => [k, parse(v)])) as Record<Name, Glyph>;

/** What a note puts in mind: its own picture, drawn every time (unless it is none). */
const THEMED: Partial<Record<string, Name>> = {
  tape: 'cassette',
  label: 'tv',
  waits: 'lantern',
  explore: 'lantern',
  door: 'vault',
  plate: 'wheels',
  clicks: 'wheels',
  box: 'key',
  mirror: 'eye',
  name: 'eye',
  won: 'crown',
  voice: 'bubble',
  guess: 'query',
  'extra-line': 'eye',
  who: 'queries',
  'saw-pleads': 'eye',
  'saw-thanks': 'heart',
};
/** Doodles ringed in red pen like a page reference, and where a click on one goes: the cassette beside the tape's note shows the recorder. */
const SPOTS: Partial<Record<string, Spot['to']>> = { tape: 'recorder' };

/** A ringed doodle on a sheet (sheet pixels), the note it was drawn beside, and where a click on it goes. */
export interface Spot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  to: 'recorder';
}

/** What a pen draws when its owner is just waiting for the next idea; then when something is wrong. */
const IDLE: readonly Name[] = ['star', 'cube', 'spiral', 'smiley', 'bolt', 'sun', 'flower', 'rainbow', 'wave', 'noughts', 'pyramid', 'asterisk', 'rocket', 'hatched'];
const UNEASY: readonly Name[] = ['eye', 'spiral', 'target', 'hatched', 'query', 'spiral', 'asterisk'];
/** Small enough for the strip left of the margin line, and what is drawn there pointing at a question. */
const MARGIN: readonly Name[] = ['star', 'asterisk', 'arrow', 'spiral', 'target', 'cube', 'bolt', 'hatched'];
/** For the space in the heading: the bigger pictures. */
const HEADER: readonly Name[] = ['cube', 'tv', 'rocket', 'rainbow', 'cassette', 'pyramid', 'sun', 'noughts'];

/** One note as it was written on the sheet: where its rows are, and how far its last line ran. */
export interface Written {
  id: string;
  mood: number;
  ask: boolean;
  /** Baselines of its first and last rows. */
  top: number;
  bottom: number;
  /** Where its last line ended. */
  end: number;
}

export interface Margins {
  /** The red margin line, the page's right limit for doodles, and the punch holes (their x and every y). */
  margin: number;
  right: number;
  hole: { x: number; ys: readonly number[] };
  /** The empty stretch of the heading, between the title and the date. */
  header: { x0: number; x1: number; y: number };
  sheet: number;
  ink: [number, number, number];
}

/**
 * A page reference ringed in a red pen, the way you circle a cross-reference on a later read-through: one quick stroke
 * round the words, never the same twice (`ringPath`). It goes on the sheet's ring layer (sheet.ts's `RING_Y`), in its own
 * colour channel (`slot`: 0 red, 1 green, 2 blue) added to what is there, so rings that overlap keep apart: the shader
 * inks them all in red, and can lift just one off to draw it again under the pointer.
 */
export function ringRef(ctx: CanvasRenderingContext2D, pts: readonly (readonly [number, number])[], slot: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = ['#f00', '#0f0', '#00f'][slot];
  ctx.lineCap = 'round';
  let along = 0;
  for (let i = 1; i < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i - 1], pts[i]];
    const len = Math.hypot(x1 - x0, y1 - y0);
    ctx.lineWidth = 2 * ringWidth(along + len / 2);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    along += len;
  }
  ctx.restore();
}

/** The ring's half width (sheet pixels) at `along` pixels into its stroke: thin where the pen touches down, its pressure wavering. noteShader.ts traces it with the same. */
export function ringWidth(along: number): number {
  const t = Math.min(1, Math.max(0, along / 10));
  return 1.2 * (0.45 + 0.55 * t * t * (3 - 2 * t)) * (0.85 + 0.2 * Math.sin(along * 0.07));
}

/** The ring's one stroke, in units of its half height (x right, y up, round 0, 0), `aspect` times as wide as it is tall; `ringRef` draws it, and the shader traces it again under the pointer (linkMark.ts). */
export function ringPath(aspect: number, seed: number, mood: number): [number, number][] {
  const r = rand(seed);
  const g = (): number => r() + r() - 1;
  // A calm pen goes round once; an uneasy one (mood over 0.3) may go round again.
  const again = r() < 0.2 + mood * 0.4 && mood > 0.3;
  const turns = again ? 1.6 + r() * 0.5 : 1.08 + r() * 0.25;
  const dir = r() < 0.75 ? 1 : -1;
  const start = r() * Math.PI * 2;
  const tilt = g() * 0.12;
  // How far round the ring wanders from an ellipse: a lopsided bulge and a flattening, each its own way up.
  const [b1, p1, b2, p2] = [0.05 + r() * 0.08, r() * 6.3, 0.03 + r() * 0.06, r() * 6.3];
  const drift = (r() < 0.5 ? 1 : -1) * (0.08 + r() * 0.12);
  const [ox, oy] = [g() * 0.1, g() * 0.12];
  const n = Math.round(turns * 28);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + dir * t * turns * Math.PI * 2;
    const k = 1 + b1 * Math.sin(a + p1) + b2 * Math.sin(2 * a + p2) + drift * (t - 0.5) + g() * 0.015;
    const [ex, ey] = [aspect * k * Math.cos(a), k * Math.sin(a)];
    pts.push([ox + ex * Math.cos(tilt) - ey * Math.sin(tilt), oy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
  }
  return pts;
}

const pick = <T>(list: readonly T[], r: Rand): T => list[Math.floor(r() * list.length)];

/** Draw the doodles for the notes written on one sheet. Returns the ones to ring, which take a click. */
export function doodle(ctx: CanvasRenderingContext2D, notes: readonly Written[], m: Margins): Spot[] {
  const spots: Spot[] = [];
  ctx.save();
  // Ink lands only on paper: not in a punch hole or past the torn edge.
  ctx.globalCompositeOperation = 'source-atop';
  const draw = (name: Name, x: number, y: number, size: number, seed: number, mood: number): void => {
    const r = rand(seed);
    const uneasy = mood > 0.3;
    sketch(ctx, SHAPES[name].strokes, x, y, {
      size,
      seed,
      mood: mood * 0.6,
      ink: m.ink,
      passes: 1 + Math.floor(r() * (uneasy ? 4 : 2)) + (uneasy ? 1 : 0),
      press: uneasy ? 1.15 + r() * 0.3 : 1,
    });
  };
  const holes = m.hole.ys;
  for (const n of notes) {
    const seed = hashSeed(`${n.id}:doodle`);
    const r = rand(seed);
    const themed = THEMED[n.id];
    // A pen idles more as the evening goes on.
    if (!themed && r() > 0.3 + n.mood * 0.7) continue;
    const name = themed ?? pick(n.mood > 0.3 ? UNEASY : IDLE, r);
    const size = 34 + r() * 10;
    const w = SHAPES[name].w * size;
    const room = m.right - (n.end + 34);
    if (room >= w) {
      const [x, y] = [n.end + 34 + r() * Math.min(room - w, 120), n.bottom + 1 + (r() - 0.5) * 4];
      draw(name, x, y, size, seed, n.mood);
      const to = SPOTS[n.id];
      if (to) spots.push({ id: n.id, x: x - 4, y: y - size - 4, w: w + 8, h: size + 8, to });
      continue;
    }
    // No room after the words: something small in the margin beside the note instead, an arrow if it is a question.
    const small = n.ask ? 'arrow' : themed && MARGIN.includes(themed) ? themed : pick(MARGIN, r);
    const ms = Math.min(30, 36 / SHAPES[small].w);
    const y = n.top - 6;
    if (holes.some((h) => Math.abs(y - ms / 2 - h) < 24)) continue;
    draw(small, m.margin - 4 - SHAPES[small].w * ms, y, ms, seed ^ 1, n.mood);
  }
  // The heading's blank stretch fills up as the sheet does: a picture after the fourth note, another after the eleventh.
  const head = rand(hashSeed(`head:${m.sheet}`));
  let x = m.header.x0 + head() * 20;
  for (const at of [4, 11]) {
    if (notes.length < at) break;
    const mood = notes[at - 1].mood;
    const name = mood > 0.3 ? pick(UNEASY, head) : pick(HEADER, head);
    const size = 56 + head() * 16;
    const w = SHAPES[name].w * size;
    if (x + w > m.header.x1) break;
    draw(name, x, m.header.y + (head() - 0.5) * 10, size, hashSeed(`head:${m.sheet}:${at}`), mood);
    x += w + 26 + head() * 20;
  }
  // A punch hole ringed round and round, once the writing has passed it.
  holes.forEach((h, i) => {
    const after = notes.findIndex((n) => n.top > h + 60);
    const seed = hashSeed(`hole:${m.sheet}:${i}`);
    const r = rand(seed);
    if (after < 0 || r() < 0.35) return;
    const start = r();
    const ring = parse(`1; ${loop(0, 0, 1, 1, start, start + 2.1)}`);
    sketch(ctx, ring.strokes, m.hole.x, h, { size: 22 + r() * 4, seed, mood: notes[after].mood, ink: m.ink, passes: 2 });
  });
  ctx.restore();
  return spots;
}
