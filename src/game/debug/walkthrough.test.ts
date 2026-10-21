import { expect, test } from '../../test/check';
import { STORY_FLAGS } from './checkpoints';
import { ROUTES, walk } from './walkthrough';

/** Flags no scripted route earns: reading the whisper and the code in the listing, the other ways past. */
const OFF_ROUTE = ['whisper-found', 'read-code'];

for (const route of ROUTES) {
  test(`walkthrough: "${route.name}" plays to the end of issue 2`, () => {
    const { flags } = walk(route);
    expect(flags.has('issue2-closed')).toBe(true);
  });
}

test('walkthrough: between them the routes earn every story flag', () => {
  const earned = new Set(ROUTES.flatMap((r) => [...walk(r).flags]));
  const missing = STORY_FLAGS.map(([f]) => f).filter((f) => !earned.has(f) && !OFF_ROUTE.includes(f));
  expect(missing.join(', ')).toBe('');
});
