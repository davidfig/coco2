import { EYE, type DeskSpot, onSpot, pictureView, spotAxes, toPixels } from '../computer/layout';
import { type Pose, type Vec3, poseAt, quatFromAxes, slerp } from '../computer/pose';
import { TUBE_C } from '../tv/cabinetShader';
import { type Layer, type Sheet, layers } from './pile';

/** A sheet's corners on screen (pixels, bottom-left origin), in the order (-1,-1), (1,-1), (1,1), (-1,1) of its own frame. */
export type Quad = [number, number][];

/** How much of the light the paper keeps lying on the dim table, against held up. */
export const DESK_LIGHT = 0.72;

const CORNERS: readonly [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/** A flat sheet's corners. */
export function sheetQuad(s: Sheet): Quad {
  const [c, n] = [Math.cos(s.rot), Math.sin(s.rot)];
  return CORNERS.map(([u, v]) => [s.cx + c * u * s.hx - n * v * s.hy, s.cy + n * u * s.hx + c * v * s.hy]);
}

/**
 * The pile as drawn (`own`, from `layers`) eased onto the table by `t`: each sheet's corners, from the bottom up. The
 * paper doesn't stretch on the way: each sheet is a real sheet of the spot's size, held up in front of the eye (as far
 * off as makes it look the size it is drawn, square to the view) and laid down where it lies on the table, turning
 * evenly as it goes, seen through the room's camera all the way. Its centre crosses the screen in a straight line while
 * it goes off into the room at an even rate of shrinking, rather than in a straight line through the room, which from
 * so near the eye would swing it wide.
 */
export function onTable(own: Layer[], t: number, spot: DeskSpot, n: number, sheet: number, picture: readonly number[]): (Layer & { quad: Quad })[] {
  const flat = own.map((l) => ({ ...l, quad: sheetQuad(l) }));
  if (t <= 0) return flat;
  const view = pictureView(picture);
  const desk = layers({ cx: 0, cy: 0, hx: spot.hw, hy: spot.hd, rot: 0 }, n, sheet, [0, 0], null);
  if (desk.length !== flat.length) return flat;
  return flat.map((l, i) => {
    const [a, b] = [heldPose(view, l, spot.hw), tablePose(spot, desk[i])];
    const [pa, pb] = [toSight(a.c), toSight(b.c)];
    const sight: Vec3 = [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] * Math.pow(pb[2] / pa[2], t)];
    const p = { c: fromSight(sight), q: slerp(a.q, b.q, t) };
    return { ...l, quad: CORNERS.map(([u, v]) => toPixels(view, poseAt(p, u * spot.hw, v * spot.hd))) };
  });
}

/** A world point as the eye sees it: where on the panel (as `project`), and how much nearness enlarges it there. */
function toSight(w: Vec3): Vec3 {
  const k = EYE.d / (EYE.d - w[2]);
  return [TUBE_C[0] + (w[0] - TUBE_C[0]) * k, EYE.y + (w[1] - EYE.y) * k, k];
}

/** `toSight` undone. */
function fromSight([px, py, k]: Vec3): Vec3 {
  return [TUBE_C[0] + (px - TUBE_C[0]) / k, EYE.y + (py - EYE.y) / k, EYE.d - EYE.d / k];
}

/** A sheet `hw` wide (world units, half) drawn flat at `s` (pixels), as a sheet in the room: square to the view, as far from the eye as makes it that size on screen. */
function heldPose(view: { cx: number; cy: number; k: number }, s: Sheet, hw: number): Pose {
  const [c, n] = [Math.cos(s.rot), Math.sin(s.rot)];
  const sight: Vec3 = [TUBE_C[0] + (s.cx - view.cx) / view.k, TUBE_C[1] + (s.cy - view.cy) / view.k, s.hx / (hw * view.k)];
  return { c: fromSight(sight), q: quatFromAxes([c, n, 0], [-n, c, 0], [0, 0, 1]) };
}

/** Sheet `s` of the pile lying at `spot` (its place and turn in the spot's frame, world units), face up on the table. */
function tablePose(spot: DeskSpot, s: Sheet): Pose {
  const { ux, uy } = spotAxes(spot);
  const [c, n] = [Math.cos(s.rot), Math.sin(s.rot)];
  const x = ux.map((v, i) => c * v + n * uy[i]);
  const y = ux.map((v, i) => -n * v + c * uy[i]);
  return { c: onSpot(spot, s.cx, s.cy), q: quatFromAxes(x, y, [0, 1, 0]) };
}

/**
 * The 3×3 matrix (row-major) taking a pixel (x, y, 1) to the sheet's own frame, (u, v) in -1..1 after dividing by the
 * third entry: the square-to-quad homography, inverted.
 */
export function toSheet(q: Quad): number[] {
  // Square (-1..1) to quad, by way of the unit square (Heckbert's closed form).
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const [dx1, dx2, dy1, dy2] = [x1 - x2, x3 - x2, y1 - y2, y3 - y2];
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  // Unit square (s, t) → pixel.
  const U = [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
  // (u, v) in -1..1 → (s, t): s = (u + 1) / 2.
  const S = [0.5, 0, 0.5, 0, 0.5, 0.5, 0, 0, 1];
  // Scaled so that the third entry is positive on the sheet (and only in front of the eye): the shader tells the two apart.
  const m = invert(mul(U, S));
  const [cx, cy] = [(x0 + x1 + x2 + x3) / 4, (y0 + y1 + y2 + y3) / 4];
  return m[6] * cx + m[7] * cy + m[8] < 0 ? m.map((v) => -v) : m;
}

/** Half the sheet's size on screen (pixels), roughly: half its mean edge lengths, across and up. */
export function quadHalf(q: Quad): [number, number] {
  const len = (a: number, b: number) => Math.hypot(q[b][0] - q[a][0], q[b][1] - q[a][1]);
  return [(len(0, 1) + len(3, 2)) / 4, (len(0, 3) + len(1, 2)) / 4];
}

/** Whether pixel (x, y) is on the quad. */
export function inQuadPx(q: Quad, x: number, y: number): boolean {
  const m = toSheet(q);
  const w = m[6] * x + m[7] * y + m[8];
  if (w <= 0) return false;
  const u = (m[0] * x + m[1] * y + m[2]) / w;
  const v = (m[3] * x + m[4] * y + m[5]) / w;
  return Math.abs(u) <= 1 && Math.abs(v) <= 1;
}

function mul(a: number[], b: number[]): number[] {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o;
}

function invert(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map((v) => v / det);
}
