import { expect, test } from '../../test/check';
import { NOTES, noteReads, noteText } from './notes';

test('NOTES: every note fills in all its words, whichever way its flags go', () => {
  for (const n of NOTES) {
    for (const flags of [new Set<string>(), new Set(noteReads(n))]) {
      expect(/[{}]/.test(noteText(n, flags))).toBe(false);
    }
  }
});
