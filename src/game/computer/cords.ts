import { JACKS, REC, recToModel } from '../recorder/layout';

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
/** The cassette cable (about 4.5 mm), its 5-pin DIN plug in the CASSETTE jack on the back panel (left of centre), and its three leads' 3.5 mm plugs. */
const CABLE = 0.017;
const LEAD = 0.011;
const CASSETTE: Pt = [-0.72, 0.21, -0.985];
const DIN = { r: 0.05, len: 0.13 } as const;
const PLUG = { r: 0.026, len: 0.12 } as const;
/** Where the cable splits into its leads, on the table in front of the recorder's right side. */
const SPLIT = recToModel(REC.hw + 0.38, CABLE, 0.32);

/** A point out from the recorder's right side (its frame's x) at a jack's height and place. */
const offSide = (j: (typeof JACKS)[number], out: number, y: number = j.y): Pt => recToModel(REC.hw + out, y, j.z);

/** The recorder's AC socket in its left side (z in its frame, height), and its figure-8 plug's radius and length. */
const AC = { z: -0.3, y: 0.14, r: 0.04, len: 0.14 } as const;
/** A point out from the recorder's left side at the socket's place (or another height and z). */
const offLeft = (out: number, y: number = AC.y, z: number = AC.z): Pt => recToModel(-REC.hw - out, y, z);

/** The table's back edge (model z: layout.ts's `EDGE.back` less `PLACE.z`, which can't be imported here: layout imports this). */
const TABLE_BACK = -5.365;
/** A cord at x over the table's back edge and down the gap behind it (the table hides it from there), to the outlet. */
const overEdge = (x: number): Pt[] => [[x, ZIP * 0.8, TABLE_BACK + 0.01], [x - 0.01, -0.12, TABLE_BACK - 0.05], [x - 0.01, -0.5, TABLE_BACK - 0.06]];

/**
 * The cords, in model coordinates (the TV's face is at z = -PLACE.z), as the Color Computer 2 Operation Manual (Tandy,
 * 1983) draws them. The AC line cord is wired in: a black flat zip cord out of a rubber grommet at the foot of the back
 * panel's far corner (the back left, seen from the front); it drops to the table, runs straight back and, slack, comes out from behind
 * the case's back-left corner and runs back between the set and the recorder and off the table's back edge, down to the wall
 * outlet. The recorder's AC cord, the same zip cord, goes the same way from its left side. The RF lead is thin black coax with a moulded
 * RCA plug at each end: from the TO TV jack, just right of centre, it droops to the table, runs straight back and comes out
 * from behind the case's back-right corner, runs back close along the set's right side, the whole depth of the cabinet, round to the Antenna Switchbox taped to the TV's back (whose
 * twin-lead goes on the VHF screws), out of sight. The table right behind the case is hidden from the viewer: only the runs out show.
 */
