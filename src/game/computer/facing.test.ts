import { expect, test } from '../../test/check';
import { facing } from './facing';
import { DESK_LAYOUTS, onSpot, toPixels } from './layout';

const VIEW = { cx: 900, cy: 1000, k: 160 };
const near = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b) < eps).toBe(true);

/** The pixel a world point shows at, seen from `eye` through ray matrix `m` (its inverse, by solving). */
function pixelOf(eye: readonly number[], m: number[], p: readonly number[]): [number, number] {
  const d = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
  const [a, b, c, e, f, g, h, i, j] = m;
  const det = a * (f * j - g * i) - b * (e * j - g * h) + c * (e * i - f * h);
  const x = (d[0] * (f * j - g * i) - b * (d[1] * j - g * d[2]) + c * (d[1] * i - f * d[2])) / det;
  const y = (a * (d[1] * j - g * d[2]) - d[0] * (e * j - g * h) + c * (e * d[2] - d[1] * h)) / det;
  const w = (a * (f * d[2] - d[1] * i) - b * (e * d[2] - d[1] * h) + d[0] * (e * i - f * h)) / det;
  return [x / w, y / w];
}

for (const what of ['magazine', 'notes'] as const) {
  const spot = DESK_LAYOUTS[0][what]!;
  const centre = onSpot(spot, 0, 0);
  const corner = onSpot(spot, spot.hw, spot.hd);

  test(`FACING ${what}: not at all, it is the room's camera`, () => {
    const f = facing(VIEW, centre, 0);
    const [a, b] = [f.toPixels(corner), toPixels(VIEW, corner)];
    near(a[0], b[0]);
    near(a[1], b[1]);
  });

  test(`FACING ${what}: its centre stays where it shows, and its rays meet its pixels`, () => {
    for (const w of [0.5, 1]) {
      const f = facing(VIEW, centre, w);
      const [a, b] = [f.toPixels(centre), toPixels(VIEW, centre)];
      near(a[0], b[0], 1e-6);
      near(a[1], b[1], 1e-6);
      const [q, r] = [f.toPixels(corner), pixelOf(f.eye, f.rays, corner)];
      near(q[0], r[0], 1e-6);
      near(q[1], r[1], 1e-6);
    }
  });

  test(`FACING ${what}: seen square on, its edges lie level and its sides upright`, () => {
    // A line across the table stays level, as the room's camera draws it; one running back into the room stands
    // upright through the centre, where the room's camera leans it toward the middle of the view.
    const f = facing(VIEW, centre, 1);
    const [c, x, z] = [centre, [centre[0] + 0.3, centre[1], centre[2]], [centre[0], centre[1], centre[2] - 0.3]].map(f.toPixels);
    near(x[1], c[1], 1e-6);
    near(z[0], c[0], 1e-6);
    const room = [centre, [centre[0], centre[1], centre[2] - 0.3]].map((p) => toPixels(VIEW, p));
    expect(Math.abs(room[1][0] - room[0][0]) > 1).toBe(true);
  });
}
