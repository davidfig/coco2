import type { IssueId } from '../magazine/pages';
import { type DeskSpot, PLACE } from './layout';

/**
 * The light on a magazine on the pile against one lying on the table (the book's `uLight`): the pile is back by the set,
 * in its shade from the lamp. Opened from there, it goes from one to the other.
 */
export const PILE_SHADE = 0.8;

/** A place on the pile (`pileSlot`, model frame). */
export interface Slot {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** How a magazine lies on the pile, for the book (`Lying`): its spot in the world, how high, seen as the room sees it, in the pile's shade. */
export interface OnPile {
  spot: DeskSpot;
  lift: number;
  face: number;
  shade: number;
}

/** A magazine at pile place `p`, the size of one on the table (`spot`). */
export function onPile(p: Slot, spot: DeskSpot): OnPile {
  return { spot: { x: p.x + PLACE.x, z: p.z + PLACE.z, yaw: p.yaw, hw: spot.hw, hd: spot.hd }, lift: p.y, face: 0, shade: PILE_SHADE };
}

/**
 * Another issue picked up from the pile beside the set (a click on it, the book's corner button, a note's page link
 * into it): it is opened from where it lies on the pile, and nothing else is carried. The one on the table stays lying
 * there (`Magazine.letGo`) and the cassettes where they are until the book is all the way open, the view in on the set:
 * then, out of sight, the one on the table goes onto the pile and the cassettes change places at once. If the book is
 * open it is first put away (`waiting`).
 */
export class IssueSwap {
  /** The issue going back to the pile, the one coming, and the page to open it at. */
  readonly from: IssueId;
  readonly to: IssueId;
  readonly page?: number;
  /** Opening from the pile: how it lies there, and how the one going back lies on the table meanwhile (`t` as `Computer.table`). */
  rising: { pile: OnPile; spot: DeskSpot; t: number } | null = null;

  constructor(from: IssueId, to: IssueId, page?: number) {
    [this.from, this.to, this.page] = [from, to, page];
  }

  /** Waiting for the book to be put away before the other is opened. */
  get waiting(): boolean {
    return !this.rising;
  }

  /** Open the one from pile place `slot`; the one going back lies at `spot` (`t` of the way onto the table). */
  rise(spot: DeskSpot, t: number, slot: Slot): void {
    this.rising = { pile: onPile(slot, spot), spot, t };
  }
}
