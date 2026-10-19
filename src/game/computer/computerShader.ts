import { CAB, CAB_R, TUBE_C } from '../tv/cabinetShader';
import { KEY_DIP_GLSL } from './keys';
import { PLASTIC_GLSL } from './plastic';
import { WEAR_GLSL } from './wear';
import { TABLE_GLSL } from './table';
import { CORDS_BACK, CORDS_LEFT, CORDS_RIGHT, cordsGlsl } from './cords';
import { RECORDER_GLSL } from '../recorder';
import { recorderBox } from '../recorder/layout';
import { BADGE, CAP, CASE, EYE, KB_X0, KB_Z0, PITCH, PLACE, PLATE, PRINT_BADGE_V0, PRINT_KB_V, PRINT_KEYS, PRINT_W, PLATE_T, TABLE, keysGlsl, ventsGlsl } from './layout';

const f = (n: number): string => n.toFixed(4);

/**
 * The CoCo 2 on the table, raymarched: the case (the keyboard deck in front, a sloped face up to the rear hump), the
 * black plate the keys come up through and 53 sculpted caps, the vent slots cut through the hump, the badge plate
 * stuck on it, the cartridge slot in the right side, the seam round the case, the feet; and its shadow on the table.
 * Beside it, the cassette recorder and the cassettes (`recorderGlsl.ts`).
 * A camera at `EYE` whose rays cross the TV's front plane (z = 0) at the panel point under each pixel, so the model
 * sits in the same picture as the flat-drawn set. Lit by the room's light from the upper left and the screen's glow.
 */
export const COMPUTER_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uPic;        // the TV's picture centre (pixels) and pixels per panel unit (Tv.picture)
uniform vec3 uGlow;       // the light the lit screen throws (Tv.glow)
uniform sampler2D uPrint; // layout.ts drawPrint: the keys' legends (R ink, B red cap) and the badge
out vec4 outColor;

const vec2 CAB = vec2(${f(CAB[0])}, ${f(CAB[1])});
const float CAB_R = ${f(CAB_R)};
const vec2 TUBE_C = vec2(${f(TUBE_C[0])}, ${f(TUBE_C[1])});
const vec3 EYE = vec3(${f(TUBE_C[0])}, ${f(EYE.y)}, ${f(EYE.d)});
const vec3 AT = vec3(${f(PLACE.x)}, ${f(TABLE)}, ${f(PLACE.z)}); // the case's footprint centre, on the table
const float HW = ${f(CASE.hw)}, HD = ${f(CASE.hd)}, HUMP = ${f(CASE.hump)};
const float DECK_B = ${f(CASE.deckBack)}, DECK_Z = ${f(CASE.deckZ)}, HUMP_Z = ${f(CASE.humpZ)};
const float DECK_ANG = ${f(Math.atan2(CASE.deckBack - CASE.deckFront, CASE.hd - CASE.deckZ))};
const vec2 SLOPE_N = vec2(${f(CASE.hump - CASE.deckBack)}, ${f(CASE.deckZ - CASE.humpZ)}) / ${f(Math.hypot(CASE.hump - CASE.deckBack, CASE.deckZ - CASE.humpZ))}; // (z, y)
const float PITCH = ${f(PITCH)};
const vec2 KB0 = vec2(${f(KB_X0)}, ${f(KB_Z0)});
const vec2 PRINT_KEYS = vec2(${f(PRINT_KEYS.w * PITCH)}, ${f(PRINT_KEYS.h * PITCH)});
// The print texture's texels per model unit: on the keyboard, and on the badge. A raymarched surface has no smooth
// texture coordinates across edges, so the detail level is worked out from the pixel's size (\`fp\`), not left to the GPU.
const float KEYS_TEXELS = ${f(PRINT_W / (PRINT_KEYS.w * PITCH))}, BADGE_TEXELS = ${f(PRINT_W / (2 * BADGE.hw))};
const float PRINT_KB_V = ${f(PRINT_KB_V)}, PRINT_BADGE_V0 = ${f(PRINT_BADGE_V0)};
const vec3 PLATE_C = vec3(0.0, 0.0, ${f((PLATE.z0 + PLATE.z1) / 2)});
const vec3 PLATE_B = vec3(${f(PLATE.hw)}, ${f(PLATE_T)}, ${f((PLATE.z1 - PLATE.z0) / 2)});
const vec3 BADGE_C = vec3(0.0, HUMP + 0.003, ${f(BADGE.z)});
const vec3 BADGE_B = vec3(${f(BADGE.hw)}, 0.007, ${f(BADGE.hd)});
const vec3 SLOT_C = vec3(HW, 0.33, -0.55), SLOT_B = vec3(0.12, 0.075, 0.2); // the cartridge slot, right side
// The top shell ends at the seam and overhangs the base, a shallower tray set in from every side; the base stands on
// rubber feet set further in, so from the front the case shows a step and then shadow before the table.
const float SEAM_Y = 0.12;
const float FOOT = 0.06;
const float BASE_IN = 0.08;
const float CAP_H = ${f(CAP.h)};    // a cap's top over the plate
const float CAP_LIFT = ${f(CAP.lift)}; // its skirt over the plate: the stem shows between
// The box every key stands in (deck frame): over the plate, from its surface up to the caps' tops.
const vec3 KEYS_C = vec3(0.0, 0.5 * (CAP_H - 2.0 * PLATE_B.y), PLATE_C.z);
const vec3 KEYS_B = vec3(PLATE_B.x, 0.5 * CAP_H, PLATE_B.z);
const vec3 LIGHT = normalize(vec3(-0.55, 0.8, 0.8));
const vec3 FILL = normalize(vec3(0.7, 0.35, 0.6));

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float sdBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float smax(float a, float b, float k) {
  float h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}
