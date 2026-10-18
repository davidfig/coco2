import { CONTROLS_GLSL } from './controlsShader';
import { WEAR_GLSL } from './wearShader';

/**
 * GLSL for everything around the picture tube: the room, the wood-grain cabinet, the charcoal front panel, the tube's
 * recess, the controls (drawn by `controlsShader.ts`, worked by `knobs.ts` and `touch.ts`) and the speaker grille.
 * Units: the tube is 2 tall.
 */
/** The cabinet's half-size and corner radius. */
export const CAB = [2.06, 1.42] as const;
export const CAB_R = 0.2;
/** The tube's half-size (4:3), in the shader's units, and its corner radius. */
export const TUBE = [1.333, 1.0] as const;
/** The tube's centre on the panel. */
export const TUBE_C = [-0.37, 0.0] as const;
export const TUBE_R = 0.17;
/** The control column's centre x. */
const CTRL_X = 1.5;
/** The two knobs: centre and radius, in the shader's units. */
export const CHANNEL_KNOB = { x: CTRL_X, y: 0.85, r: 0.2 } as const;
export const VOLUME_KNOB = { x: CTRL_X, y: 0.2, r: 0.16 } as const;
/** The fine-tuning ring behind the channel selector: it shows round it out to this share of its radius, turns between the stops. */
export const FINE_RING = 1.2;
export const FINE_MIN = -2.6;
export const FINE_MAX = 2.6;
/**
 * The power rocker under the grille, ON / OFF printed to its right, the pair set toward the tube so the open magazine's
 * edge doesn't cover the words: centre and half-size.
 * No pilot lamp: a set like this had none, the glowing tube said it was on.
 */
export const POWER_SWITCH = { x: CTRL_X - 0.22, y: -1.07, hw: 0.045, hh: 0.1 } as const;
/** The vertical hold: a small knob above the rocker, V-HOLD beside it, turning between the stops. */
export const VHOLD_KNOB = { x: POWER_SWITCH.x, y: -0.83, r: 0.06 } as const;
export const HOLD_MIN = -2.4;
export const HOLD_MAX = 2.4;
/** The channel selector clicks through VHF 2–13, `CH_STEP` radians apart, channel 2 at `CH_START` (clockwise from up). */
export const CH_FIRST = 2;
export const CH_LAST = 13;
export const CH_START = -1.4;
export const CH_STEP = 0.45;
/** The volume knob turns freely between these stops. */
export const VOL_MIN = -2.4;
export const VOL_MAX = 2.4;

/** One channel label's cell in `dialLabels.ts`'s strip, in pixels, and how tall it is on the panel (the figures fill about half). */
export const LABEL_W = 64;
/** The strip's cells: one per channel, ON and OFF for the power rocker, then V-HOLD across two. */
export const LABEL_CELLS = CH_LAST - CH_FIRST + 1 + 4;
export const LABEL_H = 48;
const DIAL_CELL_H = 0.105;

const f = (n: number): string => n.toFixed(4);

