import { CAB, TUBE, TUBE_C } from '../tv/cabinetShader';
import { ACTIVE } from '../tv/pictureShader';
import { SHEET_DPI, SHEET_H, SHEET_W } from '../notes/sheet';
import { CORDS } from './cords';
import { recorderExtent } from '../recorder/layout';

/**
 * The Color Computer 2 itself, as it sits on the table in front of the set: its size and shape, where it is, its
 * 53-key keyboard, the vents and the badge. Single source for the model's SDF (`keysGlsl`, `ventsGlsl`) and the print on
 * it (`drawPrint`). Measured off photos of the Tandy CoCo 2 (Wikimedia Commons: "TRS-80 Color Computer 2-64K.jpg",
 * "Tandy Color Computer 2.jpg", "TRS-80 Color Computer 2.jpg").
 *
 * Units are the TV shader's (the tube is 2 tall): with a 13" tube that is about 13.5 cm a unit. The real case is
 * 37.1 × 26.6 cm. World axes: x right, y up, z toward the viewer; the TV's front is z = 0. Model axes: the
 * same, from the centre of the case's footprint on the table.
 */

/**
 * The case: half width and depth; the rear hump's height; the keyboard deck's height at its back and front edge (a
 * wedge, steeply raked toward the typist); where the deck starts (z) and where the hump's flat top ends, the short
 * sloped step between them. Fitted to a front three-quarter photo (camera solved from the case's corners and the plate).
 */
export const CASE = { hw: 1.375, hd: 0.985, hump: 0.6, deckBack: 0.47, deckFront: 0.24, deckZ: 0.0, humpZ: -0.19 } as const;
/** Where the case's footprint centre sits on the table: under the tube, out from the set enough to show its cords. */
export const PLACE = { x: -0.45, z: 1.2 + CASE.hd } as const;
/** The table top (the room shader's `tableY`). */
export const TABLE = -1.44;
/**
 * The table (world units): its front edge's gap in front of the case (6 cm, as a desk's before a keyboard), its top's
 * thickness, the floor under it (a 73 cm desk), the set's depth (38 cm, a CRT's long back), its back edge (z) and the
 * wall a little behind that, a gap the power cord (cords.ts) drops down.
 */
export const EDGE = { gap: 0.45, thick: 0.22, floor: 5.4, set: 2.8, back: -3.18, wall: -3.3 } as const;
/** The space under the table that shows below its edge in the desk view (panel units); a wide window crops it first, to fill its width. */
export const UNDER = 0.55;
/** The viewer's eye: its height and how far in front of the TV's face (the TV's front plane maps 1:1 to panel units). */
export const EYE = { y: 1.0, d: 8 } as const;

/** The lowest point of the machine on screen (panel y): its front edge where it meets the table. */
export function lowestPoint(): number {
  const z = PLACE.z + CASE.hd;
  return EYE.y + ((TABLE - EYE.y) * EYE.d) / (EYE.d - z);
}

/** Key pitch: the standard 19.05 mm, on a 371 mm case (row 1's 14 keys span 72% of its width, as in the photos). */
export const PITCH = (19.05 / 371) * 2 * 1.375;
/** The keyboard's left edge (row 1, ↑…→, 14 keys, is centred) and the number row's centre, down the deck from `deckZ`. */
export const KB_X0 = -7 * PITCH;
export const KB_Z0 = 0.105 + 0.9 * PITCH;
/** The black plate the keys come up through: half width, back and front edge down the deck (in the photos it is 1.03 times row 2's width and 5.55 rows deep). */
export const PLATE = { hw: 1.03 * 7 * PITCH, z0: 0.105, z1: 0.105 + 5.55 * PITCH } as const;

/**
 * A cap: its top's height over the plate's surface and its skirt's (the stem shows between), and how far it goes down
 * when pressed. Off the PAL photo (Wikimedia Commons, "TRS-80 Color Computer 2 (pal).jpg"): the plate sits down in the
 * deck and the tops stand only about 7 mm over the deck, 11 mm over the plate; the skirts a millimetre or two.
 */
export const CAP = { h: 0.08, lift: 0.012, travel: 0.024 } as const;
/** How deep the plate sits in the deck (its pocket's half depth). */
export const PLATE_T = 0.03;

