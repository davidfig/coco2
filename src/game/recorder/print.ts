import { hashSeed, KESSLER, write } from '../handwriting';
import { CAS, GRILLE, HUB, KEYS, KEY_NAMES, LED, REC } from './layout';

/**
 * The recorder's print texture, 1024 × 1024, straight alpha (ink over whatever the shader makes the part of): the top
 * of the recorder seen from above, its back edge up (the brand, the keys' legends, the grille's border) in the top
 * `PRINT_TOP_V`; under it the two cassettes' labels side by side, March's then May's, each seen from above with the
 * back edge up and its window cut out (alpha 0 is the shell, or the tape through the window).
 */
export const PRINT_SIZE = 1024;
const TOP_H = Math.round((PRINT_SIZE * REC.hd) / REC.hw);
const LABEL_Y = TOP_H + 16;
const LABEL_W = PRINT_SIZE / 2;
const LABEL_H = Math.round((LABEL_W * CAS.hd) / CAS.hw);
export const PRINT_TOP_V = TOP_H / PRINT_SIZE;
export const PRINT_LABEL_V0 = LABEL_Y / PRINT_SIZE;
export const PRINT_LABEL_V1 = (LABEL_Y + LABEL_H) / PRINT_SIZE;

const SANS = 'Helvetica, Arial, sans-serif';
/** What each cassette's maker (M. Kessler, in pencil) wrote on it: the title over the window, and under it. */
const LABELS: readonly { title: string; under: readonly string[] }[] = [
  { title: 'RAINBOW ON TAPE - MARCH 86', under: ['Copied by hand, for you. Mistakes are mine.', '- M. Kessler'] },
  { title: 'RAINBOW ON TAPE - MAY 86', under: ['ABOUT   SHUTDOWN'] },
];

export function drawRecorderPrint(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = PRINT_SIZE;
  const g = c.getContext('2d')!;
  drawTop(g);
  LABELS.forEach((l, i) => drawLabel(g, i * LABEL_W, l));
  return c;
}

/** The recorder's top: x and z in its frame to canvas pixels. */
function drawTop(g: CanvasRenderingContext2D): void {
  const X = (x: number) => ((x + REC.hw) / (2 * REC.hw)) * PRINT_SIZE;
  const Y = (z: number) => ((z + REC.hd) / (2 * REC.hd)) * TOP_H;
  g.textBaseline = 'middle';
  // A black line round the grille, as stamped into the plate.
  g.strokeStyle = '#141414';
  g.lineWidth = 3;
  g.strokeRect(X(GRILLE.x0) - 6, Y(GRILLE.z0) - 6, X(GRILLE.x1) - X(GRILLE.x0) + 12, Y(GRILLE.z1) - Y(GRILLE.z0) + 12);
  // The brand along the front, left of the record lamp, and its name for it.
  g.fillStyle = '#121212';
  g.textAlign = 'left';
  g.font = `italic bold 38px ${SANS}`;
  g.fillText('REALISTIC', X(GRILLE.x0), Y(0.33));
  g.font = `bold 22px ${SANS}`;
  g.fillText('CCR-81', X(-0.38), Y(0.33));
  g.font = `bold 13px ${SANS}`;
  g.fillText('COMPUTER CASSETTE RECORDER', X(GRILLE.x0), Y(0.44));
  g.textAlign = 'center';
  g.fillText('REC', X(LED.x), Y(LED.z - 0.06));
  // The keys' legends, white on their tops: the name, and its sign under it.
  const signs = ['●', '▶', '◀◀', '▶▶', '■ ▲', '❚❚'];
  const kw = (KEYS.x1 - KEYS.x0) / KEYS.n;
  KEY_NAMES.forEach((name, i) => {
    const cx = X(KEYS.x0 + (i + 0.5) * kw);
    g.fillStyle = '#ecebe6';
    g.font = `bold ${name.length > 6 ? 12 : 14}px ${SANS}`;
    g.fillText(name, cx, Y(KEYS.z0 + 0.06));
    g.font = `bold 15px ${SANS}`;
    g.fillText(signs[i], cx, Y(KEYS.z0 + 0.13));
  });
}

/** A cassette's label at canvas x `x0`: cream paper with a printed band and rules, pencil on it, its window cut out. */
function drawLabel(g: CanvasRenderingContext2D, x0: number, l: (typeof LABELS)[number]): void {
  // Cassette x, z to canvas pixels.
  const X = (x: number) => x0 + (x / (2 * CAS.hw) + 0.5) * LABEL_W;
  const Y = (z: number) => LABEL_Y + (z / (2 * CAS.hd) + 0.5) * LABEL_H;
  const [lx0, lx1, ly0, ly1] = [X(-CAS.hw + 0.03), X(CAS.hw - 0.03), Y(-CAS.hd + 0.02), Y(0.09)];
  g.fillStyle = '#ece5d2';
  g.fillRect(lx0, ly0, lx1 - lx0, ly1 - ly0);
  // The printed band along the top, and the rules for writing on.
  g.fillStyle = '#c4462e';
  g.fillRect(lx0, ly0 + 8, lx1 - lx0, 16);
  g.fillStyle = '#ece5d2';
  g.font = `bold 12px ${SANS}`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillText('A', lx0 + 10, ly0 + 16);
  g.textAlign = 'right';
  g.fillText('C-60  LOW NOISE', lx1 - 10, ly0 + 16);
  g.strokeStyle = 'rgba(70, 110, 170, 0.45)';
  g.lineWidth = 1.5;
  for (const y of [ly0 + 62, ly1 - 30, ly1 - 12]) {
    g.beginPath();
    g.moveTo(lx0 + 8, y);
    g.lineTo(lx1 - 8, y);
    g.stroke();
  }
  // The window, round both hubs.
  const [wx0, wx1, wy0, wy1] = [X(-HUB.x - 0.065), X(HUB.x + 0.065), Y(HUB.z - 0.068), Y(HUB.z + 0.068)];
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.roundRect(wx0, wy0, wx1 - wx0, wy1 - wy0, 14);
  g.fill();
  g.restore();
  // In Kessler's pencil: the title over the window, and what's under it.
  const pen = (size: number, text: string) => ({ size, seed: hashSeed(text), hand: KESSLER, mood: 0.05 });
  write(g, l.title, lx0 + 14, ly0 + 56, pen(15, l.title));
  l.under.forEach((t, i) => write(g, t, lx0 + 14 + i * 230, ly1 - 31 + i * 18, pen(9, t)));
}
