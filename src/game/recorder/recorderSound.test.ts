import { expect, test } from '../../test/check';
import { RecorderSound } from './recorderSound';
import type { Sound } from '../../engine/audio';

// Node has no Web Audio: a stand-in context that only keeps the graph (what connects to what, each param's last value).
class Param {
  constructor(public value: number, readonly owner: Node) {}
  setTargetAtTime(v: number): void {
    this.value = v;
  }
  setValueAtTime(v: number): void {
    this.value = v;
  }
  exponentialRampToValueAtTime(v: number): void {
    this.value = v;
  }
}
class Node {
  readonly to: (Node | Param)[] = [];
  started = false;
  connect<T extends Node | Param>(n: T): T {
    this.to.push(n);
    return n;
  }
  start(): void {
    this.started = true;
  }
  stop(): void {}
}
class Gain extends Node {
  gain = new Param(1, this);
}
class Osc extends Node {
  type = 'sine';
  frequency = new Param(440, this);
}
class Filter extends Node {
  type = 'lowpass';
  frequency = new Param(350, this);
  Q = new Param(1, this);
}
class Source extends Node {
  buffer: unknown = null;
  loop = false;
}
class FakeContext {
  currentTime = 0;
  sampleRate = 8000;
  readonly sources: Node[] = [];
  createGain = (): Gain => new Gain();
  createBiquadFilter = (): Filter => new Filter();
  createOscillator = (): Osc => this.track(new Osc());
  createBufferSource = (): Source => this.track(new Source());
  createBuffer = (_ch: number, n: number): { getChannelData: () => Float32Array } => {
    const d = new Float32Array(n);
    return { getChannelData: () => d };
  };
  private track<T extends Node>(n: T): T {
    this.sources.push(n);
    return n;
  }
}

/** Whether `from` reaches `out`, through other nodes or a param it modulates. */
function reaches(from: Node, out: Node): boolean {
  const seen = new Set<Node>();
  const walk = (n: Node): boolean => {
    if (n === out) return true;
    if (seen.has(n)) return false;
    seen.add(n);
    return n.to.some((x) => walk(x instanceof Param ? x.owner : x));
  };
  return walk(from);
}

function built(): { sound: RecorderSound; ctx: FakeContext; out: Node } {
  const sound = new RecorderSound({ ready: () => {} } as unknown as Sound);
  const ctx = new FakeContext();
  const out = new Node();
  sound.build(ctx as unknown as BaseAudioContext, out as unknown as AudioNode);
  return { sound, ctx, out };
}

/** The motor's gain node: the one the hum's sawtooth reaches first. */
function motorParts(ctx: FakeContext): { hum: Osc; gain: Gain } {
  const hum = ctx.sources.find((s): s is Osc => s instanceof Osc && s.type === 'sawtooth')!;
  let n: Node = hum;
  while (!(n instanceof Gain)) n = n.to[0] as Node;
  return { hum, gain: n };
}

test('recorder sound: every source reaches the output, and it is silent until the motor runs', () => {
  const { ctx, out } = built();
  expect(ctx.sources.length > 0).toBe(true);
  expect(ctx.sources.every((s) => s.started && reaches(s, out))).toBe(true);
  expect(motorParts(ctx).gain.gain.value).toBe(0);
});

test('recorder sound: winding is louder and higher than playing, and it stops', () => {
  const { sound, ctx } = built();
  const { hum, gain } = motorParts(ctx);
  sound.motor(true, false);
  const play = { g: gain.gain.value, f: hum.frequency.value };
  expect(play.g > 0).toBe(true);
  sound.motor(true, true);
  expect(gain.gain.value > play.g).toBe(true);
  expect(hum.frequency.value > play.f).toBe(true);
  sound.motor(false, false);
  expect(gain.gain.value).toBe(0);
});

test('recorder sound: each one-shot plays into the output', () => {
  const { sound, ctx, out } = built();
  for (const play of [() => sound.eject(), () => sound.drop(), () => sound.shut(), () => sound.latch()]) {
    const before = ctx.sources.length;
    play();
    const added = ctx.sources.slice(before);
    expect(added.length > 0).toBe(true);
    expect(added.every((s) => s.started && reaches(s, out))).toBe(true);
  }
});

test('recorder sound: with no context (?nosound, or before the first click) nothing throws', () => {
  const sound = new RecorderSound({ ready: () => {} } as unknown as Sound);
  sound.motor(true, true);
  sound.eject();
  sound.drop();
  sound.shut();
  sound.latch();
});
