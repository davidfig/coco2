import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';

/** A machine whose recorder is empty, as the page's starts. */
const empty = (): HeadlessCoco => {
  const coco = new HeadlessCoco();
  coco.interp.tape.present = false;
  return coco;
};

test('TAPE: CLOAD with no cassette waits at S until BREAK', () => {
  const coco = empty().type('CLOAD "ABOUT"\n', 2);
  expect(coco.interp.state).toBe('tape');
  expect(coco.lines()[0].startsWith('S   ')).toBe(true);
  expect(coco.break().text()).toContain('OK');
  expect(coco.interp.program.list().length).toBe(0);
});

test('TAPE: a cassette put in while CLOAD waits is loaded', () => {
  const coco = empty().type('CLOAD "GUESS"\n', 1);
  coco.interp.tape.present = true;
  coco.settle();
  expect(coco.interp.state).toBe('idle');
  expect(coco.interp.program.list().length > 0).toBe(true);
});

test('TAPE: CSAVE with no cassette waits; it records once one goes in', () => {
  const coco = empty().type('NEW\n10 PRINT "KEPT"\nCSAVE "KEEP"\n', 1);
  expect(coco.interp.state).toBe('tape');
  expect(coco.interp.deck.waiting).toBe(true);
  coco.interp.tape.present = true;
  coco.settle().type('NEW\nCLOAD "KEEP"\nRUN\n');
  expect(coco.text()).toContain('KEPT');
});
