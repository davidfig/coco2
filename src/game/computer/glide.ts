import type { View } from './deskTable';

/** How long the pull back to the desk takes, about (seconds). */
export const DESK_TIME = 0.6;
/** How long the view's move takes as the book comes out or goes away: `Magazine`'s `openT` (seconds). */
const OPEN_TIME = 0.9;
/** …and as it goes between beside the set and reading size: `Magazine`'s `readT` (seconds). */
const READ_TIME = 0.7;

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The view's moves, each one glide: when where it is heading changes (`key`), it sets off from where it is, eased all
 * the way there over the book's opening time if the book is coming out or going away (`open` changes), its time to go to
 * or from reading size if that changes (`read`), else `DESK_TIME`.
 * The goal is followed live on the way (a window resized), so it always arrives.
 */
export class Glide {
  private from: View | null = null;
  private last: View | null = null;
  private key = '';
  private open = -1;
  private read = -1;
  private t = 1;
  /** How long the move now under way takes (seconds): the desk and the papers on it move in the same time, so all of it ends together. */
  secs = DESK_TIME;

  step(dt: number, goal: View, key: string, open: number, read = 0): View {
    if (key !== this.key && this.last) {
      [this.from, this.t, this.secs] = [this.last, 0, open !== this.open ? OPEN_TIME : read !== this.read ? READ_TIME : DESK_TIME];
    }
    [this.key, this.open, this.read] = [key, open, read];
    this.t = Math.min(1, this.t + dt / this.secs);
    const f = this.from;
    const e = smooth(this.t);
    this.last = !f || this.t === 1 ? goal : { cx: f.cx + (goal.cx - f.cx) * e, cy: f.cy + (goal.cy - f.cy) * e, k: f.k * Math.pow(goal.k / f.k, e) };
    return this.last;
  }

  /** Be wherever the next goal is at once. */
  snap(): void {
    this.last = null;
    this.t = 1;
  }
}