/** The vents: two banks of six slots across the hump, each bank split by ribs (x ranges). */
export const VENT_SEGMENTS: readonly (readonly [number, number])[] = [
  [-1.21, -0.75],
  [-0.75, -0.34],
  [-0.34, -0.04],
  [0.05, 0.35],
  [0.35, 0.83],
  [0.83, 1.22],
];
/** The first slot's centre z, how many rows, their pitch, a slot's width and a rib's. */
export const VENT = { z0: -0.88, rows: 6, pitch: 0.064, w: 0.024, rib: 0.018 } as const;
/** The badge, a black plate stuck on the hump's top just behind the step: centre z and half size. */
export const BADGE = { z: -0.32, hw: 0.46, hd: 0.058 } as const;

/**
 * Where the magazine and the notebook lie on the table when the view pulls back to the whole desk, if the window has
 * room round it: the centre (world x, z), the turn (radians, anticlockwise seen from above) and the half size (world
 * units, true to life), clear of the machine and the cords.
 */
export interface DeskSpot {
  x: number;
  z: number;
  yaw: number;
  hw: number;
  hd: number;
}
/** An inch in world units (the case is 37.1 cm across). */
const INCH = (2 * CASE.hw) / (37.1 / 2.54);
/** The RAINBOW: a letter-size page, 8½ × 11 in, in the shape its pages are drawn (1024 × 1325). */
export const MAG = { hw: 4.25 * INCH, hd: 4.25 * INCH * (1325 / 1024) };
/** The notebook's torn-out sheet, as drawn (`SHEET_W` × `SHEET_H` at `SHEET_DPI`): about 7¾ × 10½ in, a little smaller than the magazine. */
const NOTE = { hw: (SHEET_W / SHEET_DPI / 2) * INCH, hd: (SHEET_H / SHEET_DPI / 2) * INCH };
/** Where each lies, if anywhere: one arrangement of the desk. */
export type DeskLayout = { magazine?: DeskSpot; notes?: DeskSpot };
/** Both to the right of the machine, the notes lying half over the magazine: for a window with less room either side. */
const STACKED: Required<DeskLayout> = { magazine: { x: 2.22, z: 1.2, yaw: -0.12, ...MAG }, notes: { x: 2.42, z: 2.45, yaw: -0.2, ...NOTE } };
/** The arrangements to try, best first: either side of the machine, both to its right, then one alone. */
export const DESK_LAYOUTS: readonly DeskLayout[] = [
  { magazine: { x: 2.3, z: 2.15, yaw: -0.13, ...MAG }, notes: { x: -3.08, z: 2.2, yaw: 0.06, ...NOTE } },
  STACKED,
  { magazine: STACKED.magazine },
  { notes: STACKED.notes },
];

/** A spot's own axes in the world: across it (x) and up it, away from the viewer (y); its z is the table's up. */
export function spotAxes(s: DeskSpot): { ux: [number, number, number]; uy: [number, number, number] } {
  const [c, n] = [Math.cos(s.yaw), Math.sin(s.yaw)];
  return { ux: [c, 0, -n], uy: [-n, 0, -c] };
}

/** The world point at (u, v) in a spot's frame (world units from its centre), on the table. */
export function onSpot(s: DeskSpot, u: number, v: number): [number, number, number] {
  const { ux, uy } = spotAxes(s);
  return [s.x + u * ux[0] + v * uy[0], TABLE, s.z + u * ux[2] + v * uy[2]];
}

/** The eye in world coordinates. */
export const EYE_AT: readonly [number, number, number] = [TUBE_C[0], EYE.y, EYE.d];

/** A world point on screen, in panel units. */
export function worldToPanel(x: number, y: number, z: number): [number, number] {
  return project(x - PLACE.x, y - TABLE, z - PLACE.z);
}

/**
 * A view of the set in buffer pixels, from `Tv.picture` (centre x, y, half width, half height): the picture's centre and
 * pixels per panel unit. `toPixels` puts a world point there; `ray` gives the world direction from the eye through a pixel.
 */
export function pictureView(picture: readonly number[]): { cx: number; cy: number; k: number } {
  return { cx: picture[0], cy: picture[1], k: picture[3] / (TUBE[1] * ACTIVE[1]) };
}
export function toPixels(v: { cx: number; cy: number; k: number }, w: readonly number[]): [number, number] {
  const [px, py] = worldToPanel(w[0], w[1], w[2]);
  return [v.cx + (px - TUBE_C[0]) * v.k, v.cy + (py - TUBE_C[1]) * v.k];
}
/** The world ray direction through pixel (gx, gy, 1) as a 3×3 matrix (row-major): dir = M · (gx, gy, 1). */
export function rayMatrix(v: { cx: number; cy: number; k: number }): number[] {
  return [1 / v.k, 0, -v.cx / v.k, 0, 1 / v.k, -v.cy / v.k + TUBE_C[1] - EYE.y, 0, 0, -EYE.d];
}

