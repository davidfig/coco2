import { facing } from '../computer/facing';
import { CAB, TUBE_C } from '../tv/cabinetShader';
import { EYE, type DeskSpot, TABLE, onSpot, pictureView, spotAxes } from '../computer/layout';
import { type Quat, axesOf, quatFromAxes, slerp } from '../computer/pose';
import { CAM_DIST, PAGE_UNIT_H, PAPER_THICKNESS, type View, clamp, lerp, smooth } from './bookLayout';

/**
 * The camera the book shader casts its rays from (`uRayO`, `uRayM`): the eye in book space, and the ray through pixel
 * (x, y) along `m · (x, y, 1)` (row-major 3×3). Any pinhole camera fits, so the book's own (`viewCam`) and the room's,
 * with the magazine lying on the table (`deskCam`), can be eased into each other entry by entry.
 */
export interface Cam {
  o: [number, number, number];
  m: number[];
  /** Pixels per book unit at the page (for the texture's mip level), and at ray distance 1. */
  scale: number;
  focal: number;
}

/** The book's own camera for view `v`: tilted down at it, the page turned on screen about the pivot (as `screenToBook`). */
export function viewCam(v: View): Cam {
  const [rs, rc] = [Math.sin(-v.roll), Math.cos(-v.roll)];
  const [px, py] = v.pivot;
  const k = 1 / v.scale;
  // p = (pivot + R(g - pivot) - centre) / scale, R turning by -roll; then (p, -CAM_DIST) tilted.
  const b0 = (px - (rc * px - rs * py) - 0.5 * (v.rect[0] + v.rect[2])) * k;
  const b1 = (py - (rs * px + rc * py) - 0.5 * (v.rect[1] + v.rect[3])) * k;
  const [s, c] = [Math.sin(v.tilt), Math.cos(v.tilt)];
  return {
    o: [v.vx, v.vy - CAM_DIST * s, CAM_DIST * c],
    m: [rc * k, -rs * k, b0, rs * k * c, rc * k * c, b1 * c + CAM_DIST * s, rs * k * s, rc * k * s, b1 * s - CAM_DIST * c],
    scale: v.scale,
    focal: v.scale * CAM_DIST,
  };
}

/**
 * The room's camera (the eye before the set, `Tv.picture` placing it on screen) with the magazine lying on the table at
 * `spot`, the part of it in view (`win`, book x) centred there, seen square on (`facing`) so that lying off to the side
 * of the desk view it isn't stretched (`face` of the way: flown to or from the pile, which the room's camera draws, it
 * is seen as the pile is there). A book unit (the page's width) is the spot's width; it lies `lift` over the table.
 */
export function deskCam(spot: DeskSpot, picture: readonly number[], win: readonly [number, number], lift = 0, face = 1): Cam {
  const S = 2 * spot.hw;
  const view = pictureView(picture);
  const centre = onSpot(spot, 0, 0);
  centre[1] += lift;
  const seen = facing(view, centre, face);
  const A = seen.rays;
  const { ux, uy } = spotAxes(spot);
  const R = [ux, uy, [0, 1, 0]];
  const wc = 0.5 * (win[0] + win[1]);
  const at = [spot.x - S * wc * ux[0], TABLE + lift, spot.z - S * wc * ux[2]];
  const m: number[] = [];
  for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) m.push((R[r][0] * A[col] + R[r][1] * A[3 + col] + R[r][2] * A[6 + col]) / S);
  const e = seen.eye.map((v, i) => v - at[i]);
  const o = R.map((row) => (row[0] * e[0] + row[1] * e[1] + row[2] * e[2]) / S) as Cam['o'];
  const far = Math.hypot(seen.eye[0] - spot.x, seen.eye[1] - TABLE, seen.eye[2] - spot.z);
  return { o, m, scale: (view.k * EYE.d * S) / far, focal: view.k * EYE.d };
}

/**
 * `a` eased toward `b` by `t` as a camera, never as a bare matrix: each is split into how it is turned (a rotation), its
 * lens (pixel to ray, upper triangular) and where the book sits before it; the turn goes by slerp and the lens in a
 * straight line, so every step between is a true pinhole camera and the page moves without shearing. Book point `at`
 * (the middle of the page in view) crosses the screen in a straight line and recedes at an even rate of shrinking.
 */
