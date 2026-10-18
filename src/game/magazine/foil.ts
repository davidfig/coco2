import { SANS, text } from './paper';

/** Size of the squares the coverage is counted in (page units). */
const CELL = 10;
/** How far from the pointer a square counts as scratched. */
const REACH = 20;
/** Once this much of a panel is gone the last flecks of foil fall off and the hint is yours. */
export const REVEAL_AT = 0.85;

/** A panel being scratched: its own copy of the foil, worn through where the pointer has been. */
export interface Scratched {
  cover: HTMLCanvasElement;
  cells: Uint8Array;
  cols: number;
  covered: number;
  /** Where the pointer was last, relative to the panel; null when the pen is lifted. */
  last: [number, number] | null;
}

const bases = new Map<string, HTMLCanvasElement>();

/** Silver scratch-off foil with its printed label: brushed, speckled, bevelled. Drawn once per size. */
export function foil(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  const have = bases.get(key);
  if (have) return have;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, w, h * 2);
  for (const [t, col] of [[0, '#b4b7bb'], [0.18, '#dcdee0'], [0.36, '#a2a5aa'], [0.55, '#d6d8da'], [0.78, '#9a9da2'], [1, '#c8cacd']] as const) g.addColorStop(t, col);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  let seed = 12345;
  const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3200; i++) {
    c.fillStyle = rnd() < 0.5 ? `rgba(40,42,48,${0.05 + rnd() * 0.12})` : `rgba(255,255,255,${0.1 + rnd() * 0.25})`;
    c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 140; i++) {
    const y = rnd() * h;
    c.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(40,42,48,0.1)';
    c.beginPath();
    c.moveTo(rnd() * w * 0.5, y);
    c.lineTo(w * (0.4 + rnd() * 0.6), y + (rnd() - 0.5) * 3);
    c.stroke();
  }
  c.strokeStyle = 'rgba(60,60,70,0.16)';
  c.lineWidth = 2;
  for (let x = -h; x < w; x += 16) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x + h, 0);
    c.stroke();
  }
  // The label is printed on the foil, so it comes off with it.
  text(c, 'SCRATCH HERE', w / 2 + 1, h / 2 + 11, `bold 28px ${SANS}`, 'rgba(255,255,255,0.55)', 'center');
  text(c, 'SCRATCH HERE', w / 2, h / 2 + 10, `bold 28px ${SANS}`, '#585a60', 'center');
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = 2;
  c.strokeRect(1, 1, w - 2, h - 2);
  bases.set(key, cv);
  return cv;
}

/** A fresh, untouched panel. */
export function startScratch(w: number, h: number): Scratched {
  const cover = document.createElement('canvas');
  cover.width = w;
  cover.height = h;
  cover.getContext('2d')!.drawImage(foil(w, h), 0, 0);
  const cols = Math.ceil(w / CELL);
  return { cover, cells: new Uint8Array(cols * Math.ceil(h / CELL)), cols, covered: 0, last: null };
}

/**
 * Scratch at (x, y), relative to the panel, joining on to the last point if the pen is down. The foil comes away in
 * ragged flecks rather than a clean brush stroke. Returns the share of the panel now worn through.
 */
export function wear(s: Scratched, x: number, y: number): number {
  const c = s.cover.getContext('2d')!;
  c.globalCompositeOperation = 'destination-out';
  const from = s.last;
  s.last = [x, y];
  const n = from ? Math.max(1, Math.ceil(Math.hypot(x - from[0], y - from[1]) / 4)) : 1;
  const rows = s.cells.length / s.cols;
  for (let i = 1; i <= n; i++) {
    const px = from ? from[0] + ((x - from[0]) * i) / n : x;
    const py = from ? from[1] + ((y - from[1]) * i) / n : y;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.arc(px + (Math.random() - 0.5) * 18, py + (Math.random() - 0.5) * 18, 9 + Math.random() * 5, 0, Math.PI * 2);
      c.fill();
    }
    for (let cy = Math.max(0, Math.floor((py - REACH) / CELL)); cy <= Math.min(rows - 1, Math.floor((py + REACH) / CELL)); cy++) {
      for (let cx = Math.max(0, Math.floor((px - REACH) / CELL)); cx <= Math.min(s.cols - 1, Math.floor((px + REACH) / CELL)); cx++) {
        const at = cy * s.cols + cx;
        if (!s.cells[at] && Math.hypot((cx + 0.5) * CELL - px, (cy + 0.5) * CELL - py) <= REACH) {
          s.cells[at] = 1;
          s.covered++;
        }
      }
    }
  }
  return s.covered / s.cells.length;
}
