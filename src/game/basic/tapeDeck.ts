import type { TextScreen } from '../coco/screen';

/** One stretch of a tape operation: how long it takes, what the top-left corner shows meanwhile, what happens after. */
export interface TapeStep {
  seconds: number;
  banner?: string;
  done?: () => void;
}

/** How much faster than the nominal times below the tape runs (a CoCo's own tapes were slower still). */
const DEFAULT_SPEED = 1.4;

/**
 * The cassette recorder's motor: plays a CLOAD, SKIPF or CSAVE out over time. As on the CoCo, the top-left corner of
 * the screen shows `S` while searching and `F NAME` for each file found. `speed` Infinity makes it instant.
 */
export class TapeDeck {
  private steps: TapeStep[] = [];
  private left = 0;

  constructor(private readonly screen: TextScreen, public speed = DEFAULT_SPEED) {}

  play(steps: TapeStep[]): void {
    this.steps = steps;
    this.left = 0;
    this.start();
  }

  stop(): void {
    this.steps = [];
  }

  /** Advance the tape; a step's `done` may throw a BASIC error (the interpreter reports it). */
  step(dt: number): void {
    this.left -= dt;
    while (this.steps.length && this.left <= 0) {
      const s = this.steps.shift()!;
      s.done?.();
      this.start();
    }
  }

  private start(): void {
    const s = this.steps[0];
    if (!s) return;
    if (s.banner !== undefined) this.screen.writeAt(0, s.banner.padEnd(10));
    this.left += s.seconds / this.speed;
  }
}

/** How long the tape takes to read or write a program: CoCo tapes ran at 1500 baud; ours is a little quicker. */
export function tapeSeconds(text: string): number {
  return Math.min(4, Math.max(0.6, text.length / 800));
}
