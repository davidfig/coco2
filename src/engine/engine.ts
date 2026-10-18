import { Keyboard } from './keyboard';

/**
 * Owns the canvas, the WebGL2 context and the loop. Per frame: early updaters (input) → fixed steps → late updaters
 * (drawing). Same shape as the other *-geometry engines, without the 3D scene: this game draws one full-screen pass.
 */
export class Engine {
  readonly gl: WebGL2RenderingContext;
  readonly keyboard: Keyboard;
  /** Run once per drawn frame before the simulation, with the real frame delta (reading input). */
  readonly earlyUpdaters: ((dt: number) => void)[] = [];
  /** Simulation hooks, run at a fixed `STEP` rate (the VDG's 60 Hz field). */
  readonly updaters: ((dt: number) => void)[] = [];
  /** Run once per drawn frame after the simulation, with the real frame delta (drawing). */
  readonly lateUpdaters: ((dt: number) => void)[] = [];
  /** Seconds of simulation since start. */
  time = 0;
  paused = false;
  static readonly STEP = 1 / 60;

  private last = 0;
  private acc = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl;
    this.keyboard = new Keyboard();
  }

  start(): void {
    this.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min((now - this.last) / 1000, 0.1));
      this.last = now;
      this.advance(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /** Run one frame of `dt` seconds (the loop calls this; a hidden Browser pane can too). */
  advance(dt: number): void {
    this.resize();
    if (!this.paused) {
      for (const fn of [...this.earlyUpdaters]) fn(dt);
      this.acc += dt;
      let steps = 0;
      while (this.acc >= Engine.STEP && steps < 12) {
        for (const fn of [...this.updaters]) fn(Engine.STEP);
        this.time += Engine.STEP;
        this.acc -= Engine.STEP;
        steps++;
      }
      if (steps === 12) this.acc = 0;
    }
    for (const fn of [...this.lateUpdaters]) fn(this.paused ? 0 : dt);
  }

  /** Keep the drawing buffer at the canvas's on-screen size (device pixels, capped at 2×). */
  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }
}
