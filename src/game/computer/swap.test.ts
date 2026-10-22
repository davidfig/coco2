import { expect, test } from '../../test/check';
import { DESK_LAYOUTS, PLACE } from './layout';
import { pileSlot } from './pile';
import { IssueSwap, PILE_SHADE, SWAP_SECONDS } from './swap';

const spot = DESK_LAYOUTS[0].magazine!;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test('an issue picked up opens from where it lies on the pile, as the room sees it, in its shade', () => {
  const s = new IssueSwap('may', 'march');
  expect(s.waiting).toBe(true);
  const slot = pileSlot(0, 1);
  s.rise(spot, 1, slot, slot);
  expect(s.waiting).toBe(false);
  const p = s.rising!.pile;
  expect(near(p.spot.x, slot.x + PLACE.x) && near(p.spot.z, slot.z + PLACE.z) && near(p.lift, slot.y)).toBe(true);
  expect([p.spot.hw, p.spot.hd, p.face, p.shade]).toEqual([spot.hw, spot.hd, 0, PILE_SHADE]);
});

test('the one going back leaves its spot on the table a moment later, lifted on the way, and lands as the pile draws it', () => {
  const s = new IssueSwap('may', 'march', 4);
  const back = pileSlot(0, 1);
  s.rise(spot, 1, pileSlot(0, 1), back);
  const a = s.going();
  expect(near(a.spot.x, spot.x) && near(a.spot.z, spot.z) && a.lift === 0 && a.face === 1 && a.shade === 1).toBe(true);
  s.step(SWAP_SECONDS * 0.1);
  expect(near(s.going().spot.x, spot.x)).toBe(true);
  expect(s.step(SWAP_SECONDS * 0.5)).toBe(false);
  expect(s.going().lift > 0).toBe(true);
  expect(s.step(SWAP_SECONDS)).toBe(true);
  const b = s.going();
  expect(near(b.spot.x, back.x + PLACE.x) && near(b.spot.z, back.z + PLACE.z) && near(b.lift, back.y)).toBe(true);
  expect([b.face, b.shade]).toEqual([0, PILE_SHADE]);
});

test('picked up without opening, it is carried from the pile to the table first, over the one going back', () => {
  const s = new IssueSwap('may', 'march', undefined, false);
  expect(s.opens).toBe(false);
  const slot = pileSlot(0, 1);
  s.rise(spot, 1, slot, slot);
  const a = s.coming(spot);
  expect(near(a.spot.x, slot.x + PLACE.x) && a.face === 0 && a.shade === PILE_SHADE).toBe(true);
  s.step(SWAP_SECONDS * 0.5);
  expect(s.coming(spot).lift > s.going().lift).toBe(true);
  s.step(SWAP_SECONDS * 0.25);
  const b = s.coming(spot);
  expect(near(b.spot.x, spot.x) && near(b.spot.z, spot.z) && near(b.lift, 0) && b.face === 1 && b.shade === 1).toBe(true);
});
