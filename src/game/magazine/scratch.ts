import type { Magazine } from './book';
import { PAGE_UNIT_H } from './bookLayout';
import { REVEAL_AT, startScratch, wear } from './foil';
import { PAGE_H, PAGE_W } from './paper';

/**
 * Scratch the panel `id` at book point (px, py). The foil wears away only where the pointer has been, so the hint
 * shows in strips as it is scrubbed clear; once most of the panel is gone the rest falls off. A point outside the
 * panel lifts the pen.
 */
export function scratch(mag: Magazine, id: string, px: number, py: number): void {
  const page = px >= 0 ? mag.spread * 2 : mag.spread * 2 - 1;
  const x = (px >= 0 ? px : px + 1) * PAGE_W;
  const y = (0.5 - py / PAGE_UNIT_H) * PAGE_H;
  const box = mag.spots[page]?.find((s) => s.id === id);
  if (!box) return;
  let s = mag.state.scratch[id];
  if (x < box.x || x > box.x + box.w || y < box.y || y > box.y + box.h) {
    if (s) s.last = null;
    return;
  }
  s ??= mag.state.scratch[id] = startScratch(box.w, box.h);
  if (wear(s, x - box.x, y - box.y) >= REVEAL_AT) mag.reveal(id);
  else mag.have.delete(page);
}
