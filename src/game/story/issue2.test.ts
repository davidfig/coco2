import { HeadlessCoco } from '../coco/headless';
import { pageOfLine, LISTING_FITS } from '../magazine/mayShutdown';
import { MESSAGE_LINE, PLUG_HELD, PLUG_LINE, PLUG_PRINTED, PLUG_QUESTION } from '../puzzles/listingsMay';
import { ISSUE_2_RULES } from '../puzzles/rulesMay';
import { PuzzleWatcher } from '../puzzles/watcher';
import { MAY_TAPE_KEY, mayTape } from '../tapes';
import { expect, test } from '../../test/check';
import { Issue2Story } from './issue2';

/** The May tape in, issue 2 under way, and the story and its puzzles watching; `flinches` counts the set's flinches. */
function may() {
  localStorage.clear(); // OK's change to the tape is kept there
  const coco = new HeadlessCoco();
  coco.interp.tape.insert(mayTape(true), MAY_TAPE_KEY);
  const flags = new Set<string>(['issue2-waiting']);
  const has = (f: string): boolean => flags.has(f);
  const set = (f: string): void => void flags.add(f);
  const counter = { flinches: 0 };
  const story = new Issue2Story(coco.screen, has, set, coco.interp, () => counter.flinches++);
  new PuzzleWatcher(coco.interp, has, set, [...ISSUE_2_RULES, ...story.rules]);
  /** Let the story run for `seconds` at whatever the machine is doing. */
  const wait = (seconds: number): void => {
    for (let t = 0; t < seconds; t += 1 / 60) story.step(1 / 60);
  };
  return { coco, flags, counter, wait };
}

const WALK = 'TAKE UNIT\nE\nN\nN\nREST IT\nWATCH IT\nKEEP IT SMALL\n';

test('SHUTDOWN story: the first win flinches the set, then OK changes line 710 in memory and on the tape', () => {
  const { coco, flags, counter, wait } = may();
  coco.type(`CLOAD "SHUTDOWN"\nRUN\n${WALK}PULL PLUG\n`);
  expect(flags.has('door-asked') && flags.has('rules-spoken') && flags.has('shutdown-won')).toBe(true);
  expect(counter.flinches).toBe(1);
  wait(0.1);
  expect(flags.has('plug-changed')).toBe(true);
  expect(coco.interp.program.list()).toContain(PLUG_HELD);
  coco.type('NEW\nCLOAD "SHUTDOWN"\n');
  expect(coco.interp.program.list()).toContain(PLUG_HELD);
});

test('SHUTDOWN story: the plug held, then put back and pulled', () => {
  const { coco, flags, counter, wait } = may();
  coco.type(`CLOAD "SHUTDOWN"\nRUN\n${WALK}PULL PLUG\n`);
  wait(0.1);
  coco.type(`RUN\n${WALK}PULL PLUG\n`);
  expect(coco.text()).toContain(PLUG_QUESTION);
  expect(flags.has('plug-held')).toBe(true);
  coco.break().type(`${PLUG_PRINTED}\n`);
  wait(30);
  expect(flags.has('plug-left')).toBe(false);
  coco.type(`RUN\n${WALK}PULL PLUG\n`);
  expect(coco.text()).toContain('NOW SWITCH OFF YOURS');
  expect(flags.has('plug-pulled')).toBe(true);
  expect(counter.flinches).toBe(1);
});

test('SHUTDOWN story: the plug held, then left for another program', () => {
  const { coco, flags, wait } = may();
  coco.type(`CLOAD "SHUTDOWN"\nRUN\n${WALK}PULL PLUG\n`);
  wait(0.1);
  coco.type(`RUN\n${WALK}PULL PLUG\n`).break().type('CLOAD "ORACLE"\n');
  wait(7);
  expect(flags.has('plug-left')).toBe(true);
  expect(flags.has('plug-pulled')).toBe(false);
});

test('SHUTDOWN pages: the listing fits, and the notes name the right pages', () => {
  expect(LISTING_FITS).toBe(true);
  expect(pageOfLine(PLUG_LINE)).toBe('mayShutdownEnd');
  expect(pageOfLine(MESSAGE_LINE)).toBe('mayShutdownEnd');
});
