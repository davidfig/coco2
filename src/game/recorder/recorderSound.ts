import { type Sound, noiseBuffer } from '../../engine/audio';

/** The motor's gain and pitch: still, playing, and winding past files on a CLOAD search. */
const MOTOR = { still: 0, play: 0.018, wind: 0.035 };
const HISS = { still: 0, play: 0.012, wind: 0.03 };
const HUM_HZ = 96;
const WHIRR_HZ = 480;
/** How much faster the motor turns while winding. */
const WIND_PITCH = 1.6;

/**
 * The cassette recorder's sounds, made up on the spot like the set's (`tv/tvSound.ts`), no recordings: the plastic of
 * the keys and the door, the cassette knocking into the well, and while the tape moves the motor's hum with a faint
 * hiss of tape over the head, louder and higher while it winds past files. None of it goes through the set's speaker,
 * so the volume knob leaves it alone.
 */
export class RecorderSound {
  private ctx: BaseAudioContext | null = null;
  private out!: AudioNode;
  private noise!: AudioBuffer;
  private motorGain!: GainNode;
  private hissGain!: GainNode;
  private hissBand!: BiquadFilterNode;
  private hum!: OscillatorNode;
  private whirr!: OscillatorNode;
  /** What the motor was last told, so a frame that changes nothing schedules nothing. */
  private state = '';

  constructor(sound: Sound) {
    sound.ready((ctx, out) => this.build(ctx, out));
  }

  /** Make the recorder's sound graph on `ctx` into `out` (the game's master; an OfflineAudioContext's destination to test). */
  build(ctx: BaseAudioContext, out: AudioNode): void {
    this.ctx = ctx;
    this.noise = noiseBuffer(ctx, 2);
    const filter = (type: BiquadFilterType, f: number, q: number, to: AudioNode): BiquadFilterNode => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      b.connect(to);
      return b;
    };
    const gain = (to: AudioNode, v = 0): GainNode => {
      const g = ctx.createGain();
      g.gain.value = v;
      g.connect(to);
      return g;
    };
    // A small plastic box: thin, no deep bass.
    this.out = filter('highpass', 90, 0.7, out);
    // The capstan motor: a buzzy hum with the whirr of its brushes above it, muffled by the case.
    this.motorGain = gain(this.out);
    const muffle = filter('lowpass', 900, 0.8, this.motorGain);
    this.hum = ctx.createOscillator();
    this.hum.type = 'sawtooth';
    this.hum.frequency.value = HUM_HZ;
    this.hum.connect(muffle);
    this.hum.start();
    this.whirr = ctx.createOscillator();
    this.whirr.type = 'triangle';
    this.whirr.frequency.value = WHIRR_HZ;
    this.whirr.connect(gain(muffle, 0.25));
    this.whirr.start();
    // Wow: the speed wavers a little, as a cheap recorder's does.
    const wow = ctx.createOscillator();
    wow.frequency.value = 2.3;
    const depth = ctx.createGain();
    depth.gain.value = 1.2;
    wow.connect(depth).connect(this.hum.frequency);
    wow.start();
    // Tape running over the head.
    this.hissGain = gain(this.out);
    this.hissBand = filter('bandpass', 4200, 0.6, this.hissGain);
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noise;
    hiss.loop = true;
    hiss.connect(this.hissBand);
    hiss.start();
  }

  /** Every frame: the tape moving under the head, and whether it is winding past files (a CLOAD search). */
  motor(running: boolean, winding: boolean): void {
    const ctx = this.ctx;
    const state = running ? (winding ? 'wind' : 'play') : 'still';
    if (!ctx || state === this.state) return;
    this.state = state;
    const t = ctx.currentTime;
    // The motor spins up and runs down over a moment, never at once.
    const tc = running ? 0.06 : 0.12;
    this.motorGain.gain.setTargetAtTime(MOTOR[state], t, tc);
    this.hissGain.gain.setTargetAtTime(HISS[state], t, tc);
    const pitch = state === 'wind' ? WIND_PITCH : 1;
    this.hum.frequency.setTargetAtTime(HUM_HZ * pitch, t, 0.15);
    this.whirr.frequency.setTargetAtTime(WHIRR_HZ * pitch, t, 0.15);
    this.hissBand.frequency.setTargetAtTime(state === 'wind' ? 6500 : 4200, t, 0.15);
  }

  /** STOP/EJECT pressed: the key going down, its catch letting go, the door springing up against its stop. */
  eject(): void {
    const t = this.now();
    if (t === null) return;
    this.burst(t, 'bandpass', 2200, 1.5, 0.025, 0.2);
    this.tone(t, 340, 0.04, 0.06);
    this.burst(t + 0.05, 'highpass', 3000, 0.7, 0.012, 0.3);
    this.burst(t + 0.12, 'bandpass', 1300, 2, 0.06, 0.35);
    this.tone(t + 0.12, 260, 0.08, 0.12, 200);
    this.burst(t + 0.17, 'bandpass', 2400, 4, 0.04, 0.08); // the door rattling as it settles
  }

  /** The cassette dropping into the well: a hollow plastic knock. */
  drop(): void {
    const t = this.now();
    if (t === null) return;
    this.burst(t, 'lowpass', 700, 1, 0.07, 0.4);
    this.burst(t, 'bandpass', 1600, 3, 0.05, 0.18);
    this.tone(t, 180, 0.09, 0.2, 140);
  }

  /** The door pushed down until its catch snaps. */
  shut(): void {
    const t = this.now();
    if (t === null) return;
    this.burst(t, 'bandpass', 1000, 1.5, 0.05, 0.3);
    this.burst(t + 0.015, 'highpass', 3500, 0.7, 0.01, 0.35);
    this.tone(t, 210, 0.06, 0.12);
  }

  /** PLAY going down and locking: a heavier clunk, the head and pinch roller rising to the tape. */
  latch(): void {
    const t = this.now();
    if (t === null) return;
    this.burst(t, 'bandpass', 1800, 1.5, 0.02, 0.25);
    this.burst(t + 0.03, 'lowpass', 500, 0.8, 0.09, 0.45);
    this.tone(t + 0.03, 120, 0.1, 0.25, 90);
  }

  private now(): number | null {
    return this.ctx ? this.ctx.currentTime : null;
  }

  /** A puff of filtered noise that dies away over `dur` seconds: the body of a click or a knock. */
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

  /** A decaying sine, gliding to `to` Hz if given: the plastic ringing in a knock. */
  private tone(t: number, f: number, dur: number, peak: number, to?: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}
