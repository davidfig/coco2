import { CABINET_GLSL } from './cabinetShader';
import { GLASS_GLSL } from './glassShader';
import { ACTIVE, PICTURE_GLSL } from './pictureShader';

export { ACTIVE };

/**
 * How a cell changed behind BASIC's back (`TextScreen.tamper`) shows in the tube: `ghost` lets the old character fade
 * out under the new one (the subtle one), `scan` has the beam repaint it from the top (louder, for later), `both` is
 * the two at once. The index is the shader's `uTamperStyle`.
 */
export const TAMPER_STYLES = ['ghost', 'scan', 'both'] as const;
export type TamperStyle = (typeof TAMPER_STYLES)[number];

/**
 * The whole picture in one pass: room → cabinet → tube. On the tube the VDG image goes through a CRT: barrel curve,
 * 192 beam-shaped scanlines, slot mask, glow and halation, warm-up, then the curved glass on top (room reflection, a
 * desk lamp, the glare and the rim highlight).
 */
export const TV_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uPower;     // seconds since the set was switched on (negative: off)
uniform float uOff;       // seconds since it was switched off (negative: it hasn't been)
uniform float uRock;      // which way the power rocker is tipped (-1 OFF .. 1 ON)
uniform vec2 uLook;       // where the viewer's pointer is, -1..1: nudges the reflections
uniform vec3 uBorder;     // the VDG border colour
uniform vec4 uTvRect;     // where the TV may sit in the window, in pixels: x, y, w, h (it shrinks when the magazine opens)
uniform float uFrame;     // how much border shows round the picture, in tube half-heights (bigger pulls back to show the set)
uniform sampler2D uScreen; // 256×192 VDG image
uniform sampler2D uDial;  // the channel numbers (dialLabels.ts)
uniform vec4 uShade;      // the notebook page, in pixels: centre x, y, half w, h
uniform vec4 uShadeArc;   // its rotation, where its shadow falls (local x, y offset) and how soft it is
uniform float uShadeK;    // how much room light the page keeps off (0: no page)
uniform vec2 uKnobs;      // the channel and volume knobs' turns (radians clockwise from up)
uniform float uSignal;    // how much of the CoCo the tuner picks up (1 on channel 3, a little on 4, 0 elsewhere)
uniform float uChannel;   // the channel the selector is on: each dead one has its own static
uniform float uChange;    // seconds since the selector clicked to another channel (the picture's jolt)
uniform vec2 uMore;       // the fine-tuning ring's and the vertical hold's turns
uniform float uDetune;    // how far off the fine-tuning is (0 sharp .. 1 lost)
uniform float uFringe;    // how much the colour smears over RF (there's always some)
uniform float uRoll;      // how far the raster has rolled, 0..1 of a frame (a slipped vertical hold)
uniform float uSmack;     // seconds since the cabinet was smacked
uniform sampler2D uStation; // 256×192: a far station's picture (Tv.broadcast)
uniform float uStationSignal; // how much of it comes through
uniform sampler2D uGrime; // R: fingerprints left, G: dust (grime.ts)
uniform sampler2D uGhost;  // 256×192: what the tampered cells showed before
uniform sampler2D uTamper; // 32×16 R32F: when each cell was tampered with, in uTamperNow's seconds
uniform float uTamperNow;
uniform int uTamperStyle;  // TAMPER_STYLES
uniform float uTamperK;    // how strong the disturbance is (0: none; the story turns it up)
out vec4 outColor;

${CABINET_GLSL}
${GLASS_GLSL}

${PICTURE_GLSL}

/**
 * The notebook page's shadow at this pixel. It keeps off light from the room, so main() uses it in full on reflected
 * light (the cabinet, the room, the glass) and only a little on the phosphor, so that it still reads on a lit picture.
 */
