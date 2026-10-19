import type { Interpreter } from '../basic/interpreter';
import type { Program } from '../basic/program';
import { HANGMAN_REM_LINE, KNOWN_MESSAGES, MESSAGE_LINE, OK_MESSAGE, ORACLE_ASK, ORACLE_HOW, dataNumbers, decode, isHangman, isOracle } from './listingsMay';
import { screenText } from './rules';
import { MAY_TAPE_KEY } from '../tapes';
import type { Rule } from './watcher';

/** Where the player's answer to ORACLE is kept (OK reads it; later issues may use it). */
export const REPLY_KEY = 'coco2.reply';

/**
 * Issue 2's solution tests (see `docs/puzzles.md`, Issue 2). They only listen once the May issue and its tape have come
 * (`issue2-waiting`).
 */

/** True when the screen shows `text` somewhere. */
const shows = (m: Interpreter, text: string): boolean => screenText(m.screen.vram).includes(text);

/**
 * A listing of the program in memory took in `line` (which `is` recognises) and, once it ended, `text` was on the screen: the
 * player has seen that line. A long LIST scrolls, so being in the range is not enough.
 */
function seenInListing(is: (p: Program) => boolean, line: number, text: (m: Interpreter) => string, flag: string): Rule {
  let listed = false;
  return (e, ctx) => {
    const p = ctx.interp.program;
    if (!ctx.has('issue2-waiting') || !is(p)) return;
    if (e.type === 'list') listed = p.index(line) >= 0 && e.from <= line && e.to >= line;
    else if (e.type === 'idle' && listed) {
      listed = false;
      if (shows(ctx.interp, text(ctx.interp))) ctx.set(flag);
    }
  };
}

/** The first line of a program line as LIST prints it (a long line runs on to the rows below). */
const firstRow = (m: Interpreter, num: number): string => m.program.list().find((l) => l.startsWith(`${num} `))?.slice(0, 32) ?? '\u0000';

/** Anything loaded from the May tape: a CLOAD come back to OK with the May cassette in the recorder (it may go in while the CLOAD waits). */
const mayLoaded: Rule = (() => {
  let loading = false;
  return (e, ctx) => {
    if (e.type === 'cload') loading = true;
    else if (e.type === 'idle' && loading) {
      loading = false;
      if (ctx.has('issue2-waiting') && ctx.interp.tape.cassette === MAY_TAPE_KEY) ctx.set('may-loaded');
    }
  };
})();

/** HANGMAN is in memory (loaded, back at OK). */
const hangmanLoaded: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && isHangman(ctx.interp.program)) ctx.set('hangman-loaded');
};

/** CHECK with HANGMAN in memory: the sums part from the magazine's at OK's REM. */
const hangmanChecked: Rule = (e, ctx) => {
  if (e.type === 'direct' && /^\s*CHECK\s*$/i.test(e.text) && ctx.has('issue2-waiting') && isHangman(ctx.interp.program)) ctx.set('hangman-checked');
};

/** OK's REM under HANGMAN's title was on the screen after a LIST. */
const hangmanRem = seenInListing(isHangman, HANGMAN_REM_LINE, (m) => firstRow(m, HANGMAN_REM_LINE), 'hangman-rem');

/** Line 990 (the message, as OK left it) was on the screen after a LIST. */
const messageSeen = seenInListing(isHangman, MESSAGE_LINE, (m) => firstRow(m, MESSAGE_LINE), 'message-seen');

/** The decoder printed OK's message: the player has read it. */
const dataDecoded: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && shows(ctx.interp, OK_MESSAGE)) ctx.set('data-decoded');
};

/** The tape went past ORACLE, or loaded it: it is on the May tape, which the magazine does not list. */
const oraclePassed: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && ctx.interp.tape.seen.has('ORACLE')) ctx.set('oracle-passed');
};

/** ORACLE gave one of OK's answers, in the code. */
const oracleAsked: Rule = (e, ctx) => {
  if (e.type !== 'line' || e.num !== 100 || !ctx.has('issue2-waiting') || !isOracle(ctx.interp.program)) return;
  if (/\d/.test(String(ctx.interp.vars.get({ name: 'A$' })))) ctx.set('oracle-asked');
};

/** The player decoded ORACLE's question on the machine. */
const oracleRead: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('oracle-asked') && (shows(ctx.interp, ORACLE_ASK) || shows(ctx.interp, ORACLE_HOW))) ctx.set('oracle-read');
};

/** A message in the code that the player wrote: what the program's DATA decodes to, if it is not one of the known ones. */
export function playerMessage(p: Program): string | null {
  const words = decode(dataNumbers(p)).trim().replace(/ +/g, ' ');
  if (words.replace(/ /g, '').length < 2 || KNOWN_MESSAGES.includes(words)) return null;
  return words;
}

/**
 * ORACLE asked, and the player answered as it said: a message of their own in DATA, in the code, RUN or CSAVEd. What it
 * says is kept and not judged.
 */
const oracleAnswered: Rule = (e, ctx) => {
  if ((e.type !== 'run' && e.type !== 'csave') || !ctx.has('oracle-asked') || ctx.has('oracle-answered')) return;
  const reply = playerMessage(ctx.interp.program);
  if (!reply) return;
  try {
    localStorage.setItem(REPLY_KEY, reply.slice(0, 40));
  } catch {
    /* private window: OK reads it all the same */
  }
  ctx.set('oracle-answered');
};

export const ISSUE_2_RULES: readonly Rule[] = [mayLoaded, hangmanLoaded, hangmanChecked, hangmanRem, messageSeen, dataDecoded, oraclePassed, oracleAsked, oracleRead, oracleAnswered];
