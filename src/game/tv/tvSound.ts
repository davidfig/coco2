import { Sound, noiseBuffer } from '../../engine';

/** Something the set did that makes a noise of its own. */
export type TvEvent = 'detent' | 'rocker' | 'smack' | 'degauss' | 'crackle';

/** What the set sounds like this frame. */
export interface TvAudible {
  /** Whether it's switched on, and how far it has warmed up (0..1). */
  on: boolean;
  warm: number;
  /** The volume knob, 0..1. */
  volume: number;
  /** How much of what the speaker gets is snow (0 a clean channel .. 1 a dead one). */
  snow: number;
  /** How much sync buzz rasps through: the fine-tuning off, the hold slipping, a loose contact. */
  buzz: number;
}

/**
 * The set's sounds, all made up on the spot (no recordings). Through the speaker, so the volume knob sets them: the
 * hiss of a dead channel and the rasp of a badly tuned one. From the set itself, whatever the volume: the transformer's
 * hum, the flyback's whine (too high for some to hear, as it was), the degaussing coil's thump at switch-on, static
 * crackling on the glass, and the hand on the controls (the selector's detents, the rocker, a smack on the cabinet).
 */
export class TvSound {
  private ctx: BaseAudioContext | null = null;
  private out!: AudioNode;
  private noise!: AudioBuffer;
  private speaker!: GainNode;
  private hiss!: GainNode;
  private buzz!: GainNode;
  private whine!: GainNode;
  private hum!: GainNode;

  constructor(sound: Sound) {
    sound.ready((ctx, out) => this.build(ctx, out));
  }

  /** Make the set's sound graph on `ctx` into `out` (the game's master; an OfflineAudioContext's destination to test). */
  build(ctx: BaseAudioContext, out: AudioNode): void {
    this.ctx = ctx;
    this.out = out;
    this.noise = noiseBuffer(ctx, 2);
    const gain = (to: AudioNode, v = 0): GainNode => {
      const g = ctx.createGain();
      g.gain.value = v;
      g.connect(to);
      return g;
    };
    const filter = (type: BiquadFilterType, f: number, q: number, to: AudioNode): BiquadFilterNode => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      b.connect(to);
      return b;
    };
    // A small speaker in a wooden box: no deep bass, no sparkle.
    this.speaker = gain(filter('highpass', 180, 0.7, filter('lowpass', 5500, 0.7, out)));
    this.hiss = gain(this.speaker);
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = this.noise;
    hissSrc.loop = true;
    hissSrc.connect(filter('bandpass', 2800, 0.4, this.hiss));
    hissSrc.start();
    this.buzz = gain(this.speaker);
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = 59.94; // the field rate, leaking into the sound
    saw.connect(filter('lowpass', 2200, 0.7, this.buzz));
    saw.start();
    this.whine = gain(out);
    const fly = ctx.createOscillator();
    fly.frequency.value = 15734; // the line rate
    fly.connect(this.whine);
    fly.start();
    this.hum = gain(out);
    for (const f of [60, 120]) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(f === 60 ? this.hum : gain(this.hum, 0.5));
      o.start();
    }
  }

  update(s: TvAudible): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const set = (g: GainNode, v: number, tc = 0.03): void => void g.gain.setTargetAtTime(v, t, tc);
    set(this.speaker, s.volume * s.volume * 0.9);
    set(this.hiss, s.on ? s.snow * s.warm * 0.35 : 0);
    set(this.buzz, s.on ? s.buzz * s.warm * 0.12 : 0);
    set(this.whine, s.on ? 0.0025 * s.warm : 0, 0.08);
    set(this.hum, s.on ? 0.012 : 0, 0.05);
  }

  play(e: TvEvent, amount = 1): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (e) {
      case 'detent':
        this.burst(t, 'bandpass', 1800 + Math.random() * 300, 1.2, 0.03, 0.25);
        this.burst(t, 'lowpass', 500, 0.7, 0.05, 0.35);
        this.tone(t, 140 + Math.random() * 20, 0.05, 0.2);
        break;
      case 'rocker':
        this.burst(t, 'highpass', 2500, 0.7, 0.015, 0.35);
        this.burst(t, 'bandpass', 900, 2, 0.04, 0.3);
        this.tone(t, 220, 0.03, 0.15);
        break;
      case 'smack':
        this.burst(t, 'lowpass', 260, 0.8, 0.18, 0.9);
        this.tone(t, 70, 0.25, 0.6, 48);
        this.burst(t + 0.01, 'bandpass', 1400, 3, 0.09, 0.12); // something loose rattles inside
        break;
      case 'degauss':
        // The coil's thunk, then its hum dying away as the field winds down. Heard, never seen: it's over before the
        // tube has warmed up enough to show a picture.
        this.burst(t, 'lowpass', 400, 0.7, 0.08, 0.5);
        this.tone(t, 60, 1.4, 0.45);
        this.tone(t, 120, 1.0, 0.2);
        break;
      case 'crackle': {
        const n = Math.min(14, Math.max(1, Math.round(amount * 10)));
        for (let i = 0; i < n; i++) {
          const at = t + Math.random() * 0.2;
          this.burst(at, 'highpass', 3500 + Math.random() * 3000, 0.5, 0.002 + Math.random() * 0.004, 0.1 + Math.random() * 0.25);
        }
        break;
      }
    }
  }

  /** A puff of filtered noise: the body of a click, a thud or a spark. Decays to nothing over `dur` seconds. */
  private burst(t: number, type: BiquadFilterType, f: number, q: number, dur: number, peak: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(b).connect(g).connect(this.out);
    src.start(t, Math.random() * 1.5, dur + 0.02);
  }

  /** A decaying sine, gliding to `to` Hz if given: the knock in a thump, the hum of the degaussing coil. */
  private tone(t: number, f: number, dur: number, peak: number, to?: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}
