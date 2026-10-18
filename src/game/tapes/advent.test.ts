import { HeadlessCoco } from '../coco/headless';
import { ADVENT_CODE } from '../puzzles/listings';
import { expect, test } from '../../test/check';

/** ADVENT loaded, its typo (line 30's PRNT) fixed, and running at its first prompt. */
function advent(): HeadlessCoco {
  return new HeadlessCoco().type('CLOAD "ADVENT"\n30 PRINT "THE TAPE CRACKLES."\nRUN\n');
}

/** Type each command in turn; returns what the last one printed. */
const play = (coco: HeadlessCoco, ...commands: string[]): string => {
  for (const c of commands) coco.type(c + '\n');
  return coco.text();
};

test('ADVENT: as loaded, line 30 is a ?SN ERROR', () => {
  expect(new HeadlessCoco().type('CLOAD "ADVENT"\nRUN\n').text()).toContain('?SN ERROR IN 30');
});

test('ADVENT: dark until the lamp is taken', () => {
  const coco = advent();
  expect(play(coco, 'LOOK')).toContain('TOO DARK');
  expect(play(coco, 'TAKE LAMP')).toContain('TAKEN.');
  expect(play(coco, 'LOOK')).toContain('STORE ROOM');
});

test('ADVENT: the key answers to KEY, IRON KEY and SMALL IRON KEY', () => {
  const coco = advent();
  play(coco, 'TAKE LAMP', 'N', 'E');
  expect(play(coco, 'EXAMINE DESK')).toContain('IRON KEY');
  expect(play(coco, 'TAKE IRON KEY')).toContain('TAKEN.');
  expect(play(coco, 'DROP SMALL IRON KEY')).toContain('DROPPED.');
  expect(play(coco, 'TAKE KEY')).toContain('TAKEN.');
  expect(play(coco, 'I')).toContain('A SMALL IRON KEY.');
});

test('ADVENT: the key opens the cellar box', () => {
  const coco = advent();
  play(coco, 'TAKE LAMP', 'N', 'E', 'TAKE KEY', 'W', 'S', 'W');
  expect(play(coco, 'OPEN IRON BOX')).toContain('NINE OF CLUBS');
});

test('ADVENT: the code opens the door and the gold wins', () => {
  const coco = advent();
  play(coco, 'TAKE LAMP', 'N');
  expect(play(coco, 'N')).toContain('CODE?');
  expect(play(coco, '1111')).toContain('NO WHEEL MOVES');
  play(coco, 'N');
  const opened = play(coco, ADVENT_CODE);
  expect(opened).toContain('SWINGS OPEN');
  expect(opened).toContain('CHEST OF GOLD');
  expect(play(coco, 'TAKE GOLD')).toContain('YOU HAVE WON');
  expect(coco.interp.state).toBe('idle');
});
