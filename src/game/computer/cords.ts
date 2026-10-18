const f = (n: number): string => n.toFixed(4);

type Pt = readonly [number, number, number];

/**
 * A cord: points along its path (smoothed through), its radius, and `lobe` for a flat two-conductor cord: the
 * conductors' centres sit this far either side of the path, side by side when it lies on the table, with a groove
 * along the web between them. `fittings` are round cones on it (from a, radius ra, to b, radius rb): plugs and boots.
 */
interface Cord {
  r: number;
  lobe?: number;
  pts: readonly Pt[];
  fittings: readonly { a: Pt; b: Pt; ra: number; rb: number }[];
}

/** The power cord's conductors (18 AWG SPT-2 zip cord, 3.6 × 7 mm) and the RF lead's coax (about 5 mm), in model units (13.5 cm each). */
const ZIP = 0.0135;
const COAX = 0.018;
/** The TO TV jack's RCA plug: its shell's radius and length off the back panel. */
const RCA = { r: 0.032, len: 0.16 } as const;
/** The jack and the cord's exit on the back panel (model frame; z is the panel). From the Operation Manual's Figure 9, seen from the front. */
const TO_TV: Pt = [0.23, 0.22, -0.985];
const CORD_EXIT: Pt = [-1.26, 0.07, -0.975];
/** The table's back edge (model z: layout.ts's `EDGE.back` less `PLACE.z`, which can't be imported here: layout imports this). */
const TABLE_BACK = -5.365;

/**
 * The cords, in model coordinates (the TV's face is at z = -PLACE.z), as the Color Computer 2 Operation Manual (Tandy,
 * 1983) draws them. The AC line cord is wired in: a black flat zip cord out of a rubber grommet at the foot of the back
 * panel's far corner (the back left, seen from the front); it drops to the table, runs straight back and, slack, comes out from behind
 * the case's back-left corner and runs back past the set's left side and off the table's back edge, down to the wall outlet. The RF lead is thin black coax with a moulded
 * RCA plug at each end: from the TO TV jack, just right of centre, it droops to the table, runs straight back and comes out
 * from behind the case's back-right corner, runs back along the set's right side, the whole depth of the cabinet, round to the Antenna Switchbox taped to the TV's back (whose
 * twin-lead goes on the VHF screws), out of sight. The table right behind the case is hidden from the viewer: only the runs out show.
 */
export const CORDS: readonly Cord[] = [
  {
    r: ZIP,
    lobe: ZIP * 0.85,
    pts: [CORD_EXIT, [-1.27, 0.045, -1.04], [-1.32, ZIP, -1.16],
      // Straight back first, out of sight behind the hump, then out past the back-left corner, so it shows coming from behind the case.
      [-1.36, ZIP, -1.6], [-1.42, ZIP, -2.0], [-1.7, ZIP, -2.32], [-2.15, ZIP, -2.48], [-2.4, ZIP, -2.85],
      [-2.3, ZIP, -3.2], [-2.4, ZIP, -3.9], [-2.34, ZIP, -4.6], [-2.42, ZIP, -5.15],
      // Over the back edge and down the gap behind it (the table hides it from there).
      [-2.44, ZIP * 0.8, TABLE_BACK + 0.01], [-2.45, -0.12, TABLE_BACK - 0.05], [-2.45, -0.5, TABLE_BACK - 0.06],
    ],
    fittings: [{ a: [CORD_EXIT[0], CORD_EXIT[1], CORD_EXIT[2] + 0.02], b: [-1.265, 0.06, -1.03], ra: 0.03, rb: 0.022 }],
  },
  {
    r: COAX,
    pts: [[TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len - 0.04], [0.24, 0.17, -1.26], [0.28, COAX + 0.01, -1.38],
      // Straight back first, out of sight behind the hump, then out past the back-right corner along the set's foot (its
      // face is at z -2.185: any further back and the set hides it), so it shows coming from behind the case.
      [0.34, COAX, -1.62], [0.7, COAX, -1.86], [1.3, COAX, -1.96], [1.9, COAX, -1.95], [2.45, COAX, -1.99], [2.85, COAX, -2.18], [3.08, COAX, -2.55],
      // Slack, out beside the set's right side (its cabinet ends at model x 2.51) back to near its rear, then in behind it to the switchbox.
      [3.22, COAX, -3.0], [3.3, COAX, -3.6], [3.4, COAX, -4.2], [3.3, COAX, -4.7], [3.0, COAX, -5.08], [2.5, COAX, -5.2], [2.1, COAX, -5.22]],
    fittings: [
      // The plug's shell against the panel, then its boot tapering to the cable.
      { a: [TO_TV[0], TO_TV[1], TO_TV[2] + 0.02], b: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len], ra: RCA.r, rb: RCA.r },
      { a: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len], b: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len - 0.06], ra: RCA.r * 0.72, rb: COAX * 1.1 },
    ],
  },
];

