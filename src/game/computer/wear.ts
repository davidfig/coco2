/**
 * GLSL for the years on the CoCo: the case yellowed unevenly by light (most where it faces up), dirt settled in the
 * crevices, a greasy patch where wrists rest, scuffs and fine scratches; the keys yellowed key by key, their tops
 * polished by fingers and their legends rubbed thin, worst on the busiest keys. Needs PLASTIC_GLSL's noise3 and hash3.
 * Model units throughout (1 unit is about 13.5 cm); `fp` is a pixel's width on the surface, so fine marks fade out
 * instead of shimmering.
 */
export const WEAR_GLSL = /* glsl */ `
/** Fine scratches, 0..1: sparse straight lines a few hundredths of a millimetre wide, in three directions, broken along
 * their length. Each is drawn as the share of the pixel it covers. */
float scratches(vec3 p, float fp) {
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    float a = float(i) * 2.1 + 0.4;
    vec2 d = vec2(cos(a), sin(a));
    vec2 uv = vec2(dot(p.xz, d), dot(p.xz, vec2(-d.y, d.x)) + p.y * 0.7);
    float cell = floor(uv.y * 250.0);
    float w = abs(fract(uv.y * 250.0) - 0.5);
    float on = step(0.96, hash3(vec3(cell, float(i), 1.0)));
    float seg = smoothstep(0.55, 0.75, noise3(vec3(uv.x * 5.0, cell * 0.37, float(i) * 3.0)));
    float line = 1.0 - smoothstep(0.03, 0.03 + max(0.02, fp * 250.0), w);
    s = max(s, on * seg * line);
  }
  return s;
}

/** Dirt in a crevice, 0..1, from the occlusion (\`ao\` runs 0.3..1). */
float grime(vec3 p, float ao) {
  return clamp((1.0 - ao) / 0.7, 0.0, 1.0) * (0.6 + 0.4 * noise3(p * 40.0));
}

/** The cream case, aged: \`n\` its normal, \`ao\` its occlusion; it may make the surface shinier (\`gloss\`). */
vec3 caseWear(vec3 p, vec3 n, vec3 alb, float ao, float fp, inout float gloss) {
  float yel = clamp(0.2 * max(n.y, 0.0) + 0.18 * noise3(p * 1.7) - 0.03, 0.0, 0.3);
  alb *= mix(vec3(1.0), vec3(1.0, 0.92, 0.74), yel);
  alb = mix(alb, vec3(0.3, 0.26, 0.2), 0.6 * grime(p, ao));
  // In front of the keys, where wrists rest: darker and a little shiny with skin grease.
  float palm = smoothstep(0.8, 0.9, p.z) * smoothstep(0.22, 0.28, p.y) * smoothstep(1.25, 0.55, abs(p.x)) * (0.55 + 0.45 * noise3(p * 9.0));
  alb *= 1.0 - 0.14 * palm;
  gloss += 0.08 * palm;
  // Scuffs: faint, soft-edged rubs (a sleeve, a mug), not stains.
  float scuff = smoothstep(0.55, 0.85, noise3(p * vec3(9.0, 6.0, 9.0))) * smoothstep(0.45, 0.75, noise3(p * 2.3 + 7.0));
  alb *= 1.0 - 0.05 * scuff;
  return mix(alb, alb * 1.08 + 0.03, 0.7 * scratches(p, fp));
}

/**
 * A cap, aged by \`wear\` (0..1, from the print's G): yellowed, its top (\`top\`) polished and greasy, the legend
 * (\`ink\`, its coverage) rubbed thin where the finger lands, grime round its skirt.
 */
vec3 keyWear(vec3 p, vec3 alb, float wear, float top, float ao, inout float gloss, inout float ink) {
  alb *= mix(vec3(1.0), vec3(1.0, 0.93, 0.78), 0.12 + 0.38 * wear);
  float rub = top * wear * (0.6 + 0.4 * noise3(p * 120.0));
  alb *= 1.0 - 0.1 * rub;
  gloss += 0.1 * rub;
  // Rubbed thin, not chipped: a soft patch where the fingertip lands, with a finer grain inside it.
  float rubbed = smoothstep(0.3, 0.75, 0.7 * noise3(p * 260.0) + 0.3 * noise3(p * 900.0));
  ink *= 1.0 - 0.75 * smoothstep(0.5, 1.0, wear) * rubbed;
  return mix(alb, vec3(0.32, 0.27, 0.2), 0.6 * grime(p, ao));
}
`;
