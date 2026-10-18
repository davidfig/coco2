/**
 * The pages of the issue, in the order they are bound. This is the only place that says which page is which: the
 * contents, the editor's column, the letters, the hints and the notebook all name a page by id and ask `pageNo` for
 * its number, so reordering this list (or adding a page) fixes every "see page N" in the magazine at once.
 * It has no imports, so any module may use it.
 */
export const PAGE_IDS = [
  'cover',
  'insideFront',
  'contents',
  'letters',
  'editorial',
  'screen',
  'words',
  'map',
  'hints',
  'typeIn',
  'program',
  'stopping',
  'guess',
  'tape',
  'classifieds',
  'marketplace',
  'insideBack',
  'backCover',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

/** Where page `id` is in the book, counting from 0 (what the book's `goto` takes). */
export const pageIndex = (id: PageId): number => PAGE_IDS.indexOf(id);

/** The number printed on page `id`: the cover is 1. */
export const pageNo = (id: PageId): number => pageIndex(id) + 1;