export function mixCam(a: Cam, b: Cam, t: number, at: readonly number[] = [0, 0, 0]): Cam {
  const [A, B] = [split(a), split(b)];
  const R = axesOf(slerp(A.r, B.r, t));
  const u = A.u.map((v, i) => lerp(v, B.u[i], t));
  // `at` in each camera's frame, as the pixel it shows at and how far along that pixel's ray.
  const sight = (S: ReturnType<typeof split>) => {
    const q = S.R.map((e, k) => S.p[k] + e[0] * at[0] + e[1] * at[1] + e[2] * at[2]);
    const U = S.u;
    const w = q[2] / U[8];
    const gy = (q[1] / w - U[5]) / U[4];
    return [(q[0] / w - U[1] * gy - U[2]) / U[0], gy, w];
  };
  const [ga, gb] = [sight(A), sight(B)];
  const g = [lerp(ga[0], gb[0], t), lerp(ga[1], gb[1], t)];
  const w = ga[2] * Math.pow(gb[2] / ga[2], t);
  const q = [0, 3, 6].map((r) => w * (u[r] * g[0] + u[r + 1] * g[1] + u[r + 2]));
  // The book's origin before the camera, then the eye in book space.
  const p = R.map((e, k) => q[k] - (e[0] * at[0] + e[1] * at[1] + e[2] * at[2]));
  const m: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m.push(R[0][r] * u[c] + R[1][r] * u[3 + c] + R[2][r] * u[6 + c]);
  const o = [0, 1, 2].map((r) => -(R[0][r] * p[0] + R[1][r] * p[1] + R[2][r] * p[2])) as Cam['o'];
  return { o, m, scale: lerp(a.scale, b.scale, t), focal: lerp(a.focal, b.focal, t) };
}

/**
 * A camera's matrix as rotation × lens (Gram-Schmidt on its columns: the screen's across, then up, then out of it), and
 * the book's origin in the camera's own frame.
 */
function split(cam: Cam): { r: Quat; R: number[][]; u: number[]; p: number[] } {
  const m = cam.m;
  const col = (j: number) => [m[j], m[3 + j], m[6 + j]];
  const dot = (x: number[], y: number[]) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const unit = (x: number[]) => x.map((v) => v / Math.hypot(...x));
  const e0 = unit(col(0));
  const c1 = col(1);
  const e1 = unit(c1.map((v, i) => v - dot(e0, c1) * e0[i]));
  const e2 = [e0[1] * e1[2] - e0[2] * e1[1], e0[2] * e1[0] - e0[0] * e1[2], e0[0] * e1[1] - e0[1] * e1[0]];
  const E = [e0, e1, e2];
  const u = E.flatMap((e) => [0, 1, 2].map((j) => dot(e, col(j))));
  return { r: quatFromAxes(e0, e1, e2), R: E, u, p: E.map((e) => -dot(e, cam.o)) };
}

/** The book-space point on the page plane (z = 0) under pixel (x, y). */
export function camToBook(cam: Cam, x: number, y: number): [number, number] {
  const m = cam.m;
  const d = [0, 3, 6].map((r) => m[r] * x + m[r + 1] * y + m[r + 2]);
  const t = -cam.o[2] / d[2];
  return [cam.o[0] + d[0] * t, cam.o[1] + d[1] * t];
}

/** The pixel a book-space point shows at, or null behind the eye: the ray's matrix undone. */
export function camToScreen(cam: Cam, p: readonly number[]): [number, number] | null {
  const [a, b, c, d, e, f, g, h, i] = cam.m;
  const r = [p[0] - cam.o[0], p[1] - cam.o[1], p[2] - cam.o[2]];
  // m⁻¹ · r by the adjugate (the determinant's sign kept, so in front stays positive).
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const x = ((e * i - f * h) * r[0] + (c * h - b * i) * r[1] + (b * f - c * e) * r[2]) / det;
  const y = ((f * g - d * i) * r[0] + (a * i - c * g) * r[1] + (c * d - a * f) * r[2]) / det;
  const w = ((d * h - e * g) * r[0] + (b * g - a * h) * r[1] + (a * e - b * d) * r[2]) / det;
  return w > 1e-6 ? [x / w, y / w] : null;
}

/** Where the book can draw (pixels: x0, y0, x1, y1) through camera `cam`, as `bookBounds` for the book's own; `drop` (book units) is how far under it its shadow falls. */
export function camBounds(cam: Cam, v: View, turning: boolean, drop = 0): [number, number, number, number] {
  const hh = PAGE_UNIT_H / 2 + 0.3;
  const xs = turning ? [Math.min(v.see[0], -1.1), Math.max(v.see[1], 1.1)] : [v.see[0] - 0.3, v.see[1] + 0.3];
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const bx of xs)
    for (const by of [-hh, hh])
      for (const bz of [-drop, turning ? 1.3 : 0.25]) {
        const q = camToScreen(cam, [bx, by, bz]);
        if (!q) return v.clip;
        b[0] = Math.min(b[0], q[0]);
        b[1] = Math.min(b[1], q[1]);
        b[2] = Math.max(b[2], q[0]);
        b[3] = Math.max(b[3], q[1]);
      }
  return [Math.max(b[0] - 3, v.clip[0]), Math.max(b[1] - 3, v.clip[1]), Math.min(b[2] + 3, v.clip[2]), Math.min(b[3] + 3, v.clip[3])];
}

