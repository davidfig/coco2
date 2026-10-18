/** What the interpreter reports to a listener (the puzzle watcher): things the player did, not BASIC's internals. */
export type BasicEvent =
  /** A line typed at the OK prompt that runs at once (PRINT 1, RUN, LIST…). */
  | { type: 'direct'; text: string }
  /** A numbered line stored (or deleted, when it was typed with nothing after the number). */
  | { type: 'edit'; num: number; deleted: boolean }
  | { type: 'run'; from?: number }
  /** The program reached this line (by running on, GOTO, GOSUB, RUN n). */
  | { type: 'line'; num: number }
  | { type: 'list'; from: number; to: number }
  /** BREAK or STOP; `line` is null for a typed line. */
  | { type: 'break'; line: number | null }
  | { type: 'cont' }
  | { type: 'error'; code: string; line: number | null }
  | { type: 'csave'; name: string }
  | { type: 'cload'; name: string }
  /** Back at the OK prompt, however it got there (an error and a BREAK both end here). */
  | { type: 'idle' };

export type BasicListener = (e: BasicEvent) => void;
