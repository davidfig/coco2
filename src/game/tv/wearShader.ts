/**
 * GLSL for the cabinet's years of use, spliced into `CABINET_GLSL` (it uses its hash, noise, fbm and LIGHT): the
 * lacquer rubbed through along the edges, scratches in the veneer, small dents.
 */
export const WEAR_GLSL = /* glsl */ `
/**
 * Years of use on the veneer: scratches that show the paler backing (straight, at a few favoured angles, broken along
 * their length, tapered at the ends) and small dents. Lines thinner than a pixel fade rather than vanish or shimmer.
 */
float scratches(vec2 p) {
  float s = 0.0;
  for (int k = 0; k < 4; k++) {
    float a = float(k) * 2.1 + 0.4;
    vec2 r = mat2(cos(a), sin(a), -sin(a), cos(a)) * p * 2.5 + float(k) * 7.3;
    vec2 cell = floor(r) + float(k) * 13.0;
    if (hash(cell) < 0.3) continue;
    vec2 f = fract(r) - 0.5 - (vec2(hash(cell + 5.7), hash(cell + 9.2)) - 0.5) * 0.3;
    float ang = (hash(cell + 3.1) - 0.5) * 1.2;
    vec2 dir = vec2(cos(ang), sin(ang));
    float along = dot(f, dir), across = abs(dot(f, vec2(-dir.y, dir.x)));
    float len = 0.12 + 0.22 * hash(cell + 1.9);
    float w = 0.004 + 0.008 * hash(cell + 2.3);
    float aa = fwidth(across) + 1e-5;
    float line = (1.0 - smoothstep(max(w, aa), max(w, aa) + aa, across)) * min(1.0, w / aa);
    line *= smoothstep(len, len * 0.5, abs(along));                       // tapered ends
    line *= smoothstep(0.25, 0.6, noise(vec2(along * 30.0, hash(cell) * 50.0))); // broken where it skipped
    s = max(s, line * (0.5 + 0.5 * hash(cell + 4.4)));
  }
  return s;
}

/** Small dents: 1 in the hollow, with a little light caught on the lip (negative). */
float dents(vec2 p) {
  vec2 cell = floor(p * 4.0);
  if (hash(cell + 21.0) < 0.8) return 0.0;
  vec2 c = (cell + 0.2 + 0.6 * vec2(hash(cell + 22.0), hash(cell + 23.0))) / 4.0;
  float r = 0.006 + 0.01 * hash(cell + 24.0);
  float d = length(p - c) / r;
  return smoothstep(1.0, 0.6, d) - 0.5 * smoothstep(0.9, 1.0, d) * smoothstep(1.3, 1.0, d) * step(0.0, dot(p - c, LIGHT));
}

/** The veneer \`col\` at p (cabD is the cabinet's SDF there) after years in a living room. */
vec3 wear(vec3 col, vec2 p, float cabD) {
  // The lacquer rubbed through along the outer edge (worst at the corners and the top), rub marks, scratches, dents.
  float corner = smoothstep(1.6, 2.06, abs(p.x)) * smoothstep(0.9, 1.42, abs(p.y));
  float worn = smoothstep(-0.05, 0.0, cabD) * (0.5 + corner + 0.5 * step(0.0, p.y)) * smoothstep(0.3, 0.7, fbm(p * 7.0));
  col = mix(col, vec3(dot(col, vec3(0.4))) * 1.25 + vec3(0.03, 0.02, 0.01), clamp(worn, 0.0, 1.0) * 0.7);
  // Dull rub marks where hands have lifted and shoved it, streaked along the grain.
  float rub = smoothstep(0.55, 0.8, fbm(p * vec2(2.0, 9.0) + 3.0));
  col = mix(col, col * 1.2 + 0.015, rub * 0.5);
  col = mix(col, vec3(0.40, 0.31, 0.22), 0.55 * scratches(p));
  float dent = dents(p);
  col *= 1.0 - 0.45 * max(dent, 0.0) + 0.6 * max(-dent, 0.0);
  return col;
}
`;
