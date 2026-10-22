import type { IssueId } from '../magazine/pages';
import { type DeskSpot, PLACE } from './layout';

/**
 * The light on a magazine on the pile against one lying on the table (the book's `uLight`): the pile is back by the set,
 * in its shade from the lamp. Opened from there, or carried back there, it goes from one to the other.
 */
export const PILE_SHADE = 0.8;
/** Seconds from the one picked up lifting off the pile to the one going back landing there: about the book's opening. */
export const SWAP_SECONDS = 1.1;
/** The share of that before the one going back sets off, so it doesn't meet the other leaving the pile. */
const LEAVE = 0.25;
/** How high the one going back is carried over the table halfway (world units). */
const ARC = 0.25;
/** How high the one put on the table without opening it is carried: higher than the one going back, which it passes over (the book draws it on top). */
const OVER = 0.55;

/** A place on the pile (`pileSlot`, model frame). */
export interface Slot {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** How a magazine lies, for the book (`Lying`): its spot in the world, how high, how square on (1: as on the table, 0: as the room sees the pile), its light. */
export interface Pose {
  spot: DeskSpot;
  lift: number;
  face: number;
  shade: number;
}

/** A magazine at pile place `p`, the size of one on the table (`spot`). */
export function onPile(p: Slot, spot: DeskSpot): Pose {
  return { spot: { x: p.x + PLACE.x, z: p.z + PLACE.z, yaw: p.yaw, hw: spot.hw, hd: spot.hd }, lift: p.y, face: 0, shade: PILE_SHADE };
}

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/**
 * Another issue picked up from the pile beside the set (a click on it, the book's corner button, a note's page link
 * into it): it is opened from where it lies on the pile, and the one on the table (`Magazine.letGo`) is carried back
 * to the pile meanwhile, setting off a moment later, lifted over the table, landing as the pile draws it. The cassettes
 * stay where they are until both are done, the view in on the set: then, out of sight, they change places at once. If
 * the book is open it is first put away (`waiting`). Picked up without opening it (`opens` false: a click on its
 * cassette in the pile), it is carried from the pile to the table instead, over the one going back, and the cassettes
 * change places meanwhile (`Recorder.shift`).
 */
export class IssueSwap {
  /** The issue going back to the pile, the one coming, and the page to open it at. */
  readonly from: IssueId;
  readonly to: IssueId;
  readonly page?: number;
  /** Whether the one picked up is opened (else it is only put on the table: `coming`). */
  readonly opens: boolean;
  /** Under way: how the one opening lay on the pile, where the one going back lay on the table and lands on it, and `t` as `Computer.table` for it. */
  rising: { pile: Pose; table: Pose; back: Pose; t: number } | null = null;
  /** How far through (0..1). */
  s = 0;

  constructor(from: IssueId, to: IssueId, page?: number, opens = true) {
    [this.from, this.to, this.page, this.opens] = [from, to, page, opens];
  }

  /** Waiting for the book to be put away before the other is opened. */
  get waiting(): boolean {
    return !this.rising;
  }

  /** Open the one from pile place `slot`; the one going back lies at `spot` (`t` of the way onto the table) and goes to place `back`. */
  rise(spot: DeskSpot, t: number, slot: Slot, back: Slot): void {
    this.rising = { pile: onPile(slot, spot), table: { spot, lift: 0, face: 1, shade: 1 }, back: onPile(back, spot), t };
    this.s = 0;
  }

  /** Further through it; true once the one going back has landed. */
  step(dt: number): boolean {
    if (!this.rising) return false;
    this.s = Math.min(1, this.s + dt / SWAP_SECONDS);
    return this.s >= 1;
  }

  /** Where the one going back is: from its spot on the table to its place on the pile, lifted over the table between. */
  going(): Pose {
    const { table, back } = this.rising!;
    return carry(table, back, clamp01((this.s - LEAVE) / (1 - LEAVE)), ARC);
  }

  /** Where the one put on the table without opening it is: from its place on the pile to `spot` on the table, setting off first and carried higher. */
  coming(spot: DeskSpot): Pose {
    return carry(this.rising!.pile, { spot, lift: 0, face: 1, shade: 1 }, clamp01(this.s / (1 - LEAVE)), OVER);
  }
}

/** A magazine `u` of the way from `a` to `b`, lifted `arc` over the table halfway. */
function carry(a: Pose, b: Pose, u: number, arc: number): Pose {
  const e = smooth(u);
  const mix = (p: number, q: number) => p + (q - p) * e;
  return {
    spot: { ...a.spot, x: mix(a.spot.x, b.spot.x), z: mix(a.spot.z, b.spot.z), yaw: mix(a.spot.yaw, b.spot.yaw) },
    lift: mix(a.lift, b.lift) + arc * Math.sin(Math.PI * u),
    face: mix(a.face, b.face),
    shade: mix(a.shade, b.shade),
  };
}
