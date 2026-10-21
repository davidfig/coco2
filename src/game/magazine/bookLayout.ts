import { TUBE } from '../tv/cabinetShader';
import { ACTIVE } from '../tv/pictureShader';
import { type Cam, camToBook } from './bookCam';
import { PAGE_H, PAGE_W } from './paper';

/** A rectangle in window fractions, origin bottom-left (like gl_FragCoord). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  tv: Rect;
  book: Rect;
}

/** Where the TV's picture bottoms out in `rect` (window fractions) with `frame` round it, as `Tv.draw` fits it. */
function pictureBottom(rect: Rect, aspect: number, frame: number): number {
  const [px, py] = [TUBE[0] * ACTIVE[0], TUBE[1] * ACTIVE[1]];
  const s = Math.max(py + frame, (px + frame) / ((rect.w * aspect) / rect.h));
  return rect.y + rect.h / 2 - (py / s) * (rect.h / 2);
}

/** Page height in page widths. */
export const PAGE_UNIT_H = PAGE_H / PAGE_W;
/** Window room round one page, in page widths / heights. */
export const PAGE_FIT_W = 1.02;
export const PAGE_FIT_H = 1.03;
/** The whole block of paper, in page widths held out (kept tiny: no slab of paper edge shows; the 3D comes from the curl and the light). Lying on the table it is thicker (`onTable`). */
export const PAPER_THICKNESS = 0.004;
/**
 * The camera looks down at the open book from this tilt (radians back from straight on) and distance (page widths). Put
 * away, the book stands straight on to it instead, a plain upright page at the window's edge; it leans back as it comes out.
 */
export const TILT = 0.42;
export const CAM_DIST = 4.5;
/** The room one page needs across, in page widths: its bottom edge, nearest the tilted camera, shows wider than the middle. */
export const PAGE_NEAR_W = (PAGE_FIT_W * CAM_DIST) / (CAM_DIST - (PAGE_UNIT_H / 2) * Math.sin(TILT));
/** With the book put away, the TV sits this far (window fraction) off the bottom: room for the notebook page to peek up over the set without covering the picture. */
export const NOTE_ROOM = 0.08;
/** How much of the put-away book shows at the window's edge (window fraction), and how much more under the pointer. */
export const PEEK = 0.09;
/** Put away, the page is turned this far (radians, anticlockwise) about its top-left corner, so only that corner shows. */
export const ROLL = 0.35;
/** …and that corner sits this far (share of the book's rect) below the rect's top. */
export const CORNER_DROP = 0.18;
export const PEEK_HOVER = 0.04;
/** How much of the set shows round the picture (`Tv.draw`'s `frame`): book put away, beside it, at reading size. */
export const CLOSED_FRAME = 0.08;
export const SIDE_FRAME = 0.95;
export const READ_FRAME = 0.4;
/** Beside the set, the book takes at most this share of the window (width, or height when tall): the set has the rest. */
export const SIDE_BOOK = 0.5;
/** Windows narrower than this (width / height) stack the TV over the book instead of side by side. */
export const TALL = 0.9;
/** With the book out in a tall window, the notebook page tucks down to a strip this high (window fraction) along the bottom, below the book. */
export const NOTE_STRIP = 0.03;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

/**
 * The three arrangements of window: the TV alone with the magazine peeking in at the edge, the two side by side, and
 * the magazine reading-size with the TV pushed to a strip. Wide windows split left/right, tall ones top/bottom; put
 * away, the magazine always peeks in at the right edge.
 */
