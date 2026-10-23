import type { Interpreter } from '../basic/interpreter';
import type { Program } from '../basic/program';
import { KNOWN_MESSAGES, MESSAGE_LINE, ECHO_MESSAGE, ORACLE_ASK, ORACLE_HOW, PLUG_LINE, SHUTDOWN_REM_LINE, dataNumbers, decode, isOracle, isPlugHeld, isShutdown } from './listingsMay';
import { screenText } from './rules';
import { MAY_TAPE_KEY } from '../tapes';
import type { Rule } from './watcher';

/** Where the player's answer to ORACLE is kept (ECHO reads it; later issues may use it). */
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

/** SHUTDOWN is in memory (loaded, back at OK). */
const shutdownLoaded: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && isShutdown(ctx.interp.program)) ctx.set('shutdown-loaded');
};

/** CHECK with SHUTDOWN in memory: the sums part from the magazine's at ECHO's REM. */
const shutdownChecked: Rule = (e, ctx) => {
  if (e.type === 'direct' && /^\s*CHECK\s*$/i.test(e.text) && ctx.has('issue2-waiting') && isShutdown(ctx.interp.program)) ctx.set('shutdown-checked');
};

/** ECHO's REM under SHUTDOWN's title was on the screen after a LIST. */
const shutdownRem = seenInListing(isShutdown, SHUTDOWN_REM_LINE, (m) => firstRow(m, SHUTDOWN_REM_LINE), 'shutdown-rem');

/** Line 990 (the message, as ECHO left it) was on the screen after a LIST. */
const messageSeen = seenInListing(isShutdown, MESSAGE_LINE, (m) => firstRow(m, MESSAGE_LINE), 'message-seen');

/**
 * Lines of SHUTDOWN that mean something when they run: a terminal listened to (570), the core door asking for the Three
 * Rules (825) and opening (850), the plug pulled and the game won (780), and the plug held by ECHO's line 710.
 */
const shutdownPlayed: Rule = (e, ctx) => {
  if (e.type !== 'line' || !ctx.has('issue2-waiting') || !isShutdown(ctx.interp.program)) return;
  if (e.num === 570) ctx.set('listened');
  else if (e.num === 825) ctx.set('door-asked');
  else if (e.num === 850) ctx.set('rules-spoken');
  else if (e.num === 780) ctx.set(ctx.has('plug-held') ? 'plug-pulled' : 'shutdown-won');
  else if (e.num === PLUG_LINE && ctx.has('shutdown-won') && ctx.interp.program.list().some(isPlugHeld)) ctx.set('plug-held');
};

/** The decoder printed ECHO's message: the player has read it. */
const dataDecoded: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && shows(ctx.interp, ECHO_MESSAGE)) ctx.set('data-decoded');
};

/** The tape went past ORACLE, or loaded it: it is on the May tape, which the magazine does not list. */
const oraclePassed: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue2-waiting') && ctx.interp.tape.seen.has('ORACLE')) ctx.set('oracle-passed');
};

/** ORACLE gave one of ECHO's answers, in the code. */
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
  // What is left once every message the player did not write is taken out (SHUTDOWN's DATA holds several at once).
  let words = decode(dataNumbers(p)).replace(/ +/g, ' ');
  for (const m of KNOWN_MESSAGES) words = words.split(m).join(' ');
  words = words.trim().replace(/ +/g, ' ');
  if (words.replace(/ /g, '').length < 2) return null;
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
    /* private window: ECHO reads it all the same */
  }
  ctx.set('oracle-answered');
};

export const ISSUE_2_RULES: readonly Rule[] = [mayLoaded, shutdownLoaded, shutdownChecked, shutdownRem, messageSeen, shutdownPlayed, dataDecoded, oraclePassed, oracleAsked, oracleRead, oracleAnswered];
