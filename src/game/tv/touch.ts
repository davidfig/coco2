import { CAB, CAB_R, POWER_SWITCH, TUBE, TUBE_C, TUBE_R } from './cabinetShader';
import type { Grime } from './grime';
import type { PanelView } from './knobs';
import type { TvEvent } from './tvSound';

/** What the power rocker works: whether the set is on, and the switch. */
export interface PowerSwitch {
  isOn(): boolean;
  toggle(): void;
}

/** How quickly (1/s) the power rocker snaps over. */
const ROCK_RATE = 45;
/** How long (s) the hand stays in its follow-through after a smack. */
const SLAP_SHOW = 0.15;

/**
 * An open hand as a cursor (white with a dark outline, like the system's), raised to slap; `turn` tilts it, degrees.
 * Each shape is drawn twice, outlined then filled, so the outline runs round the whole hand and not between fingers.
 */
function handCursor(turn: number): string {
  const shapes = [
    '<rect x="9" y="14" width="14" height="13" rx="4"/>',
    '<rect x="9" y="5" width="3.6" height="12" rx="1.8"/>',
    '<rect x="12.8" y="3" width="3.6" height="14" rx="1.8"/>',
    '<rect x="16.6" y="3.5" width="3.6" height="13.5" rx="1.8"/>',
    '<rect x="20.4" y="6" width="3.4" height="11" rx="1.7"/>',
    '<rect x="7.5" y="14" width="3.8" height="12" rx="1.9" transform="rotate(-28 9.4 26)"/>', // thumb, from the palm
  ].join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g transform="rotate(${turn} 16 16)">` +
    `<g fill="#222" stroke="#222" stroke-width="2.4" stroke-linejoin="round">${shapes}</g><g fill="#fff">${shapes}</g></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, pointer`;
}
/** Raised, and in the follow-through. */
const HAND = handCursor(-15);
const SLAP = handCursor(-55);

const sdBox = (x: number, y: number, hx: number, hy: number, r: number): number => {
  const qx = Math.abs(x) - hx + r;
  const qy = Math.abs(y) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

/**
 * Everything the hand does to the set that isn't turning a knob (`knobs.ts` has first say on those): the power rocker
 * (press its top half for ON, its bottom half for OFF), a smack on the cabinet's top-left (where a hand would land on
 * the side of a set; the pointer turns into an open hand there), and wiping the glass with a fingertip.
 */
export class Touch {
  /** Which way the power rocker is tipped as drawn: -1 OFF .. 1 ON. */
  rock: number;
  /** Seconds since the cabinet was last smacked (the picture's jolt and the set's shake run off it). */
  sinceSmack = 99;
  private hover: 'switch' | 'glass' | 'smack' | null = null;
  /** Called after a smack by hand on the cabinet (main.ts: a phone asks, then, to be shaken instead). */
  onHandSmack: () => void = () => {};
  /** The pointer wiping the glass, and where it was last (tube coordinates). */
  private wiping: { id: number; x: number; y: number } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly view: PanelView,
    private readonly power: PowerSwitch,
    private readonly grime: Grime,
    private readonly onSmack: () => void,
    private readonly onEvent: (e: TvEvent, amount?: number) => void,
  ) {
    this.rock = power.isOn() ? 1 : -1;
    this.listen();
  }

  /** The cabinet takes a smack: a hand on its top-left, or the whole phone shaken (`touch/shake.ts`). */
  smack(): void {
    this.sinceSmack = 0;
    this.onSmack();
    this.onEvent('smack');
  }

  update(dt: number): void {
    this.sinceSmack += dt;
    this.rock += ((this.power.isOn() ? 1 : -1) - this.rock) * (1 - Math.exp(-ROCK_RATE * dt));
  }

  /** A hand over the rocker, a fingertip over the glass; call after anything else that sets the canvas's cursor. */
  cursor(): void {
    if (this.wiping) this.canvas.style.cursor = 'grabbing';
    else if (this.hover === 'switch') this.canvas.style.cursor = 'pointer';
    else if (this.hover === 'smack') this.canvas.style.cursor = this.sinceSmack < SLAP_SHOW ? SLAP : HAND;
  }

  /** What part of the set a point in buffer pixels is on, with the point in tube coordinates for the glass. */
  at(x: number, y: number): { part: 'on' | 'off' | 'glass' | 'smack'; tx: number; ty: number } | null {
    if (!this.view.covers(x, y)) return null;
    const [px, py] = this.view.toPanel(x, y);
    const tx = (px - TUBE_C[0]) / TUBE[0];
    const ty = (py - TUBE_C[1]) / TUBE[1];
    const s = POWER_SWITCH;
    if (Math.abs(px - s.x) <= s.hw + 0.01 && Math.abs(py - s.y) <= s.hh + 0.01) return { part: py >= s.y ? 'on' : 'off', tx, ty };
    if (sdBox(px - TUBE_C[0], py - TUBE_C[1], TUBE[0], TUBE[1], TUBE_R) < 0) return { part: 'glass', tx, ty };
    // The top-left of the cabinet, wood and bezel: left of the tube's middle and above it.
    if (px < TUBE_C[0] && py > TUBE_C[1] && sdBox(px, py, CAB[0], CAB[1], CAB_R) < 0) return { part: 'smack', tx, ty };
    return null;
  }

  private listen(): void {
    const c = this.canvas;
    const px = (e: MouseEvent): [number, number] => {
      const k = c.width / c.clientWidth;
      const r = c.getBoundingClientRect();
      return [(e.clientX - r.left) * k, (r.bottom - e.clientY) * k];
    };
    const swallow = (e: Event): void => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.wiping) return;
      const hit = this.at(...px(e));
      if (!hit) return;
      swallow(e);
      if (hit.part === 'on' || hit.part === 'off') {
        // Pressing the half that's already in does nothing, as on the real thing.
        if ((hit.part === 'on') !== this.power.isOn()) {
          this.power.toggle();
          this.onEvent('rocker');
        }
      } else if (hit.part === 'glass') {
        c.setPointerCapture(e.pointerId);
        this.wiping = { id: e.pointerId, x: hit.tx, y: hit.ty };
      } else {
        this.smack();
        this.onHandSmack();
      }
    });
    c.addEventListener('pointermove', (e) => {
      const w = this.wiping;
      if (!w) {
        const part = this.at(...px(e))?.part;
        this.hover = part === 'on' || part === 'off' ? 'switch' : part ?? null;
        return;
      }
      if (e.pointerId !== w.id) return;
      swallow(e);
      const [x, y] = this.view.toPanel(...px(e));
      const tx = (x - TUBE_C[0]) / TUBE[0];
      const ty = (y - TUBE_C[1]) / TUBE[1];
      const took = this.grime.wipe(w.x, w.y, tx, ty);
      if (took > 0.01) this.onEvent('crackle', took);
      w.x = tx;
      w.y = ty;
    });
    const release = (e: PointerEvent): void => {
      if (!this.wiping || e.pointerId !== this.wiping.id) return;
      swallow(e);
      this.wiping = null;
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
    c.addEventListener('pointerleave', () => (this.hover = null));
  }
}
