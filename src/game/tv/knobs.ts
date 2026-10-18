import {
  CHANNEL_KNOB,
  CH_FIRST,
  CH_LAST,
  CH_START,
  CH_STEP,
  FINE_MAX,
  FINE_MIN,
  FINE_RING,
  HOLD_MAX,
  HOLD_MIN,
  VHOLD_KNOB,
  VOLUME_KNOB,
  VOL_MAX,
  VOL_MIN,
} from './cabinetShader';
import type { TvEvent } from './tvSound';
import { saveTvSettings, TvSettings } from './tvSave';

/** How the controls find themselves on screen: the TV's last-drawn mapping from buffer pixels to panel units. */
export interface PanelView {
  toPanel(x: number, y: number): [number, number];
  covers(x: number, y: number): boolean;
}

/** Within this (radians) of a channel the selector snaps onto it and holds there until turned out again. */
const CH_LOCK = 0.1;
/** How quickly (1/s) a knob catches up with where it's going: the selector snaps, the others glide. */
const CH_RATE = 40;
const GLIDE_RATE = 25;
/** A flicked volume knob spins on, slowing at this rate (1/s), until it stops or hits a stop. */
const VOL_FRICTION = 5;
/** Near the centre the pointer's angle jumps about: drags inside this share of the radius don't turn. */
const DEAD = 0.2;
/** Where the fine-tuning ring sits on a set fresh from the shop: a touch off, so the picture is a little soft. */
const FINE_START = 0.18;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const chAngle = (ch: number): number => CH_START + (ch - CH_FIRST) * CH_STEP;
const CH_MIN = chAngle(CH_FIRST);
const CH_MAX = chAngle(CH_LAST);

type Which = 'channel' | 'volume' | 'fine' | 'hold';
/** Index into `turn`/`goal`, and the turning stops, of each knob but the selector. */
const SLOT = { channel: 0, volume: 1, fine: 2, hold: 3 } as const;
const STOPS = { volume: [VOL_MIN, VOL_MAX], fine: [FINE_MIN, FINE_MAX], hold: [HOLD_MIN, HOLD_MAX] } as const;
/** Each knob's centre and radius, and the band (share of the radius) a pointer must be in to take hold of it. */
const GRIP = {
  channel: { k: CHANNEL_KNOB, from: 0, to: 1 },
  fine: { k: CHANNEL_KNOB, from: 1, to: FINE_RING + 0.04 },
  volume: { k: VOLUME_KNOB, from: 0, to: 1 },
  hold: { k: VHOLD_KNOB, from: 0, to: 1.15 },
} as const;

/**
 * The set's knobs, turned by dragging round them (or the wheel over one). The channel selector clicks from between
 * channels 2 and 13 (it turns freely in the hand but snaps onto a channel as it nears one, and falls into the nearest
 * when let go); the fine-tuning ring behind it, the volume and the vertical hold turn smoothly between their stops, and
 * the volume spins on a little when flicked. What they do to the picture is `tuning.ts`'s business. Where they're left
 * is saved (`tvSave.ts`) once they come to rest.
 */
