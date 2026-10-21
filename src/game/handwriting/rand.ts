/** Seeded randomness for the pens: the same seed writes the same way every time. */
export type Rand = () => number;

export function mulberry32(a: number): Rand {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const gauss = (r: Rand): number => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
