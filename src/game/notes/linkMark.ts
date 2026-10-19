import { smooth } from '../magazine/bookLayout';
import type { Mark } from './pileDraw';
import { type PageLink, ringPoints } from './sheet';

/** How long the pen takes to go round a page reference. */
const TRACE_TIME = 0.42;

/**
 * The sheets' page references, and the one under the pointer on the held-up sheet: its ring is lifted off the page and
 * drawn again by the red pen, each time it is pointed at. A pointer that leaves early lets the pen finish.
 */
export class LinkMark {
  /** Each sheet's page references as last written, in sheet pixels. */
  links: PageLink[][] = [];
  /** The reference under the pointer now, if any. */
  over: PageLink | false = false;
  private link: PageLink | undefined;
  private pts = new Float32Array(0);
  private box: [number, number, number, number] = [0, 0, 0, 0];
  private length = 0;
  private t = 0;

  /** The reference at sheet pixel (sx, sy) on `sheet`, if any. */
  at(sheet: number, sx: number, sy: number): PageLink | undefined {
    return (this.links[sheet] ?? []).find((l) => sx >= l.x && sx <= l.x + l.w && sy >= l.y && sy <= l.y + l.h);
  }

  /** Follow `over` while the sheet is held up (`open`). */
  update(open: boolean, dt: number): void {
    const over = open && this.over;
    if (over && over !== this.link) this.trace(over);
    if (!this.link) return;
    this.t = Math.min(1, this.t + dt / TRACE_TIME);
    // Once round, the sheet's own ring is the same: drawn again only when next pointed at.
    if (this.t >= 1 && !over) this.link = undefined;
  }

  /** Start drawing `link`'s ring again (sheet pixels). */
  private trace(link: PageLink): void {
    const path = ringPoints(link).slice(0, 64);
    this.pts = new Float32Array(path.flat());
    this.length = 0;
    for (let i = 1; i < path.length; i++) this.length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    const xs = path.map((p) => p[0]);
    const ys = path.map((p) => p[1]);
    this.box = [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + 4, Math.max(...ys) + 4];
    this.link = link;
    this.t = 0;
  }

  /** The ring being drawn again (sheet pixels) and how far the pen has got; none once it is round. */
  mark(): Mark | undefined {
    if (!this.link || this.t >= 1) return undefined;
    return { pts: this.pts, box: this.box, drawn: this.length * smooth(this.t), slot: this.link.slot };
  }
}
