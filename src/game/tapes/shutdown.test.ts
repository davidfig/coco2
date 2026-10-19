import { HeadlessCoco } from '../coco/headless';
import { checkSum } from '../basic/checksum';
import { DECODER, OK_MESSAGE, PLUG_HELD, PLUG_QUESTION, SHUTDOWN_PRINTED, SPEECHES } from '../puzzles/listingsMay';
import { playerMessage } from '../puzzles/rulesMay';
import { MAY_TAPE_KEY, mayTape } from '.';
import { expect, test } from '../../test/check';

/** A CoCo with the May cassette in. */
function may(deleted = true): HeadlessCoco {
  localStorage.clear(); // a story test may have left OK's change on the tape
  const coco = new HeadlessCoco();
  coco.interp.tape.insert(mayTape(deleted), MAY_TAPE_KEY);
  return coco;
}

/** SHUTDOWN loaded from the May tape and running at its first prompt. */
const shutdown = (): HeadlessCoco => may().type('CLOAD "SHUTDOWN"\nRUN\n');

/** Type each command in turn; returns what the last one printed. */
const play = (coco: HeadlessCoco, ...commands: string[]): string => {
  for (const c of commands) coco.type(c + '\n');
  return coco.text();
};

/** From the start to the plug, the door opened with the Three Rules. */
const WALK = ['TAKE UNIT', 'E', 'N', 'N', 'REST IT', 'WATCH IT', 'KEEP IT SMALL'];

test('SHUTDOWN: no line is longer than BASIC allows, and the printed one is the tape one but for OK', () => {
  for (const l of SHUTDOWN_PRINTED) expect(l.length <= 249).toBe(true);
  const tape = mayTape(true).find((f) => f.name === 'SHUTDOWN')!.text.split('\n');
  expect(tape.length).toBe(SHUTDOWN_PRINTED.length + 1);
  expect(checkSum(tape).length).toBe(tape.length);
});

test('SHUTDOWN: starts in the airlock with the pocket unit', () => {
  const coco = shutdown();
  expect(play(coco, 'LOOK')).toContain('AIRLOCK');
  expect(coco.text()).toContain('POCKET UNIT');
  expect(play(coco, 'TAKE UNIT')).toContain('TAKEN.');
  expect(play(coco, 'USE UNIT')).toContain('GO EAST.');
});

test('SHUTDOWN: listening to a terminal sends you back to the airlock', () => {
  const coco = shutdown();
  play(coco, 'TAKE UNIT', 'E');
  expect(play(coco, 'EXAMINE TERMINAL')).toContain('DO NOT LISTEN');
  const heard = play(coco, 'LISTEN');
  expect(heard).toContain(SPEECHES[0]);
  expect(heard).toContain('IT HAS YOU');
  expect(play(coco, 'LOOK')).toContain('AIRLOCK');
  expect(play(coco, 'I')).toContain('NOTHING');
});

test('SHUTDOWN: each terminal says its own speech', () => {
  const rooms: [string[], string][] = [
    [['E'], SPEECHES[0]],
    [['E', 'N', 'E'], SPEECHES[1]],
    [['E', 'N'], SPEECHES[2]],
    [['E', 'N', 'W'], SPEECHES[3]],
  ];
  for (const [path, speech] of rooms) expect(play(shutdown(), ...path, 'LISTEN')).toContain(speech);
});

test('SHUTDOWN: the core door wants the unit, then the Three Rules', () => {
  const coco = shutdown();
  expect(play(coco, 'E', 'N', 'N')).toContain('WANTS A UNIT');
  const back = shutdown();
  play(back, 'TAKE UNIT', 'E', 'N', 'N', 'REST');
  expect(play(back, 'SLEEP')).toContain('THE DOOR WAITS.');
  expect(play(shutdown(), ...WALK)).toContain('THE DOOR SLIDES OPEN.');
});

test('SHUTDOWN: pulling the plug wins, with DELPHI\'s last words', () => {
  const coco = shutdown();
  play(coco, ...WALK);
  const won = play(coco, 'PULL PLUG');
  expect(won).toContain(SPEECHES[4]);
  expect(won).toContain('KEEP YOURS SMALL');
  expect(won).toContain('SCORE: 100 OF 100');
});

test('SHUTDOWN: with OK\'s line 710 the plug will not come', () => {
  const coco = may().type('CLOAD "SHUTDOWN"\n');
  coco.interp.program.set(710, PLUG_HELD.slice(4));
  coco.type('RUN\n');
  play(coco, ...WALK);
  const held = play(coco, 'PULL PLUG');
  expect(held).toContain('IT WILL NOT COME.');
  expect(held).toContain(PLUG_QUESTION);
});

test('SHUTDOWN: the decoder reads DELPHI, then OK\'s lie, and none of it is an answer to ORACLE', () => {
  const coco = may().type(`CLOAD "SHUTDOWN"\n${DECODER.join('\n')}\nRUN\n`);
  const out = coco.transcript().map((l) => l.padEnd(32)).join('');
  for (const s of SPEECHES) expect(out).toContain(s.split(' ')[0]);
  expect(out.replace(/ +/g, ' ')).toContain(OK_MESSAGE);
  expect(playerMessage(coco.interp.program)).toBe(null);
});
