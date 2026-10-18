/** The grime map's size: one texel per patch of glass, enough for a fingertip's wipe to have soft edges. */
export const GRIME_W = 96;
export const GRIME_H = 72;
/** How much dust there is at power-on, and how long (seconds) a clean screen takes to fur up completely again. */
const DUST_START = 0.45;
const DUST_FULL = 600;
/** A wiping hand's radius, in tube half-heights, and how much of the dirt one pass takes off. */
const BRUSH = 0.12;
const TAKE_PRINTS = 0.35;
const TAKE_DUST = 0.6;

/**
 * What's on the glass, as a small two-channel map over the tube (u across, v up, both 0..1 from the bottom-left):
 * R, how much of the fingerprints is left; G, how much dust there is. Static from the tube pulls dust back on slowly;
 * fingerprints only come off. Dragging across the glass wipes both (`touch.ts`).
 */
export class Grime {
  readonly data = new Uint8Array(GRIME_W * GRIME_H * 2);
  /** Whether `data` changed since the GPU last had it. */
  dirty = true;
  private settle = 0;

  constructor() {
    for (let i = 0; i < GRIME_W * GRIME_H; i++) {
      this.data[i * 2] = 255;
      this.data[i * 2 + 1] = Math.round(DUST_START * 255);
    }
  }

  /** Dust settles while the set is on (the tube's charge pulls it in): one step at a time, every few seconds. */
  update(dt: number, on: boolean): void {
    if (!on) return;
    this.settle += dt;
    const step = DUST_FULL / 255;
    if (this.settle < step) return;
    this.settle -= step;
    for (let i = 1; i < this.data.length; i += 2) if (this.data[i] < 255) this.data[i]++;
    this.dirty = true;
  }

  /**
   * A fingertip dragged from a to b (tube coordinates, -1..1, y up): wipes along the stroke. Returns how much dust it
   * took off (in brush-sized patches), which is what makes the static crackle.
   */
  wipe(ax: number, ay: number, bx: number, by: number): number {
    // Brush radius in texels, each way (the tube is 4:3, the map isn't square in the same proportion).
    const rx = (BRUSH / 1.333) * (GRIME_W / 2);
    const ry = BRUSH * (GRIME_H / 2);
    // Dabs along the stroke a texel or so apart, each taking its share: a spot the brush passes once loses about
    // TAKE_* of its dirt, and a finger held still wipes nothing.
    const len = Math.hypot(((bx - ax) * GRIME_W) / 2, ((by - ay) * GRIME_H) / 2);
    const steps = Math.max(1, Math.ceil(len / 1.5));
    const share = Math.min(1, len / steps / (2 * Math.min(rx, ry)));
    let took = 0;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const cx = ((ax + (bx - ax) * t) * 0.5 + 0.5) * GRIME_W;
      const cy = ((ay + (by - ay) * t) * 0.5 + 0.5) * GRIME_H;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          if (x < 0 || y < 0 || x >= GRIME_W || y >= GRIME_H) continue;
          const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
          if (d >= 1) continue;
          const k = (1 - d * d) * share; // soft-edged
          const i = (y * GRIME_W + x) * 2;
          const dust = this.data[i + 1] * k * TAKE_DUST;
          this.data[i] -= this.data[i] * k * TAKE_PRINTS;
          this.data[i + 1] -= dust;
          took += dust / 255;
        }
      }
    }
    this.dirty = true;
    return took / (rx * ry * 3);
  }
}
