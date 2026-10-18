import type { TypedKey } from '../../engine';
import { TUBE_C } from '../tv/cabinetShader';
import { CAP, CASE, EYE, KB_X0, KB_Z0, Key, PITCH, PLACE, PLATE_T, ROWS, TABLE, UPPER } from './layout';

/** How many keys can be moving at once (the shader's `uKeys`). */
export const KEYS_MOVING = 6;
/** GLSL: the keys on their way down or back up (\`uKeys\`, from \`CocoKeys.uniform\`) and \`keyDip\`. Needs PITCH. */
export const KEY_DIP_GLSL = /* glsl */ `uniform vec4 uKeys[${KEYS_MOVING}]; // centre (keyboard x, z), half width, how far down
/** How far down the key whose footprint holds \`c\` (keyboard space: from the number row's first cap) is pressed. */
float keyDip(vec2 c) {
  for (int i = 0; i < ${KEYS_MOVING}; i++) {
    vec4 k = uKeys[i];
    if (abs(c.x - k.x) < k.z && abs(c.y - k.y) < PITCH * 0.5) return k.w;
  }
  return 0.0;
}`;

/** How long a key takes to go down, and to come back up (seconds); a tap stays down at least `TAP`. */
const DOWN_TIME = 0.03;
const UP_TIME = 0.08;
const TAP = 0.07;

/** What a cap sends, as a browser key (`TypedKey.key`), unshifted; SHIFT sends nothing, it latches. */
const SENDS: Record<string, string> = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', BREAK: 'Escape', CLEAR: 'Clear', ENTER: 'Enter', '': ' ' };

interface Moving {
  row: number;
  key: Key;
  /** 0 up, 1 all the way down. */
  down: number;
  held: boolean;
  /** How long it still stays down after a tap. */
  hold: number;
}

/**
 * The CoCo's keyboard as something to press: a click on a cap types it (as a real keydown would) and pushes the cap
 * down while the button is held; SHIFT latches for the next key. Keys typed on the real keyboard tap their caps too.
 */
export class CocoKeys {
  private readonly moving = new Map<Key, Moving>();
  private shift = false;
  private readonly uniforms = new Float32Array(KEYS_MOVING * 4);

  constructor(private readonly send: (k: TypedKey) => void) {}

  /** The pointer went down on a cap. */
  press(row: number, i: number): void {
    const key = ROWS[row][i];
    if (key.label === 'SHIFT') {
      this.shift = !this.shift;
      for (const k of this.shiftKeys()) this.move(k.row, k.key).held = this.shift;
      return;
    }
    this.move(row, key).held = true;
    const sent = SENDS[key.label] ?? (this.shift && UPPER[key.label] ? UPPER[key.label] : key.label);
    // SHIFT-BREAK is the CoCo's SHIFT-CLEAR as BASIC reads it (`Escape` + shift); otherwise shift only picks the sign.
    this.send({ key: sent, shift: this.shift, ctrl: false });
    if (this.shift) {
      this.shift = false;
      for (const k of this.shiftKeys()) this.move(k.row, k.key).held = false;
    }
  }

  /** The pointer came up: every clicked cap but a latched SHIFT goes back up. */
  release(): void {
    for (const m of this.moving.values()) if (m.key.label !== 'SHIFT') m.held = false;
  }

  /** Keys typed on the real keyboard (or `Keyboard.type`): their caps tap down, SHIFT with them for a shifted sign. */
  typed(keys: readonly TypedKey[]): void {
    for (const t of keys) {
      const found = capFor(t.key);
      if (!found) continue;
      this.tap(found.row, found.key);
      if (found.shifted || (t.shift && t.key.length > 1)) for (const k of this.shiftKeys()) this.tap(k.row, k.key);
    }
  }

  step(dt: number): void {
    for (const [key, m] of this.moving) {
      m.hold = Math.max(0, m.hold - dt);
      const goingDown = m.held || m.hold > 0;
      m.down = Math.min(1, Math.max(0, m.down + (goingDown ? dt / DOWN_TIME : -dt / UP_TIME)));
      if (!goingDown && m.down === 0) this.moving.delete(key);
    }
  }