export const CABINET_GLSL = /* glsl */ `
const vec2 CAB = vec2(${CAB[0]}, ${CAB[1]});      // cabinet half-size
const vec2 PANEL = vec2(1.93, 1.29);    // front panel half-size (inside the wood rim)
const vec2 TUBE_C = vec2(${f(TUBE_C[0])}, ${f(TUBE_C[1])}); // tube centre
const vec2 TUBE = vec2(${TUBE[0]}, ${TUBE[1]}); // tube half-size (4:3)
const float TUBE_R = ${TUBE_R};              // tube corner radius
const float CTRL_X = ${f(CTRL_X)};          // the control column's centre
const vec3 CH_KNOB = vec3(${f(CHANNEL_KNOB.x)}, ${f(CHANNEL_KNOB.y)}, ${f(CHANNEL_KNOB.r)}); // centre, radius
const vec3 VOL_KNOB = vec3(${f(VOLUME_KNOB.x)}, ${f(VOLUME_KNOB.y)}, ${f(VOLUME_KNOB.r)});
const float CH_START = ${f(CH_START)}, CH_STEP = ${f(CH_STEP)}, CH_COUNT = ${f(CH_LAST - CH_FIRST + 1)};
const float VOL_MIN = ${f(VOL_MIN)}, VOL_MAX = ${f(VOL_MAX)};
const float FINE_RING = ${f(FINE_RING)};
const vec3 VHOLD = vec3(${f(VHOLD_KNOB.x)}, ${f(VHOLD_KNOB.y)}, ${f(VHOLD_KNOB.r)}); // centre, radius
const vec4 POWER_SW = vec4(${f(POWER_SWITCH.x)}, ${f(POWER_SWITCH.y)}, ${f(POWER_SWITCH.hw)}, ${f(POWER_SWITCH.hh)}); // centre, half-size
const float LABEL_CELLS = ${f(LABEL_CELLS)};       // cells in the uDial strip: the channels, ON, OFF, V-HOLD (two)
const vec2 DIAL_CELL = vec2(${f(DIAL_CELL_H * (LABEL_W / LABEL_H))}, ${f(DIAL_CELL_H)}); // one channel label's cell, in panel units
const vec2 LIGHT = vec2(-0.55, 0.83);   // where the room light comes from (in the plane): the desk lamp the glass reflects

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
/** The outward direction of a rounded box's edge at p (its SDF gradient). */
vec2 boxNormal(vec2 p, vec2 b, float r) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec2(sdBox(p + e.xy, b, r) - sdBox(p - e.xy, b, r), sdBox(p + e.yx, b, r) - sdBox(p - e.yx, b, r)) + 1e-6);
}

/** Walnut vinyl veneer: long horizontal grain with the odd knot. */
vec3 wood(vec2 p) {
  float warp = fbm(p * vec2(0.8, 3.0)) * 2.0;
  float grain = fbm(vec2(p.x * 1.2, p.y * 26.0 + warp * 3.0));
  float rings = 0.5 + 0.5 * sin(p.y * 34.0 + warp * 5.0 + sin(p.x * 1.7) * 1.5);
  float fine = noise(vec2(p.x * 3.0, p.y * 260.0));
  vec3 dark = vec3(0.13, 0.065, 0.03), light = vec3(0.36, 0.19, 0.09);
  return mix(dark, light, rings * 0.45 + grain * 0.45 + fine * 0.1);
}

${WEAR_GLSL}
/** The dark wall and the top of the table the TV stands on, lit a little by the screen; brighter toward the lamp. */
vec3 room(vec2 p, float cabD, vec3 spill) {
  vec3 wall = mix(vec3(0.035, 0.03, 0.028), vec3(0.075, 0.062, 0.05), smoothstep(-2.5, 1.5, dot(p, LIGHT)));
  wall *= 0.75 + 0.25 * fbm(p * 3.0);
  float tableY = -CAB.y - 0.02;
  if (p.y < tableY) {
    float t = clamp((tableY - p.y) * 1.2, 0.0, 1.0);
    vec3 top = wood(vec2(p.x * 0.5, (tableY - p.y) * 4.0 / (0.3 + (tableY - p.y)))) * 0.7;
    wall = mix(top, top * 0.35, t);
    wall *= 1.0 - 0.75 * exp(-(tableY - p.y) * 9.0) * smoothstep(CAB.x + 0.3, CAB.x - 0.2, abs(p.x)); // contact shadow
  }
  float shadow = exp(-max(sdBox(p - vec2(0.12, -0.14), CAB, 0.2), 0.0) * 4.5);
  wall *= 1.0 - 0.7 * shadow;
  return wall + spill * exp(-max(cabD, 0.0) * 1.6);
}

${CONTROLS_GLSL}
/**
 * The front panel and everything on it except the tube's glass; \`knobs\` is the channel and volume knobs' turns, \`more\`
 * the fine-tuning ring's and the vertical hold's, \`rock\` which way the power rocker is tipped.
 */
vec3 panel(vec2 p, vec2 knobs, vec2 more, float rock) {
  vec3 col = vec3(0.052, 0.05, 0.05) * (0.9 + 0.2 * noise(p * 400.0)); // fine plastic texture
  col *= 0.85 + 0.25 * smoothstep(-1.3, 1.3, p.y);
  // The recess the tube sits in: darker toward the glass, its far edge catching the light.
  vec2 tp = p - TUBE_C;
  float rec = sdBox(tp, TUBE + 0.085, TUBE_R + 0.08);
  if (rec < 0.0) {
    float depth = smoothstep(0.0, -0.085, rec);
    vec2 n = boxNormal(tp, TUBE + 0.085, TUBE_R + 0.08);
    col = mix(col, vec3(0.018), depth * 0.8);
    col += 0.06 * max(0.0, dot(n, -LIGHT)) * (1.0 - depth);
  } else {
    col += 0.05 * max(0.0, dot(boxNormal(tp, TUBE + 0.085, TUBE_R + 0.08), LIGHT)) * smoothstep(0.02, 0.0, rec);
  }
  // Speaker grille: slots with rounded ends.
  vec2 g = p - vec2(CTRL_X, -0.47);
  if (abs(g.x) < 0.27 && abs(g.y) < 0.24) {
    float row = fract(g.y * 13.0) - 0.5;
    float slot = sdBox(vec2(g.x, row / 13.0), vec2(0.24, 0.016), 0.016);
    col = mix(col, vec3(0.006), smoothstep(0.003, -0.002, slot));
    col += 0.03 * smoothstep(0.0, 0.004, slot) * smoothstep(0.009, 0.004, slot) * step(row, 0.0);
  }
  // The knobs, with their printed scales: channel (it starts on 3, where a CoCo lives), volume, vertical hold.
  float print = max(max(channelTicks(p), channelNumbers(p)), max(max(volumeWedge(p), powerLabels(p)), holdLabel(p)));
  col = mix(col, mix(vec3(0.56, 0.54, 0.47), vec3(0.5, 0.47, 0.38), noise(p * 12.0)), 0.9 * silkscreen(p, print)); // yellowed
  vec4 k = fineRing(p, more.x);
  col = k.a > 0.99 ? k.rgb : col * (1.0 - k.a);
  k = knob(p, CH_KNOB.xy, CH_KNOB.z, knobs.x);
  col = k.a > 0.99 ? k.rgb : col * (1.0 - k.a);
  k = knob(p, VOL_KNOB.xy, VOL_KNOB.z, knobs.y);
  col = k.a > 0.99 ? k.rgb : col * (1.0 - k.a);
  k = knob(p, VHOLD.xy, VHOLD.z, more.y);
  col = k.a > 0.99 ? k.rgb : col * (1.0 - k.a);
  vec4 b = rocker(p, rock);
  col = b.a > 0.99 ? b.rgb : col * (1.0 - b.a);
  return col;
}

/** The cabinet at p, given its SDF value: wood rim with a bevelled, lacquered edge around the panel. */
vec3 cabinet(vec2 p, float cabD, vec2 knobs, vec2 more, float rock) {
  float panelD = sdBox(p, PANEL, 0.11);
  if (panelD < 0.0) {
    vec3 col = panel(p, knobs, more, rock);
    col *= 1.0 - 0.5 * smoothstep(-0.04, 0.0, panelD) * max(0.0, dot(boxNormal(p, PANEL, 0.11), LIGHT)); // inset shadow
    return col;
  }
  vec3 col = wear(wood(p), p, cabD);
  vec2 n = boxNormal(p, CAB, 0.2);
  float edge = smoothstep(-0.07, 0.0, cabD);
  float inner = smoothstep(0.035, 0.0, panelD);
  col *= 1.0 + 0.55 * edge * dot(n, LIGHT) - 0.35 * inner * dot(boxNormal(p, PANEL, 0.11), LIGHT);
  col *= 0.8 + 0.3 * smoothstep(-1.4, 1.4, p.y);
  float sheen = exp(-pow((p.y - 1.30) * 9.0, 2.0)) * 0.10 + exp(-pow((p.x + p.y * 0.4 + 1.2) * 3.0, 2.0)) * 0.03;
  return col + sheen;
}
`;