export function layouts(aspect: number, peek: number): { closed: Layout; side: Layout; read: Layout } {
  if (aspect >= TALL) {
    // Just wide enough for one page at full height, but never more than `SIDE_BOOK`: the set keeps the rest, so a
    // listing can be copied off the page at a readable picture (BIGGER, reading mode, gives the page more).
    const panel = Math.min(PAGE_NEAR_W / (PAGE_UNIT_H * PAGE_FIT_H) / aspect, SIDE_BOOK);
    const side: Layout = { tv: { x: 0, y: 0, w: 1 - panel, h: 1 }, book: { x: 1 - panel, y: 0, w: panel, h: 1 } };
    const read: Layout = { tv: { x: 0, y: 0, w: 0.2, h: 1 }, book: { x: 0.2, y: 0, w: 0.8, h: 1 } };
    return { closed: { tv: closedTv(aspect), book: { ...side.book, x: 1 - peek } }, side, read };
  }
  // The book comes up over the bottom of the set to just under the picture, and sits above the tucked notebook's strip.
  const sideTv: Rect = { x: 0, y: 0.5, w: 1, h: 0.5 };
  const sideTop = pictureBottom(sideTv, aspect, SIDE_FRAME) - 0.01;
  const side: Layout = { tv: sideTv, book: { x: 0, y: NOTE_STRIP, w: 1, h: sideTop - NOTE_STRIP } };
  const read: Layout = { tv: { x: 0, y: 0.84, w: 1, h: 0.16 }, book: { x: 0, y: NOTE_STRIP, w: 1, h: 0.84 - NOTE_STRIP } };
  // Put away, it peeks in at the right edge beside the set, as in a wide window: along the bottom the notebook would cover it.
  const tv = closedTv(aspect);
  return { closed: { tv, book: { ...side.book, x: 1 - peek, y: tv.y + tv.h / 2 - side.book.h / 2 } }, side, read };
}

/**
 * The TV with the book put away: centred while it clears the peeking book (at its widest, under the
 * pointer); in a narrower window it slides left, then shrinks, so the book's edge always shows beside the set.
 */
function closedTv(aspect: number): Rect {
  const h = 1 - NOTE_ROOM;
  // The set's width (window fraction) at full height: the picture plus the frame round it, as `Tv.draw` fits it.
  const tvW = ((TUBE[0] * ACTIVE[0] + CLOSED_FRAME) / (TUBE[1] * ACTIVE[1] + CLOSED_FRAME)) * h / aspect;
  const room = 1 - PEEK - PEEK_HOVER;
  return { x: 0, y: NOTE_ROOM, w: clamp(2 * room - tvW, room, 1), h };
}

/** Where the book sits on screen for a (fractional) spread: view centre, visible extent, page-stack thickness. The spreads run 0 (cover alone) to `last` (back cover alone). */
export function spreadView(phi: number, last: number): { c: number; xmin: number; xmax: number; stackL: number; stackR: number } {
  const open = smooth(phi);
  const close = smooth(phi - (last - 1));
  const c = 0.5 * (1 - open) - 0.5 * close;
  const xmin = -open;
  const xmax = 1 - close;
  // The leaves under the top one: open at the inside covers, the cover lies alone on its side, with no block under it.
  const frac = clamp((phi - 1) / Math.max(last - 2, 1), 0, 1);
  return {
    c,
    xmin,
    xmax,
    // The paper under each side: pages read pile up on the left, pages to come on the right.
    stackL: PAPER_THICKNESS * frac,
    stackR: PAPER_THICKNESS * (1 - frac),
  };
}

/**
 * The split right now: closed → beside the TV as the book opens, → reading mode; the hover makes a closed book peek out
 * further, and `arrive` (0..1) brings the put-away book in from off the window as the page opens. `notes` is how far the notebook page tucks down out of the book's way (0..1: only in a tall window), and
 * `notesTv` the set the page is sized by: full size beside the book, shrinking only with the TV in reading mode.
 */
export function layoutAt(aspect: number, hoverT: number, openT: number, readT: number, arrive = 1): Layout & { notes: number; notesTv: Rect } {
  // Not yet arrived, the put-away book waits a little past the window's edge, so its tilted corner is out of sight too.
  const L = layouts(aspect, (PEEK + PEEK_HOVER * smooth(hoverT)) * arrive - 0.06 * (1 - arrive));
  const open = smooth(openT);
  const read = smooth(readT);
  const a: Layout = { tv: lerpRect(L.closed.tv, L.side.tv, open), book: lerpRect(L.closed.book, L.side.book, open) };
  return {
    tv: lerpRect(a.tv, L.read.tv, read),
    book: lerpRect(a.book, L.read.book, read),
    notes: aspect < TALL ? open : 0,
    notesTv: lerpRect(L.closed.tv, L.read.tv, read),
  };
}

/** The TV's rectangle and frame at one end of the book's moves (put away or out, side by side or reading), and its share now. */
export interface TvEnd {
  tv: Rect;
  frame: number;
  open: number;
  w: number;
}

