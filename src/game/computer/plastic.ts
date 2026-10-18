/**
 * GLSL for the CoCo's moulded ABS: 3D value noise and the stipple of a textured mould, as a colour (`stipple`) and as
 * a bump on the surface's normal (`stippled`). `GRAIN` is the coarsest of its four octaves, per model unit (1 unit is
 * about 13.5 cm, so 380 is about 0.35 mm); each octave fades out as it gets finer than a pixel.
 */
export const PLASTIC_GLSL = /* glsl */ `
const float GRAIN = 380.0;

/** 3D value noise with a quintic fade (no grid creases where the cells meet). */
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1) * 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), u.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), u.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
/**
 * The moulded plastic's stipple (the fine "orange peel" of a textured mould), about 0..1, from features of about half a
 * millimetre up: each octave fades to its mean as it gets finer than \`fp\`, a pixel's width there, so it neither
 * blocks up close in nor shimmers far off.
 */
float stipple(vec3 p, float fp, float freq) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * mix(noise3(p * freq), 0.5, smoothstep(0.18, 0.55, freq * fp));
    freq *= 2.2;
    a *= 0.5;
  }
  return s / 0.9375;
}
/** \`n\` tilted by the stipple's slopes (bump), \`k\` how deep it is. */
vec3 stippled(vec3 p, vec3 n, float fp, float freq, float k) {
  if (freq * fp > 0.55) return n;
  vec2 e = vec2(0.35 / freq, 0.0);
  vec3 g = vec3(stipple(p + e.xyy, fp, freq) - stipple(p - e.xyy, fp, freq),
                stipple(p + e.yxy, fp, freq) - stipple(p - e.yxy, fp, freq),
                stipple(p + e.yyx, fp, freq) - stipple(p - e.yyx, fp, freq)) / (2.0 * e.x);
  return normalize(n - k / freq * (g - n * dot(g, n)));
}

`;
