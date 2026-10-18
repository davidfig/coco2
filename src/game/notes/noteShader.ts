/**
 * The sheet as a rotated rectangle on screen, lit a little by the picture behind it, and (when open) the room dimmed
 * behind it. Its shadow isn't here: it falls mostly on room light, so the TV's shader draws it (see `Notebook.shade`).
 */
export const NOTE_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uCenter;   // sheet centre in pixels
uniform vec2 uHalf;     // half size in pixels
uniform float uRot;
uniform float uOpen;    // 0 peeking, 1 held up to read
uniform float uLift;    // 0..1: raised a little (pointer near, or a new note)
uniform vec3 uGlow;     // the lit screen's average colour
uniform vec4 uPicture;  // where the lit picture is, in pixels: centre x, y, half w, h
uniform sampler2D uTex;
uniform vec4 uUnder[4];   // the sheets behind this one (centre, half size), which the screen's light passes through first
uniform float uUnderRot[4];
uniform int uUnderN;
uniform float uDim;     // how much to dim the room behind (given to the first sheet drawn only)
out vec4 outColor;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 d = gl_FragCoord.xy - uCenter;
  float c = cos(uRot), s = sin(uRot);
  vec2 l = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  float sd = sdBox(l, uHalf);
  float inside = clamp(0.5 - sd, 0.0, 1.0);
  float dim = uDim;
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
    vec2 e = gl_FragCoord.xy - uUnder[i].xy;
    float ci = cos(uUnderRot[i]), si = sin(uUnderRot[i]);
    through += clamp(0.5 - sdBox(vec2(ci * e.x + si * e.y, -si * e.x + ci * e.y), uUnder[i].zw), 0.0, 1.0);
  }
  float peak = max(max(uGlow.r, uGlow.g), uGlow.b) * over * pow(0.5, through);
  vec3 hue = uGlow / max(peak, 1e-3);
  paper *= mix(vec3(1.0), hue * 1.08, peak * 0.18 * (1.0 - 0.5 * uOpen));
  float cov = inside * tex.a;
  outColor = vec4(paper * cov, cov + (1.0 - cov) * dim * (1.0 - 0.8 * tex.a * inside));
}`;
