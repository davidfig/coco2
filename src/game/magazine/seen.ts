import type { Magazine } from './book';
import type { AnyPageId } from './pages';

/** Pages the story waits for the player to have looked at: each sets the flag `seen-<id>`. */
const WATCHED: readonly AnyPageId[] = ['guess', 'mayShutdownEnd'];

/** How long a page must stay open in front of the player before it counts as looked at (not just flipped past). */
const DWELL = 1.2;

/**
 * Notices when a watched page has been open and at rest for a moment, and sets its `seen-` flag. Turning pages one after
 * another, or leaving the magazine shut, counts for nothing. Call it every frame.
 */
export class SeenTracker {
  private at = -1;
  private held = 0;

  update(mag: Magazine, dt: number): void {
    const phi = mag.phi();
    const spread = Math.round(phi);
    if (!mag.open || mag.openT < 0.97 || Math.abs(phi - spread) > 0.001) {
      this.at = -1;
      this.held = 0;
      return;
    }
    if (spread !== this.at) {
      this.at = spread;
      this.held = 0;
    }
    this.held += dt;
    if (this.held < DWELL) return;
    for (const i of [spread * 2 - 1, spread * 2]) {
      const id = mag.pageId(i);
      if (id && WATCHED.includes(id)) mag.setFlag(`seen-${id}`);
    }
  }
}
