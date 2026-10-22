import { ISSUE_ORDER, type IssueId } from '../magazine/pages';
import { CAB } from '../tv/cabinetShader';
import { CAS, type Pose, cassetteCorners } from '../recorder/layout';
import { MAG, hull, inHull, project } from './layout';

const f = (n: number): string => n.toFixed(4);

/**
 * The issues not on the table, piled on it beside the set's right side, the oldest at the bottom (the book holds one at
 * a time: `Magazine.issue`; a click on one in the pile swaps it with that one, main.ts). The pile is laid from the top
 * down: the top one lies at `PILE`, and each under it is pushed a step further right and toward the room (`STEP`), so an
 * edge of every one shows to be clicked; each lies a little askew of the others (`SLOTS`). The cassettes of the issues in
 * the pile lie in a pile of their own beside it, on the table in front of its right side (`pileCassette`). Single source for the pile's SDF (`PILE_GLSL`), the covers and spines
 * painted for it (`pileCovers.ts`), clicks (`pileAt`) and the desk's bounds. Model frame (`layout.ts`: x right, y up off
 * the table, z toward the viewer, from the CoCo's footprint).
 */

/** The top one's centre on the table: right of the set (its cabinet ends at model x 2.5), alongside its long back. */
export const PILE = { x: 3.72, z: -3.2 } as const;
/** How far each further down the pile is pushed out from the one on it: right, and toward the room. */
const STEP = { x: 0.3, z: 0.12 } as const;
/** How thick an issue is (a 1986 RAINBOW ran to 200-odd pages: 6 or 7 mm). */
const THICK = 0.05;
/** Each place in the pile from the bottom: how far off square it was put down (from where `STEP` puts it) and its turn (radians, anticlockwise seen from above). */
const SLOTS: readonly { dx: number; dz: number; yaw: number }[] = [
  { dx: 0.0, dz: 0.0, yaw: -0.16 },
  { dx: -0.04, dz: -0.06, yaw: 0.14 },
  { dx: 0.05, dz: 0.03, yaw: -0.27 },
  { dx: -0.03, dz: -0.04, yaw: 0.06 },
  { dx: 0.04, dz: 0.05, yaw: -0.08 },
  { dx: -0.02, dz: -0.02, yaw: 0.22 },
];
/** As many places as there can be issues in the pile: all but the one on the table. */
const N = Math.max(1, ISSUE_ORDER.length - 1);
/** The cassettes' pile: where it stands on the table, clear of the magazines' and of the magazine and notes put down on the table. */
const CAS_PILE = { x: 4.25, z: -1.7 } as const;
/** Each cassette in it from the bottom, dropped on the one under it: how far off its middle, and its turn. */
const CAS_SLOTS: readonly { dx: number; dz: number; yaw: number }[] = [
  { dx: 0.0, dz: 0.0, yaw: 0.34 },
  { dx: 0.06, dz: -0.04, yaw: 0.1 },
  { dx: -0.05, dz: 0.03, yaw: 0.55 },
  { dx: 0.03, dz: 0.05, yaw: 0.22 },
  { dx: -0.04, dz: -0.03, yaw: 0.44 },
  { dx: 0.05, dz: 0.02, yaw: 0.04 },
];

/** Spine lettering, and its colour, for each issue. */
export const SPINES: Record<IssueId, { date: string; volume: string; colour: string }> = {
  march: { date: 'March 1986', volume: 'VOLUME V  NUMBER 8', colour: '#141a52' },
  may: { date: 'May 1986', volume: 'VOLUME V  NUMBER 10', colour: '#2a5a9a' },
};

/** Place `i` (from the bottom) in a pile of `n`: its centre and turn. */
function slot(i: number, n: number): { x: number; z: number; yaw: number } {
  const k = n - 1 - i;
  return { x: PILE.x + SLOTS[i].dx + STEP.x * k, z: PILE.z + SLOTS[i].dz + STEP.z * k, yaw: SLOTS[i].yaw };
}

/** Place `i` (from the bottom) in a pile of `n` (model frame): its centre, the height of its underside, and its turn. */
export function pileSlot(i: number, n: number): { x: number; y: number; z: number; yaw: number } {
  return { ...slot(i, n), y: i * THICK };
}

/** A point in place `i`'s frame (across its cover, up, down its cover) in the model frame, in a pile of `n`. */
function fromSlot(i: number, n: number, u: number, y: number, v: number): [number, number, number] {
  const s = slot(i, n);
  const [c, sn] = [Math.cos(s.yaw), Math.sin(s.yaw)];
  return [s.x + u * c + v * sn, y, s.z - u * sn + v * c];
}

