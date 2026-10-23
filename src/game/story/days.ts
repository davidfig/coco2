/**
 * The nights between issues: each evening's story ends with a flag, the set switched off after it closes the evening,
 * and in the dark of that night the next issue's box comes (`ISSUE_ARRIVES`, magazine/pages.ts). Each issue is one day
 * (docs/story.md, Timeline).
 */
export const NIGHTS: readonly { closed: string; next: string }[] = [
  { closed: 'issue1-closed', next: 'issue2-waiting' },
  { closed: 'issue2-closed', next: 'issue3-waiting' },
];

export class Days {
  constructor(
    private readonly has: (flag: string) => boolean,
    private readonly set: (flag: string) => void,
    /** The next day: the CoCo switched on again, nothing in memory. */
    private readonly newDay: () => void,
  ) {}

  /** How many evenings have been closed: one more after the set is switched off means night falls (main.ts, `night`). */
  nights(): number {
    return NIGHTS.filter((n) => this.has(n.closed)).length;
  }

  /**
   * The room went dark after the set was switched off (`night` in main.ts), or the set was switched on, or the page
   * loaded, which is waking up too. After a night that closed an evening, it is the next day: the CoCo starts afresh and
   * the next issue is here.
   */
  wake(): void {
    const night = NIGHTS.find((n) => this.has(n.closed) && !this.has(n.next));
    if (!night) return;
    this.newDay();
    this.set(night.next);
  }
}
