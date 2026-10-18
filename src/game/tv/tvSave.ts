/** How the set was left: its knobs and power, kept in localStorage so a reload finds it the same way. */

import { CH_FIRST, CH_LAST, FINE_MAX, FINE_MIN, HOLD_MAX, HOLD_MIN } from './cabinetShader';

const KEY = 'coco2.tv';

export interface TvSettings {
  channel: number;
  /** 0..1 */
  volume: number;
  /** The fine-tuning ring's and the vertical hold's turns, in radians. */
  fine: number;
  hold: number;
  on: boolean;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function readTvSettings(): Partial<TvSettings> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    const out: Partial<TvSettings> = {};
    const ch = Number(raw.channel);
    if (Number.isInteger(ch) && ch >= CH_FIRST && ch <= CH_LAST) out.channel = ch;
    const vol = Number(raw.volume);
    if (raw.volume !== undefined && Number.isFinite(vol)) out.volume = clamp(vol, 0, 1);
    const fine = Number(raw.fine);
    if (raw.fine !== undefined && Number.isFinite(fine)) out.fine = clamp(fine, FINE_MIN, FINE_MAX);
    const hold = Number(raw.hold);
    if (raw.hold !== undefined && Number.isFinite(hold)) out.hold = clamp(hold, HOLD_MIN, HOLD_MAX);
    if (typeof raw.on === 'boolean') out.on = raw.on;
    return out;
  } catch {
    return {}; // unreadable: the set as it comes from the shop
  }
}

export function saveTvSettings(s: TvSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window or blocked storage: it just starts on 3 next time */
  }
}
