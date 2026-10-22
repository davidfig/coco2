import { expect, test } from '../../test/check';
import { DESK_LAYOUTS, PLACE } from './layout';
import { pileSlot } from './pile';
import { IssueSwap, PILE_SHADE } from './swap';

const spot = DESK_LAYOUTS[0].magazine!;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test('an issue picked up opens from where it lies on the pile, as the room sees it, in its shade', () => {
  const s = new IssueSwap('may', 'march');
  expect(s.waiting).toBe(true);
  const slot = pileSlot(0, 1);
  s.rise(spot, 1, slot);
  expect(s.waiting).toBe(false);
  const p = s.rising!.pile;
  expect(near(p.spot.x, slot.x + PLACE.x) && near(p.spot.z, slot.z + PLACE.z) && near(p.lift, slot.y)).toBe(true);
  expect([p.spot.hw, p.spot.hd, p.face, p.shade]).toEqual([spot.hw, spot.hd, 0, PILE_SHADE]);
});

test('the one going back lies where it was on the table while the other opens', () => {
  const s = new IssueSwap('may', 'march', 4);
  s.rise(spot, 0.5, pileSlot(0, 1));
  expect([s.rising!.spot, s.rising!.t, s.page]).toEqual([spot, 0.5, 4]);
});