/** How much of the light the paper keeps lying on the dim table, against held out under the lamp. */
export const DESK_LIGHT = 0.72;

/** The whole block of paper lying on the table, in page widths: a fat 1980s issue, about 3/16 in. */
const DESK_PAPER_THICKNESS = 0.022;

/**
 * Put away with the desk in view (`d` of the way there), the magazine lies on the table at `spot`, seen through the
 * room's camera; coming out (`open`, eased), it rises off it straight to `out`, the view with the book all the way out,
 * never by way of the put-away corner `v` is easing from (that path would hang back, then lurch). The view to draw and
 * point with (its `cam` set while on the table), the camera, the light, how far it lies (`uDesk`) and how far open flat
 * at a spread rather than folded back (`uSpread`).
 */
export function onTable(v: View, out: View, d: number, open: number, spot: DeskSpot, picture: readonly number[], lift = 0, face = 1): { view: View; cam: Cam; light: number; desk: number; spread: number } {
  const own = viewCam(v);
  const t = d * (1 - open);
  if (t <= 0) return { view: v, cam: own, light: 1, desk: 0, spread: 0 };
  const at = [0.5 * (v.win[0] + v.win[1]), 0, 0];
  const table = deskCam(spot, picture, v.win, lift, face);
  const rise = open > 0 ? mixCam(table, viewCam(out), open, at) : table;
  const cam = d < 1 ? mixCam(own, rise, d, at) : rise;
  const c = v.clip;
  const clip: View['clip'] = [lerp(c[0], 0, t), lerp(c[1], 0, t), lerp(c[2], v.W, t), lerp(c[3], v.H, t)];
  // Seen from across the room the block of paper shows its true thickness, its sides a band of sheet edges. Put down
  // open at a right-hand page, it is folded back on its spine: the whole block lies under the page in view, the other
  // half under. Open at a left-hand page with a right-hand one beside it, it lies open flat, the right-hand page reaching
  // away from the set as far as the window shows (the left page stays on the spot; the set is the other side).
  const spread = smooth(clamp(-2 * v.c, 0, 1)) * clamp(v.ext[1], 0, 1);
  const k = lerp(1, DESK_PAPER_THICKNESS / PAPER_THICKNESS, t);
  const all = v.ext[2] + v.ext[3];
  const stack = (s: number) => lerp(s, lerp(all, s, spread), t) * k;
  const ext: View['ext'] = [v.ext[0], v.ext[1], stack(v.ext[2]), stack(v.ext[3])];
  // Folded back on its spine, only the page in view lies up: the facing page is gone as soon as it starts down. Open
  // flat, it comes back as the book goes down (putting it away hid it).
  const folded = lerp(v.see[1], v.win[1], clamp(t * 4, 0, 1));
  const flat = lerp(v.see[1], v.ext[1], smooth(clamp(t * 2, 0, 1)));
  const see: View['see'] = [v.see[0], lerp(folded, flat, spread)];
  return { view: { ...v, cam, clip, ext, see }, cam, light: lerp(1, DESK_LIGHT, t), desk: t, spread };
}

/**
 * The set's face on screen (pixels: x0, y0, x1, y1) and its plane (world z = 0) in the book space of a magazine lying at
 * `spot`, `lift` over the table, with `win` in view (as `deskCam`): what of it is behind that plane and inside the
 * rectangle is behind the set (`uSetRect`, `uSetPlane`). Only true where it is seen as the room's camera sees it.
 */
export function behindSet(spot: DeskSpot, picture: readonly number[], win: readonly [number, number]): { rect: number[]; plane: number[] } {
  const view = pictureView(picture);
  const [x0, y0] = [view.cx + (-CAB[0] - TUBE_C[0]) * view.k, view.cy + (-CAB[1] - TUBE_C[1]) * view.k];
  const [x1, y1] = [view.cx + (CAB[0] - TUBE_C[0]) * view.k, view.cy + (CAB[1] - TUBE_C[1]) * view.k];
  const S = 2 * spot.hw;
  const { ux, uy } = spotAxes(spot);
  const wc = 0.5 * (win[0] + win[1]);
  // World z of book point b: the spot's (moved to the middle of the page in view), plus b across and up it.
  return { rect: [x0, y0, x1, y1], plane: [S * ux[2], S * uy[2], 0, spot.z - S * wc * ux[2]] };
}

/** Hand camera `cam` and the room's `light` to the book shader (`uRayO`, `uRayM`, `uScale`, `uFocal`, `uLight`). */
export function setCam(gl: WebGL2RenderingContext, u: Record<string, WebGLUniformLocation | null>, cam: Cam, light: number): void {
  gl.uniform3f(u.uRayO, ...cam.o);
  gl.uniformMatrix3fv(u.uRayM, true, cam.m);
  gl.uniform1f(u.uScale, cam.scale);
  gl.uniform1f(u.uFocal, cam.focal);
  gl.uniform1f(u.uLight, light);
}
