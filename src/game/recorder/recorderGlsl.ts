import { CAS, GRILLE, HUB, JACKS, KEYS, LED, LID, REC, WELL, WIN } from './layout';
import { PRINT_LABEL_V0, PRINT_LABEL_V1, PRINT_TOP_V } from './print';

const f = (n: number): string => n.toFixed(4);

/**
 * GLSL for the cassette recorder and the two cassettes, for the computer's march (`computerShader.ts`): their SDF
 * (`recorder`, materials 20 and up), what each part is made of (`recMaterial`), the smoked window over the cassette
 * (`recGlass`, laid over whatever the ray found under it) and their shadows on the table (`recShadow`). Needs the
 * computer shader's sdBox, noise, stipple and LIGHT.
 */
export const RECORDER_GLSL = /* glsl */ `
uniform float uLid;         // how far the door is open (radians)
uniform vec4 uRecKeys;      // RECORD, PLAY, STOP/EJECT: how far each is down (0..1); the record lamp
uniform vec4 uCasA, uCasB;  // the March and the May cassette: centre (model frame) and turn; y under the table hides one
uniform vec2 uCasTilt;      // each one's tilt about its own x
uniform vec2 uReel;         // the hubs' turn (radians), and how much of the tape has wound onto the right-hand reel (0..1)
uniform sampler2D uRecPrint; // print.ts: the recorder's top, and the two labels

const vec3 REC_C = vec3(${f(REC.x)}, 0.0, ${f(REC.z)});
const vec2 REC_YAW = vec2(${f(Math.cos(REC.yaw))}, ${f(Math.sin(REC.yaw))});
const vec3 REC_B = vec3(${f(REC.hw)}, ${f(REC.h)}, ${f(REC.hd)});
const vec4 LID_R = vec4(${f(LID.x0)}, ${f(LID.x1)}, ${f(LID.z0)}, ${f(LID.z1)});
const float LID_T = ${f(LID.t)}, WELL_D = ${f(WELL.depth)}, WELL_IN = ${f(WELL.inset)};
const vec4 WIN_R = vec4(${f(WIN.x0)}, ${f(WIN.x1)}, ${f(WIN.z0)}, ${f(WIN.z1)});
const vec4 KEYS_R = vec4(${f(KEYS.x0)}, ${f(KEYS.x1)}, ${f(KEYS.z0)}, ${f(KEYS.z1)});
const float KEY_W = ${f((KEYS.x1 - KEYS.x0) / KEYS.n)};
const vec4 GRILLE_R = vec4(${f(GRILLE.x0)}, ${f(GRILLE.x1)}, ${f(GRILLE.z0)}, ${f(GRILLE.z1)});
const vec3 JACK[${JACKS.length}] = vec3[${JACKS.length}](${JACKS.map((k) => `vec3(${f(k.z)}, ${f(k.y)}, ${f(k.r)})`).join(', ')}); // z, height, radius
const vec3 LED_P = vec3(${f(LED.x)}, ${f(LED.z)}, ${f(LED.r)});
const vec3 CAS_B = vec3(${f(CAS.hw)}, ${f(CAS.hh)}, ${f(CAS.hd)});
const vec4 HUB_P = vec4(${f(HUB.x)}, ${f(HUB.z)}, ${f(HUB.r)}, 0.0);
const vec2 PACK = vec2(${f(HUB.empty)}, ${f(HUB.full)});
const float TOP_TEXELS = ${f(1024 / (2 * REC.hw))}, LABEL_TEXELS = ${f(512 / (2 * CAS.hw))};
const float PRINT_TOP_V = ${f(PRINT_TOP_V)}, PRINT_LABEL_V0 = ${f(PRINT_LABEL_V0)}, PRINT_LABEL_V1 = ${f(PRINT_LABEL_V1)};

/** Light the recorder gives off itself (the record lamp), added after the room's light. */
vec3 recEmit = vec3(0.0);

/** Into the recorder's frame (a point, or with \`dir\` a direction). */
vec3 recLocal(vec3 p) { vec3 q = p - REC_C; return vec3(q.x * REC_YAW.x - q.z * REC_YAW.y, q.y, q.x * REC_YAW.y + q.z * REC_YAW.x); }
vec3 recDir(vec3 d) { return vec3(d.x * REC_YAW.x - d.z * REC_YAW.y, d.y, d.x * REC_YAW.y + d.z * REC_YAW.x); }
/** From the recorder's frame into the door's (as if shut, z from the hinge). */
vec3 lidLocal(vec3 q) {
  vec3 h = q - vec3(0.0, REC_B.y, LID_R.z);
  float c = cos(uLid), s = sin(uLid);
  return vec3(h.x, h.y * c - h.z * s, h.y * s + h.z * c);
}
/** Into a cassette's frame at its pose (centre and turn) and tilt. */
vec3 casLocal(vec3 p, vec4 pose, float tilt) {
  vec3 q = p - pose.xyz;
  float c = cos(pose.w), s = sin(pose.w);
  q = vec3(q.x * c - q.z * s, q.y, q.x * s + q.z * c);
  float ct = cos(tilt), st = sin(tilt);
  return vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct);
}
float sdRect(vec2 p, vec4 r) { vec2 b = abs(p - 0.5 * (r.xz + r.yw)) - 0.5 * (r.yw - r.xz); return length(max(b, 0.0)) + min(max(b.x, b.y), 0.0); }
bool inRect(vec2 p, vec4 r) { return p.x > r.x && p.x < r.y && p.y > r.z && p.y < r.w; }

/** A cassette: the shell, a little waisted along its tape edge where the heads go in. */
float cassette(vec3 c) {
  float d = sdBox(c, CAS_B, 0.012);
  return max(d, -sdBox(c - vec3(0.0, 0.0, CAS_B.z), vec3(0.2, CAS_B.y * 0.55, 0.012), 0.004));
}

/** The key \`i\` (0..5): how far it is down. */
float keyDown(float i) { return i == 0.0 ? uRecKeys.x : i == 1.0 ? uRecKeys.y : i == 4.0 ? uRecKeys.z : 0.0; }

/** The recorder and the cassettes into \`r\` (distance, material): 20 body, 21 keys, 22 door, 24 and 25 the cassettes. */
vec2 recorder(vec3 p, vec2 r) {
  if (length(p - uCasA.xyz) < r.x + 0.46) { float d = cassette(casLocal(p, uCasA, uCasTilt.x)); if (d < r.x) r = vec2(d, 24.0); }
  if (length(p - uCasB.xyz) < r.x + 0.46) { float d = cassette(casLocal(p, uCasB, uCasTilt.y)); if (d < r.x) r = vec2(d, 25.0); }
  vec3 q = recLocal(p);
  // Further off than the box it stands in (the door open), that box is a safe step.
  float box = sdBox(q - vec3(0.0, 0.5, -0.1), vec3(REC_B.x, 0.5, REC_B.z + 0.1) + 0.02, 0.0);
  if (box > 0.02) {
    if (box < r.x) r = vec2(box, 20.0);
    return r;
  }
  float body = sdBox(q - vec3(0.0, 0.5 * REC_B.y + 0.006, 0.0), vec3(REC_B.x, 0.5 * REC_B.y - 0.006, REC_B.z), 0.035);
  vec2 lc = vec2(0.5 * (LID_R.x + LID_R.y), 0.5 * (LID_R.z + LID_R.w)), lh = vec2(0.5 * (LID_R.y - LID_R.x), 0.5 * (LID_R.w - LID_R.z));
  float cut = sdBox(q - vec3(lc.x, REC_B.y, lc.y), vec3(lh.x, LID_T, lh.y), 0.004);                                   // the door's seat
  cut = min(cut, sdBox(q - vec3(lc.x, REC_B.y, lc.y), vec3(lh.x - WELL_IN, WELL_D, lh.y - WELL_IN), 0.01));          // the well
  vec2 kc = vec2(0.5 * (KEYS_R.x + KEYS_R.y), 0.5 * (KEYS_R.z + KEYS_R.w) + 0.05);
  cut = min(cut, sdBox(q - vec3(kc.x, REC_B.y, kc.y), vec3(0.5 * (KEYS_R.y - KEYS_R.x), 0.07, 0.5 * (KEYS_R.w - KEYS_R.z) + 0.05), 0.004)); // the keys' slot, open at the front
  float d = max(body, -cut);
  if (d < r.x) r = vec2(d, 20.0);
  vec3 l = lidLocal(q);
  float lid = sdBox(l - vec3(lc.x, -0.5 * LID_T, lh.y), vec3(lh.x - 0.006, 0.5 * LID_T, lh.y - 0.006), 0.01);
  lid = max(lid, -sdBox(l - vec3(0.5 * (WIN_R.x + WIN_R.y), 0.0, 0.5 * (WIN_R.z + WIN_R.w)), vec3(0.5 * (WIN_R.y - WIN_R.x), 0.1, 0.5 * (WIN_R.w - WIN_R.z)), 0.02));
  if (lid < r.x) r = vec2(lid, 22.0);
  // The keys: the one the point is over and its neighbours (a key down beside one up).
  float ki = floor((q.x - KEYS_R.x) / KEY_W);
  for (float i = ki - 1.0; i <= ki + 1.0; i++) {
    if (i < 0.0 || i > 5.0) continue;
    float y = REC_B.y + 0.026 - 0.032 * keyDown(i) - 0.045;
    float k = sdBox(q - vec3(KEYS_R.x + (i + 0.5) * KEY_W, y, 0.5 * (KEYS_R.z + KEYS_R.w)), vec3(0.5 * KEY_W - 0.007, 0.045, 0.5 * (KEYS_R.w - KEYS_R.z)), 0.008);
    if (k < r.x) r = vec2(k, 21.0);
  }
  return r;
}

/** A texel of the print (uv in the region's 0..1), its detail level from a pixel's width \`fp\` and the texels per unit. */
vec4 recPrint(vec2 uv, float fp, float texels) { return textureLod(uRecPrint, uv, log2(max(fp * texels, 1.0))); }

/** What the part hit is made of, seen along \`rd\`. */
void recMaterial(vec3 p, vec3 n, vec3 rd, float id, float fp, float st, inout vec3 alb, inout float gloss, inout float bump) {
  vec3 q = recLocal(p);
  vec3 ln = recDir(n);
  vec2 topUv = vec2((q.x + REC_B.x) / (2.0 * REC_B.x), (q.z + REC_B.z) / (2.0 * REC_B.z) * PRINT_TOP_V);
  alb = vec3(0.045, 0.043, 0.042) * (0.95 + 0.1 * st); // black textured plastic
  gloss = 0.12;
  bump = 0.12;
  if (id >= 24.0) {
    vec3 c = id == 24.0 ? casLocal(p, uCasA, uCasTilt.x) : casLocal(p, uCasB, uCasTilt.y);
    alb = vec3(0.075, 0.073, 0.07) * (0.95 + 0.1 * st); // the shell, smoky black
    gloss = 0.25;
    if (c.y < CAS_B.y - 0.004) return;
    bump = 0.0;
    vec2 uv = c.xz / (2.0 * CAS_B.xz) + 0.5;
    vec4 lab = recPrint(vec2((uv.x + (id == 24.0 ? 0.0 : 1.0)) * 0.5, mix(PRINT_LABEL_V0, PRINT_LABEL_V1, uv.y)), fp, LABEL_TEXELS);
    if (lab.a > 0.5) {
      alb = lab.rgb * 0.8;
      gloss = 0.03;
      return;
    }
    // Through the window in the label: the tape wound on each hub, the hubs' teeth turning, the clear plastic over them.
    if (abs(c.x) > 0.25 || abs(c.z - HUB_P.y) > 0.12) return;
    float side = sign(c.x);
    vec2 h = vec2(c.x - side * HUB_P.x, c.z - HUB_P.y);
    float rr = length(h);
    float pack = mix(PACK.x, PACK.y, side > 0.0 ? uReel.y : 1.0 - uReel.y);
    alb = vec3(0.02);
    gloss = 0.6;
    if (rr < pack) alb = vec3(0.16, 0.085, 0.045) * (0.9 + 0.1 * sin(rr * 900.0)); // brown oxide, its turns catching the light
    if (rr < HUB_P.z) alb = vec3(0.78, 0.77, 0.73);                                // the white hub
    float a = atan(h.y, h.x) - uReel.x;
    if (rr < HUB_P.z - 0.017 && (rr < HUB_P.z - 0.03 || fract(a * 0.9549) > 0.22)) alb = vec3(0.01); // its hole, six teeth in it
    return;
  }
  if (id == 21.0) {
    float i = floor((q.x - KEYS_R.x) / KEY_W);
    alb = i == 0.0 ? vec3(0.42, 0.05, 0.04) : vec3(0.075, 0.073, 0.07); // RECORD red
    gloss = 0.22;
    bump = 0.05;
    if (ln.y > 0.9) {
      vec4 ink = recPrint(topUv, fp, TOP_TEXELS);
      alb = mix(alb, ink.rgb, ink.a);
    }
    return;
  }
  if (id == 22.0) {
    gloss = 0.4;
    bump = 0.04;
    return;
  }
  // The body: its top is brushed aluminium inside a black rim, the grille punched through it; dark down in the well.
  bool top = ln.y > 0.9 && q.y > REC_B.y - 0.004 && abs(q.x) < REC_B.x - 0.035 && abs(q.z) < REC_B.z - 0.035;
  if (top) {
    // A pixel's footprint on the top, x and z apart: seen at a slant it stretches along the view, up to 1 / cos.
    vec3 d = recDir(rd);
    vec2 slant = normalize(d.xz + 1e-5) * (1.0 / max(abs(d.y), 0.08) - 1.0);
    vec2 fw = fp * (1.0 + abs(slant));
    // The brushing's finest grain fades to its mean once a pixel spans it, or it beats into stripes.
    float fine = 0.5 + (noise(vec2(q.x * 1.3, q.z * 2300.0)) - 0.5) * (1.0 - smoothstep(0.3, 1.0, fw.y * 2300.0));
    float brush = noise(vec2(q.x * 4.0, q.z * 700.0)) * 0.6 + fine * 0.4;
    alb = vec3(0.56, 0.565, 0.57) * (0.88 + 0.16 * brush);
    gloss = 0.3;
    bump = 0.0;
    if (inRect(q.xz, GRILLE_R)) {
      // Staggered holes, 0.032 apart, 0.009 across. Once a pixel spans a good part of the pitch they fade to the
      // share of the plate they open (pi r^2 / pitch^2), so the rows never beat against the pixels in a moiré.
      vec2 g = q.xz / 0.032;
      g.x += 0.5 * mod(floor(g.y), 2.0);
      float hole = length(fract(g) - 0.5) * 0.032;
      float w = max(fw.x, fw.y);
      float metal = smoothstep(0.009 - 0.5 * w, 0.009 + 0.5 * w, hole);
      metal = mix(metal, 1.0 - 0.2485, smoothstep(0.2, 0.5, w / 0.032));
      alb = mix(vec3(0.02), alb, metal);
    }
    vec4 ink = recPrint(topUv, fp, TOP_TEXELS);
    alb = mix(alb, ink.rgb, ink.a);
    float led = length(q.xz - LED_P.xy);
    if (led < LED_P.z) {
      alb = vec3(0.25, 0.03, 0.02);
      gloss = 0.7;
      recEmit = vec3(1.0, 0.12, 0.04) * uRecKeys.w * smoothstep(LED_P.z, 0.0, led);
    }
  } else if (q.y < REC_B.y - 0.02 && inRect(q.xz, LID_R)) {
    alb = vec3(0.03);
    // The heads and the capstan at the front of the well, where the cassette's tape edge sits.
    if (q.z > LID_R.w - WELL_IN - 0.08 && abs(q.x - 0.5 * (LID_R.x + LID_R.y)) < 0.12) alb = vec3(0.3, 0.3, 0.31), gloss = 0.5, bump = 0.0;
  } else if (ln.x > 0.9) {
    for (int j = 0; j < ${JACKS.length}; j++) {
      vec3 jk = JACK[j];
      if (length(q.zy - jk.xy) < jk.z * 1.6) alb = length(q.zy - jk.xy) < jk.z ? vec3(0.005) : vec3(0.25), gloss = 0.4; // the hole, its nickel ring
    }
  }
}

/**
 * The smoked window in the door, over what the ray hit \`t\` along it beneath (model frame): darker, a faint
 * reflection of the room and the lamp. Not there, \`col\` comes back as it was.
 */
vec3 recGlass(vec3 ro, vec3 rd, float t, vec3 col) {
  vec3 o = lidLocal(recLocal(ro)), d = recDir(rd);
  float c = cos(uLid), s = sin(uLid);
  d = vec3(d.x, d.y * c - d.z * s, d.y * s + d.z * c);
  float tg = (-0.5 * LID_T - o.y) / d.y;
  if (tg <= 0.0 || tg > t) return col;
  vec3 g = o + d * tg;
  if (sdRect(g.xz, WIN_R) > -0.004) return col;
  vec3 nw = vec3(-s * REC_YAW.y, c, -s * REC_YAW.x);
  float fres = 0.04 + 0.6 * pow(1.0 - abs(d.y), 5.0);
  float spec = pow(max(dot(reflect(rd, nw), LIGHT), 0.0), 80.0);
  return col * vec3(0.5, 0.47, 0.43) + fres * vec3(0.1, 0.095, 0.09) + spec * vec3(0.5, 0.48, 0.44);
}

/** How much the recorder and the cassettes lying on it darken the table at a point (model frame), their light from the upper left. */
float recShadow(vec2 xz) {
  vec3 q = recLocal(vec3(xz.x - 0.08, 0.0, xz.y + 0.06));
  vec2 b = abs(q.xz) - REC_B.xz + 0.04;
  float s = 0.6 * exp(-max(length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.04, 0.0) * 14.0);
  for (int i = 0; i < 2; i++) {
    vec4 c = i == 0 ? uCasA : uCasB;
    if (c.y > 0.2 + REC_B.y || c.y < 0.0) continue;
    // Lifted, its shadow falls further off and fainter.
    vec3 cq = casLocal(vec3(xz.x - 0.1 * c.y, 0.0, xz.y + 0.08 * c.y), vec4(c.x, 0.0, c.z, c.w), 0.0);
    vec2 cb = abs(cq.xz) - CAS_B.xz + 0.01;
    s = max(s, 0.55 * exp(-max(length(max(cb, 0.0)) + min(max(cb.x, cb.y), 0.0), 0.0) * (40.0 / (1.0 + 6.0 * c.y))) / (1.0 + 3.0 * c.y));
  }
  return s;
}
`;
