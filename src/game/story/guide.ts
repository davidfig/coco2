/**
 * Seconds before a call once the one called to changes (the notes put down), and between calls after that; a page
 * load's first call comes at once. The same for every call: the notes, the magazine and the cassette.
 */
export const GUIDE_FIRST = 3;
export const GUIDE_AGAIN = 22;
/** How long a call holds the magazine slid out. */
export const GUIDE_HOLD = 0.9;

/** What the guide wants to draw the eye to this frame. */
export type Beckon = 'notes' | 'magazine' | 'cassette' | null;

/**
 * Brings a new player to the paper on the desk, with nothing written on screen: the notes bounce now and then until they
 * have been held up once (their first line points into the magazine), and then the magazine slides out a little now and
 * then until it has been opened. Each is remembered by a flag (`opened-notes`, `opened-magazine`), so it happens once.
 * After that, while the story waits on a cassette to be put in the recorder (`cassette`: March's to begin with, May's
 * once it has come), that cassette hops now and then, but only with the view pulled back to the desk, where it shows.
 */
export class Guide {
  private t = 0;
  private due = GUIDE_FIRST;
  /** Undefined until the first frame, whose call comes as soon as the paper is in. */
  private calling: Beckon | undefined = undefined;
  private held = 0;

  constructor(
    private readonly has: (flag: string) => boolean,
    private readonly set: (flag: string) => void,
    private readonly cassette: () => boolean = () => false,
  ) {}

  /**
   * One frame: `ready` once the paper has come in, whether each is open now, and whether the view is on the whole desk.
   * Returns the one to call to, on the frame it should.
   */
  step(dt: number, ready: boolean, notesOpen: boolean, magazineOpen: boolean, desk = true): Beckon {
    this.held = magazineOpen ? 0 : Math.max(0, this.held - dt);
    if (notesOpen) this.set('opened-notes');
    if (magazineOpen) this.set('opened-magazine');
    const want: Beckon = !this.has('opened-notes') ? 'notes' : !this.has('opened-magazine') ? 'magazine' : this.cassette() ? 'cassette' : null;
    // A new one to call to (the notes were just put down): it waits as long as the first call did.
    if (want !== this.calling) [this.calling, this.t, this.due] = [want, 0, this.calling === undefined ? 0 : GUIDE_FIRST];
    // The cassette shows only on the desk: its time between calls runs only while the view is there.
    if (!want || !ready || notesOpen || magazineOpen || (want === 'cassette' && !desk)) return null;
    if ((this.t += dt) < this.due) return null;
    [this.t, this.due] = [0, GUIDE_AGAIN];
    if (want === 'magazine') this.held = GUIDE_HOLD;
    return want;
  }

  /** The magazine is being called to: held slid out a little, as a pointer over it does. */
  get magazineOut(): boolean {
    return this.held > 0;
  }
}
