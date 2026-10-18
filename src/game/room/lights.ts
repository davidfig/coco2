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
  /** When the lights are on for good, this load (seconds from the first frame): the set comes on after it. */
  readonly onAt: number;
  private program: Program | null = null;

  constructor(private readonly gl: WebGL2RenderingContext, on = false) {
    this.level = on ? 1 : 0;
    this.time = on ? Infinity : 0;
    let t = 0;
    STEPS.forEach(([at, l], i) => {
      if (i > 0) t += (at - STEPS[i - 1][0]) * (1 + (Math.random() - 0.5) * 0.3);
      this.steps.push([t, l]);
    });
    this.onAt = t;
  }

  get on(): boolean {
    return this.level >= 1;
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

  draw(): void {
    // The program is built on the first dark frame, which the page draws before it starts its clock.
    if (this.on) return;
    const gl = this.gl;
    this.program ??= linkProgram(gl, FULLSCREEN_VERT, LIGHTS_FRAG);
    const l = this.level;
    gl.disable(gl.SCISSOR_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
    gl.useProgram(this.program.prog);
    gl.uniform3f(this.program.u.uTint, l, Math.pow(l, 1.4), Math.pow(l, 2.2));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The next frame's first pass (the TV's) draws without setting blending: it must find it off.
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.disable(gl.BLEND);
  }
}
