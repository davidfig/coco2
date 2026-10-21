import { expect, test } from '../../test/check';
import { BOUNCE_TIME, Hop } from './hop';

test('a hop leaves the table and lands again, and a second call mid-hop is ignored', () => {
  const h = new Hop();
  expect(h.lift(1)).toBe(0);
  h.start();
  h.step(BOUNCE_TIME / 2);
  const top = h.lift(1);
  expect(top > 0).toBe(true);
  h.start();
  h.step(BOUNCE_TIME / 2);
  expect(h.lift(1) < top / 10).toBe(true);
  h.step(BOUNCE_TIME * 2);
  expect(h.lift(1)).toBe(0);
});
