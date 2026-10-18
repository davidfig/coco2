import type { Program } from '../basic/program';
import type { Interpreter } from '../basic/interpreter';
import { ADVENT, ADVENT_CODE, FIRST_PROGRAM, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from './listings';
import { programIs, Rule } from './watcher';

/**
 * Issue 1's solution tests (see `docs/puzzles.md`). Each ticks the story flag of the same name when it sees the
 * player do the thing.
 */

/** P1: a PRINT typed at the OK prompt ran without an error. */
const sayHello: Rule = (() => {
  let printed = false;
  return (e, ctx) => {
    if (e.type === 'direct') printed = /^\s*(PRINT|\?)/i.test(e.text);
    else if (e.type === 'error') printed = false;
    else if (e.type === 'idle' && printed) {
      printed = false;
      ctx.set('printed');
    }
  };
})();

/** P2: RUN with exactly the tutorial's program in memory. */
const firstProgram: Rule = (e, ctx) => {
  if (e.type === 'run' && programIs(ctx.interp.program, FIRST_PROGRAM)) ctx.set('first-program');
};

/** True when the program in memory is ADVENT (the tape file's first line says so, and the player may have edited the rest). */
export const isAdvent = (p: Program): boolean => p.lines[0]?.text.startsWith('REM ADVENT') ?? false;

/** One of ADVENT's numeric variables, 0 if it has none yet. */
const advVar = (m: Interpreter, name: string): number => Number(m.vars.get({ name })) || 0;

/** The tape went into the cassette recorder: the first CLOAD or CSAVE. The player can now see the cassette's label. */
const tapeInserted: Rule = (e, ctx) => {
  if (e.type === 'cload' || e.type === 'csave') ctx.set('tape-inserted');
};

/** The notebook's "load the adventure": ADVENT was loaded and run (even if it stopped with an error at once). */
const adventureLoaded: Rule = (e, ctx) => {
  if (e.type === 'run' && isAdvent(ctx.interp.program)) ctx.set('adventure-loaded');
};

/** The ?SN ERROR the broken line gives: the notebook then points the player at the page on errors. */
const adventureError: Rule = (e, ctx) => {
  if (e.type === 'error' && e.code === 'SN' && e.line === ADVENT.typo && isAdvent(ctx.interp.program)) ctx.set('adventure-sn');
};

/** P3: ADVENT got past its broken line 30, so the player fixed it. */
const adventureRuns: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.fixed && isAdvent(ctx.interp.program)) ctx.set('adventure-runs');
};

/** The notebook's "look around": the game described a room (the opening one counts, a LOOK counts again). */
const looked: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.describe && isAdvent(ctx.interp.program)) ctx.set('looked');
};

/** The notebook's "find a light": back at the prompt after a command with the lamp carried. */
const hasLamp: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.prompt && isAdvent(ctx.interp.program) && advVar(ctx.interp, 'LP') === 0) ctx.set('has-lamp');
};

/** EXAMINE DOOR was typed in the hall: a lock with four wheels and a plate. */
const doorExamined: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.door && isAdvent(ctx.interp.program)) {
    ctx.set('lock-examined');
    ctx.set('door-examined');
  }
};

/** The scrap in the study desk: the game itself says the code is not in the rooms but in the program. */
const deskRead: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.desk && isAdvent(ctx.interp.program)) ctx.set('desk-read');
};

/** EXAMINE PLATE: the brass plate's riddle was read, the honest way to the code. */
const plateRead: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.plate && isAdvent(ctx.interp.program)) {
    ctx.set('lock-examined');
    ctx.set('plate-passed');
    ctx.set('plate-read');
  }
};

/** The player listed ADVENT and the line that checks the code is on the screen, so the code can be read (the cheat). */
const readCode: Rule = (() => {
  let listed = false;
  return (e, ctx) => {
    const p = ctx.interp.program;
    if (!isAdvent(p)) return;
    if (e.type === 'list') {
      const at = p.lines.find((l) => /IF C=\d+/.test(l.text));
      listed = !!at && e.from <= at.num && e.to >= at.num;
    } else if (e.type === 'idle' && listed) {
      listed = false;
      if (screenText(ctx.interp.screen.vram).includes(`C=${ADVENT_CODE}`)) ctx.set('read-code');
    }
  };
})();

/** The adventure is won: the gold taken from the vault (with the door really opened, not by RUN 700). */
const adventureWon: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.ending && isAdvent(ctx.interp.program) && advVar(ctx.interp, 'Q') === 1) ctx.set('adventure-won');
};

/** P4: the vault was entered with the door really unlocked (not by RUN 700, which clears the variables). */
const doorOpen: Rule = (e, ctx) => {
  if (e.type === 'line' && e.num === ADVENT.vault && isAdvent(ctx.interp.program) && advVar(ctx.interp, 'Q') === 1) {
    ctx.set('lock-examined'); // whether or not the player asked the lock first
    ctx.set('plate-passed');
    ctx.set('door-open');
  }
};

/**
 * The notebook's "start a map": the player has stood in all three rooms. Counted by where they are each time the game waits
 * for a command (ADVENT's variable R), not by the descriptions shown: in the dark, or after taking the lamp and walking on,
 * a room may never have been described, but the player has still been there.
 */
const mapped: Rule = (() => {
  const been = new Set<number>();
  return (e, ctx) => {
    if (e.type !== 'line' || e.num !== ADVENT.prompt || !isAdvent(ctx.interp.program)) return;
    been.add(advVar(ctx.interp, 'R'));
    if (ADVENT.rooms.every((_, i) => been.has(i + 1))) ctx.set('mapped');
  };
})();

/** True when the program in memory is GUESS (the tape file's first line says so). */
export const isGuess = (p: Program): boolean => p.lines[0]?.text.startsWith('REM GUESS') ?? false;

/** What a screen's video memory says, as plain text (graphics blocks count as spaces). */
const screenText = (vram: Uint8Array): string => [...vram].map((b) => (b >= 128 ? ' ' : String.fromCharCode((b & 63) < 32 ? (b & 63) + 64 : b & 63))).join('');

/**
 * P5: the player has seen GUESS's extra line, or has deleted it. Listing it is not enough: the screen holds 16 rows and a
 * long LIST scrolls, so the line only counts when it is really on the screen when the listing ends.
 */
const extraLine: Rule = (() => {
  let listed = false;
  return (e, ctx) => {
    const p = ctx.interp.program;
    if (!isGuess(p)) return;
    if (e.type === 'list') listed = p.index(GUESS_EXTRA_LINE) >= 0 && e.from <= GUESS_EXTRA_LINE && e.to >= GUESS_EXTRA_LINE;
    else if (e.type === 'idle' && listed) {
      listed = false;
      if (screenText(ctx.interp.screen.vram).includes(GUESS_EXTRA_TEXT)) ctx.set('found-extra-line');
    }
    if (e.type === 'edit' && e.deleted && e.num === GUESS_EXTRA_LINE) {
      ctx.set('found-extra-line');
      ctx.set('deleted-extra-line');
    }
  };
})();

export const ISSUE_1_RULES: readonly Rule[] = [sayHello, firstProgram, tapeInserted, adventureLoaded, adventureError, adventureRuns, looked, hasLamp, mapped, doorExamined, deskRead, plateRead, readCode, doorOpen, adventureWon, extraLine];
