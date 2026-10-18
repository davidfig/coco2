/**
 * The page's sound: one AudioContext and a master gain. Browsers allow no sound before the player has clicked or typed,
 * so it's made on the first of those; with `enabled` false (`?nosound`) it never is, and nothing plays.
 */
export class Sound {
  ctx: AudioContext | null = null;
  out: GainNode | null = null;
  private readonly waiting: ((ctx: BaseAudioContext, out: AudioNode) => void)[] = [];

  constructor(readonly enabled: boolean) {
    if (!enabled) return;
    // iOS Safari (17+) treats Web Audio as a ringer sound, muted by the silent switch; playback is the media kind, which plays.
    const session = (navigator as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    const start = (): void => {
      window.removeEventListener('pointerdown', start, true);
      window.removeEventListener('keydown', start, true);
      const ctx = new AudioContext();
      const out = ctx.createGain();
      out.gain.value = 0.8; // headroom for several sounds at once
      out.connect(ctx.destination);
      this.ctx = ctx;
      this.out = out;
      // iOS Safari can make it suspended from a pointerdown: the touch's end (or the click) is what lets it play.
      const resume = (): void => {
        if (ctx.state !== 'suspended') return;
        void ctx.resume();
      };
      for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, resume, true);
      for (const fn of this.waiting.splice(0)) fn(ctx, out);
    };
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('keydown', start, true);
  }

  /** Run `fn` with the context and the master output once there is one (now, if there already is). */
  ready(fn: (ctx: BaseAudioContext, out: AudioNode) => void): void {
    if (this.ctx && this.out) fn(this.ctx, this.out);
    else if (this.enabled) this.waiting.push(fn);
  }
}

/** A buffer of white noise, for hiss and for the attack of a click or a thump. */
export function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