  /** `uKeys`: up to `KEYS_MOVING` caps, the deepest first, as centre (keyboard x, z), half width, depth. */
  uniform(): Float32Array {
    this.uniforms.fill(0);
    [...this.moving.values()]
      .sort((a, b) => b.down - a.down)
      .slice(0, KEYS_MOVING)
      .forEach((m, i) => {
        // Eased: quick off the top, settling at the bottom.
        const d = 1 - (1 - m.down) * (1 - m.down);
        this.uniforms.set([(m.key.x + m.key.w / 2) * PITCH, m.row * PITCH, (m.key.w / 2) * PITCH, d * CAP.travel], i * 4);
      });
    return this.uniforms;
  }

  private tap(row: number, key: Key): void {
    this.move(row, key).hold = TAP;
  }

  private move(row: number, key: Key): Moving {
    let m = this.moving.get(key);
    if (!m) this.moving.set(key, (m = { row, key, down: 0, held: false, hold: 0 }));
    return m;
  }

  private shiftKeys(): { row: number; key: Key }[] {
    return ROWS.flatMap((keys, row) => keys.filter((k) => k.label === 'SHIFT').map((key) => ({ row, key })));
  }
}

/** Browser key names that land on a cap, beside the ones in `SENDS`. */
const ALSO: Record<string, string> = { Backspace: '←', Home: 'CLEAR', Delete: '←' };

/** The cap a browser key comes from, and whether SHIFT was needed for it. */
function capFor(name: string): { row: number; key: Key; shifted: boolean } | null {
  const ch = name.length === 1 ? name.toUpperCase() : name;
  const label = ALSO[ch] ?? Object.keys(SENDS).find((l) => SENDS[l] === ch);
  for (let row = 0; row < ROWS.length; row++) {
    for (const key of ROWS[row]) {
      if (key.label === (label ?? ch)) return { row, key, shifted: false };
      if (label === undefined && UPPER[key.label] === ch) return { row, key, shifted: true };
    }
  }
  return null;
}

/**
 * The key under a panel point, if any: anywhere on a cap (its top, its sides, its face) or in the gap round it. The
 * ray from the eye through the point is followed from the caps' tops down to the plate (in the deck's frame, as the
 * shader's \`deck\`); the first cap it goes into is the one seen there. A ray that reaches the plate between caps
 * takes the key whose pitch cell it lands in, so there are no dead gaps. Returns the row and the key's index in it.
 */
export function keyAt(px: number, py: number): { row: number; i: number } | null {
  const ang = Math.atan2(CASE.deckBack - CASE.deckFront, CASE.hd - CASE.deckZ);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  // Model frame, from the deck's origin (0, deckBack, deckZ).
  const o = [TUBE_C[0] - PLACE.x, EYE.y - TABLE - CASE.deckBack, EYE.d - PLACE.z - CASE.deckZ];
  const d = [px - TUBE_C[0], py - EYE.y, -EYE.d];
  const den = d[1] * c + d[2] * s;
  if (Math.abs(den) < 1e-9) return null;
  const at = (h: number) => (h - PLATE_T - (o[1] * c + o[2] * s)) / den;
  const t0 = at(CAP.h);
  const t1 = at(0);
  if (!(t0 > 0)) return null;
  for (let n = 0; n <= HIT_STEPS; n++) {
    const t = t0 + ((t1 - t0) * n) / HIT_STEPS;
    const y = o[1] + d[1] * t;
    const z = o[2] + d[2] * t;
    const h = y * c + z * s + PLATE_T; // over the plate
    const kx = (o[0] + d[0] * t - KB_X0) / PITCH;
    const kz = (z * c - y * s - KB_Z0) / PITCH;
    const row = Math.round(kz);
    if (!Number.isFinite(kx) || !(row >= 0 && row < ROWS.length)) continue;
    const i = ROWS[row].findIndex((k) => kx >= k.x && kx < k.x + k.w);
    if (i < 0) continue;
    if (n === HIT_STEPS) return { row, i };
    if (h < CAP.lift) continue;
    // Inside the cap: its sides lean in from the skirt to the top, as the shader's keyCap.
    const k = ROWS[row][i];
    const inset = (CAP_INSET + CAP_TAPER * Math.min(1, (h - CAP.lift) / (CAP.h - CAP.lift))) / PITCH;
    if (Math.abs(kx - k.x - k.w / 2) < k.w / 2 - inset && Math.abs(kz - row) < 0.5 - inset) return { row, i };
  }
  return null;
}
/** How many steps \`keyAt\` takes between the caps' tops and the plate. */
const HIT_STEPS = 48;
/** How far a cap's sides sit in from its pitch cell at the skirt, and how much further at the top (the shader's keyCap). */
const CAP_INSET = 0.005;
const CAP_TAPER = 0.013;
