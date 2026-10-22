import { expect, test } from '../../test/check';
import { CHECKPOINTS, STORY_FLAGS } from './checkpoints';

test('checkpoints: each `?at=` id is used once and names only story flags', () => {
  const ids = CHECKPOINTS.map((c) => c.id);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i).join(', ')).toBe('');
  const known = new Set(STORY_FLAGS.map(([f]) => f));
  expect(CHECKPOINTS.flatMap((c) => c.flags.filter((f) => !known.has(f))).join(', ')).toBe('');
});
