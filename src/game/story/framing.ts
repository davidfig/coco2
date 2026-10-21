/** Seconds at BASIC's OK prompt with nothing typed before the view drifts back to the desk. */
export const BACK_AFTER = 10;

/**
 * Where the view rests: the whole desk (set, machine, recorder, the magazine and the notes on the table), going in to
 * the set only when the screen needs reading. The story changing the screen goes in (a tamper, which would be missed
 * from across the room); typing doesn't move the view, but keeps it where it is: a while at OK with nothing typed drifts back, and a tape
 * command waiting for a cassette pulls back at once (`back`). A click on the set goes in (`closer`), and another comes
 * back out (`back`); no other click moves it: a click on the machine's keys types without going in, the keyboard being in view.
 * With the magazine out the same goes for the view beside it (main.ts), between the screen close up and the whole set
 * with the machine: opening the book goes in, and it doesn't drift back out while the book is open.
 */
export class Framing {
  private still = 0;
  /** Pulled back for the recorder (`back(true)`): the whole desk even with the magazine out, which otherwise only goes out as far as the set and the machine. */
  desk = false;

  constructor(public wide: boolean) {}

  /** One frame: `typed` real keys (the drift back starts over), the story `tampered` with the screen, BASIC `idle` at OK. */
  step(dt: number, typed: boolean, tampered: boolean, idle: boolean): void {
    if (tampered) return this.closer();
    this.still = idle && !typed ? this.still + dt : 0;
    if (this.still >= BACK_AFTER) this.wide = true;
  }

  /** In to the set (a click on it); the drift back starts over. */
  closer(): void {
    this.wide = false;
    this.desk = false;
    this.still = 0;
  }

  /** Back to the desk at once (the set clicked again, or `desk`: the recorder is wanted). */
  back(desk = false): void {
    this.wide = true;
    this.desk = desk;
    this.still = 0;
  }
}
