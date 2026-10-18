/**
 * The pages of the issue, in the order they are bound. This is the only place that says which page is which: the
 * contents, the editor's column, the letters, the cover and the notebook all name a page by id and ask `pageNo` for
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
  'cleanerAd',
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

/**
 * The May issue, as far as it has come: the cover, the printer's notice inside it, and the back. Its pages get their
 * own ids; `pageNo` above is the March issue's, which is the one the notebook and March's own pages point into.
 */
export const MAY_PAGE_IDS = ['mayCover', 'mayNotice', 'mayInsideBack', 'mayBackCover'] as const;

export type MayPageId = (typeof MAY_PAGE_IDS)[number];
export type AnyPageId = PageId | MayPageId;

/** Every issue the player can have, in the order they arrive. */
export const ISSUES = { march: PAGE_IDS, may: MAY_PAGE_IDS } as const satisfies Record<string, readonly AnyPageId[]>;
export type IssueId = keyof typeof ISSUES;
export const ISSUE_ORDER: readonly IssueId[] = ['march', 'may'];
/** The month on each issue's cover and running foot. */
export const ISSUE_DATE: Record<IssueId, string> = { march: 'March 1986', may: 'May 1986' };
