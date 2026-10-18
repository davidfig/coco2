import { COLS } from '../vdg/vdg';

/**
 * Color BASIC's low-res graphics on the text screen: 64×32 dots, each cell a semigraphics 4 byte holding four dots
 * in one colour. Colours are 1–8 (green, yellow, blue, red, buff, cyan, magenta, orange); 0 means "keep the cell's".
 */
function cellAndBit(x: number, y: number): [number, number] {
  return [(y >> 1) * COLS + (x >> 1), 1 << (3 - ((y & 1) * 2 + (x & 1)))];
}

/** SET(x, y, c): light a dot. The whole cell takes the colour, as on the real thing. */
export function setDot(vram: Uint8Array, x: number, y: number, color: number): void {
  const [cell, bit] = cellAndBit(x, y);
  const old = vram[cell] & 0x80 ? vram[cell] : 0x80;
  const hue = color === 0 ? (old >> 4) & 7 : color - 1;
  vram[cell] = 0x80 | (hue << 4) | (old & 0x0f) | bit;
}

/** RESET(x, y): put a dot out. */
export function resetDot(vram: Uint8Array, x: number, y: number): void {
  const [cell, bit] = cellAndBit(x, y);
  const old = vram[cell] & 0x80 ? vram[cell] : 0x80;
  vram[cell] = old & ~bit;
}

/** POINT(x, y): the dot's colour (1–8), 0 if it's off, -1 if the cell holds a character. */
export function pointDot(vram: Uint8Array, x: number, y: number): number {
  const [cell, bit] = cellAndBit(x, y);
  const v = vram[cell];
  if (!(v & 0x80)) return -1;
  return v & bit ? ((v >> 4) & 7) + 1 : 0;
}