float smin(float a, float b, float k) { return -smax(-a, -b, k); }
/** As the room's (cabinetShader.ts): the table's veneer. */
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}
vec3 wood(vec2 p) {
  float warp = fbm(p * vec2(0.8, 3.0)) * 2.0;
  float grain = fbm(vec2(p.x * 1.2, p.y * 26.0 + warp * 3.0));
  float rings = 0.5 + 0.5 * sin(p.y * 34.0 + warp * 5.0 + sin(p.x * 1.7) * 1.5);
  float fine = noise(vec2(p.x * 3.0, p.y * 260.0));
  vec3 dark = vec3(0.13, 0.065, 0.03), light = vec3(0.36, 0.19, 0.09);
  return mix(dark, light, rings * 0.45 + grain * 0.45 + fine * 0.1);
}
float capsule(vec3 p, vec3 a, vec3 b) {
  vec3 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
/** Whether a point (model frame) is hidden by the set: behind its face and, on screen (\`p\` panel), inside its outline. */
bool behindSet(vec3 m, vec2 p) {
  vec2 q = abs(p) - CAB + CAB_R;
  return m.z + AT.z < 0.0 && length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - CAB_R < 0.0;
}

/** Into the deck's frame: y' off the deck's top (0 on it), z' down it from where it starts. */
vec3 deck(vec3 p) {
  vec3 q = p - vec3(0.0, DECK_B, DECK_Z);
  float c = cos(DECK_ANG), s = sin(DECK_ANG);
  return vec3(q.x, q.y * c + q.z * s, q.z * c - q.y * s);
}

${KEY_DIP_GLSL}
/**
 * One cap, q from its centre on the deck's surface, \`hw\` its half width: it rides on its stem over the plate, its
 * sides lean in toward a smaller top, and the top is dished across. A wide cap has a stem at each end as well. \`c\` is
 * its centre in keyboard space, for how far it is pressed down.
 */
float keyCap(vec3 q, float hw, vec2 c) {
  float y = q.y + PLATE_B.y + keyDip(c);
  float h = CAP_H - CAP_LIFT;
  float t = clamp((y - CAP_LIFT) / h, 0.0, 1.0);
  vec2 b = vec2(hw, PITCH * 0.5) - 0.005 - 0.013 * t; // 18 mm at the skirt, three quarters of that at the top
  vec2 e = abs(q.xz) - b + 0.014;
  float side = (length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.014) * 0.98;
  vec2 w = vec2(side, abs(y - CAP_LIFT - h * 0.5) - h * 0.5) + 0.015; // every edge rounded: top, front and sides flow together
  float d = length(max(w, 0.0)) + min(max(w.x, w.y), 0.0) - 0.015;
  float k = min(1.0, PITCH * 0.5 / hw);
  d = smax(d, -(length(vec2(q.x * k, y - CAP_H - 0.25)) - 0.256), 0.004);
  float sx = hw > 0.1 ? min(abs(q.x), abs(abs(q.x) - hw + 0.07)) : abs(q.x);
  return min(d, sdBox(vec3(sx, y - CAP_LIFT * 0.5, q.z), vec3(0.017, CAP_LIFT * 0.5 + 0.004, 0.017), 0.004));
}
/** \`n\` 1u caps in a row, the first centred at x0. */
float keyRun(vec3 q, float x0, float n, float z) {
  float i = clamp(floor((q.x - x0) / PITCH + 0.5), 0.0, n - 1.0);
  return keyCap(q - vec3(x0 + i * PITCH, 0.0, 0.0), PITCH * 0.5, vec2(x0 + i * PITCH, z));
}
${keysGlsl()}
${ventsGlsl()}
${cordsGlsl()}
${RECORDER_GLSL}

/** The top shell's outer box, from the seam up. */
float shell(vec3 p) { return sdBox(p - vec3(0.0, 0.5 * (HUMP + SEAM_Y), 0.0), vec3(HW, 0.5 * (HUMP - SEAM_Y), HD), 0.045); }
/** The base under it, from the feet up into the shell. */
float base(vec3 p) {
  return sdBox(p - vec3(0.0, 0.5 * (SEAM_Y + FOOT) + 0.01, 0.0), vec3(HW - BASE_IN, 0.5 * (SEAM_Y - FOOT) + 0.01, HD - BASE_IN), 0.02);
}

/** Distance and material: 0 case, 1 cap, 3 feet, 4 the badge, 5 the power cord, 6 the RF lead, 7–10 the cassette cable; 20 and up the recorder. */
vec2 map(vec3 p) {
  float body = shell(p);
  vec3 q = deck(p);
  float deckSlab = smax(body, q.y, 0.02);
  float slope = dot(vec2(p.z - DECK_Z, p.y - DECK_B), SLOPE_N);
  float hump = smax(body, slope, 0.035);
  float d = smin(deckSlab, hump, 0.02);
  d = smax(d, -sdBox(q - PLATE_C, PLATE_B, 0.012), 0.004);                    // the plate's pocket
  d = min(d, base(p));
  if (p.z < HUMP_Z && p.y > HUMP - 0.1) d = smax(d, -vents(p), 0.004);
  d = max(d, -sdBox(p - SLOT_C, SLOT_B, 0.01));
  vec2 r = vec2(d, 0.0);
  // The keys only near the box they stand in; further off, the box itself is a safe step (never the case alone,
  // or a ray steps over the tops into the caps).
  float kb = sdBox(q - KEYS_C, KEYS_B, 0.0);
  if (kb < min(r.x, 0.02)) {
    float k = keys(q - vec3(KB0.x, 0.0, KB0.y));
    if (k < r.x) r = vec2(k, 1.0);
  } else if (kb < r.x) {
    r.x = kb;
  }
  float badge = sdBox(p - BADGE_C, BADGE_B, 0.004);
  if (badge < r.x) r = vec2(badge, 4.0);
  vec3 fp = vec3(abs(p.x) - HW + 0.42, p.y - FOOT * 0.5, abs(p.z) - HD + 0.32);
  float foot = max(length(fp.xz) - 0.05, abs(fp.y) - FOOT * 0.5);
  if (foot < r.x) r = vec2(foot, 3.0);
  if (p.z < -HD + 0.05 || abs(p.x) > HW - 0.05) {
    vec2 c = cords(p, r.x);
    if (c.y > 0.0) r = c;
  }
  return recorder(p, r);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.001, -0.001);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
/** Ambient occlusion, sampled close in (the gaps between the caps are a few millimetres) and never quite black. */
float occlusion(vec3 p, vec3 n) {
  float o = 0.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.005 * float(i * i);
    vec3 q = p + n * h;
    o += (h - min(map(q).x, q.y)) / float(i); // the table (y = 0) too: what lies on it is shaded underneath
  }
  return 0.3 + 0.7 * clamp(1.0 - 4.0 * o, 0.0, 1.0);
}
/** Light let through toward \`l\`: a narrow penumbra, so a rounded edge doesn't shade itself from its own top. */
float softShadow(vec3 p, vec3 l) {
  float s = 1.0, t = 0.02;
  for (int i = 0; i < 28; i++) {
    float h = map(p + l * t).x;
    s = min(s, 24.0 * h / t);
    t += clamp(h, 0.006, 0.08);
    if (s < 0.01 || t > 1.2) break;
  }
  return clamp(s, 0.0, 1.0);
}

