import { expect, test } from '../../test/check';
import { readSave } from './bookSave';

test('bookSave: a save from before the rename keeps its story, under the new flag names', () => {
  localStorage.setItem('coco2.rainbow', JSON.stringify({ flags: ['booted', 'ok-thanks', 'saw-thanks'], issue: 'march', pages: {} }));
  expect(readSave().flags?.join(',')).toBe('booted,echo-thanks,saw-thanks');
  localStorage.removeItem('coco2.rainbow');
});
