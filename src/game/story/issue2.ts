import type { Interpreter } from '../basic/interpreter';
import { TAPE_KEY } from '../basic/tape';
import type { TextScreen } from '../coco/screen';
import { OK_LINES, OK_MESSAGE } from '../puzzles/listingsMay';
import { screenText } from '../puzzles/rules';
import type { Rule } from '../puzzles/watcher';
import { MAY_TAPE_KEY, RAINBOW_TAPE, mayTape } from '../tapes';
import { COLS, ROWS } from '../vdg/vdg';
import { rowText } from './screenText';

/** Seconds the OK prompt is late through issue 2, until the player answers ORACLE. Long enough to feel, short enough to doubt. */
const PROMPT_LAG = 0.6;
/** Seconds between the cursor's colours slipping out of order, at the OK prompt (a range: it should not feel like a clock). */
const MISSTEP_EVERY: readonly [number, number] = [18, 34];
/** Prompts after the answer before the player notices they come on time (the first one is still being read). */
const ON_TIME_AFTER = 2;

/**
 * What the story does in issue 2 (see `docs/flags.md`, Issue 2): the May tape goes into the recorder, and until the player
 * answers ORACLE the machine is a little off in deniable ways (a late OK, a cursor colour out of order). OK's lines shimmer
 * whenever a listing puts them on the screen, and so does his message when the decoder prints it. The puzzles' own flags are
 * in `puzzles/rulesMay.ts`.
 */
export class Issue2Story {
  private cassette: 'march' | 'may' | null = null;
  private misstepIn = MISSTEP_EVERY[0];
  private prompts = 0;
  private onTimeIn = -1;

  constructor(private readonly screen: TextScreen, private readonly has: (flag: string) => boolean, private readonly set: (flag: string) => void, private readonly interp: Interpreter) {}

  /** The cassette in the recorder follows the issue on the table: the May tape once May has come (a checkpoint may go back). */
  private insertTape(): void {
    const want = this.has('issue2-waiting') ? 'may' : 'march';
    if (want === this.cassette) return;
    this.cassette = want;
    if (want === 'may') this.interp.tape.insert(mayTape(this.has('deleted-extra-line')), MAY_TAPE_KEY);
    else this.interp.tape.insert(RAINBOW_TAPE, TAPE_KEY);
  }

  /** OK's lines in a listing, and his message as the decoder prints it, are his: claimed, so they shimmer and keep rippling. */
  private readonly hisLines: Rule = (e) => {
    if (e.type !== 'idle' || !this.has('issue2-waiting')) return;
    const mine = this.interp.program.list().filter((l) => OK_LINES.includes(l));
    for (let r = 0; r < ROWS; r++) {
      const row = rowText(this.screen, r);
      for (const l of mine) {
        if (!row.startsWith(l.slice(0, COLS))) continue;
        const from = l.indexOf(' ') + 1; // after the line number
        this.screen.claim(r * COLS + from, l.length - from);
      }
    }
    // The message may run over the end of a row, so it is looked for in the screen as one long line.
    const at = screenText(this.screen.vram).indexOf(OK_MESSAGE);
    if (at >= 0) this.screen.claim(at, OK_MESSAGE.length);
  };

  /** Once ORACLE is answered, the next prompts come up on time, and after a couple the player notices. */
  private readonly onTime: Rule = (e) => {
    if (e.type !== 'idle' || !this.has('oracle-answered') || this.has('prompt-on-time')) return;
    if (++this.prompts === ON_TIME_AFTER) this.onTimeIn = 1.5;
  };

  readonly rules: readonly Rule[] = [this.hisLines, this.onTime];

  /** The set was switched off: once ORACLE is answered and noticed, that is the end of the second evening. */
  sleep(): void {
    if (this.has('issue2-done')) this.set('issue2-closed');
  }

  step(dt: number): void {
    this.insertTape();
    const uneasy = this.has('issue2-waiting') && !this.has('oracle-answered');
    this.interp.promptLag = uneasy ? PROMPT_LAG : 0;
    if (uneasy && this.interp.state === 'idle' && (this.misstepIn -= dt) <= 0) {
      this.screen.misstep();
      this.misstepIn = MISSTEP_EVERY[0] + Math.random() * (MISSTEP_EVERY[1] - MISSTEP_EVERY[0]);
    }
    if (this.onTimeIn > 0 && (this.onTimeIn -= dt) <= 0) this.set('prompt-on-time');
    if (this.has('prompt-on-time') && !this.has('issue2-done')) this.set('issue2-done');
  }
}
