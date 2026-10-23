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
  'mayPledge',
  'mayClassifieds',
  'mayMarketplace',
  'mayInsideBack',
  'mayBackCover',
] as const;

export type MayPageId = (typeof MAY_PAGE_IDS)[number];

/**
 * The July issue, in the order it is bound (all starting "july"). Planned in docs/issues.md, Issue 3; its pages are
 * placeholders for now (`julyDraft.ts`).
 */
export const JULY_PAGE_IDS = [
  'julyCover',
  'julyInsideFront',
  'julyContents',
  'julyLetters',
  'julyEditorial',
  'julyInterview',
  'julyPlace',
  'julyRegister',
  'julyRegisterList',
  'julyTape',
  'julyPledge',
  'julySermon',
  'julyClassifieds',
  'julyMarketplace',
  'julyInsideBack',
  'julyBackCover',
] as const;

export type JulyPageId = (typeof JULY_PAGE_IDS)[number];
export type AnyPageId = PageId | MayPageId | JulyPageId;

/** Every issue the player can have, in the order they arrive. */
export const ISSUES = { march: PAGE_IDS, may: MAY_PAGE_IDS, july: JULY_PAGE_IDS } as const satisfies Record<string, readonly AnyPageId[]>;
export type IssueId = keyof typeof ISSUES;
export const ISSUE_ORDER: readonly IssueId[] = ['march', 'may', 'july'];
/** The month on each issue's cover and running foot. */
export const ISSUE_DATE: Record<IssueId, string> = { march: 'March 1986', may: 'May 1986', july: 'July 1986' };
/**
 * The flag that brings each issue's box (null: there from the start). It is set in the dark of the night before
 * (`story/days.ts`), and from then on the issue is the player's: on the table, its cassette by the recorder.
 */
export const ISSUE_ARRIVES: Record<IssueId, string | null> = { march: null, may: 'issue2-waiting', july: 'issue3-waiting' };

/** The issues that have come, given the story's flags, in the order they came. */
export const issuesHad = (has: (flag: string) => boolean): IssueId[] => ISSUE_ORDER.filter((id) => ISSUE_ARRIVES[id] === null || has(ISSUE_ARRIVES[id]!));

/** The newest issue that has come. */
export const newestIssue = (has: (flag: string) => boolean): IssueId => issuesHad(has).at(-1)!;

/** The issue page `id` is bound in. */
export const issueOf = (id: AnyPageId): IssueId => ISSUE_ORDER.find((issue) => (ISSUES[issue] as readonly AnyPageId[]).includes(id))!;

/** Where page `id` is in its issue, counting from 0 (what the book's `goto` takes). */
export const pageIndex = (id: AnyPageId): number => (ISSUES[issueOf(id)] as readonly AnyPageId[]).indexOf(id);

/** The number printed on page `id`: the cover is 1. */
export const pageNo = (id: AnyPageId): number => pageIndex(id) + 1;
