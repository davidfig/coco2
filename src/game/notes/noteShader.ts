/**
 * The sheet on screen (a rotated rectangle, or a quad in perspective lying on the table), lit a little by the picture behind it. Its shadow isn't here: it falls mostly on room light, so the TV's shader draws it (see `Notebook.shade`).
 */
export const NOTE_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform mat3 uToSheet;  // pixel (x, y, 1) to the sheet's own frame, -1..1 after the divide (onDesk.ts's toSheet)
uniform vec2 uHalf;     // half size in pixels (about, in perspective)
uniform float uLight;   // the room's light on the paper (1 held out; less lying on the dim table)
uniform float uOpen;    // 0 peeking, 1 held up to read
uniform float uLift;    // 0..1: raised a little (pointer near, or a new note)
uniform vec3 uGlow;     // the lit screen's average colour
uniform vec4 uPicture;  // where the lit picture is, in pixels: centre x, y, half w, h
uniform sampler2D uTex;
uniform mat3 uUnder[4];   // the sheets behind this one (as uToSheet), which the screen's light passes through first
uniform vec2 uUnderHalf[4];
uniform int uUnderN;
out vec4 outColor;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/** A pixel in a sheet's frame, scaled to its half size: about pixels from its centre. */
vec2 onSheet(mat3 m, vec2 half_, vec2 g) {
  vec3 h = m * vec3(g, 1.0);
  // Behind the eye (past the horizon of a sheet on the table): nowhere on the sheet.
  if (h.z <= 0.0) return vec2(1e4);
  return h.xy / h.z * half_;
}

void main() {
  vec2 l = onSheet(uToSheet, uHalf, gl_FragCoord.xy);
  // Its edge measured in pixels: in perspective a sheet unit isn't one.
  float sd = sdBox(l, uHalf);
  float fw = fwidth(sd);
  // Far off the sheet stays off: at the horizon the mapping jumps between neighbouring pixels, and so would fwidth.
  sd = sd > max(uHalf.x, uHalf.y) ? 1e4 : sd / max(fw, 1e-4);
  if (sd > 1.0) discard;
  float inside = clamp(0.5 - sd, 0.0, 1.0);
  vec2 uv = vec2(l.x / uHalf.x * 0.5 + 0.5, 0.5 - l.y / uHalf.y * 0.5);
  vec4 tex = texture(uTex, clamp(uv, 0.0, 1.0));
  vec3 paper = tex.rgb;
  paper *= 0.93 + 0.07 * smoothstep(-1.0, 1.0, l.y / uHalf.y);
  paper *= 0.9 + 0.1 * smoothstep(0.0, 6.0, -sd);
  // The screen behind lights the paper: part of its light becomes the screen's hue (the paper is near white, so adding
  // light would only clip). The tint is laid in window pixels, not on the sheet, so it stays on the picture behind as
  // the sheet moves and grows, with only a short soft edge. Held up to read it is nearer you than the set, so it catches less.
  float soft = 0.04 * uPicture.w;
  float over = smoothstep(soft, -soft, sdBox(gl_FragCoord.xy - uPicture.xy, uPicture.zw));
  // Each sheet behind this point has already taken some of that light: the more paper it went through, the less is left.
  float through = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i >= uUnderN) break;
    through += clamp(0.5 - sdBox(onSheet(uUnder[i], uUnderHalf[i], gl_FragCoord.xy), uUnderHalf[i]), 0.0, 1.0);
  }
  float peak = max(max(uGlow.r, uGlow.g), uGlow.b) * over * pow(0.5, through);
  vec3 hue = uGlow / max(peak, 1e-3);
  paper *= mix(vec3(1.0), hue * 1.08, peak * 0.18 * (1.0 - 0.5 * uOpen));
  paper *= uLight;
  float cov = inside * tex.a;
  outColor = vec4(paper * cov, cov);
}`;