export class Knobs {
  /** The channel the selector rests on (or is passing over), CH_FIRST..CH_LAST. */
  channel: number;
  /** Seconds since the selector last clicked onto a different channel (the tube's jolt runs off it). */
  sinceChange = 10;
  /** 0 (off) .. 1 (full). */
  volume: number;
  /** Each knob's turn as drawn (radians clockwise from up): channel, volume, fine-tuning ring, vertical hold. */
  readonly turn: number[];
  /** Where each knob is heading: the selector's hand (its detent once let go), the others' hands. */
  private goal: number[];
  /** What was last written to storage, as JSON. */
  private saved: string;
  private vel = 0;
  private drag: { which: Which; id: number; hand: number; last: number; acc: number; t: number } | null = null;
  private hover: Which | null = null;
  private wheelSum = 0;
  /** Told when the selector clicks into a detent. */
  onEvent: (e: TvEvent) => void = () => {};

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly view: PanelView,
    private readonly isOn: () => boolean,
    start: Partial<TvSettings> = {},
  ) {
    this.channel = start.channel ?? 3;
    this.volume = start.volume ?? 0.6;
    this.turn = [chAngle(this.channel), VOL_MIN + this.volume * (VOL_MAX - VOL_MIN), start.fine ?? FINE_START, start.hold ?? 0];
    this.goal = [...this.turn];
    this.saved = JSON.stringify(this.settings(start.on ?? true));
    this.listen();
  }

  /** The fine-tuning ring's and the vertical hold's turns, where they're heading. */
  get fine(): number {
    return this.goal[2];
  }
  get hold(): number {
    return this.goal[3];
  }

  update(dt: number): void {
    this.sinceChange += dt;
    if (!this.drag && this.vel !== 0) {
      this.goal[1] += this.vel * dt;
      this.vel *= Math.exp(-VOL_FRICTION * dt);
      if (Math.abs(this.vel) < 0.05 || this.goal[1] <= VOL_MIN || this.goal[1] >= VOL_MAX) this.vel = 0;
      this.goal[1] = clamp(this.goal[1], VOL_MIN, VOL_MAX);
    }
    this.turn[0] += (this.goal[0] - this.turn[0]) * (1 - Math.exp(-CH_RATE * dt));
    for (let i = 1; i < 4; i++) this.turn[i] += (this.goal[i] - this.turn[i]) * (1 - Math.exp(-GLIDE_RATE * dt));
    this.volume = (this.goal[1] - VOL_MIN) / (VOL_MAX - VOL_MIN);
    if (!this.drag && this.vel === 0) this.save();
  }

  /** Write where the set is left, if that's changed since last time. */
  private save(): void {
    const s = this.settings(this.isOn());
    const json = JSON.stringify(s);
    if (json === this.saved) return;
    saveTvSettings(s);
    this.saved = json;
  }

  private settings(on: boolean): TvSettings {
    const r = (v: number): number => Math.round(v * 1000) / 1000;
    return { channel: this.channel, volume: r(this.volume), fine: r(this.goal[2]), hold: r(this.goal[3]), on };
  }

  /** Show a hand over a knob; call after anything else that sets the canvas's cursor each frame. */
  cursor(): void {
    if (this.drag || this.hover) this.canvas.style.cursor = this.drag ? 'grabbing' : 'grab';
  }

  /** Move the hand on the selector: it goes where it's turned, but snaps onto a channel near it; `channel` is the nearest. */
  private setChannelHand(hand: number): number {
    hand = clamp(hand, CH_MIN, CH_MAX);
    const ch = Math.round((hand - CH_START) / CH_STEP) + CH_FIRST;
    if (ch !== this.channel) {
      this.sinceChange = 0;
      this.onEvent('detent');
    }
    this.channel = ch;
    const rest = chAngle(this.channel);
    this.goal[0] = Math.abs(hand - rest) < CH_LOCK ? rest : hand;
    return hand;
  }

  /** Which knob (if any) is under a point in buffer pixels, and the point's angle round it. */
  at(x: number, y: number): { which: Which; angle: number; near: number } | null {
    if (!this.view.covers(x, y)) return null;
    for (const which of ['channel', 'fine', 'volume', 'hold'] as const) {
      const a = this.angle(which, x, y);
      if (a.near >= GRIP[which].from && a.near <= GRIP[which].to) return { which, ...a };
    }
    return null;
  }

  private angle(which: Which, x: number, y: number): { angle: number; near: number } {
    const k = GRIP[which].k;
    const [px, py] = this.view.toPanel(x, y);
    const dx = px - k.x;
    const dy = py - k.y;
    return { angle: Math.atan2(dx, dy), near: Math.hypot(dx, dy) / k.r };
  }

  private listen(): void {
    const c = this.canvas;
    const px = (e: MouseEvent): [number, number] => {
      const k = c.width / c.clientWidth;
      const r = c.getBoundingClientRect();
      return [(e.clientX - r.left) * k, (r.bottom - e.clientY) * k];
    };
    // Plain (bubbling) listeners added before the magazine's: the notebook still gets first say, the book never sees a turn.
    const swallow = (e: Event): void => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.drag) return;
      const hit = this.at(...px(e));
      if (!hit) return;
      swallow(e);
      c.setPointerCapture(e.pointerId);
      // The hand starts where the knob is, not where it's heading, so grabbing a spinning knob stops it.
      const hand = hit.which === 'channel' ? chAngle(this.channel) : this.turn[SLOT[hit.which]];
      this.vel = 0;
      this.goal[1] = this.turn[1];
      this.drag = { which: hit.which, id: e.pointerId, hand, last: hit.angle, acc: 0, t: e.timeStamp };
    });
    c.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d) {
        this.hover = this.at(...px(e))?.which ?? null;
        return;
      }
      if (e.pointerId !== d.id) return;
      swallow(e);
      const { angle, near } = this.angle(d.which, ...px(e));
      if (near < DEAD) return;
      // The step round the knob since last time, the short way.
      let step = angle - d.last;
      step -= Math.round(step / (2 * Math.PI)) * 2 * Math.PI;
      d.last = angle;
      if (d.which === 'channel') {
        d.hand = this.setChannelHand(d.hand + step);
        return;
      }
      const [lo, hi] = STOPS[d.which];
      d.hand = clamp(d.hand + step, lo, hi);
      this.goal[SLOT[d.which]] = d.hand;
      if (d.which !== 'volume') return;
      // Its speed over the last few hundredths of a second, sampled every few ms however often the events come.
      d.acc += step;
      const dt = (e.timeStamp - d.t) / 1000;
      if (dt < 0.008) return;
      this.vel += (d.acc / dt - this.vel) * (1 - Math.exp(-dt / 0.04));
      d.acc = 0;
      d.t = e.timeStamp;
    });
    const release = (e: PointerEvent): void => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      swallow(e);
      this.drag = null;
      if (d.which === 'channel') this.goal[0] = chAngle(this.channel);
      // Only a knob still moving when let go spins on.
      if (d.which === 'volume' && (e.type === 'pointercancel' || e.timeStamp - d.t > 80)) this.vel = 0;
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
    c.addEventListener('pointerleave', () => (this.hover = null));
    c.addEventListener(
      'wheel',
      (e) => {
        const hit = this.at(...px(e));
        if (!hit) return;
        swallow(e);
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        if (hit.which !== 'channel') {
          const i = SLOT[hit.which];
          const [lo, hi] = STOPS[hit.which];
          if (hit.which === 'volume') this.vel = 0;
          this.goal[i] = clamp(this.goal[i] - dy * (hit.which === 'volume' ? 0.004 : 0.002), lo, hi);
          return;
        }
        // One channel per notch's worth of scrolling.
        this.wheelSum += dy;
        if (Math.abs(this.wheelSum) < 40) return;
        this.setChannelHand(chAngle(this.channel) - Math.sign(this.wheelSum) * CH_STEP);
        this.goal[0] = chAngle(this.channel);
        this.wheelSum = 0;
      },
      { passive: false },
    );
  }
}
