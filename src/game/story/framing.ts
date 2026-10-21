/** Seconds at BASIC's OK prompt with nothing typed before the view drifts back to the desk. */
export const BACK_AFTER = 10;

/**
 * Where the view rests: the whole desk (set, machine, recorder, the magazine and the notes on the table), going in to
 * the set only when the screen needs reading. Typing on the real keyboard goes in, as does the story changing the screen
 * (a tamper, which would be missed from across the room); a while at OK with nothing typed drifts back, and a tape
 * command waiting for a cassette pulls back at once (`back`). A click on the set goes in (`closer`), and another comes
 * back out (`back`); no other click moves it: a click on the machine's keys types without going in, the keyboard being in view.
 */
export class Framing {
  private still = 0;

  constructor(public wide: boolean) {}

  /** One frame: `typed` real keys, the story `tampered` with the screen, BASIC `idle` at OK. */
  step(dt: number, typed: boolean, tampered: boolean, idle: boolean): void {
    if (typed || tampered) {
      this.wide = false;
      this.still = 0;
      return;
    }
    this.still = idle ? this.still + dt : 0;
    if (this.still >= BACK_AFTER) this.wide = true;
  }

  /** In to the set (a click on it); the drift back starts over. */
  closer(): void {
    this.wide = false;
    this.still = 0;
  }

  /** Back to the desk at once (the recorder is wanted, or the set clicked again). */
  back(): void {
    this.wide = true;
    this.still = 0;
  }
}
