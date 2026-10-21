import { expect, test } from '../../test/check';
import { BACK_AFTER, Framing } from './framing';

/** Runs `secs` seconds at 60 Hz with nothing happening but BASIC `idle` or not. */
function wait(f: Framing, secs: number, idle = true): void {
  for (let i = 0; i < Math.round(secs * 60); i++) f.step(1 / 60, false, false, idle);
}

test('typing goes in, and a while at OK with nothing typed drifts back to the desk', () => {
  const f = new Framing(true);
  f.step(1 / 60, true, false, true);
  expect(f.wide).toBe(false);
  wait(f, BACK_AFTER - 0.5);
  expect(f.wide).toBe(false);
  wait(f, 1);
  expect(f.wide).toBe(true);
});

test('a running program or an INPUT holds the view in; the clock starts again at OK', () => {
  const f = new Framing(true);
  f.step(1 / 60, true, false, false);
  wait(f, BACK_AFTER * 3, false);
  expect(f.wide).toBe(false);
  wait(f, BACK_AFTER - 0.5);
  expect(f.wide).toBe(false);
});

test('the story changing the screen goes in; a tape waiting for the recorder pulls back at once', () => {
  const f = new Framing(true);
  f.step(1 / 60, false, true, true);
  expect(f.wide).toBe(false);
  f.back();
  expect(f.wide).toBe(true);
});