/** A model point on screen, in the TV shader's panel units (the eye sits over the tube's centre, `TUBE_C`). */
export function project(x: number, y: number, z: number): [number, number] {
  const k = EYE.d / (EYE.d - (PLACE.z + z));
  return [TUBE_C[0] + (PLACE.x + x - TUBE_C[0]) * k, EYE.y + (TABLE + y - EYE.y) * k];
}

/** The keyboard on screen (panel units: x0, y0, x1, y1): its plate's corners, from the plate up to the caps' tops. */
export function keyboardBounds(): [number, number, number, number] {
  const a = Math.atan2(CASE.deckBack - CASE.deckFront, CASE.hd - CASE.deckZ);
  const pts: [number, number][] = [];
  for (const x of [-PLATE.hw, PLATE.hw])
    for (const zd of [PLATE.z0, PLATE.z1])
      for (const yd of [-PLATE_T, CAP.h - PLATE_T]) {
        // Out of the deck's frame (as the shader's deck(), undone).
        pts.push(project(x, CASE.deckBack + yd * Math.cos(a) - zd * Math.sin(a), CASE.deckZ + yd * Math.sin(a) + zd * Math.cos(a)));
      }
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
}

/** The case's outline on screen (panel units): the convex hull of its box's corners, counter-clockwise. */
export const CASE_OUTLINE: readonly (readonly [number, number])[] = hull(
  [-1, 1].flatMap((sx) => [0, CASE.hump].flatMap((y) => [-1, 1].map((sz) => project(sx * CASE.hw, y, sz * CASE.hd)))),
);

/** Whether a panel point is on the case (inside `CASE_OUTLINE`). */
export function onCase(x: number, y: number): boolean {
  return inHull(CASE_OUTLINE, x, y);
}

/** Whether a point is inside a convex outline (counter-clockwise, as `hull` makes them). */
export function inHull(o: readonly (readonly [number, number])[], x: number, y: number): boolean {
  for (let i = 0; i < o.length; i++) {
    const [ax, ay] = o[i];
    const [bx, by] = o[(i + 1) % o.length];
    if ((bx - ax) * (y - ay) - (by - ay) * (x - ax) < 0) return false;
  }
  return true;
}

/** Everything on the desk, on screen (panel units: x0, y0, x1, y1): the set, the case, its cords, the recorder, the table's edge and under it, and `more` (model points: the old magazines' pile). */
export function deskBounds(more: readonly (readonly [number, number, number])[] = []): [number, number, number, number] {
  const pts = [...CASE_OUTLINE, ...CORDS.flatMap((c) => c.pts.map((p) => project(p[0], 0, p[2]))), ...[...recorderExtent(), ...more].map((p) => project(p[0], p[1], p[2]))];
  return [
    Math.min(-CAB[0], ...pts.map((p) => p[0])),
    Math.min(-CAB[1], ...pts.map((p) => p[1]), project(0, -EDGE.thick, CASE.hd + EDGE.gap)[1] - UNDER),
    Math.max(CAB[0], ...pts.map((p) => p[0])),
    Math.max(CAB[1], ...pts.map((p) => p[1])),
  ];
}

/** Monotone-chain convex hull, counter-clockwise. */
export function hull(points: [number, number][]): [number, number][] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: [number, number][]) => {
    const h: [number, number][] = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...half(p), ...half([...p].reverse())];
}

export interface Key {
  label: string;
  /** Left edge and width, in key units. */
  x: number;
  w: number;
}

