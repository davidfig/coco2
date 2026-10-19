import { expect, test } from '../../test/check';
import { GUIDE_AGAIN, GUIDE_FIRST, Guide, type Beckon } from './guide';

/** A guide with its own flags, and every call it makes over `secs` seconds (at 60 Hz) with the paper as given. */
function guided(): { flags: Set<string>; guide: Guide; run: (secs: number, ready?: boolean, notesOpen?: boolean, magazineOpen?: boolean) => Beckon[] } {
  const flags = new Set<string>();
  const guide = new Guide((f) => flags.has(f), (f) => flags.add(f));
  const run = (secs: number, ready = true, notesOpen = false, magazineOpen = false): Beckon[] => {
    const calls: Beckon[] = [];
    for (let i = 0; i < Math.round(secs * 60); i++) {
      const b = guide.step(1 / 60, ready, notesOpen, magazineOpen);
      if (b) calls.push(b);
    }
    return calls;
  };
  return { flags, guide, run };
}

test('the notes are called to first, then again and again until held up', () => {
  const { run } = guided();
  expect(run(GUIDE_FIRST - 0.1)).toEqual([]);
  expect(run(0.2)).toEqual(['notes']);
  expect(run(GUIDE_AGAIN * 2)).toEqual(['notes', 'notes']);
});

test('nothing calls before the paper has come in', () => {
  const { run } = guided();
  expect(run(GUIDE_FIRST * 3, false)).toEqual([]);
  expect(run(GUIDE_FIRST + 0.1)).toEqual(['notes']);
});

test('once the notes have been held up, the magazine is called to, and stops once opened', () => {
  const { flags, guide, run } = guided();
  expect(run(1, true, true)).toEqual([]);
  expect(flags.has('opened-notes')).toBe(true);
  expect(run(GUIDE_FIRST + 0.1)).toEqual(['magazine']);
  expect(guide.magazineOut).toBe(true);
  expect(run(1, true, false, true)).toEqual([]);
  expect(guide.magazineOut).toBe(false);
  expect(flags.has('opened-magazine')).toBe(true);
  expect(run(GUIDE_AGAIN * 3)).toEqual([]);
});

test('the magazine opened first still leaves the notes to call to, and nothing after them', () => {
  const { run } = guided();
  run(1, true, false, true);
  expect(run(GUIDE_FIRST + 0.1)).toEqual(['notes']);
  run(1, true, true);
  expect(run(GUIDE_AGAIN * 3)).toEqual([]);
});