/** The ends the arrangement is between now (`layoutAt`'s TV and `Magazine.frame` are these blended, two ways at once), each with its weight. */
export function tvEnds(aspect: number, openT: number, readT: number): TvEnd[] {
  const [o, r] = [smooth(openT), smooth(readT)];
  const ends: TvEnd[] = [];
  for (const open of [0, 1])
    for (const read of [0, 1]) {
      const w = (open ? o : 1 - o) * (read ? r : 1 - r);
      if (w > 0) ends.push({ tv: layoutAt(aspect, 0, open, read).tv, frame: lerp(CLOSED_FRAME, lerp(SIDE_FRAME, READ_FRAME, read), open), open, w });
    }
  return ends;
}

export interface Flip {
  /** The leaf turning: front page `2 * leaf`, back page `2 * leaf + 1`. */
  leaf: number;
  dir: 1 | -1;
  /** 0..1 along the way. */
  t: number;
  /** Where it is heading: 1 = finish the turn, 0 = fall back. */
  to: 0 | 1;
  /** A hand is holding the leaf; `t` follows the pointer. */
  held: boolean;
}

/** What the last frame drew; pointer maths and the toolbar use it. */
export interface View {
  W: number;
  H: number;
  rect: [number, number, number, number];
  scale: number;
  fit: number;
  vx: number;
  vy: number;
  c: number;
  ext: [number, number, number, number];
  win: [number, number];
  /** The part of the book drawn: `win`, and with a left-hand page in view, as much of the right-hand one as fits beside it. */
  see: [number, number];
  /** The camera's tilt this frame: `TILT` with the book out, 0 put away. */
  tilt: number;
  /** The page's turn on screen (`ROLL` put away, 0 out) about `pivot` (pixels: the page's top-left corner). */
  roll: number;
  pivot: [number, number];
  /** Where the magazine may draw (pixels, x0 y0 x1 y1): the whole window put away, its rect once out. */
  clip: [number, number, number, number];
  /** Set while the magazine lies on the table (`Magazine.draw`): the camera it was drawn through, which the pointer then follows. */
  cam?: Cam;
}

/** View `v` laid in book rect `r` (window fractions) instead, fitted to it at `zoom`. */
export function viewIn(v: View, r: Rect, zoom: number): View {
  const rect: View['rect'] = [r.x * v.W, r.y * v.H, (r.x + r.w) * v.W, (r.y + r.h) * v.H];
  const fit = Math.min((r.w * v.W) / PAGE_NEAR_W, (r.h * v.H) / (PAGE_UNIT_H * PAGE_FIT_H));
  return { ...v, rect, fit, scale: fit * zoom, clip: rect };
}

