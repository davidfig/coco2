import type { Program } from '../basic/program';
import { JULY_TAPE_KEY } from '../tapes';
import type { Rule } from './watcher';

/**
 * Issue 3's solution tests (see `docs/puzzles.md`, Issue 3: planned; only the first two are built). They only listen once
 * the July issue and its tape have come (`issue3-waiting`).
 */

/** True when the program in memory is REGISTER. */
export const isRegister = (p: Program): boolean => p.lines[0]?.text.startsWith('REM REGISTER') ?? false;

/** Anything loaded from the July tape: a CLOAD come back to OK with the July cassette in the recorder. */
const julyLoaded: Rule = (() => {
  let loading = false;
  return (e, ctx) => {
    if (e.type === 'cload') loading = true;
    else if (e.type === 'idle' && loading) {
      loading = false;
      if (ctx.has('issue3-waiting') && ctx.interp.tape.cassette === JULY_TAPE_KEY) ctx.set('july-loaded');
    }
  };
})();

/** REGISTER is in memory (loaded, back at OK). */
const registerLoaded: Rule = (e, ctx) => {
  if (e.type === 'idle' && ctx.has('issue3-waiting') && isRegister(ctx.interp.program)) ctx.set('register-loaded');
};

export const ISSUE_3_RULES: readonly Rule[] = [julyLoaded, registerLoaded];
