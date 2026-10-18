import { CELL_H, CELL_W, GLYPHS } from './charset';
import { BLACK, Rgb, SG_COLORS, TEXT_DARK, TEXT_GREEN } from './palette';

export const COLS = 32;
export const ROWS = 16;
export const WIDTH = COLS * CELL_W; // 256
export const HEIGHT = ROWS * CELL_H; // 192

/**
 * The MC6847 in its power-on mode (alphanumerics + semigraphics 4): turns 512 bytes of video memory into a 256×192
 * RGBA image. Bytes 0x00–0x7F are characters (bit 6 = normal, clear = inverse); 0x80–0xFF are semigraphics 4 blocks
 * (bits 6..4 colour, bits 3..0 the four quarters, top-left first). The border is black in this mode.
 */
export class Vdg {
  readonly pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  readonly border: Rgb = BLACK;

  /** Redraw from `vram`. `overlay` (cell → byte) shows a byte at a cell without changing memory: the cursor. */
  render(vram: Uint8Array, overlay?: { at: number; code: number }): void {
    for (let cell = 0; cell < COLS * ROWS; cell++) {
      const code = overlay && overlay.at === cell ? overlay.code : vram[cell];
      if (code & 0x80) this.block(cell, code);
      else this.char(cell, code);
    }
  }

  private char(cell: number, code: number): void {
    const glyph = (code & 0x3f) * CELL_H;
    const normal = (code & 0x40) !== 0;
    const ink = normal ? TEXT_DARK : TEXT_GREEN;
    const paper = normal ? TEXT_GREEN : TEXT_DARK;
    const x0 = (cell % COLS) * CELL_W;
    const y0 = Math.floor(cell / COLS) * CELL_H;
    for (let r = 0; r < CELL_H; r++) {
      const dots = GLYPHS[glyph + r];
      for (let c = 0; c < CELL_W; c++) this.put(x0 + c, y0 + r, dots & (0x80 >> c) ? ink : paper);
    }
  }

  private block(cell: number, code: number): void {
    const color = SG_COLORS[(code >> 4) & 7];
    const x0 = (cell % COLS) * CELL_W;
    const y0 = Math.floor(cell / COLS) * CELL_H;
    for (let r = 0; r < CELL_H; r++) {
      for (let c = 0; c < CELL_W; c++) {
        const bit = 3 - ((r < 6 ? 0 : 2) + (c < 4 ? 0 : 1));
        this.put(x0 + c, y0 + r, code & (1 << bit) ? color : BLACK);
      }
    }
  }

  private put(x: number, y: number, rgb: Rgb): void {
    const i = (y * WIDTH + x) * 4;
    this.pixels[i] = rgb[0];
    this.pixels[i + 1] = rgb[1];
    this.pixels[i + 2] = rgb[2];
    this.pixels[i + 3] = 255;
  }
}
