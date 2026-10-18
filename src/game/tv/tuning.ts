import { CH_FIRST, CH_START, CH_STEP } from './cabinetShader';
import type { Knobs } from './knobs';

/** The channel the CoCo's RF modulator sends on, and how much of it the next channel up still catches. */
export const COCO_CHANNEL = 3;
const CH_BLEED = 0.4;
/** How far off the fine-tuning ring can be (radians) before the picture is half lost: sets the curve's width. */
const FINE_WIDTH = 0.5;
/** The vertical hold locks the picture within this (radians) of where it should be; beyond, it rolls. */
const HOLD_LOCK = 0.3;
/** How fast the picture rolls (frames a second) per radian the hold is off beyond the lock. */
const ROLL_RATE = 1.4;

/** A far-off station coming in on a dead channel (`Tv.broadcast`): which channel, and how strongly at best (0..1). */
export interface Station {
  channel: number;
  strength: number;
}

/**
 * What reaches the tube through the tuner: how much of the CoCo's picture (and of a far station's), how sharply it's
 * tuned in, and whether the picture holds still. The knobs set it; the story can upset it (`drift`, `upsetHold`,
 * `loosen`) and a smack on the cabinet sometimes puts it right.
 */
export class Tuning {
  /** Where the fine-tuning ring brings the picture in sharpest; `drift` moves it. */
  fineIdeal = 0;
  /** Where the vertical hold locks the picture; `upsetHold` moves it. */
  holdIdeal = 0;
  /** How far the raster has rolled, in frames (only the fraction shows), and how fast it's rolling (frames a second). */
  roll = 0;
  rollSpeed = 0;
  /** A bad connection somewhere inside, 0..1: the picture drops out now and then, worse the higher it is. */
  loose = 0;
  station: Station | null = null;
  /** 1 while a loose connection has the picture, dipping toward 0 as it cuts out. */
  private contact = 1;
  private cutFor = 0;

  constructor(private readonly knobs: Knobs) {}

  update(dt: number): void {
    const off = this.knobs.hold - this.holdIdeal;
    this.rollSpeed = Math.sign(off) * Math.max(0, Math.abs(off) - HOLD_LOCK) * ROLL_RATE;
    if (this.rollSpeed !== 0) this.roll += this.rollSpeed * dt;
    else this.roll += (Math.round(this.roll) - this.roll) * (1 - Math.exp(-8 * dt)); // the picture pulls back into lock
    // A loose connection: now and then the picture cuts out for a moment, more often the looser it is.
    if (this.cutFor > 0) this.cutFor -= dt;
    else if (Math.random() < this.loose * this.loose * dt * 3) this.cutFor = 0.04 + Math.random() * 0.25 * this.loose;
    this.contact += ((this.cutFor > 0 ? 0.05 : 1) - this.contact) * (1 - Math.exp(-40 * dt));
  }

  /** How far the selector's pointer is (in channels) from `ch`, as a 0..1 nearness: 1 right on it. */
  private near(ch: number): number {
    const at = (this.knobs.turn[0] - CH_START) / CH_STEP + CH_FIRST;
    return Math.exp(-((at - ch) ** 2) / 0.06);
  }

  /** How badly the fine-tuning is off, 0 (sharp) .. 1 (lost): softer colour, herringbone, buzz, then snow. */
  detune(): number {
    const d = (this.knobs.turn[2] - this.fineIdeal) / FINE_WIDTH;
    return 1 - Math.exp(-d * d * 0.7);
  }

  /** How well a picture sent on `ch` comes through as tuned now, 0..1. */
  private through(ch: number): number {
    const lost = Math.min(1, Math.max(0, (this.detune() - 0.55) / 0.4));
    return this.near(ch) * (1 - 0.85 * lost * lost * (3 - 2 * lost)) * this.contact;
  }

  /**
   * How much of the CoCo's picture the set picks up, 0..1, from where the selector points right now (so it comes and
   * goes as the knob swings past). The modulator sends on 3; 4, next door, catches a weak copy; elsewhere is snow.
   */
  signal(): number {
    return Math.max(this.through(COCO_CHANNEL), CH_BLEED * this.through(COCO_CHANNEL + 1));
  }

  /** How much of the far station comes through, 0..1. */
  stationSignal(): number {
    const s = this.station;
    return s && s.channel !== COCO_CHANNEL ? s.strength * this.through(s.channel) : 0;
  }

  /** Story: the set slips off tune by `by` radians of the fine-tuning ring (the player turns it back). */
  drift(by: number): void {
    this.fineIdeal += by;
  }

  /** Story: the vertical hold slips by `by` radians, so the picture starts to roll until the knob is turned to match. */
  upsetHold(by: number): void {
    this.holdIdeal += by;
  }

  /** Story: something inside works loose (0 none .. 1 dreadful). */
  loosen(amount: number): void {
    this.loose = Math.min(1, Math.max(0, amount));
  }

  /** The flat of a hand on the cabinet: it may jar a slipped hold, a drifted tune or a loose contact back, or not. */
  smack(): void {
    if (this.rollSpeed !== 0 && Math.random() < 0.5) this.holdIdeal += (this.knobs.hold - this.holdIdeal) * 0.7;
    if (Math.abs(this.fineIdeal) > 0.05 && Math.random() < 0.4) this.fineIdeal *= 0.4;
    if (this.loose > 0) {
      const r = Math.random();
      if (r < 0.45) this.loose = 0;
      else if (r > 0.85) this.loose = Math.min(1, this.loose + 0.2);
    }
  }
}