/** Catmull-Rom through a cord's points, `n` segments a span. */
function smoothPath(pts: readonly Pt[], n: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)) as [number, number, number]);
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

/** The horizontal across a segment (a flat cord's conductors lie along it), or `prev` where the segment is near upright. */
function across(a: Pt, b: Pt, prev: Pt): Pt {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const l = Math.hypot(dx, dz);
  return l < 1e-4 ? prev : [-dz / l, 0, dx / l];
}

const allPts = (c: Cord): Pt[] => [...c.pts, ...c.fittings.flatMap((g) => [g.a, g.b])];
/** The cords reach this far back (model z), for the box the model is marched in. */
export const CORDS_BACK = Math.min(...CORDS.flatMap((c) => allPts(c).map((p) => p[2]))) - 0.04;
export const CORDS_SIDE = Math.max(...CORDS.flatMap((c) => allPts(c).map((p) => Math.abs(p[0])))) + 0.04;

/** GLSL `vec2 cords(vec3 p, float best)`: the nearest cord (distance, material 5 + its index), each skipped by its box. */
export function cordsGlsl(): string {
  const v = (p: readonly number[]) => `vec3(${p.map(f).join(', ')})`;
  const parts = CORDS.map((cord, i) => {
    const path = smoothPath(cord.pts, 5);
    const pad = cord.r + (cord.lobe ?? 0) + 0.04;
    const pts = [...path, ...cord.fittings.flatMap((g) => [g.a, g.b])];
    const lo = [0, 1, 2].map((c) => Math.min(...pts.map((p) => p[c])) - pad);
    const hi = [0, 1, 2].map((c) => Math.max(...pts.map((p) => p[c])) + pad);
    let side: Pt = [1, 0, 0];
    const segs = path.slice(1).map((b, j) => {
      if (!cord.lobe) return `d = min(d, capsule(p, ${v(path[j])}, ${v(b)}));`;
      side = across(path[j], b, side);
      return `d = min(d, zipCord(p, ${v(path[j])}, ${v(b)}, ${v(side)}));`;
    });
    const fits = cord.fittings.map((g) => `d = min(d, roundCone(p, ${v(g.a)}, ${v(g.b)}, ${f(g.ra)}, ${f(g.rb)}));`);
    return `if (sdBox(p - ${v(lo.map((l, c) => (l + hi[c]) / 2))}, ${v(lo.map((l, c) => (hi[c] - l) / 2))}, 0.0) < r.x) {
    float d = 1e3;
    ${segs.join('\n    ')}
    d -= ${f(cord.r)};
    ${fits.join('\n    ')}
    if (d < r.x) r = vec2(d, ${f(5 + i)});
  }`;
  });
  const lobe = CORDS.find((c) => c.lobe)?.lobe ?? 0;
  return `/** Distance to a flat zip cord's two conductors (less their radius): side by side along \`s\`, a groove between. */
float zipCord(vec3 p, vec3 a, vec3 b, vec3 s) {
  vec3 pa = p - a, ba = b - a;
  vec3 q = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float h = dot(q, s);
  return length(vec2(abs(h) - ${f(lobe)}, length(q - s * h)));
}
/** A cone with rounded ends, radius ra at a and rb at b (iq's). */
float roundCone(vec3 p, vec3 a, vec3 b, float ra, float rb) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba), rr = ra - rb, a2 = l2 - rr * rr, il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba), z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv), y2 = y * y * l2, z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - rb;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - ra;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
}
vec2 cords(vec3 p, float best) {
  vec2 r = vec2(best, -1.0);
  ${parts.join('\n  ')}
  return r;
}`;
}
