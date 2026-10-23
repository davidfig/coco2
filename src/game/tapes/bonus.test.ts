import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';
import { JULY_TAPE_KEY, MAY_TAPE_KEY, julyTape, mayTape } from '.';

/** A machine with this cassette in. */
function withTape(tape: 'may' | 'july'): HeadlessCoco {
  const coco = new HeadlessCoco();
  if (tape === 'may') coco.interp.tape.insert(mayTape(false), MAY_TAPE_KEY);
  else coco.interp.tape.insert(julyTape(), JULY_TAPE_KEY);
  return coco;
}

test('CODER: a message comes out as a DATA line in the RAINBOW code', () => {
  const coco = withTape('may').type('CLOAD "CODER"\nRUN\n').type('HI MOM\n');
  expect(coco.lines().join('\n')).toContain('10 DATA 8,9,0,13,15,13,-1');
  expect(coco.transcript().join('\n')).notToContain('ERROR');
});

test('CODER: punctuation and digits are left out', () => {
  const coco = withTape('may').type('CLOAD "CODER"\nRUN\n').type('A1, B!\n');
  expect(coco.lines().join('\n')).toContain('10 DATA 1,0,2,-1');
});

test('CHECKUP: no signs is a healthy system', () => {
  const coco = withTape('may').type('CLOAD "CHECKUP"\nRUN\n').type('NO\n').type('NO\n').type('NO\n');
  expect(coco.lines().join('\n')).toContain('A HEALTHY SMALL SYSTEM.');
  expect(coco.transcript().join('\n')).notToContain('ERROR');
});

test('CHECKUP: one sign says to switch off and call the Line', () => {
  const coco = withTape('may').type('CLOAD "CHECKUP"\nRUN\n').type('YES\n').type('NO\n').type('NO\n');
  const screen = coco.lines().join('\n');
  expect(screen).toContain('IS IT SLOW TO ANSWER?');
  expect(screen).toContain('606-555-0142.');
});

test('COUNTER: prints the index from its DATA', () => {
  const coco = withTape('july').type('CLOAD "COUNTER"\nRUN\n');
  const screen = coco.lines().join('\n');
  expect(screen).toContain('REGISTER     18');
  expect(screen).toContain('GOODBYE      59');
  expect(coco.transcript().join('\n')).notToContain('ERROR');
});

test('GOODBYE: draws the house, says goodnight and waits for a key', () => {
  const coco = withTape('july').type('CLOAD "GOODBYE"\nRUN\n', 3);
  const screen = coco.lines().join('\n');
  expect(screen).toContain('I PUT IT AWAY TONIGHT.');
  expect(screen).toContain('GOODNIGHT.');
  expect(coco.transcript().join('\n')).notToContain('ERROR');
});

test("GOODBYE: its name is cut, and its REM spells a hard word the way Kessler's Post-its do", () => {
  const coco = withTape('july').type('CLOAD "GOODBYE"\nLIST -35\n');
  const listing = coco.lines().join('\n');
  expect(listing).toContain('20 REM BY\n');
  expect(listing).toContain('ACURATE');
});
