import { CHECKPOINTS, DEFAULT_NAME, ISSUE_STARTS, type Checkpoint } from './game/debug/checkpoints';
import { TAPE_KEY } from './game/basic/tape';
import { writeSave } from './game/magazine/bookSave';
import { ISSUES } from './game/magazine/pages';
import { REPLY_KEY } from './game/puzzles/rulesMay';
import { RECORDER_KEY } from './game/recorder';
import { NAME_KEY } from './game/story';
import { MAY_TAPE_KEY } from './game/tapes';

/**
 * Playtesting: `?at=<id>` starts at that checkpoint (`CHECKPOINTS`), and `?issue=N` at the beginning of issue N with
 * every issue before it played through (`ISSUE_STARTS`). The story's save is replaced by the checkpoint's flags, the book
 * shut on its issue's cover, that issue's cassette put in the recorder, a name kept if the story has asked for one by
 * then, and the player's CSAVEs and ORACLE reply forgotten. The TV's knobs and the notebook's wear stay (add `?clear` to
 * lose those too). Like `?clear` it drops itself from the URL, so a reload carries on. Imported in main.ts after `clear`,
 * before anything reads localStorage; main types `startAt.typed` once the CoCo has booted.
 */
const params = new URLSearchParams(location.search);
const at = params.get('at');
const issue = params.get('issue');
export const startAt: Checkpoint | undefined = at !== null ? CHECKPOINTS.find((c) => c.id === at) : issue !== null ? ISSUE_STARTS[Number(issue) - 1] : undefined;
if (at !== null && !startAt) console.warn(`?at=${at}: no such checkpoint. Try one of: ${CHECKPOINTS.map((c) => c.id).join(', ')}`);
if (startAt) {
  const id = startAt.flags.includes('issue2-waiting') ? 'may' : 'march';
  writeSave({ flags: [...startAt.flags], issue: id, pages: {}, page: ISSUES[id][0] });
  try {
    for (const key of [TAPE_KEY, MAY_TAPE_KEY, REPLY_KEY]) localStorage.removeItem(key);
    localStorage.setItem(RECORDER_KEY, JSON.stringify({ deck: id, spots: {} }));
    if (!startAt.named) localStorage.removeItem(NAME_KEY);
    else if (!localStorage.getItem(NAME_KEY)) localStorage.setItem(NAME_KEY, DEFAULT_NAME);
  } catch {
    // storage blocked: nothing kept either way
  }
}
if (at !== null || issue !== null) {
  const search = location.search.slice(1).split('&').filter((p) => !['at', 'issue'].includes(p.split('=')[0])).join('&');
  history.replaceState(null, '', location.pathname + (search ? `?${search}` : '') + location.hash);
}