/** Turn pixel point (`x`, `y`) by `a` about the view's pivot. */
function turn(v: View, x: number, y: number, a: number): [number, number] {
  const [cx, cy] = v.pivot;
  const s = Math.sin(a);
  const c = Math.cos(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/** Book-space point under a screen point (window fractions, origin bottom-left), for the view `v` last drawn. */
export function screenToBook(v: View, nx: number, ny: number): [number, number] {
  if (v.cam) return camToBook(v.cam, nx * v.W, ny * v.H);
  const [sx, sy] = turn(v, nx * v.W, ny * v.H, -v.roll);
  const px = (sx - 0.5 * (v.rect[0] + v.rect[2])) / v.scale;
  const py = (sy - 0.5 * (v.rect[1] + v.rect[3])) / v.scale;
  // The same camera ray the shader casts, met with the page plane.
  const s = Math.sin(v.tilt);
  const c = Math.cos(v.tilt);
  const len = Math.hypot(px, py, CAM_DIST);
  const dx = px / len;
  const dy = py / len;
  const dz = -CAM_DIST / len;
  const ey = dy * c - dz * s;
  const ez = dy * s + dz * c;
  const oy = -CAM_DIST * s;
  const oz = CAM_DIST * c;
  const t = -oz / ez;
  return [v.vx + dx * t, v.vy + oy + ey * t];
}

/** Screen point (window fractions, origin bottom-left) of book-space point (`bx`, `by`) on the page plane: `screenToBook` undone. */
export function bookToScreen(v: View, bx: number, by: number): [number, number] {
  const s = Math.sin(v.tilt);
  const c = Math.cos(v.tilt);
  // From the camera to the point, turned back into the camera's frame.
  const rx = bx - v.vx;
  const ry = by - v.vy + CAM_DIST * s;
  const rz = -CAM_DIST * c;
  const cy = ry * c + rz * s;
  const cz = -ry * s + rz * c;
  const k = -CAM_DIST / cz;
  const [sx, sy] = turn(v, rx * k * v.scale + 0.5 * (v.rect[0] + v.rect[2]), cy * k * v.scale + 0.5 * (v.rect[1] + v.rect[3]), v.roll);
  return [sx / v.W, sy / v.H];
}

/**
 * What the book shader can draw in view `v` (pixels: x0, y0, x1, y1), clipped to `v.clip`: the page in view with room for
 * its shadow on the table, or, while a leaf turns (`turning`), that leaf too, standing up over either side of the spine.
 */
export function bookBounds(v: View, turning: boolean): [number, number, number, number] {
  const s = Math.sin(v.tilt);
  const c = Math.cos(v.tilt);
  const hh = PAGE_UNIT_H / 2 + 0.3;
  const xs = turning ? [Math.min(v.see[0], -1.1), Math.max(v.see[1], 1.1)] : [v.see[0] - 0.3, v.see[1] + 0.3];
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const bx of xs)
    for (const by of [-hh, hh])
      for (const bz of [0, turning ? 1.3 : 0.25]) {
        // As bookToScreen, off the page plane.
        const ry = by - v.vy + CAM_DIST * s;
        const rz = bz - CAM_DIST * c;
        const k = -CAM_DIST / (-ry * s + rz * c);
        const [x, y] = turn(v, (bx - v.vx) * k * v.scale + 0.5 * (v.rect[0] + v.rect[2]), (ry * c + rz * s) * k * v.scale + 0.5 * (v.rect[1] + v.rect[3]), v.roll);
        b[0] = Math.min(b[0], x);
        b[1] = Math.min(b[1], y);
        b[2] = Math.max(b[2], x);
        b[3] = Math.max(b[3], y);
      }
  return [Math.max(b[0] - 3, v.clip[0]), Math.max(b[1] - 3, v.clip[1]), Math.min(b[2] + 3, v.clip[2]), Math.min(b[3] + 3, v.clip[3])];
}

/**
 * The view `v` (laid out for the book out) eased toward the book put away by `1 - open`: only the page's top-left corner
 * shows at the window's edge. The view slides so that corner sits at the rect's left, a little below its top, the camera
 * comes round to straight on (a square page), and the page turns about the corner so the rest swings out of the window.
 */
export function putAway(v: View, open: number): View {
  const [x0, y0, x1, y1] = v.rect;
  const away = 1 - open;
  const tuckX = away * (v.win[0] + (x1 - x0) / 2 / v.scale - v.c);
  const tuckY = away * (PAGE_UNIT_H / 2 - ((0.5 - CORNER_DROP) * (y1 - y0)) / v.scale);
  const clip: View['clip'] = [lerp(0, x0, open), lerp(0, y0, open), lerp(v.W, x1, open), lerp(v.H, y1, open)];
  // Only the page in view's corner shows put away: the facing page goes in the first half of the way.
  const see: View['see'] = [v.win[0], lerp(v.win[1], v.see[1], smooth(clamp(2 * open - 1, 0, 1)))];
  const out: View = { ...v, vx: v.vx + tuckX, vy: v.vy + tuckY, tilt: TILT * open, roll: 0, clip, see };
  const [px, py] = bookToScreen(out, v.win[0], PAGE_UNIT_H / 2);
  return { ...out, roll: ROLL * away, pivot: [px * v.W, py * v.H] };
}

/** Whether a screen point (window fractions) is over the book as drawn in `v` (the page in view, and lying open at a spread its facing page), inside the window. */
export function overPage(v: View, nx: number, ny: number): boolean {
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return false;
  const [x, y] = screenToBook(v, nx, ny);
  return x >= v.see[0] && x <= v.see[1] && Math.abs(y) <= PAGE_UNIT_H / 2;
}

/** The page layers in view (left, right, then the turning leaf's front and back; -1 for none) for a spread or a turn. */
export function leafLayers(f: Flip | null, spread: number, count: number): [number, number, number, number] {
  const layer = (i: number) => (i >= 0 && i < count ? i : -1);
  if (f) return [layer(2 * f.leaf - 1), layer(2 * f.leaf + 2), layer(2 * f.leaf), layer(2 * f.leaf + 1)];
  return [layer(2 * spread - 1), layer(2 * spread), -1, -1];
}
