import { DEFAULT_NAME, ISSUE_STARTS } from './game/debug/checkpoints';
import { TAPE_KEY } from './game/basic/tape';
import { writeSave } from './game/magazine/bookSave';
import { ISSUES } from './game/magazine/pages';
import { REPLY_KEY } from './game/puzzles/rulesMay';
import { NAME_KEY } from './game/story';
import { MAY_TAPE_KEY } from './game/tapes';

/**
 * `?issue=N` (playtesting) starts at the beginning of issue N with every issue before it played through: the story's
 * save is replaced by that point's checkpoint flags (`ISSUE_STARTS`), the book shut on that issue's cover, a name kept
 * if the story has asked for one by then, and the player's CSAVEs and ORACLE reply forgotten. The TV's knobs and the
 * notebook's wear stay (add `?clear` to lose those too). Like `?clear` it drops itself from the URL, so a reload carries
 * on. Imported in main.ts after `clear`, before anything reads localStorage.
 */
const asked = new URLSearchParams(location.search).get('issue');
const start = asked === null ? undefined : ISSUE_STARTS[Number(asked) - 1];
if (start) {
  const issue = start.flags.includes('issue2-waiting') ? 'may' : 'march';
  writeSave({ flags: [...start.flags], issue, pages: {}, page: ISSUES[issue][0] });
  try {
    for (const key of [TAPE_KEY, MAY_TAPE_KEY, REPLY_KEY]) localStorage.removeItem(key);
    if (!start.named) localStorage.removeItem(NAME_KEY);
    else if (!localStorage.getItem(NAME_KEY)) localStorage.setItem(NAME_KEY, DEFAULT_NAME);
  } catch {
    // storage blocked: nothing kept either way
  }
}
if (asked !== null) {
  const search = location.search.slice(1).split('&').filter((p) => p.split('=')[0] !== 'issue').join('&');
  history.replaceState(null, '', location.pathname + (search ? `?${search}` : '') + location.hash);
}
