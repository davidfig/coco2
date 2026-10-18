import { PAGE_COUNT } from './issue';
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

/** Page height in page widths. */
export const PAGE_UNIT_H = PAGE_H / PAGE_W;
/** Window room round one page, in page widths / heights. */
export const PAGE_FIT_W = 1.02;
export const PAGE_FIT_H = 1.03;
/** The whole block of paper, in page widths (kept tiny: no slab of paper edge shows; the 3D comes from the curl and the light). */
export const PAPER_THICKNESS = 0.004;
/** The camera looks down at the book from this tilt (radians back from straight on) and distance (page widths). */
export const TILT = 0.42;
export const CAM_DIST = 4.5;
/** With the book put away, the TV sits this far (window fraction) off the bottom: room for the notebook page to peek up over the set without covering the picture. */
export const NOTE_ROOM = 0.08;
/** The spreads run 0 (cover alone) to this (back cover alone). */
export const LAST_SPREAD = PAGE_COUNT / 2;

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
 * the magazine reading-size with the TV pushed to a strip. Wide windows split left/right, tall ones top/bottom.
 */
export function layouts(aspect: number, peek: number): { closed: Layout; side: Layout; read: Layout } {
  if (aspect >= 0.9) {
    // Just wide enough for one page at full height: nothing else sits beside it now.
    const panel = Math.min(PAGE_FIT_W / (PAGE_UNIT_H * PAGE_FIT_H) / aspect, 0.68);
    const side: Layout = { tv: { x: 0, y: 0, w: 1 - panel, h: 1 }, book: { x: 1 - panel, y: 0, w: panel, h: 1 } };
    const read: Layout = { tv: { x: 0, y: 0, w: 0.2, h: 1 }, book: { x: 0.2, y: 0, w: 0.8, h: 1 } };
    return { closed: { tv: { x: 0, y: NOTE_ROOM, w: 1, h: 1 - NOTE_ROOM }, book: { ...side.book, x: 1 - peek } }, side, read };
  }
  const side: Layout = { tv: { x: 0, y: 0.5, w: 1, h: 0.5 }, book: { x: 0, y: 0, w: 1, h: 0.5 } };
  const read: Layout = { tv: { x: 0, y: 0.84, w: 1, h: 0.16 }, book: { x: 0, y: 0, w: 1, h: 0.84 } };
  return { closed: { tv: { x: 0, y: NOTE_ROOM, w: 1, h: 1 - NOTE_ROOM }, book: { ...side.book, y: peek - side.book.h } }, side, read };
}

/** Where the book sits on screen for a (fractional) spread: view centre, visible extent, page-stack thickness. */
export function spreadView(phi: number): { c: number; xmin: number; xmax: number; stackL: number; stackR: number } {
  const open = smooth(phi);
  const close = smooth(phi - (LAST_SPREAD - 1));
  const c = 0.5 * (1 - open) - 0.5 * close;
  const xmin = -open;
  const xmax = 1 - close;
  const frac = clamp(phi / LAST_SPREAD, 0, 1);
  return {
    c,
    xmin,
    xmax,
    // The paper under each side: pages read pile up on the left, pages to come on the right.
    stackL: PAPER_THICKNESS * frac,
    stackR: PAPER_THICKNESS * (1 - frac),
  };
}

/** The split right now: closed → beside the TV as the book opens, → reading mode; the hover makes a closed book peek out further. */
export function layoutAt(aspect: number, hoverT: number, openT: number, readT: number): Layout {
  const L = layouts(aspect, 0.07 + 0.04 * smooth(hoverT));
  const open = smooth(openT);
  const read = smooth(readT);
  const a: Layout = { tv: lerpRect(L.closed.tv, L.side.tv, open), book: lerpRect(L.closed.book, L.side.book, open) };
  return { tv: lerpRect(a.tv, L.read.tv, read), book: lerpRect(a.book, L.read.book, read) };
}