${PLASTIC_GLSL}
${WEAR_GLSL}
/** \`fp\` is a pixel's width at p (world units), for the texture's detail. */
vec3 shade(vec3 p, vec3 rd, float id, float fp) {
  vec3 n = normalAt(p);
  vec3 q = deck(p);
  // The cream ABS of the case: the stipple in its surface, a little in its colour, and a faint mottle of age.
  float st = stipple(p, fp, GRAIN);
  vec3 alb = vec3(0.74, 0.72, 0.66) * (0.985 + 0.03 * st) * (0.97 + 0.05 * noise3(p * 3.0));
  float gloss = 0.06;
  float bump = 0.17;
  float ao = occlusion(p, n);
  if (id == 1.0) {
    vec2 uv = (q.xz - KB0 + vec2(0.0, 0.5 * PITCH)) / PRINT_KEYS * vec2(1.0, PRINT_KB_V);
    vec3 ink = textureLod(uPrint, uv, log2(max(fp * KEYS_TEXELS, 1.0))).rgb;
    // Printed on the dished top only: facing up off the deck, near the cap's height (not the sides' upper band).
    float top = smoothstep(0.9, 0.95, dot(n, vec3(0.0, cos(DECK_ANG), sin(DECK_ANG)))) * step(CAP_H - PLATE_B.y - 0.015 - keyDip(q.xz - KB0), q.y);
    alb = mix(vec3(0.84, 0.82, 0.75), vec3(0.6, 0.07, 0.05), step(0.5, ink.b));   // cream caps, BREAK red
    gloss = 0.05; // satin ABS: a soft sheen, not a shine
    float legend = ink.r * top;
    alb = keyWear(p, alb, ink.g, top, ao, gloss, legend);
    alb = mix(alb, ink.b > 0.5 ? vec3(0.92, 0.91, 0.88) : vec3(0.1, 0.095, 0.09), legend); // charcoal ink, BREAK's white
    bump = 0.07; // the caps are smoother: worn by fingers
  } else if (id == 3.0) {
    alb = vec3(0.02);
    bump = 0.0;
  } else if (id >= 20.0) {
    recMaterial(p, n, rd, id, fp, st, alb, gloss, bump);
  } else if (id >= 5.0) {
    alb = id == 5.0 ? vec3(0.045) : vec3(0.07, 0.07, 0.075); // black rubber; the RF lead a little greyer
    gloss = 0.5;
    bump = 0.0;
  } else if (id == 4.0) {
    vec2 uv = vec2((p.x - BADGE_C.x + BADGE_B.x) / (2.0 * BADGE_B.x), (p.z - BADGE_C.z + BADGE_B.z) / (2.0 * BADGE_B.z));
    alb = n.y > 0.9 ? textureLod(uPrint, vec2(uv.x, mix(PRINT_BADGE_V0, 1.0, uv.y)), log2(max(fp * BADGE_TEXELS, 1.0))).rgb * 0.8 : vec3(0.03);
    gloss = 0.35;
    bump = 0.0; // a smooth printed plate
    alb = mix(alb, alb * 1.3 + 0.05, 0.6 * scratches(p, fp));
  } else if (q.y < -0.008 && all(lessThan(abs(q.xz - PLATE_C.xz), PLATE_B.xz + 0.002))) {
    alb = vec3(0.19, 0.186, 0.18) * (0.95 + 0.1 * st); // the plate: black satin plastic (lifted: the room is dim), the same grain
    alb = mix(alb, vec3(0.26, 0.23, 0.19), 0.5 * grime(p, ao)); // dust and crumbs round the stems
    gloss = 0.12;
  } else if ((p.z < HUMP_Z && p.y < HUMP - 0.006 && vents(p) < 0.004) || sdBox(p - SLOT_C, SLOT_B, 0.01) < 0.004) {
    alb = vec3(0.012); // into the slots: dark inside
    bump = 0.0;
  } else {
    alb = caseWear(p, n, alb, ao, fp, gloss);
  }
  vec3 sn = bump > 0.0 ? stippled(p, n, fp, GRAIN, bump) : n;
  // Turned away from the lamp, the surface is its own shadow (the march would only run into the body): skip it.
  float sh = dot(n, LIGHT) > -0.1 ? softShadow(p + n * 0.006, LIGHT) : 0.0;
  vec3 col = alb * (vec3(0.1, 0.095, 0.09) * (0.6 + 0.4 * n.y) * ao);           // the dark room
  col += alb * vec3(0.15, 0.15, 0.16) * max(dot(sn, FILL), 0.0) * ao;           // the room's soft fill, front right: no side goes black
  col += alb * vec3(0.6, 0.57, 0.52) * max(dot(sn, LIGHT), 0.0) * sh * (0.4 + 0.6 * ao); // the lamp, upper left
  // The screen behind and above: its light on the top and the back, and on what lies in front of the set.
  vec3 scr = vec3(TUBE_C, 0.0) - (p + AT);
  float facing = smoothstep(-0.2, 0.3, p.z + AT.z); // only in front of the set's face: behind it, the cabinet's in the way
  col += alb * uGlow * 0.12 * max(dot(sn, normalize(scr)), 0.0) / (1.0 + 0.25 * dot(scr, scr)) * ao * facing;
  vec3 h = normalize(LIGHT - rd);
  col += gloss * vec3(0.6, 0.57, 0.52) * pow(max(dot(sn, h), 0.0), id >= 5.0 && id < 20.0 ? 12.0 : 40.0) * sh; // the cords' sheen is broad
  col += recEmit;
  return col;
}

