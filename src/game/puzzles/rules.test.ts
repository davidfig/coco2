import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';
import { FIRST_PROGRAM } from './listings';
import { ISSUE_1_RULES } from './rules';
import { PuzzleWatcher } from './watcher';

/** A machine whose puzzle watcher records the flags it ticks. */
function watched(): { coco: HeadlessCoco; flags: Set<string> } {
  const coco = new HeadlessCoco();
  const flags = new Set<string>();
  new PuzzleWatcher(coco.interp, (f) => flags.has(f), (f) => flags.add(f), ISSUE_1_RULES);
  return { coco, flags };
}

const typeFirstProgram = (coco: HeadlessCoco): HeadlessCoco => coco.type('NEW\n' + FIRST_PROGRAM.join('\n') + '\n');

test('P2: typing the first program in does not count until it has run', () => {
  const { coco, flags } = watched();
  typeFirstProgram(coco);
  expect(flags.has('first-program')).toBe(false);
  coco.type('RUN\n');
  expect(coco.interp.state).toBe('input');
  expect(flags.has('first-program')).toBe(false);
});

test('P2: an empty answer does not count', () => {
  const { coco, flags } = watched();
  typeFirstProgram(coco).type('RUN\n\n');
  expect(flags.has('first-program')).toBe(false);
});

test('P2: answering with a name ticks first-program', () => {
  const { coco, flags } = watched();
  typeFirstProgram(coco).type('RUN\nADA\n');
  expect(coco.text()).toContain('HELLO, ADA');
  expect(flags.has('first-program')).toBe(true);
});

test('P2: a different program asking for N$ does not count', () => {
  const { coco, flags } = watched();
  coco.type('NEW\n10 INPUT N$\n40 PRINT N$\nRUN\nADA\n');
  expect(flags.has('first-program')).toBe(false);
});
