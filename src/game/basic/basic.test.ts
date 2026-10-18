import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';

test('BASIC: boots to OK', () => {
  expect(new HeadlessCoco().lines()).toContain('OK');
});

test('BASIC: a direct PRINT', () => {
  expect(new HeadlessCoco().type('PRINT 2+3\n').output()).toEqual(['PRINT 2+3', ' 5', 'OK', '']);
});

test('BASIC: keywords are found anywhere (FORI=1TO3)', () => {
  expect(new HeadlessCoco().type('FORI=1TO3:PRINTI;:NEXT\n').text()).toContain(' 1  2  3');
});

test('BASIC: SCORE=5 is SC OR E=5, a ?SN ERROR', () => {
  expect(new HeadlessCoco().type('SCORE=5\n').text()).toContain('?SN ERROR');
});

test('BASIC: a program with INPUT', () => {
  const coco = new HeadlessCoco().type('NEW\n10 INPUT "NAME";N$\n20 PRINT "HI ";N$\nRUN\n');
  expect(coco.interp.state).toBe('input');
  expect(coco.type('ADA\n').text()).toContain('HI ADA');
});

test('BASIC: BREAK stops a loop', () => {
  const coco = new HeadlessCoco().type('NEW\n10 GOTO 10\nRUN\n', 0.5);
  expect(coco.interp.state).toBe('running');
  expect(coco.break().text()).toContain('BREAK IN 10');
});

test('BASIC: output that scrolls off stays in the transcript', () => {
  const coco = new HeadlessCoco().type('FOR I=1 TO 40:PRINT I:NEXT\n');
  expect(coco.output()).toContain(' 1');
  expect(coco.output()).toContain(' 40');
});

test('BASIC: CSAVE and CLOAD round trip', () => {
  const coco = new HeadlessCoco().type('NEW\n10 PRINT "SAVED"\nCSAVE "MINE"\nNEW\nCLOAD "MINE"\nRUN\n');
  expect(coco.text()).toContain('SAVED');
});
