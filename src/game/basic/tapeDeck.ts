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
 * the screen shows `S` while searching and `F NAME` for each file found. `speed` Infinity makes it instant. Nothing
 * moves until `ready` (a cassette in the recorder, PLAY down): the command waits there, as the CoCo waits for a tape
 * that never comes, until BREAK.
 */
export class TapeDeck {
  private steps: TapeStep[] = [];
  private left = 0;
  /** What the command does once the tape can move: its steps are worked out then (where the tape is, what is on it). */
  private pending: (() => TapeStep[]) | null = null;
  /** What the motor is doing: playing, recording (CSAVE), or nothing. */
  mode: 'play' | 'record' | null = null;

  constructor(private readonly screen: TextScreen, private readonly ready: () => boolean = () => true, public speed = DEFAULT_SPEED) {}

  /** Run the tape through the steps `build` gives once it can move; until then the corner shows `waiting`, if given. */
  play(build: () => TapeStep[], record = false, waiting?: string): void {
    this.steps = [];
    this.left = 0;
    this.pending = build;
    this.mode = record ? 'record' : 'play';
    if (waiting !== undefined) this.screen.writeAt(0, waiting.padEnd(10));
    this.begin();
  }

  stop(): void {
    this.steps = [];
    this.pending = null;
    this.mode = null;
  }

  /** Waiting for a cassette: the command was given and the tape can't move. */
  get waiting(): boolean {
    return this.pending !== null;
  }

  /** The motor is running: the tape moving under the head. */
  get running(): boolean {
    return this.pending === null && this.steps.length > 0;
  }

  /** Advance the tape; a step's `done` may throw a BASIC error (the interpreter reports it). */
  step(dt: number): void {
    if (this.pending) return this.begin();
    this.left -= dt;
    while (this.steps.length && this.left <= 0) {
      const s = this.steps.shift()!;
      s.done?.();
      this.start();
    }
  }

  private begin(): void {
    if (!this.pending || !this.ready()) return;
    this.steps = this.pending();
    this.pending = null;
    this.start();
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