export const CORDS: readonly Cord[] = [
  {
    r: ZIP,
    lobe: ZIP * 0.85,
    pts: [CORD_EXIT, [-1.27, 0.045, -1.04], [-1.32, ZIP, -1.16],
      // Straight back first, out of sight behind the hump, then out past the back-left corner, so it shows coming from
      // behind the case; back between the set and the recorder, drifting left as it goes so the set doesn't hide it.
      [-1.36, ZIP, -1.6], [-1.42, ZIP, -1.98], [-1.7, ZIP, -2.35], [-1.92, ZIP, -2.72], [-2.06, ZIP, -3.12], [-2.18, ZIP, -3.6],
      [-2.32, ZIP, -4.1], [-2.44, ZIP, -4.6], [-2.52, ZIP, -5.1],
      ...overEdge(-2.55),
    ],
    fittings: [{ a: [CORD_EXIT[0], CORD_EXIT[1], CORD_EXIT[2] + 0.02], b: [-1.265, 0.06, -1.03], ra: 0.03, rb: 0.022 }],
  },
  {
    r: COAX,
    pts: [[TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len - 0.04], [0.24, 0.17, -1.26], [0.28, COAX + 0.01, -1.38],
      // Straight back first, out of sight behind the hump, then out past the back-right corner along the set's foot (its
      // face is at z -2.185: any further back and the set hides it), so it shows coming from behind the case.
      [0.34, COAX, -1.62], [0.7, COAX, -1.86], [1.3, COAX, -1.96], [1.9, COAX, -1.95], [2.4, COAX, -1.99], [2.6, COAX, -2.14],
      // Back close along the set's right side (its cabinet ends at model x 2.51), in the gap left of the old magazines
      // piled there (`pile.ts`: their left edge is at x 2.75 or more), to near its rear, then in behind it to the switchbox.
      [2.65, COAX, -2.5], [2.65, COAX, -3.2], [2.64, COAX, -3.9], [2.62, COAX, -4.5], [2.55, COAX, -4.95], [2.35, COAX, -5.17], [2.1, COAX, -5.22]],
    fittings: [
      // The plug's shell against the panel, then its boot tapering to the cable.
      { a: [TO_TV[0], TO_TV[1], TO_TV[2] + 0.02], b: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len], ra: RCA.r, rb: RCA.r },
      { a: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len], b: [TO_TV[0], TO_TV[1], TO_TV[2] - RCA.len - 0.06], ra: RCA.r * 0.72, rb: COAX * 1.1 },
    ],
  },
  {
    r: CABLE,
    // Out of the DIN plug and down behind the case, crossing over the power cord, out past the back-left corner and
    // across the table to the recorder.
    pts: [[CASSETTE[0], CASSETTE[1], CASSETTE[2] - DIN.len - 0.05], [-0.74, 0.15, -1.25], [-0.8, CABLE, -1.36], [-1.05, CABLE, -1.44],
      [-1.32, 0.04, -1.56], [-1.5, CABLE, -1.72], [-1.8, CABLE, -1.95], [-2.05, CABLE, -2.2], [SPLIT[0] + 0.12, CABLE, SPLIT[2] + 0.2], SPLIT],
    fittings: [
      { a: [CASSETTE[0], CASSETTE[1], CASSETTE[2] + 0.02], b: [CASSETTE[0], CASSETTE[1], CASSETTE[2] - DIN.len], ra: DIN.r, rb: DIN.r * 0.9 },
      { a: [CASSETTE[0], CASSETTE[1], CASSETTE[2] - DIN.len], b: [CASSETTE[0], CASSETTE[1], CASSETTE[2] - DIN.len - 0.06], ra: DIN.r * 0.7, rb: CABLE * 1.1 },
      { a: [SPLIT[0] + 0.03, CABLE * 1.3, SPLIT[2] + 0.05], b: [SPLIT[0] - 0.03, CABLE * 1.3, SPLIT[2] - 0.05], ra: CABLE * 1.6, rb: CABLE * 1.6 },
    ],
  },
  // The leads: from the split up into the jacks, each plug's barrel and boot standing out of the side.
  ...JACKS.map((j, i): Cord => ({
    r: LEAD,
    pts: [SPLIT, recToModel(REC.hw + 0.34, LEAD, j.z + 0.1 - 0.03 * i), offSide(j, 0.27, j.y * 0.55), offSide(j, PLUG.len + 0.07), offSide(j, PLUG.len + 0.05)],
    fittings: [
      { a: offSide(j, -0.01), b: offSide(j, PLUG.len * 0.55), ra: j.r * 0.8, rb: j.r * 0.8 },
      { a: offSide(j, PLUG.len * 0.4), b: offSide(j, PLUG.len + 0.05), ra: PLUG.r, rb: LEAD * 1.2 },
    ],
  })),
  {
    r: ZIP,
    lobe: ZIP * 0.85,
    // Out of the socket in the recorder's left side and, slack, back to the table's edge, swinging out wide enough that
    // the recorder doesn't hide it from the viewer.
    pts: [offLeft(AC.len + 0.02), offLeft(AC.len + 0.12, 0.12), offLeft(0.33, 0.05, AC.z - 0.05), offLeft(0.48, ZIP, AC.z - 0.2),
      [-5.25, ZIP, -3.2], [-5.45, ZIP, -3.7], [-5.6, ZIP, -4.3], [-5.7, ZIP, -4.9], [-5.74, ZIP, -5.2], ...overEdge(-5.76)],
    fittings: [
      // The figure-8 plug's body against the side, then its boot.
      { a: offLeft(-0.01), b: offLeft(AC.len * 0.7), ra: AC.r, rb: AC.r },
      { a: offLeft(AC.len * 0.6), b: offLeft(AC.len + 0.03), ra: AC.r * 0.8, rb: ZIP * 1.6 },
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
/** And this far left and right (model x). */
export const CORDS_LEFT = Math.min(...CORDS.flatMap((c) => allPts(c).map((p) => p[0]))) - 0.04;
export const CORDS_RIGHT = Math.max(...CORDS.flatMap((c) => allPts(c).map((p) => p[0]))) + 0.04;

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
