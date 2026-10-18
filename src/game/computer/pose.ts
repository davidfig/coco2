/**
 * Rigid moves: where a flat thing (a sheet, the magazine) is and which way it faces, as a centre and a rotation, eased
 * from one to another without stretching it (the rotation by slerp).
 */
export type Vec3 = [number, number, number];
/** A unit quaternion (x, y, z, w). */
export type Quat = [number, number, number, number];

/** The rotation whose columns are the axes `x`, `y`, `z` (orthonormal, right-handed). */
export function quatFromAxes(x: readonly number[], y: readonly number[], z: readonly number[]): Quat {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  const tr = m00 + m11 + m22;
  let q: Quat;
  if (tr > 0) {
    const s = 2 * Math.sqrt(tr + 1);
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4];
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s];
  }
  const l = Math.hypot(...q);
  return q.map((v) => v / l) as Quat;
}

/** A rotation's axes (its matrix's columns). */
export function axesOf(q: Quat): [Vec3, Vec3, Vec3] {
  const [x, y, z, w] = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)],
    [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)],
    [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)],
  ];
}

/** `a` turned toward `b` by `t`, the short way round, at an even rate. */
export function slerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const s = d < 0 ? -1 : 1;
  d *= s;
  if (d > 0.9995) {
    const q = a.map((v, i) => v + (s * b[i] - v) * t);
    const l = Math.hypot(...q);
    return q.map((v) => v / l) as Quat;
  }
  const th = Math.acos(d);
  const [ka, kb] = [Math.sin((1 - t) * th) / Math.sin(th), (s * Math.sin(t * th)) / Math.sin(th)];
  return a.map((v, i) => ka * v + kb * b[i]) as Quat;
}

/** A flat thing's place: its centre and its axes (across it, up it, out of its face). */
export interface Pose {
  c: Vec3;
  q: Quat;
}

/** The point (u, v) in a pose's own plane (its units), in the world. */
export function poseAt(p: Pose, u: number, v: number): Vec3 {
  const [x, y] = axesOf(p.q);
  return [p.c[0] + u * x[0] + v * y[0], p.c[1] + u * x[1] + v * y[1], p.c[2] + u * x[2] + v * y[2]];
}