/** Rows from the back: the number row first, the space bar last. Arrows: ↑ ↓ at the left, ← → at the right. */
export const ROWS: Key[][] = [
  keys(0.5, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ':', '-', 'BREAK']),
  keys(0, ['↑', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '@', '←', '→']),
  [...keys(0.2, ['↓', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';']), { label: 'ENTER', x: 11.2, w: 1.5 }, { label: 'CLEAR', x: 12.7, w: 1 }],
  [{ label: 'SHIFT', x: 0.05, w: 1.65 }, ...keys(1.7, ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']), { label: 'SHIFT', x: 11.7, w: 1.65 }],
  [{ label: '', x: 2.9, w: 8.3 }],
];

/** Shifted legends over the main ones, as printed ('' for a key with one sign but printed the same way). */
export const UPPER: Record<string, string> = { '1': '!', '2': '"', '3': '#', '4': '$', '5': '%', '6': '&', '7': "'", '8': '(', '9': ')', ':': '*', '-': '=', ';': '+', ',': '<', '.': '>', '/': '?', '0': '', '@': '' };

function keys(x: number, labels: string[]): Key[] {
  return labels.map((label, i) => ({ label, x: x + i, w: 1 }));
}

const f = (n: number): string => n.toFixed(4);

/**
 * GLSL `float keys(vec3 q)`: the key caps, q in the deck's frame relative to (KB_X0, 0, KB_Z0). Only the two rows
 * either side of the point are looked at, and each run of 1u keys is one repeated cap.
 */
export function keysGlsl(): string {
  const rows = ROWS.map((row, r) => {
    const parts: string[] = [];
    let i = 0;
    while (i < row.length) {
      let j = i;
      while (j < row.length && row[j].w === 1 && row[j].x === row[i].x + (j - i)) j++;
      if (j - i > 1) {
        parts.push(`d = min(d, keyRun(q, ${f((row[i].x + 0.5) * PITCH)}, ${f(j - i)}, ${f(r * PITCH)}));`);
        i = j;
      } else {
        const k = row[i];
        const cx = f((k.x + k.w / 2) * PITCH);
        parts.push(`d = min(d, keyCap(q - vec3(${cx}, 0.0, 0.0), ${f((k.w * PITCH) / 2)}, vec2(${cx}, ${f(r * PITCH)})));`);
        i++;
      }
    }
    return `if (r == ${r}) { ${parts.join(' ')} }`;
  });
  return `float keyRow(int r, vec3 q) {
  float d = 1e3;
  ${rows.join('\n  else ')}
  return d;
}
float keys(vec3 q) {
  // The row the point is over and the rows either side: the caps are tall, so a ray coming in low over one row must
  // already see the next, or it steps into the cap it is heading for.
  float z = floor(q.z / PITCH + 0.5);
  float d = 1e3;
  for (int i = -1; i <= 1; i++) {
    float r = z + float(i);
    if (r < 0.0 || r > ${f(ROWS.length - 1)}) continue;
    d = min(d, keyRow(int(r), q - vec3(0.0, 0.0, r * PITCH)));
  }
  return d;
}`;
}

/** GLSL `float vents(vec3 p)`: the slots, as solids to cut out of the hump (model frame). */
export function ventsGlsl(): string {
  const segs = VENT_SEGMENTS.map(([a, b]) => {
    const c = (a + b) / 2;
    const h = (b - a) / 2 - VENT.rib / 2;
    return `d = min(d, sdBox(vec3(p.x - ${f(c)}, p.y - HUMP, z), vec3(${f(h)}, 0.08, ${f(VENT.w / 2)}), 0.006));`;
  });
  return `float vents(vec3 p) {
  float z = p.z - ${f(VENT.z0)};
  z -= ${f(VENT.pitch)} * clamp(floor(z / ${f(VENT.pitch)} + 0.5), 0.0, ${f(VENT.rows - 1)});
  float d = 1e3;
  ${segs.join('\n  ')}
  return d;
}`;
}

/**
 * The print texture. Top: the keyboard's plan, in key units from the number row's back edge, R the legends' ink and
 * B where a cap is red (BREAK, whose legend is white). The bottom quarter: the badge, in its own colours.
 */
export const PRINT_W = 1024;
export const PRINT_H = 512;
export const PRINT_KEYS = { w: 14, h: 5 } as const;
/** The keyboard's share of the texture's height, and where the badge starts (fractions of PRINT_H). */
export const PRINT_KB_V = ((PRINT_W / PRINT_KEYS.w) * PRINT_KEYS.h) / PRINT_H;
export const PRINT_BADGE_V0 = 0.75;

/**
 * How worn a key is, 0..1: years of BASIC and games. The space bar and ENTER most, then the arrows (joystick-less
 * games), SHIFT, the common letters; digits and signs least. A little jitter per key so no two match.
 */
const WEAR: Record<string, number> = {
  '': 1, ENTER: 0.95, '↑': 0.8, '↓': 0.8, '←': 0.8, '→': 0.8, SHIFT: 0.7, BREAK: 0.55, CLEAR: 0.35,
  E: 0.85, T: 0.75, A: 0.75, O: 0.7, I: 0.7, N: 0.7, S: 0.7, R: 0.7, P: 0.6, L: 0.55, H: 0.55, D: 0.55, U: 0.5, C: 0.5, M: 0.5, G: 0.5,
};
function keyWear(label: string, row: number): number {
  let h = row * 131;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  const base = WEAR[label] ?? (/^[A-Z]$/.test(label) ? 0.4 : /^\d$/.test(label) ? 0.3 : 0.22);
  return Math.min(1, Math.max(0, base + ((h % 100) / 100 - 0.5) * 0.2));
}

export function drawPrint(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = PRINT_W;
  c.height = PRINT_H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, PRINT_W, PRINT_H);
  const u = PRINT_W / PRINT_KEYS.w;
  const font = (px: number, weight = 'bold') => `${weight} ${Math.round(px)}px Helvetica, Arial, sans-serif`;
  g.textBaseline = 'middle';
  // Under each cap: how worn it is (G) and, for BREAK, its red (B). The legends add their ink (R) over that.
  ROWS.forEach((row, r) =>
    row.forEach((k) => {
      g.fillStyle = `rgb(0, ${Math.round(keyWear(k.label, r) * 255)}, ${k.label === 'BREAK' ? 255 : 0})`;
      g.fillRect(k.x * u, r * u, k.w * u, u);
    }),
  );
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = '#f00';
  ROWS.forEach((row, r) => {
    for (const k of row) {
      if (!k.label) continue;
      const cx = (k.x + k.w / 2) * u;
      const cy = (r + 0.5) * u;
      if (k.label.length > 1) {
        g.textAlign = 'center';
        g.font = font(u * 0.17);
        g.fillText(k.label, cx, cy - u * 0.04);
      } else if ('↑↓←→'.includes(k.label)) {
        g.textAlign = 'center';
        g.font = font(u * 0.34);
        g.fillText(k.label, cx, cy - u * 0.02);
      } else if (k.label in UPPER) {
        // Two signs, left-aligned on the cap: the shifted one above.
        g.textAlign = 'left';
        g.font = font(u * 0.24, 'bold');
        if (UPPER[k.label]) g.fillText(UPPER[k.label], cx - u * 0.22, cy - u * 0.14);
        g.fillText(k.label, cx - u * 0.22, cy + (UPPER[k.label] ? u * 0.1 : -u * 0.06));
      } else {
        g.textAlign = 'left';
        g.font = font(u * 0.32, 'bold');
        g.fillText(k.label, cx - u * 0.22, cy - u * 0.08);
      }
    }
  });
  g.globalCompositeOperation = 'source-over';
  // The badge, as on the Tandy-era CoCo 2: TANDY in silver, three slashes (red, green, light blue), COLOR COMPUTER 2 in
  // white, on black in a metal rim.
  const y0 = PRINT_BADGE_V0 * PRINT_H;
  const bw = PRINT_W;
  const bh = PRINT_H - y0;
  g.fillStyle = '#0b0b0c';
  g.fillRect(0, y0, bw, bh);
  g.strokeStyle = '#a8a8ac'; // the bright metal rim
  g.lineWidth = 9;
  g.strokeRect(5, y0 + 5, bw - 10, bh - 10);
  g.textAlign = 'left';
  // Each word stretched to the share of the plate it spans on the real badge (both faces are wide).
  const word = (text: string, x0: number, x1: number, px: number, weight: string) => {
    g.font = font(px, weight);
    g.save();
    g.translate(bw * x0, y0 + bh * 0.53);
    g.scale((bw * (x1 - x0)) / g.measureText(text).width, 1);
    g.fillText(text, 0, 0);
    g.restore();
  };
  g.fillStyle = '#bdbdbb';
  word('TANDY', 0.06, 0.255, bh * 0.54, 'bold');
  ['#d23a2a', '#3a9a3c', '#4a96e0'].forEach((col, i) => {
    const x = bw * 0.28 + i * bh * 0.32;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + bh * 0.3, y0 + bh * 0.16);
    g.lineTo(x + bh * 0.52, y0 + bh * 0.16);
    g.lineTo(x + bh * 0.22, y0 + bh * 0.84);
    g.lineTo(x, y0 + bh * 0.84);
    g.closePath();
    g.fill();
  });
  g.fillStyle = '#f2f2ee';
  word('COLOR COMPUTER 2', 0.46, 0.93, bh * 0.42, 'bold');
  return c;
}
