import { SPACE } from '../vdg/charset';
import { COLS, ROWS } from '../vdg/vdg';

/** `at` for a cell nothing has tampered with (or that BASIC has written over since): no effect at all. */
const NEVER = -1e9;

/**
 * Which cells were changed by something other than BASIC, when, and what they held before. The TV turns this into a
 * disturbance in the tube (see `TAMPER_STYLES` in tvShader.ts), so that the change looks like the screen's doing, not
 * the data's. It scrolls with the text and is wiped by CLS.
 */
export class Tamper {
  /** When each cell was last tampered with, in `clock` seconds. */
  readonly at = new Float32Array(COLS * ROWS).fill(NEVER);
  /** What each tampered cell showed before (the phosphor ghost and the re-scan draw it). */
  readonly before = new Uint8Array(COLS * ROWS).fill(SPACE);
  /** Seconds since the screen was made. */
  clock = 0;
  private changed = true;

  mark(cell: number, old: number): void {
    this.at[cell] = this.clock;
    this.before[cell] = old;
    this.changed = true;
  }

  /** True if the cell holds the story's text (it has a mark BASIC has not written over). */
  isMarked(cell: number): boolean {
    return this.at[cell] !== NEVER;
  }

  /** BASIC wrote this cell itself: what is there now is the machine's, not the story's. */
  forget(cell: number): void {
    if (this.at[cell] === NEVER) return;
    this.at[cell] = NEVER;
    this.changed = true;
  }

  scroll(): void {
    this.at.copyWithin(0, COLS);
    this.at.fill(NEVER, this.at.length - COLS);
    this.before.copyWithin(0, COLS);
    this.changed = true;
  }

  clear(): void {
    this.at.fill(NEVER);
    this.changed = true;
  }

  step(dt: number): void {
    this.clock += dt;
  }

  takeChanged(): boolean {
    const c = this.changed;
    this.changed = false;
    return c;
  }
}