float paperShadow(vec2 frag) {
  if (uShadeK <= 0.0) return 0.0;
  vec2 d = frag - uShade.xy;
  float c = cos(uShadeArc.x), s = sin(uShadeArc.x);
  vec2 l = vec2(c * d.x + s * d.y, -s * d.x + c * d.y) - uShadeArc.yz;
  vec2 e = abs(l) - uShade.zw;
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
  return uShadeK * exp(-max(sd, 0.0) / uShadeArc.w);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float lit = 1.0 - paperShadow(frag);
  float aspect = uTvRect.z / uTvRect.w;
  // Close in on the picture: it fills its rectangle with a strip of black border, the set off-frame.
  vec2 pic = TUBE * ACTIVE;
  float s = max(pic.y + uFrame, (pic.x + uFrame) / aspect);
  vec2 p = (frag - (uTvRect.xy + 0.5 * uTvRect.zw)) / (0.5 * uTvRect.w) * s + TUBE_C;
  float px = abs(dFdy(p.y)); // tube units per pixel (here, while every pixel still runs together)
  linesPerPx = px / (2.0 * TUBE.y * ACTIVE.y) * LINES;
  dotsPerPx = px / (2.0 * TUBE.x * ACTIVE.x) * 256.0;
  p -= vec2(sin(uSmack * 55.0), cos(uSmack * 47.0)) * 0.012 * exp(-uSmack * 9.0); // a smack shakes the set

  float on = uPower < 0.0 ? 0.0 : uPower;
  float power = uPower < 0.0 ? 0.0 : 1.0;
  float cabD = sdBox(p, CAB, 0.2);
  vec3 spill = vec3(0.10, 0.45, 0.12) * 0.06 * smoothstep(0.3, 1.5, on);
  vec3 col;
  if (cabD > 0.0) {
    col = room(p, cabD, spill) * lit;
  } else {
    vec2 tp = p - TUBE_C;
    float tubeD = sdBox(tp, TUBE, TUBE_R);
    if (tubeD < 0.0) {
      vec2 q = tp / TUBE;
      vec3 phos = power > 0.0 ? picture(q, on, -1.0) : uOff >= 0.0 && uOff < 1.5 ? picture(q, 10.0, uOff) : vec3(0.0);
      // Switched off, the phosphor glows on faintly with the last picture for a few seconds (the green longest).
      vec2 auv = vec2(q.x, -q.y) / ACTIVE * 0.5 + 0.5;
      if (power == 0.0 && uOff >= 0.0 && auv == clamp(auv, 0.0, 1.0))
        phos += textureLod(uScreen, auv, 2.0).rgb * vec3(0.5, 1.0, 0.55) * 0.06 * exp(-uOff / 1.4) * uSignal;
      phos *= mix(0.55, 1.0, smoothstep(0.0, -0.3, tubeD)) * (1.0 - 0.12 * dot(q, q)); // dimmer toward the edges
      vec2 grime = texture(uGrime, q * 0.5 + 0.5).rg;
      float film = prints(q) * grime.r;
      float specks = dust(q, grime.g);
      vec3 refl = glass(q, tubeD, film, specks, grime.g);
      phos *= 1.0 - 0.5 * specks;                                                // dust shades the picture behind it
      phos *= 1.0 - 0.3 * film;                                                  // the grease dims it
      phos += film * 0.3 * vec3(dot(phos, vec3(0.3, 0.6, 0.1)));                // and scatters a milky haze
      // Not strictly physical: the page takes a little off the phosphor too, or its shadow wouldn't read on a lit picture.
      col = (vec3(0.03, 0.034, 0.032) + refl * (1.0 - 0.35 * clamp(phos, 0.0, 1.0))) * lit + phos * (1.0 - 0.2 * (1.0 - lit));
      col *= smoothstep(0.0, -0.012, tubeD) * 0.6 + 0.4; // the glass meets the bezel in shadow
    } else {
      col = cabinet(p, cabD, uKnobs, uMore, uRock);
      col += spill * 0.4 * exp(-max(tubeD, 0.0) * 8.0);
      col *= lit;
    }
    col = mix(col, room(p, cabD, spill) * lit, smoothstep(-0.006, 0.0, cabD)); // soft silhouette
  }
  col *= 1.0 - 0.35 * pow(length((frag / uRes - 0.5) * vec2(1.0, 0.8)), 2.2); // a little lens vignette
  outColor = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
}`;
