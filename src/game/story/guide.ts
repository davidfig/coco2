/** Seconds after the notes and the magazine have come in before the first call, and between calls after that. */
export const GUIDE_FIRST = 3;
export const GUIDE_AGAIN = 22;
/** How long a call holds the magazine slid out. */
export const GUIDE_HOLD = 0.9;

/** What the guide wants to draw the eye to this frame. */
export type Beckon = 'notes' | 'magazine' | null;

/**
 * Brings a new player to the paper on the desk, with nothing written on screen: the notes bounce now and then until they
 * have been held up once (their first line points into the magazine), and then the magazine slides out a little now and
 * then until it has been opened. Each is remembered by a flag (`opened-notes`, `opened-magazine`), so it happens once.
 */
export class Guide {
  private t = 0;
  private due = GUIDE_FIRST;
  private calling: Beckon = null;
  private held = 0;

  constructor(private readonly has: (flag: string) => boolean, private readonly set: (flag: string) => void) {}

  /**
   * One frame: `ready` once the paper has come in, and whether each is open now. Returns the one to call to, on the frame
   * it should.
   */
  step(dt: number, ready: boolean, notesOpen: boolean, magazineOpen: boolean): Beckon {
    this.held = magazineOpen ? 0 : Math.max(0, this.held - dt);
    if (notesOpen) this.set('opened-notes');
    if (magazineOpen) this.set('opened-magazine');
    const want: Beckon = !this.has('opened-notes') ? 'notes' : !this.has('opened-magazine') ? 'magazine' : null;
    // A new one to call to (the notes were just put down): it waits as long as the first call did.
    if (want !== this.calling) [this.calling, this.t, this.due] = [want, 0, GUIDE_FIRST];
    if (!want || !ready || notesOpen || magazineOpen) return null;
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
