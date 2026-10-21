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
  // The features follow the puzzles: say hello, type a program and check it, load the adventure (and fix it), play it, map it, stop
  // it to read its lines, then check GUESS against its listing.
  'screen',
  'program',
  'tape',
  'words',
  'map',
  'cleanerAd',
  'stopping',
  'guess',
  'memoryAd',
  'classifieds',
  'marketplace',
  'insideBack',
  'backCover',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

/**
 * The May issue, in the order it is bound. Its pages have their own ids (all starting "may"), and `pageNo` finds a page in
 * whichever issue it belongs to.
 */
export const MAY_PAGE_IDS = [
  'mayCover',
  'mayInsideFront',
  'mayContents',
  'mayLetters',
  'mayEditorial',
  'mayHealthy',
  'maySecret',
  'mayShutdown',
  'mayShutdownList',
  'mayShutdownEnd',
  'mayTape',
  'mayClearMind',
  'mayClassifieds',
  'mayMarketplace',
  'mayInsideBack',
  'mayBackCover',
] as const;

export type MayPageId = (typeof MAY_PAGE_IDS)[number];
export type AnyPageId = PageId | MayPageId;

/** Every issue the player can have, in the order they arrive. */
export const ISSUES = { march: PAGE_IDS, may: MAY_PAGE_IDS } as const satisfies Record<string, readonly AnyPageId[]>;
export type IssueId = keyof typeof ISSUES;
export const ISSUE_ORDER: readonly IssueId[] = ['march', 'may'];
/** The month on each issue's cover and running foot. */
export const ISSUE_DATE: Record<IssueId, string> = { march: 'March 1986', may: 'May 1986' };

/** The issue page `id` is bound in. */
export const issueOf = (id: AnyPageId): IssueId => ((MAY_PAGE_IDS as readonly AnyPageId[]).includes(id) ? 'may' : 'march');

/** Where page `id` is in its issue, counting from 0 (what the book's `goto` takes). */
export const pageIndex = (id: AnyPageId): number => (ISSUES[issueOf(id)] as readonly AnyPageId[]).indexOf(id);

/** The number printed on page `id`: the cover is 1. */
export const pageNo = (id: AnyPageId): number => pageIndex(id) + 1;
