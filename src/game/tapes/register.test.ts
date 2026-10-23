import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';
import { JULY_TAPE_KEY, julyTape } from '.';

test('REGISTER: asks four things and prints the card', () => {
  const coco = new HeadlessCoco();
  coco.interp.tape.insert(julyTape(), JULY_TAPE_KEY);
  coco.type('CLOAD "REGISTER"\nRUN\n').type('TESTER\n').type('26-3026\n').type('DAYTON\n').type('1\n');
  const card = coco.lines().join('\n');
  expect(card).toContain('REGISTRATION CARD');
  expect(card).toContain('OWNER:   TESTER');
  expect(card).toContain('SERIAL:  26-3026');
  expect(card).toContain('MACHINES: 1');
  expect(coco.transcript().join('\n')).notToContain('ERROR');
});
