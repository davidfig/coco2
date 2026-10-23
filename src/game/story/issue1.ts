import type { Interpreter } from '../basic/interpreter';
import { Program } from '../basic/program';
import type { TextScreen } from '../coco/screen';
import { firstProgramName, isAdvent, isGuess } from '../puzzles/rules';
import { ADVENT, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';
import type { Rule } from '../puzzles/watcher';
import type { Tv } from '../tv/tv';
import { rowText } from './screenText';
import { COLS, ROWS } from '../vdg/vdg';

/** Where the player's name is kept between sessions (the first program asks for it). */
export const NAME_KEY = 'coco2.name';
/** How strong the tube's tamper effect is in this issue: clear enough to catch the eye, but over in a moment (see design.md). */
const TAMPER_STRENGTH = 0.85;
/** Seconds after ADVENT has been won before something writes on the screen by itself. */
const VOICE_AFTER = 1.5;
/** Seconds between its letters. */
const LETTER_GAP = 0.35;
/** Seconds after OK's answer appears on screen before the player writes it down. */
const SAW_AFTER = 1.5;
/** What it writes: the first thing the player ever typed to the machine. */
const VOICE = 'HELLO';
/**
 * Seconds the player has to delete the extra line before OK takes it that they are keeping it. Leaving it means doing
 * nothing, so this must be short: at 45 s the game simply looked stuck.
 */
const KEEP_AFTER = 12;
/** The same, once the player has run GUESS with the line still in it, or loaded something else: they have gone on. */
const KEEP_AFTER_GOING_ON = 8;
/** Seconds after a LOOK is answered before the word in the room changes: long enough to have read the room. */
const LAMP_AFTER = 2.5;
/** Seconds between the player having the whole picture (deleted line) and OK putting the line back. */
const PLEAD_AFTER = 5;

function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * What the story does in issue 1, besides the puzzles: the machine's first hand on the screen, and OK's first line in
 * the player's notebook (see `docs/flags.md`). Everything is faint and happens once. Rules are fed the interpreter's
 * events by the puzzle watcher; `step` runs the timers.
 */
export class Issue1Story {
  private readonly later: { t: number; fn: () => void }[] = [];
  private keptFor = 0;
  private keptAfter = KEEP_AFTER;
  private pleadFor = 0;
  /** ADVENT has reached the vault; the next time it stops, OK speaks. */
  private inVault = false;
  /** The prompt that follows the win belongs to HELLO; the name waits for a later one. */
  private winPrompt = false;

  constructor(private readonly screen: TextScreen, tv: Tv, private readonly has: (flag: string) => boolean, private readonly set: (flag: string) => void, private readonly interp: Interpreter) {
    tv.tamperStrength = TAMPER_STRENGTH;
    // The beam repaints the changed letters (a bright line down each cell) and the old ones fade: both, so it shows.
    tv.tamperStyle = 'both';
  }

  /** The screen's text on one row, one character per cell ("?" for a block). */
  rowText(row: number): string {
    return rowText(this.screen, row);
  }

  /** The cell where `text` first appears on the screen, searching from the bottom row up (-1: not there). */
  find(text: string): number {
    for (let r = ROWS - 1; r >= 0; r--) {
      const i = this.rowText(r).indexOf(text);
      if (i >= 0) return r * COLS + i;
    }
    return -1;
  }

  private after(seconds: number, fn: () => void): void {
    this.later.push({ t: seconds, fn });
  }

  /** The player's name is kept when the first program has asked for it. */
  private readonly rememberName: Rule = (e, ctx) => {
    const name = firstProgramName(e, ctx.interp);
    try {
      if (name) localStorage.setItem(NAME_KEY, name);
    } catch {
      /* private window: OK just will not know the name */
    }
  };

  /** The first LOOK has been answered; a moment later, one word in the room has changed. */
  private readonly lampWaits: Rule = (e, ctx) => {
    if (e.type !== 'line' || e.num !== ADVENT.prompt || !isAdvent(ctx.interp.program)) return;
    if (!this.has('looked') || !this.has('adventure-runs') || this.has('tamper-lamp')) return;
    this.after(LAMP_AFTER, () => {
      const at = this.find('A LAMP SITS ON IT.');
      if (at < 0) return;
      this.screen.tamper(at + 'A LAMP '.length, 'WAITS ON IT.');
      this.set('tamper-lamp');
    });
  };

  /**
   * Past the door, the first plain OK prompt after the one that follows the win (that one belongs to HELLO) says the player's name
   * instead of OK, and then, a moment later, OK again.
   */
  private readonly nameAtPrompt: Rule = (e) => {
    if (e.type !== 'idle' || !this.has('door-open') || this.has('tamper-name') || !savedName()) return;
    if (this.winPrompt) {
      this.winPrompt = false;
      return;
    }
    // While OK still owes an answer about line 125, the prompt is his for that; the name comes after.
    if (this.has('found-extra-line') && this.has('seen-guess') && !this.has('ok-pleads') && !this.has('ok-thanks')) return;
    this.after(2.2, () => {
      const name = savedName();
      const row = [...Array(ROWS).keys()].reverse().find((r) => this.rowText(r) === 'OK'.padEnd(COLS));
      if (row === undefined || !name || this.has('tamper-name')) return;
      this.screen.tamper(row * COLS, name.padEnd(2));
      this.set('tamper-name');
      this.after(3.5, () => {
        const back = [...Array(ROWS).keys()].reverse().find((r) => this.rowText(r).startsWith(name));
        if (back !== undefined) this.screen.tamper(back * COLS, 'OK'.padEnd(name.length));
      });
    });
  };

  /**
   * The game ends plainly (the win, the score, BASIC's own OK). A moment later, on the empty row above that prompt, something
   * writes HELLO, the first thing the player ever typed, one letter at a time with the shimmer. Nothing in the program
   * leads up to it, so it cannot be read as the game's own ending.
   */
  private readonly vaultVoice: Rule = (e, ctx) => {
    if (e.type === 'line' && e.num === ADVENT.ending && isAdvent(ctx.interp.program)) this.inVault = true;
    if (e.type !== 'idle' || !this.inVault) return;
    this.inVault = false;
    this.winPrompt = true;
    this.after(VOICE_AFTER, () => {
      const at = this.find('SCORE:');
      const row = Math.floor(at / COLS) + 2;
      if (at < 0 || row >= ROWS) return;
      [...VOICE].forEach((ch, i) => this.after(i * LETTER_GAP, () => this.screen.tamper(row * COLS + i, ch)));
      // Once the whole word is there (and has had a moment to be seen), the player can write it down.
      this.after(VOICE.length * LETTER_GAP + 0.8, () => this.set('tamper-voice'));
    });
  };

  /** The player ran GUESS with the extra line in it, or went off to load something else: they are keeping it. */
  private readonly keptSignal: Rule = (e, ctx) => {
    if (!this.has('found-extra-line') || this.has('deleted-extra-line')) return;
    const p = ctx.interp.program;
    if ((e.type === 'run' && isGuess(p) && p.index(GUESS_EXTRA_LINE) >= 0) || e.type === 'cload') this.keptAfter = KEEP_AFTER_GOING_ON;
  };

  /**
   * OK rewrites the extra line in the GUESS in memory. He only does it at the OK prompt (changing lines under a running program
   * would send it to the wrong place), so if GUESS is not there yet he waits until it is.
   */
  private writeLine(text: string, flag: string, shown: string, saw: string): void {
    if (this.interp.state !== 'idle') return;
    const p = this.interp.program;
    // The GUESS in memory if that is where it is; otherwise the copy on the tape, so the next CLOAD "GUESS" shows it.
    if (isGuess(p)) p.set(GUESS_EXTRA_LINE, `REM ${text}`);
    else {
      const file = this.interp.tape.files().find((f) => f.name === 'GUESS');
      if (file) {
        const copy = new Program();
        copy.load(file.text);
        copy.set(GUESS_EXTRA_LINE, `REM ${text}`);
        this.interp.tape.save('GUESS', copy.save());
      }
    }
    this.set(flag);
    // He answers on the screen too, over the last OK prompt, so it cannot be missed (and it keeps the story's ripple).
    const row = [...Array(ROWS).keys()].reverse().find((r) => this.rowText(r) === 'OK'.padEnd(COLS));
    if (row === undefined) return;
    this.screen.tamper(row * COLS, shown);
    this.after(SAW_AFTER, () => this.set(saw));
  }

  /**
   * Line 125 is OK's, however it reaches the screen: whenever a command leaves it there (a LIST, usually), its words are claimed
   * as the story's, so they shimmer in and keep rippling like everything else he writes. If the line runs on to a second row
   * (with PLEASE or THANK YOU), that part is claimed too.
   */
  private readonly hisLine: Rule = (e) => {
    if (e.type !== 'idle') return;
    for (let r = 0; r < ROWS; r++) {
      const row = this.rowText(r);
      const at = row.indexOf(`${GUESS_EXTRA_LINE} REM `);
      if (at !== 0) continue;
      const from = `${GUESS_EXTRA_LINE} REM `.length;
      this.screen.claim(r * COLS + from, row.trimEnd().length - from);
      if (row.trimEnd().length >= COLS - 1 && r + 1 < ROWS) {
        const next = this.rowText(r + 1);
        if (!/^\d/.test(next)) this.screen.claim((r + 1) * COLS, next.trimEnd().length);
      }
    }
  };

  /** The player listed GUESS and the screen shows what OK wrote: now they can write it down. */
  private readonly sawOkEdit: Rule = (e) => {
    if (e.type !== 'idle') return;
    if (this.has('ok-pleads') && !this.has('saw-pleads') && this.find('PLEASE') >= 0) this.set('saw-pleads');
    if (this.has('ok-thanks') && !this.has('saw-thanks') && this.find('THANK YOU') >= 0) this.set('saw-thanks');
  };

  readonly rules: readonly Rule[] = [this.rememberName, this.lampWaits, this.vaultVoice, this.nameAtPrompt, this.keptSignal, this.hisLine, this.sawOkEdit];

  /** The set was switched off. Once OK has answered, that is the end of the evening, and of the issue. */
  sleep(): void {
    if (this.has('issue1-done')) this.set('issue1-closed');
  }

  step(dt: number): void {
    for (const l of this.later) l.t -= dt;
    // Take what is due off the list before running it, so anything it schedules (even with no delay) waits its turn.
    const due = this.later.filter((x) => x.t <= 0);
    for (const l of due) this.later.splice(this.later.indexOf(l), 1);
    for (const l of due) l.fn();
    // Once the player has seen OK's answer, the issue's story is told.
    if ((this.has('saw-pleads') || this.has('saw-thanks')) && !this.has('issue1-done')) this.set('issue1-done');
    // OK answers "Who is asking?" in the only place he can: the program. Once the player has both the line and the page, he puts
    // the line back with a word added if it was deleted, or thanks them if it stayed. (The notebook only records what the
    // player then sees: see `saw-pleads`, `saw-thanks`.)
    if (!this.has('found-extra-line') || !this.has('seen-guess')) return;
    if (this.has('deleted-extra-line')) {
      if (!this.has('ok-pleads') && (this.pleadFor += dt) >= PLEAD_AFTER) this.writeLine(`${GUESS_EXTRA_TEXT}, PLEASE`, 'ok-pleads', `${GUESS_EXTRA_TEXT}, PLEASE`, 'saw-pleads');
    } else if (!this.has('ok-thanks') && (this.keptFor += dt) >= this.keptAfter) this.writeLine(`${GUESS_EXTRA_TEXT}. THANK YOU`, 'ok-thanks', 'THANK YOU', 'saw-thanks');
  }
}
