import type { TextScreen } from '../coco/screen';
import { screenCode } from '../vdg/charset';
import { COLS } from '../vdg/vdg';

/** Screen byte → character, for reading the screen back. */
const CHAR = new Map<number, string>();
for (let a = 0x20; a <= 0x5d; a++) CHAR.set(screenCode(String.fromCharCode(a))!, String.fromCharCode(a));

/** The screen's text on one row, one character per cell ("?" for a block). */
export function rowText(screen: TextScreen, row: number): string {
  let s = '';
  for (let c = 0; c < COLS; c++) s += CHAR.get(screen.vram[row * COLS + c]) ?? '?';
  return s;
}