/** Place `i`'s corners (model frame) in a pile of `n`. */
function corners(i: number, n: number): [number, number, number][] {
  return [-MAG.hw, MAG.hw].flatMap((u) => [-MAG.hd, MAG.hd].flatMap((v) => [i * THICK, (i + 1) * THICK].map((y) => fromSlot(i, n, u, y, v))));
}

/** Every corner of a pile of `n` (model frame), and of the pile of their `n` cassettes beside it: for the desk's bounds. */
export function pileExtent(n: number): [number, number, number][] {
  return Array.from({ length: n }, (_, i) => [...corners(i, n), ...cassetteCorners(pileCassette(i))]).flat();
}

/** The box any pile lies in, its cassettes on it, hopping (model frame: least and greatest corner): for the box the march looks in. */
export function pileBox(): [[number, number, number], [number, number, number]] {
  const pts = Array.from({ length: N }, (_, n) => pileExtent(n + 1)).flat();
  const lo = [0, 2].map((c) => Math.min(...pts.map((p) => p[c])) - 0.03);
  const hi = [0, 2].map((c) => Math.max(...pts.map((p) => p[c])) + 0.03);
  return [
    [lo[0], 0, lo[1]],
    [hi[0], Math.max(N * THICK, N * 2 * CAS.hh) + 0.35, hi[1]],
  ];
}

/** Everything the pile and the cassettes on it can cover on screen (panel x0, y0, x1, y1). */
export const PILE_BOUNDS: readonly [number, number, number, number] = (() => {
  const [lo, hi] = pileBox();
  const pts = [lo[0], hi[0]].flatMap((x) => [lo[1], hi[1]].flatMap((y) => [lo[2], hi[2]].map((z) => project(x, y, z))));
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
})();

/**
 * What in `pile` (issues from the bottom) is under a panel point, where the set isn't in front of it: a cassette lying
 * on it (of `cassettes`, those `piled`), or the issue topmost there.
 */
export function pileClick<C extends { id: IssueId; pose: Pose; piled: boolean }>(pile: readonly IssueId[], cassettes: readonly C[], x: number, y: number): { pile: IssueId; cassette: boolean } | null {
  if (Math.abs(x) < CAB[0] && Math.abs(y) < CAB[1]) return null;
  const on = (pts: [number, number, number][]) => inHull(hull(pts.map((p) => project(...p))), x, y);
  const cas = cassettes.find((c) => c.piled && on(cassetteCorners(c.pose)));
  if (cas) return { pile: cas.id, cassette: true };
  for (let i = pile.length - 1; i >= 0; i--) if (on(corners(i, pile.length))) return { pile: pile[i], cassette: false };
  return null;
}

/** The `j`th cassette from the bottom of the cassettes' pile (the order of their issues in the magazines' pile). */
export function pileCassette(j: number): Pose {
  const s = CAS_SLOTS[j % CAS_SLOTS.length];
  return { x: CAS_PILE.x + s.dx, y: CAS.hh + 0.002 + j * (2 * CAS.hh + 0.002), z: CAS_PILE.z + s.dz, yaw: s.yaw, tilt: 0 };
}

/** The pile texture (`pileCovers.ts`): each issue's cover (in `ISSUE_ORDER`), `COVER_COLS` across at `COVER_W` × `COVER_H`; under them a row per spine, `SPINE_H` high, from `SPINE_Y`. */
export const COVER_W = 512;
export const COVER_H = Math.round((COVER_W * 1325) / 1024);
export const COVER_COLS = 2;
export const SPINE_Y = Math.ceil(ISSUE_ORDER.length / COVER_COLS) * COVER_H + 8;
export const SPINE_H = 28;
export const PILE_TEX = { w: 1024, h: SPINE_Y + ISSUE_ORDER.length * SPINE_H } as const;

const vecs = (xs: string[]): string => xs.join(', ');

/**
 * GLSL for the pile, for the computer's march: its SDF (`pile`, materials 30 and up, one per magazine), what each part
 * shows (`pileMaterial`: the cover on top, the spine, the block of pages along the other edges, yellowing with age), the
 * set's shade falling on it (`setShade`: the lamp is up to the left, beyond the set) and its shadow on the table
 * (`pileShadow`). Needs the computer shader's sdBox, noise, hash, LIGHT, CAB and AT.
 */
