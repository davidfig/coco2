import { expect, test } from '../../test/check';
import { BOUNCE_TIME, HOP_HEIGHT, Hop } from './hop';

test('a hop leaves the table and lands again, and a second call mid-hop is ignored', () => {
  const h = new Hop();
  expect(h.lift()).toBe(0);
  h.start();
  h.step(BOUNCE_TIME / 2);
  const top = h.lift();
  expect(Math.abs(top - HOP_HEIGHT) < 1e-9).toBe(true);
  h.start();
  h.step(BOUNCE_TIME / 2);
  expect(h.lift() < top / 10).toBe(true);
  h.step(BOUNCE_TIME * 2);
  expect(h.lift()).toBe(0);
});
