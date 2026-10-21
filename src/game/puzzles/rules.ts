import type { Program } from '../basic/program';
import type { Interpreter } from '../basic/interpreter';
import { ADVENT, ADVENT_CODE, ADVENT_WHISPER, FIRST_PROGRAM, FIRST_PROGRAM_GREETS, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from './listings';
import type { BasicEvent } from '../basic/events';
import { programIs, type PuzzleContext, type Rule } from './watcher';

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

/**
 * The name the player has just given the tutorial's program, as OK keeps it: at its greeting line, with exactly that program in
 * memory. '' at any other moment, or when the answer was empty, so a bare RUN or ENTER alone does not count.
 */
export function firstProgramName(e: BasicEvent, interp: Interpreter): string {
  if (e.type !== 'line' || e.num !== FIRST_PROGRAM_GREETS || !programIs(interp.program, FIRST_PROGRAM)) return '';
  return String(interp.vars.get({ name: 'N$' })).trim().toUpperCase().slice(0, 12);
}

/** P2, half way: the tutorial's program is in memory exactly as printed (the notebook then says to RUN it). */
const programTyped: Rule = (e, ctx) => {
  if (e.type === 'edit' && programIs(ctx.interp.program, FIRST_PROGRAM)) ctx.set('program-typed');
};

/** P2: the tutorial's program, typed in exactly, has been run and told a name (the story keeps it). */
const firstProgram: Rule = (e, ctx) => {
  if (firstProgramName(e, ctx.interp)) ctx.set('first-program');
};

/** True when the program in memory is ADVENT (the tape file's first line says so, and the player may have edited the rest). */
export const isAdvent = (p: Program): boolean => p.lines[0]?.text.startsWith('REM ADVENT') ?? false;

/** One of ADVENT's numeric variables, 0 if it has none yet. */
const advVar = (m: Interpreter, name: string): number => Number(m.vars.get({ name })) || 0;

/**
 * The tape is in the cassette recorder: the first CLOAD or CSAVE with it in (the page's recorder also sets it as the
 * March cassette goes in). The player has seen the cassette's label.
 */
const tapeInserted: Rule = (e, ctx) => {
  if ((e.type === 'cload' || e.type === 'csave') && ctx.interp.tape.present) ctx.set('tape-inserted');
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

/** True when ADVENT is in memory and has just reached line `num`. */
const atLine = (e: BasicEvent, ctx: PuzzleContext, num: number): boolean => e.type === 'line' && e.num === num && isAdvent(ctx.interp.program);

/** EXAMINE DOOR was typed in the hall: a lock with four wheels and a plate. */
const doorExamined: Rule = (e, ctx) => {
  if (!atLine(e, ctx, ADVENT.door)) return;
  ctx.set('lock-examined');
  ctx.set('door-examined');
};

/** EXAMINE PLATE: four rooms hold a number each, set in the order they are read off the map. */
const plateRead: Rule = (e, ctx) => {
  if (!atLine(e, ctx, ADVENT.plate)) return;
  ctx.set('lock-examined');
  ctx.set('plate-read');
};

/** The four clues, and the way to the last of them: each ticks a flag the notebook writes down (what was seen, not the digit). */
const CLUES: readonly [line: number, flag: string][] = [
  [ADVENT.clock, 'clock-read'],
  [ADVENT.mirror, 'mirror-read'],
  [ADVENT.chapel, 'whisper-heard'],
  [ADVENT.altar, 'altar-read'],
  [ADVENT.listened, 'whisper-listened'],
  [ADVENT.cellar, 'box-seen'],
  [ADVENT.box, 'box-seen'],
  [ADVENT.unlock, 'box-opened'],
  [ADVENT.card, 'card-read'],
  [ADVENT.tried, 'code-tried'],
];
const clues: Rule = (e, ctx) => {
  for (const [line, flag] of CLUES) if (atLine(e, ctx, line)) ctx.set(flag);
};

/** The key from the study desk is carried: back at the prompt with KY at 0. */
const hasKey: Rule = (e, ctx) => {
  if (atLine(e, ctx, ADVENT.prompt) && advVar(ctx.interp, 'KY') === 0) ctx.set('has-key');
};

/**
 * The whisper was found: ADVENT was listed and its REM is on the screen when the listing ends (or the player deleted it,
 * which means they found it first). The other way to it is to LISTEN in the chapel (`whisper-listened`).
 */
const whisperFound: Rule = (() => {
  let listed = false;
  return (e, ctx) => {
    const p = ctx.interp.program;
    if (!isAdvent(p)) return;
    if (e.type === 'list') listed = e.from <= ADVENT.whisper && e.to >= ADVENT.whisper;
    else if (e.type === 'idle' && listed) {
      listed = false;
      if (screenText(ctx.interp.screen.vram).includes(ADVENT_WHISPER)) ctx.set('whisper-found');
    }
  };
})();

/** The player listed ADVENT and the line that checks the code is on the screen, so the code can be read (the cheat). */
const readCode: Rule = (() => {
  let listed = false;
  return (e, ctx) => {
    const p = ctx.interp.program;
    if (!isAdvent(p)) return;
    if (e.type === 'list') {
      const at = p.lines.find((l) => l.text.includes(`C$="${ADVENT_CODE}"`));
      listed = !!at && e.from <= at.num && e.to >= at.num;
    } else if (e.type === 'idle' && listed) {
      listed = false;
      if (screenText(ctx.interp.screen.vram).includes(`C$="${ADVENT_CODE}"`)) ctx.set('read-code');
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
    ctx.set('door-open');
  }
};

/**
 * The notebook's "walk the map": the player has stood in every room but the vault. Counted by where they are each time the game waits
 * for a command (ADVENT's variable R), not by the descriptions shown: in the dark, or after taking the lamp and walking on,
 * a room may never have been described, but the player has still been there.
 */
const mapped: Rule = (() => {
  const been = new Set<number>();
  return (e, ctx) => {
    if (e.type !== 'line' || e.num !== ADVENT.prompt || !isAdvent(ctx.interp.program)) return;
    been.add(advVar(ctx.interp, 'R'));
    if (ADVENT.mapRooms.every((r) => been.has(r))) ctx.set('mapped');
  };
})();

/** True when the program in memory is GUESS (the tape file's first line says so). */
export const isGuess = (p: Program): boolean => p.lines[0]?.text.startsWith('REM GUESS') ?? false;

/** What a screen's video memory says, as plain text (graphics blocks count as spaces). */
export const screenText = (vram: Uint8Array): string => [...vram].map((b) => (b >= 128 ? ' ' : String.fromCharCode((b & 63) < 32 ? (b & 63) + 64 : b & 63))).join('');

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

export const ISSUE_1_RULES: readonly Rule[] = [sayHello, programTyped, firstProgram, tapeInserted, adventureLoaded, adventureError, adventureRuns, looked, hasLamp, mapped, doorExamined, plateRead, clues, hasKey, whisperFound, readCode, doorOpen, adventureWon, extraLine];
