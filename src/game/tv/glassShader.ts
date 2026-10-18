/**
 * GLSL for the tube's glass, spliced into `TV_FRAG` after `CABINET_GLSL` (it uses uLook, LIGHT and noise):
 * the room reflected in it, the glare, and the fingerprints on it.
 */
export const GLASS_GLSL = /* glsl */ `
/**
 * One fingerprint on the glass at c (tube coordinates), turned by \`ang\`, \`size\` its half-size (round units): ridges in
 * loose loops, pressed unevenly, with a ragged edge. Ridges too fine for the pixels blur into an even smear. 0..1.
 */
float fingerprint(vec2 q, vec2 c, float ang, vec2 size, float seed) {
  vec2 d = (q - c) * vec2(1.333, 1.0);
  d = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * d / size;
  float r = length(d + vec2(0.0, 0.25 * d.x * d.x));                       // loops, a little arched
  if (r > 1.4) return 0.0;
  float phase = (r + 0.12 * noise(d * 3.0 + seed)) * 60.0 + seed;
  float aa = fwidth(phase);
  float ridge = mix(0.5 + 0.5 * sin(phase), 0.5, clamp(aa / 3.0, 0.0, 1.0));
  float edge = smoothstep(1.0, 0.65, r + (noise(d * 4.0 + seed * 3.0) - 0.5) * 0.5);
  float press = 0.6 + 0.4 * noise(d * 1.7 + seed * 7.0);
  return edge * press * (0.4 + 0.6 * ridge);
}

/** Where people have touched the screen: pointing at a line of text, a thumb on the corner, a wiped smear. 0..1. */
float prints(vec2 q) {
  float f = 0.0;
  f = max(f, fingerprint(q, vec2(0.66, -0.62), 0.7, vec2(0.075, 0.1), 1.0));   // thumb, lower right
  f = max(f, fingerprint(q, vec2(0.30, -0.12), -0.3, vec2(0.05, 0.065), 4.0)); // pointing at the text
  f = max(f, 0.8 * fingerprint(q, vec2(0.38, -0.02), -0.2, vec2(0.045, 0.06), 7.0));
  f = max(f, 0.7 * fingerprint(q, vec2(-0.25, 0.3), 0.4, vec2(0.05, 0.065), 11.0));
  f = max(f, 0.6 * fingerprint(q, vec2(0.86, 0.42), 1.4, vec2(0.05, 0.07), 15.0)); // half off the edge
  // A smear where one was wiped with a sleeve: no ridges, streaked one way.
  vec2 s = (q - vec2(-0.5, -0.55)) * vec2(1.333, 1.0);
  s = mat2(0.9, 0.44, -0.44, 0.9) * s;
  f = max(f, 0.35 * smoothstep(1.0, 0.3, length(s / vec2(0.2, 0.06))) * (0.5 + 0.5 * noise(vec2(s.x * 6.0, s.y * 90.0))));
  return f;
}

/**
 * Dust on the glass at q, \`amount\` 0..1 (the grime map's G): specks of it, each catching the light. Where they're
 * too small for the pixels they fade into an even haze rather than shimmer. Coverage 0..1.
 */
float dust(vec2 q, float amount) {
  float density = 0.01 * amount; // share of cells holding a speck
  vec2 g = q * vec2(1.333, 1.0) * 140.0;
  vec2 cell = floor(g);
  float h = hash(cell + 31.7);
  float r = 0.12 + 0.22 * hash(cell + 8.8);
  vec2 o = (vec2(hash(cell + 2.3), hash(cell + 5.1)) - 0.5) * 0.5;
  float aa = fwidth(g.x);
  float speck = step(1.0 - density, h) * (1.0 - smoothstep(r - aa * 0.5, r + aa * 0.5, length(fract(g) - 0.5 - o)));
  return mix(speck, density * 0.3, clamp(aa - 0.8, 0.0, 1.0));
}

/**
 * Light reflected off the curved glass at q: the dim room, a desk lamp behind the viewer, the glare and the rim. \`film\`
 * is the fingerprints' grease and \`specks\` the dust, which show where there is light to catch; \`haze\` is how dusty
 * the glass is overall, a fine bloom on every reflection.
 */
vec3 glass(vec2 q, float tubeD, float film, float specks, float haze) {
  vec3 n = normalize(vec3(-q * 0.32, 1.0));
  float fres = 0.05 + 0.5 * pow(1.0 - n.z, 1.6) * 6.0;
  vec2 look = uLook * 0.07;
  vec3 col = vec3(0.022, 0.026, 0.028) * (1.2 - 0.5 * q.y) * (0.6 + fres);
  // A desk lamp behind the viewer, high on the left: a cone shade, lit faintly through, brightest at its open
  // rim, with the bulb's hot spot just under it.
  vec2 l = q - vec2(-0.55, 0.62) + look;
  l = mat2(0.99, 0.12, -0.12, 0.99) * l;
  float t = clamp(l.y / 0.13 * 0.5 + 0.5, 0.0, 1.0);
  float halfW = mix(0.17, 0.07, t);
  float shade = smoothstep(0.035, -0.02, abs(l.x) - halfW) * smoothstep(0.03, -0.02, abs(l.y) - 0.13);
  float lip = exp(-pow((l.y + 0.13) * 22.0, 2.0)) * smoothstep(0.04, -0.03, abs(l.x) - 0.16);
  col += vec3(0.07, 0.058, 0.04) * shade * (0.6 + 0.4 * (1.0 - t));
  col += vec3(0.12, 0.10, 0.07) * lip;
  // The bulb's hot spot and the long diagonal streak.
  col += vec3(0.44, 0.42, 0.38) * pow(max(0.0, 1.0 - length((l - vec2(0.0, -0.15) + look * 0.4) * vec2(4.0, 6.5))), 1.8);
  col += vec3(0.09) * exp(-pow((q.x * 0.55 + q.y - 0.55 + look.x) * 5.0, 2.0)) * smoothstep(1.0, -0.3, q.x);
  // Where the glass curves into the bezel it bulges toward the lamp along the top and left, and catches it there.
  float rim = smoothstep(-0.07, -0.012, tubeD) * smoothstep(0.0, -0.012, tubeD);
  col += vec3(0.22, 0.21, 0.19) * rim * max(0.0, dot(normalize(q + 1e-4), LIGHT));
  return col * (1.0 + 0.25 * haze) + film * (vec3(0.018) + 1.4 * col) + specks * (vec3(0.05) + 2.0 * col);
}
`;
