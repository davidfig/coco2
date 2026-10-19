import type { Interpreter } from '../basic/interpreter';
import type { TextScreen } from '../coco/screen';
import { Program } from '../basic/program';
import { MAY_TAPE_KEY } from '../tapes';
import { OK_LINES, OK_MESSAGE, PLUG_HELD, PLUG_LINE, PLUG_PRINTED, PLUG_QUESTION, isShutdown } from '../puzzles/listingsMay';
import { screenText } from '../puzzles/rules';
import type { Rule } from '../puzzles/watcher';
import { COLS, ROWS } from '../vdg/vdg';
import { rowText } from './screenText';

/** Seconds the OK prompt is late through issue 2, until the player answers ORACLE. Long enough to feel, short enough to doubt. */
const PROMPT_LAG = 0.6;
/** Seconds between the cursor's colours slipping out of order, at the OK prompt (a range: it should not feel like a clock). */
const MISSTEP_EVERY: readonly [number, number] = [18, 34];
/** Prompts after the answer before the player notices they come on time (the first one is still being read). */
const ON_TIME_AFTER = 2;
/** Seconds at OK, once the plug has been held, before the player is taken to have left OK's line 710 as it is. */
const LEAVE_AFTER = 25;
/** The same, once they have gone off to load something else. */
const LEAVE_AFTER_GOING_ON = 6;

/**
 * What the story does in issue 2 (see `docs/flags.md`, Issue 2), besides the May cassette coming (it lies by the
 * recorder for the player to put in: `recorder/`): until the player answers ORACLE the machine is a little off in
 * deniable ways (a late OK, a cursor colour out of order). OK's lines shimmer whenever a listing puts them on the screen,
 * and so does his message when the decoder prints it. SHUTDOWN's first win makes the set flinch, and then OK changes the
 * line that pulls the plug (P8), and waits to see what the player does about it. The puzzles' own flags are in
 * `puzzles/rulesMay.ts`.
 */
export class Issue2Story {
  private misstepIn = MISSTEP_EVERY[0];
  private prompts = 0;
  private onTimeIn = -1;
  private leftIn = -1;

  constructor(
    private readonly screen: TextScreen,
    private readonly has: (flag: string) => boolean,
    private readonly set: (flag: string) => void,
    private readonly interp: Interpreter,
    private readonly flinch: () => void = () => {},
  ) {}

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
    const text = screenText(this.screen.vram);
    const at = text.indexOf(OK_MESSAGE);
    if (at >= 0) this.screen.claim(at, OK_MESSAGE.length);
    // His question at the plug, as SHUTDOWN prints it.
    const asked = this.has('plug-changed') ? text.indexOf(PLUG_QUESTION) : -1;
    if (asked >= 0) this.screen.claim(asked, PLUG_QUESTION.length);
  };

  /** The lights going out in SHUTDOWN, the first time: the set flinches with them. */
  private readonly lightsOut: Rule = (e) => {
    if (e.type !== 'line' || e.num !== 760 || this.has('flinched') || !this.has('issue2-waiting') || !isShutdown(this.interp.program)) return;
    this.flinch();
    this.set('flinched');
  };

  /**
   * Once the plug has been held, what the player does next: working on line 710 or running the game is still deciding,
   * loading something else is going on without it.
   */
  private readonly deciding: Rule = (e) => {
    if (!this.has('plug-held') || this.has('plug-pulled') || this.has('plug-left')) return;
    if (e.type === 'run' || (e.type === 'edit' && e.num === PLUG_LINE)) this.leftIn = LEAVE_AFTER;
    else if (e.type === 'cload') this.leftIn = LEAVE_AFTER_GOING_ON;
    else if (this.leftIn < 0) this.leftIn = LEAVE_AFTER;
  };

  /**
   * After the first win, OK changes the line that pulls the plug: in memory if SHUTDOWN is there, and on the May tape if it
   * is in the recorder, so a fresh CLOAD shows it too. Only at OK (changing lines under a running program would lose its
   * place); with neither to hand, he waits.
   */
  private holdPlug(): void {
    if (this.interp.state !== 'idle') return;
    let done = false;
    const p = this.interp.program;
    if (isShutdown(p) && p.index(PLUG_LINE) >= 0) {
      p.set(PLUG_LINE, PLUG_HELD.slice(String(PLUG_LINE).length));
      done = true;
    }
    const file = this.interp.tape.cassette === MAY_TAPE_KEY ? this.interp.tape.files().find((f) => f.name === 'SHUTDOWN') : undefined;
    if (file) {
      const copy = new Program();
      copy.load(file.text);
      copy.set(PLUG_LINE, PLUG_HELD.slice(String(PLUG_LINE).length));
      this.interp.tape.save('SHUTDOWN', copy.save());
      done = true;
    }
    if (done) this.set('plug-changed');
  }

  /** Once ORACLE is answered, the next prompts come up on time, and after a couple the player notices. */
  private readonly onTime: Rule = (e) => {
    if (e.type !== 'idle' || !this.has('oracle-answered') || this.has('prompt-on-time')) return;
    if (++this.prompts === ON_TIME_AFTER) this.onTimeIn = 1.5;
  };

  readonly rules: readonly Rule[] = [this.hisLines, this.onTime, this.lightsOut, this.deciding];

  /** The set was switched off: once ORACLE is answered and noticed, that is the end of the second evening. */
  sleep(): void {
    if (this.has('issue2-done')) this.set('issue2-closed');
  }

  step(dt: number): void {
    const uneasy = this.has('issue2-waiting') && !this.has('oracle-answered');
    this.interp.promptLag = uneasy ? PROMPT_LAG : 0;
    if (uneasy && this.interp.state === 'idle' && (this.misstepIn -= dt) <= 0) {
      this.screen.misstep();
      this.misstepIn = MISSTEP_EVERY[0] + Math.random() * (MISSTEP_EVERY[1] - MISSTEP_EVERY[0]);
    }
    if (this.onTimeIn > 0 && (this.onTimeIn -= dt) <= 0) this.set('prompt-on-time');
    if (this.has('shutdown-won') && !this.has('plug-changed')) this.holdPlug();
    if (this.leftIn > 0 && this.interp.state === 'idle' && !this.has('plug-pulled') && (this.leftIn -= dt) <= 0) {
      // Line 710 put back as printed: they mean to pull it, and are only resting. Otherwise they have left it.
      const p = this.interp.program;
      if (isShutdown(p) && p.list().includes(PLUG_PRINTED)) this.leftIn = LEAVE_AFTER;
      else this.set('plug-left');
    }
    const decided = this.has('plug-pulled') || this.has('plug-left');
    if (this.has('prompt-on-time') && decided && !this.has('issue2-done')) this.set('issue2-done');
  }
}