export const PILE_GLSL = /* glsl */ `
uniform float uPile;              // how many lie in the pile
uniform float uPileIssue[${N}];  // which issue each is, from the bottom (its place in ISSUE_ORDER: its cover and spine in the texture; -1 a place left empty)
uniform sampler2D uPileTex;       // pileCovers.ts

const int PILE_N = ${N};
const float THICK = ${f(THICK)};
const vec2 STEP = vec2(${f(STEP.x)}, ${f(STEP.z)});
const vec2 PILE_M[${N}] = vec2[${N}](${vecs(SLOTS.slice(0, N).map((m) => `vec2(${f(PILE.x + m.dx)}, ${f(PILE.z + m.dz)})`))}); // each place's centre, the top one's
const vec2 PILE_R[${N}] = vec2[${N}](${vecs(SLOTS.slice(0, N).map((m) => `vec2(${f(Math.cos(m.yaw))}, ${f(Math.sin(m.yaw))})`))}); // its turn
const vec2 MAG_H = vec2(${f(MAG.hw)}, ${f(MAG.hd)});
const vec3 PILE_LO = vec3(${pileBox()[0].map(f).join(', ')}), PILE_HI = vec3(${pileBox()[1].map(f).join(', ')});
const vec4 PILE_TEX = vec4(${f(COVER_W / PILE_TEX.w)}, ${f(COVER_H / PILE_TEX.h)}, ${f(SPINE_Y / PILE_TEX.h)}, ${f(SPINE_H / PILE_TEX.h)}); // a cover's size, the spines' start and a spine's height (uv)
const float COVER_TEXELS = ${f(COVER_W / (2 * MAG.hw))}, SPINE_TEXELS = ${f(PILE_TEX.w / (2 * MAG.hd))};
// The set, as a box in the model frame (from the face back and from the table up), for the shade it throws.
const vec3 SET_LO = vec3(-CAB.x, 0.0, -2.8) - AT * vec3(1.0, 0.0, 1.0), SET_HI = vec3(CAB.x, 2.0 * CAB.y + 0.02, 0.0) - AT * vec3(1.0, 0.0, 1.0);

/** Into place \`i\`'s frame: from the middle of its bottom, x across the cover, z down it (its top edge at -z); each under the top one a step further out. */
vec3 magLocal(vec3 p, int i) {
  vec3 q = p - vec3(PILE_M[i].x, float(i) * THICK, PILE_M[i].y) - vec3(STEP.x, 0.0, STEP.y) * (uPile - 1.0 - float(i));
  vec2 r = PILE_R[i];
  return vec3(q.x * r.x - q.z * r.y, q.y, q.x * r.y + q.z * r.x);
}
vec3 magDir(vec3 d, int i) { vec2 r = PILE_R[i]; return vec3(d.x * r.x - d.z * r.y, d.y, d.x * r.y + d.z * r.x); }

/** The pile into \`r\` (distance, material): 30 + which magazine, from the bottom. */
vec2 pile(vec3 p, vec2 r) {
  vec3 c = 0.5 * (PILE_LO + PILE_HI);
  float box = sdBox(p - c, 0.5 * (PILE_HI - PILE_LO), 0.0);
  if (box > 0.02) {
    if (box < r.x) r = vec2(box, 30.0);
    return r;
  }
  for (int i = 0; i < PILE_N; i++) {
    if (float(i) >= uPile) break;
    if (uPileIssue[i] < 0.0) continue;
    vec3 l = magLocal(p, i);
    float t = THICK;
    // The fore-edge and the foot a little swollen and rounded: the pages, not a board.
    float d = sdBox(l - vec3(0.0, 0.5 * t, 0.0), vec3(MAG_H.x, 0.5 * t, MAG_H.y), min(0.012, 0.45 * t));
    if (d < r.x) r = vec2(d, 30.0 + float(i));
  }
  return r;
}

/** A texel of the pile texture, its detail level from a pixel's width \`fp\` and the texels per unit. */
vec3 pileTex(vec2 uv, float fp, float texels) { return textureLod(uPileTex, uv, log2(max(fp * texels, 1.0))).rgb; }

/** What magazine \`id\` shows where it was hit: the cover on top, the spine, the block of pages. */
void pileMaterial(vec3 p, vec3 n, float id, float fp, inout vec3 alb, inout float gloss, inout float bump) {
  int i = int(id - 29.5);
  vec3 l = magLocal(p, i), ln = magDir(n, i);
  float t = THICK;
  float issue = uPileIssue[i];
  float age = (${f(ISSUE_ORDER.length - 1)} - issue) / 12.0; // a little yellowing for each issue since
  vec2 cell = vec2(mod(issue, ${f(COVER_COLS)}), floor(issue / ${f(COVER_COLS)})) * PILE_TEX.xy;
  vec2 cuv = clamp(l.xz / (2.0 * MAG_H) + 0.5, 0.004, 0.996);
  bump = 0.0;
  if (ln.y > 0.6) {
    // The glossy cover; worn along the spine and the corners.
    alb = pileTex(cell + cuv * PILE_TEX.xy, fp, COVER_TEXELS);
    float rub = smoothstep(0.03, 0.0, cuv.x) + 0.6 * smoothstep(0.06, 0.0, min(min(cuv.x, 1.0 - cuv.x), min(cuv.y, 1.0 - cuv.y)));
    alb = mix(alb, vec3(0.75, 0.72, 0.65), 0.5 * clamp(rub, 0.0, 1.0));
    gloss = 0.32;
    return;
  }
  float h = clamp(l.y / t, 0.0, 1.0); // up its edge: 0 the back cover, 1 the front
  if (ln.y < -0.6) {
    alb = vec3(0.3, 0.28, 0.25);
    return;
  }
  if (ln.x < -0.6) {
    // The spine, printed along its length, the front cover's side up.
    alb = pileTex(vec2(cuv.y, PILE_TEX.z + (issue + 0.08 + 0.84 * (1.0 - h)) * PILE_TEX.w), fp, SPINE_TEXELS);
    alb *= mix(1.0, 0.88, age);
    gloss = 0.25;
    return;
  }
  // The other three edges: the front cover's and the back's stock over and under the block of pages.
  if (h > 0.9) {
    alb = pileTex(cell + clamp(cuv, 0.02, 0.98) * PILE_TEX.xy, fp, COVER_TEXELS) * 0.9;
    gloss = 0.2;
    return;
  }
  if (h < 0.1) {
    alb = vec3(0.4 + 0.4 * hash(vec2(issue, 3.0)), 0.3 + 0.3 * hash(vec2(issue, 5.0)), 0.25 + 0.4 * hash(vec2(issue, 7.0))) * 0.7; // the back cover's ad
    gloss = 0.2;
    return;
  }
  // The pages: newsprint-ish, yellowing; the leaves' lines fade to their mean once a pixel spans them; here and there
  // a signature of colour pages (the ads) shows as a band.
  float along = abs(ln.x) > abs(ln.z) ? l.z : l.x;
  float leaves = l.y * 1400.0;
  float fine = 0.5 + (noise(vec2(along * 6.0, leaves)) - 0.5) * (1.0 - smoothstep(0.3, 1.0, fp * 1400.0));
  alb = vec3(0.8, 0.77, 0.68) * (0.86 + 0.2 * fine);
  float band = floor(l.y * 160.0);
  float c = hash(vec2(band, issue));
  if (c > 0.82) alb *= mix(vec3(1.0), vec3(0.75 + 0.3 * hash(vec2(band, issue + 1.0)), 0.7, 0.62 + 0.3 * hash(vec2(issue, band))), 0.6);
  alb *= mix(vec3(1.0), vec3(1.0, 0.92, 0.74), 0.6 * age);
  gloss = 0.03;
}

/** How much of the lamp's light reaches a point (model frame) past the set, which stands between them for the pile: softened at the edges. */
float setShade(vec3 p) {
  vec3 t0 = (SET_LO - p) / LIGHT, t1 = (SET_HI - p) / LIGHT;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  return b <= max(a, 0.0) ? 1.0 : 1.0 - 0.8 * smoothstep(0.0, 0.5, b - max(a, 0.0));
}

/** How much the pile darkens the table at a point (model frame): each magazine's, thrown away from the lamp by its height. */
float pileShadow(vec2 xz) {
  float s = 0.0;
  for (int i = 0; i < PILE_N; i++) {
    if (float(i) >= uPile) break;
    if (uPileIssue[i] < 0.0) continue;
    float y = float(i + 1) * THICK;
    vec3 l = magLocal(vec3(xz.x - 0.6 * y, 0.0, xz.y + 0.6 * y), i);
    vec2 b = abs(l.xz) - MAG_H + 0.03;
    float d = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0);
    s = max(s, 0.6 * exp(-max(d, 0.0) * 12.0));
  }
  return s;
}
`;
