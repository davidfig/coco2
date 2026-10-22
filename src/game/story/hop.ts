/**
 * Every hop, the notes', the magazine's and a cassette's alike: this many bounces, each this long (seconds), rising this
 * high off the table (the desk's model units: about half an inch, a tenth of the paper's half-depth).
 */
export const BOUNCES = 2;
export const BOUNCE_TIME = 0.32;
export const HOP_HEIGHT = 0.1;

/**
 * The guide's call (`Guide`) to a magazine or notes lying on the table, where their own (the page peeking up, the book
 * sliding out) can't show, or to a cassette waiting to go in the recorder: it hops off the table and lands again, twice.
 */
export class Hop {
  private left = 0;

  /** Start a hop, unless one is still going. */
  start(): void {
    if (this.left <= 0) this.left = BOUNCES * BOUNCE_TIME;
  }

  step(dt: number): void {
    this.left = Math.max(0, this.left - dt);
  }

  /** How high it is off the table now; each bounce starts and ends on it. */
  lift(): number {
    return this.left > 0 ? Math.abs(Math.sin((Math.PI * this.left) / BOUNCE_TIME)) * HOP_HEIGHT : 0;
  }
}
