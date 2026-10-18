import type { BasicEvent } from '../basic/events';
import type { Interpreter } from '../basic/interpreter';
import type { Program } from '../basic/program';

/** What a rule can see and do: the machine, and the story's flags. */
export interface PuzzleContext {
  interp: Interpreter;
  has(flag: string): boolean;
  set(flag: string): void;
}

/** A puzzle's solution test. It is handed every event and may keep its own state in a closure. */
export type Rule = (e: BasicEvent, ctx: PuzzleContext) => void;

/**
 * Watches what the player does in BASIC and ticks story flags when a puzzle is solved. Rules are plain functions in
 * `rules.ts`; this class only feeds them events. Flags are the single record of progress (the magazine saves them).
 */
export class PuzzleWatcher {
  private readonly ctx: PuzzleContext;

  constructor(interp: Interpreter, has: (flag: string) => boolean, set: (flag: string) => void, private readonly rules: readonly Rule[]) {
    this.ctx = { interp, has, set };
    interp.listener = (e) => this.handle(e);
  }

  handle(e: BasicEvent): void {
    for (const rule of this.rules) rule(e, this.ctx);
  }
}

/** A line with the spaces outside quotes taken out, so `20 PRINT "A"` and `20PRINT "A"` compare equal. */
function squash(line: string): string {
  return line.split('"').map((part, i) => (i % 2 === 0 ? part.replace(/ /g, '') : part)).join('"').toUpperCase();
}

/** True when the program in memory is exactly these lines (spacing outside quotes does not matter). */
export function programIs(program: Program, listing: readonly string[]): boolean {
  const have = program.list().map(squash);
  return have.length === listing.length && listing.every((l, i) => squash(l) === have[i]);
}
