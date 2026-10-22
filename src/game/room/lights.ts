import { FULLSCREEN_VERT, Program, linkProgram } from '../../engine';

const LIGHTS_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uTint;
out vec4 outColor;
void main() { outColor = vec4(uTint, 1.0); }`;

/**
 * The room's lights coming on as the page opens, the switch catching on its third try: [seconds, level] steps. A bulb's
 * filament takes a moment to heat and cool, so the level follows each step softly (`HEAT`, `COOL`).
 */
const STEPS: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.45, 1],
  [0.52, 0],
  [0.6, 0.8],
  [0.64, 0],
  [0.8, 0.55],
  [0.95, 0],
  [1.05, 1],
];
/** The lights going out at the end of the evening, a bulb's last stutter: [seconds, level] steps, then dark for `NIGHT`. */
const OUT: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.06, 0.25],
  [0.11, 0.9],
  [0.16, 0],
];
/** Seconds the room stays dark between the lights going out and coming on again (the night passing). */
const NIGHT = 1;
/** Seconds for the filament to heat up and to cool (first-order). */
const HEAT = 0.025;
const COOL = 0.06;

/**
 * The whole frame dimmed by how much light is in the room, drawn last over everything (multiplied, so the tube and the
 * CoCo dim with it). A filament low on current glows orange, so the dark end is warm. Once fully on it draws nothing.
 */
export class RoomLights {
  /** 0 (dark) .. 1 (on). */
  level: number;
  private time = 0;
  /** This load's switching: each gap between steps a little longer or shorter, so they keep their order. */
  private readonly steps: [number, number][] = [];
  /** When the lights are on for good (seconds from the first frame, or from `night`): the set comes on after it. */
  onAt: number;
  /** When the room is fully dark during `night` (seconds from its start); 0 when the lights only come on. */
  darkAt = 0;
  private program: Program | null = null;
  /** The same tint for what the page lays over the canvas (the magazine's stickers): an SVG filter, made on first use. */
  private matrix: SVGFEColorMatrixElement | null = null;

  constructor(private readonly gl: WebGL2RenderingContext, on = false) {
    this.level = on ? 1 : 0;
    this.time = on ? Infinity : 0;
    this.onAt = this.switching(STEPS, 0);
  }

  /** Adds `steps` from `start` seconds, each gap a little longer or shorter; returns when the last one is. */
  private switching(steps: readonly (readonly [number, number])[], start: number): number {
    let t = start;
    steps.forEach(([at, l], i) => {
      if (i > 0) t += (at - steps[i - 1][0]) * (1 + (Math.random() - 0.5) * 0.3);
      this.steps.push([t, l]);
    });
    return t;
  }

  /** The end of the evening: the lights blink out, the room stays dark a moment, and they come on again (`darkAt`, `onAt`). */
  night(): void {
    this.steps.length = 0;
    this.time = 0;
    this.darkAt = this.switching(OUT, 0);
    this.onAt = this.switching(STEPS, this.darkAt + NIGHT);
  }

  get on(): boolean {
    return this.level >= 1 && this.time >= this.onAt;
  }

  update(dt: number): void {
    if (this.on) return;
    this.time += dt;
    let goal = 0;
    for (const [t, l] of this.steps) if (this.time >= t) goal = l;
    const k = 1 - Math.exp(-dt / (goal > this.level ? HEAT : COOL));
    this.level += (goal - this.level) * k;
    if (this.time >= this.onAt && this.level > 0.995) this.level = 1;
  }

  /**
   * A CSS `filter` that dims an element over the canvas as `draw` dims the canvas ('' once the lights are on). The
   * multiply pass works on the canvas's sRGB values, so the filter does too.
   */
  css(): string {
    if (this.on) return '';
    if (!this.matrix) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.position = 'absolute';
      const filter = document.createElementNS(ns, 'filter');
      filter.id = 'room-lights';
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      this.matrix = document.createElementNS(ns, 'feColorMatrix');
      filter.append(this.matrix);
      svg.append(filter);
      document.body.append(svg);
    }
    const [r, g, b] = this.tint();
    this.matrix.setAttribute('values', `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`);
    return 'url(#room-lights)';
  }

  /** What each channel is multiplied by: a filament low on current glows orange. */
  private tint(): [number, number, number] {
    const l = this.level;
    return [l, Math.pow(l, 1.4), Math.pow(l, 2.2)];
  }

  draw(): void {
    // The program is built on the first dark frame, which the page draws before it starts its clock.
    if (this.on) return;
    const gl = this.gl;
    this.program ??= linkProgram(gl, FULLSCREEN_VERT, LIGHTS_FRAG);
    gl.disable(gl.SCISSOR_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
    gl.useProgram(this.program.prog);
    gl.uniform3f(this.program.u.uTint, ...this.tint());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The next frame's first pass (the TV's) draws without setting blending: it must find it off.
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.disable(gl.BLEND);
  }
}