${TABLE_GLSL}
/** Where a ray is inside a box: from (x) and to (y) along it; empty if x >= y. */
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi) {
  vec3 t0 = (lo - ro) / rd, t1 = (hi - ro) / rd;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
}
void main() {
  vec2 p = (gl_FragCoord.xy - uPic.xy) / uPic.z + TUBE_C;
  vec3 ro = EYE - AT;
  vec3 rd = normalize(vec3(p, 0.0) - EYE);
  // The boxes it lies in: the machine and its cords, and the recorder (the door open, a cassette carried in).
  vec2 b = boxSpan(ro, rd, vec3(${f(CORDS_LEFT)}, 0.0, ${f(CORDS_BACK)}) - 0.02, vec3(${f(CORDS_RIGHT)}, HUMP, HD) + 0.02);
  vec2 rb = boxSpan(ro, rd, vec3(${recorderBox()[0].map(f).join(', ')}), vec3(${recorderBox()[1].map(f).join(', ')}));
  if (rb.x < rb.y) b = b.x < b.y ? vec2(min(b.x, rb.x), max(b.y, rb.y)) : rb;
  float near = b.x, far = b.y;
  // Over the set, whatever lies behind its face is hidden (behindSet): the march stops there.
  vec2 cq = abs(p) - CAB + CAB_R;
  if (length(max(cq, 0.0)) + min(max(cq.x, cq.y), 0.0) - CAB_R < 0.0) far = min(far, (-AT.z - ro.z) / rd.z);
  // A pixel's width, in world units, per unit along the ray.
  float pix = 1.0 / (uPic.z * EYE.z);
  float hitT = -1.0;
  float edgeT = 0.0, edge = 1e3;
  if (near < far && far > 0.0) {
    float t = max(near, 0.0), d = 1e3;
    bool escaped = false;
    for (int i = 0; i < 240; i++) {
      d = map(ro + rd * t).x;
      float cover = d / (pix * t);
      if (cover < edge) { edge = cover; edgeT = t; }
      if (d < 0.0003 * t) { hitT = t; break; }
      t += d * 0.8;
      if (t > far) { escaped = true; break; }
    }
    // Out of steps while still skimming close over the caps (a low ray creeps past every edge): it is a hit there,
    // not a miss to be shaded at some nearer edge.
    if (hitT < 0.0 && !escaped && d < 0.004) hitT = t;
  }
  if (hitT > 0.0 && behindSet(ro + rd * hitT, p)) hitT = -1.0, edge = 1e3;
  if (hitT > 0.0) {
    vec3 hp = ro + rd * hitT;
    outColor = vec4(recGlass(ro, rd, hitT, shade(hp, rd, map(hp).y, pix * hitT)), 1.0);
    return;
  }
  // The silhouette's edge, within a pixel: shade the nearest point and cover part of the pixel.
  float a = edge < 1.5 && !behindSet(ro + rd * edgeT, p) ? 1.0 - smoothstep(0.0, 1.5, edge) : 0.0;
  vec3 col = vec3(0.0);
  if (a > 0.0) {
    vec3 ep = ro + rd * edgeT;
    col = shade(ep, rd, map(ep).y, pix * edgeT);
  }
  // The table, the edge and the dark under it, behind the silhouette's edge.
  float ta;
  vec3 tc = table(ro, rd, p, ta);
  float oa = a + (1.0 - a) * ta;
  col = oa > 0.0 ? (col * a + tc * ta * (1.0 - a)) / oa : col;
  a = oa;
  outColor = vec4(col, a);
}`;
