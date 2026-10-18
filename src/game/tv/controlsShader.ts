/**
 * GLSL for the set's controls, spliced into \`CABINET_GLSL\` (it uses its constants, noise, sdBox and uDial): the knobs
 * and the fine-tuning ring, their printed scales and words in worn silkscreen, and the power rocker.
 */
export const CONTROLS_GLSL = /* glsl */ `
/** A knob: ridged rim, domed cap, a white pointer at angle \`turn\` (radians from straight up, clockwise). */
vec4 knob(vec2 p, vec2 c, float r, float turn) {
  vec2 d = p - c;
  float len = length(d);
  float shadow = smoothstep(r * 1.25, r * 0.9, length(d - vec2(0.03, -0.04)));
  if (len > r) return vec4(0.0, 0.0, 0.0, shadow * 0.6);
  float a = atan(d.x, d.y);
  float rim = smoothstep(r * 0.78, r * 0.82, len);
  vec3 cap = vec3(0.10, 0.10, 0.11) + 0.20 * pow(max(0.0, 1.0 - length(d / r - LIGHT * 0.45)), 2.0);
  vec3 ridges = vec3(0.07) + 0.05 * step(0.0, sin(a * 40.0)) + 0.10 * max(0.0, dot(normalize(d), LIGHT));
  vec3 col = mix(cap, ridges, rim);
  vec2 dir = vec2(sin(turn), cos(turn));
  float along = dot(d, dir), side = dot(d, vec2(dir.y, -dir.x));
  // The pointer's paint, worn like the panel's print: in the knob's own frame, so the wear turns with it. Ragged
  // edges, chipped in patches, rubbed thin toward the rim where fingers grip, grimy where it's left.
  vec2 k = vec2(side, along) / r + c * 7.0;
  float rag = r * (0.05 + 0.018 * (noise(k * 45.0) - 0.5));
  float mark = smoothstep(rag, rag - r * 0.012, abs(side)) * smoothstep(r * 0.23, r * 0.27, along) * smoothstep(r * 0.76, r * 0.72, along);
  float u = (along / r - 0.25) / 0.49;                       // 0 inner end .. 1 outer
  mark *= smoothstep(0.25, 0.4, fbm(k * 9.0) + 0.25 * (1.0 - u));
  mark *= 1.0 - 0.85 * smoothstep(0.5, 1.0, u) * noise(k * 20.0);
  mark *= 1.0 - 0.7 * step(0.9, hash(floor(k * 120.0)));
  col = mix(col, mix(vec3(0.8, 0.78, 0.7), vec3(0.62, 0.59, 0.5), noise(k * 14.0)), mark * 0.92);
  col *= smoothstep(r, r * 0.95, len) * 0.4 + 0.6;
  return vec4(col, 1.0);
}

/** The channel numbers' places round the selector: a short tick at each detent. */
float channelTicks(vec2 p) {
  vec2 d = p - CH_KNOB.xy;
  float t = mod(atan(d.x, d.y) - CH_START + 0.2, 6.2832) - 0.2;
  float i = clamp(floor(t / CH_STEP + 0.5), 0.0, CH_COUNT - 1.0);
  float across = abs(t - i * CH_STEP) * length(d);
  float ring = step(CH_KNOB.z * (FINE_RING + 0.08), length(d)) * step(length(d), CH_KNOB.z * (FINE_RING + 0.22));
  return ring * smoothstep(0.009, 0.005, across);
}

/** The channel numbers printed round the selector, upright, beyond its ticks: \`dialLabels.ts\`'s strip in uDial. */
float channelNumbers(vec2 p) {
  vec2 d = p - CH_KNOB.xy;
  float t = mod(atan(d.x, d.y) - CH_START + 0.2, 6.2832) - 0.2;
  float i = clamp(floor(t / CH_STEP + 0.5), 0.0, CH_COUNT - 1.0);
  float a = CH_START + i * CH_STEP;
  vec2 q = (d - CH_KNOB.z * (FINE_RING + 0.46) * vec2(sin(a), cos(a))) / DIAL_CELL + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  return texture(uDial, vec2((i + q.x) / LABEL_CELLS, 1.0 - q.y)).a * (0.88 + 0.12 * hash(vec2(i, 7.0))); // each its own ink
}

/** ON and OFF printed right of the power rocker's two halves: the last two cells of \`dialLabels.ts\`'s strip. */
float powerLabels(vec2 p) {
  vec2 q = (p - POWER_SW.xy - vec2(POWER_SW.z + 0.1, 0.0)) / DIAL_CELL;
  float i = q.y > 0.0 ? CH_COUNT : CH_COUNT + 1.0;
  q.y = q.y - (q.y > 0.0 ? 1.0 : -1.0) * POWER_SW.w * 0.55 / DIAL_CELL.y;
  q += 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  return texture(uDial, vec2((i + q.x) / LABEL_CELLS, 1.0 - q.y)).a;
}

/** V-HOLD printed right of its knob: the strip's last two cells. */
float holdLabel(vec2 p) {
  vec2 q = (p - VHOLD.xy - vec2(VHOLD.z + 0.03 + DIAL_CELL.x, 0.0)) / (DIAL_CELL * vec2(2.0, 1.0)) + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  return texture(uDial, vec2((LABEL_CELLS - 2.0 + 2.0 * q.x) / LABEL_CELLS, 1.0 - q.y)).a;
}

/**
 * The fine-tuning ring: a thin knurled disc behind the channel selector, showing round it, with a pale line across its
 * edge at \`turn\` (radians clockwise from up) to see where it's set. Alpha as \`knob\`'s.
 */
vec4 fineRing(vec2 p, float turn) {
  vec2 d = p - CH_KNOB.xy;
  float len = length(d), r1 = CH_KNOB.z * FINE_RING;
  float shadow = smoothstep(r1 * 1.15, r1 * 0.92, length(d - vec2(0.025, -0.035)));
  if (len > r1) return vec4(0.0, 0.0, 0.0, shadow * 0.5);
  float a = atan(d.x, d.y);
  vec3 col = vec3(0.075) + 0.03 * step(0.0, sin(a * 110.0)) + 0.09 * max(0.0, dot(d / len, LIGHT)) * smoothstep(r1 * 0.88, r1, len);
  float off = abs(mod(a - turn + 3.1416, 6.2832) - 3.1416) * len;
  col = mix(col, vec3(0.62, 0.6, 0.53), smoothstep(0.009, 0.005, off) * step(CH_KNOB.z * 1.03, len));
  col *= smoothstep(r1, r1 * 0.96, len) * 0.35 + 0.65;
  return vec4(col, 1.0);
}

/**
 * Printed coverage \`a\` as an old set's silkscreen: ragged edges where the ink crept along the mesh, pinholes where it
 * didn't take, uneven density, a few scratches, and rubbed away in patches, most where fingers reach for a knob.
 */
float silkscreen(vec2 p, float a) {
  if (a <= 0.0) return 0.0;
  float rough = noise(p * 380.0) * 0.6 + noise(p * 950.0) * 0.4;
  float ink = smoothstep(0.32, 0.68, a + (rough - 0.5) * 0.5);
  ink *= 1.0 - 0.5 * step(0.92, hash(floor(p * 650.0)));
  ink *= 0.86 + 0.14 * noise(p * 70.0);
  float grip = max(smoothstep(CH_KNOB.z * 1.9, CH_KNOB.z * 1.2, length(p - CH_KNOB.xy)),
                   smoothstep(VOL_KNOB.z * 1.6, VOL_KNOB.z * 1.05, length(p - VOL_KNOB.xy)));
  float worn = 0.18 + 0.1 * grip;
  ink *= smoothstep(worn, worn + 0.08, fbm(p * 30.0 + 4.0));
  vec2 s = mat2(0.83, -0.56, 0.56, 0.83) * p;
  ink *= 1.0 - 0.5 * smoothstep(0.9, 0.96, noise(vec2(s.x * 14.0, s.y * 420.0))) * step(0.55, noise(s * 9.0));
  return ink;
}

/** The volume's wedge round its knob: thin at the quiet end, thick at the loud one. */
float volumeWedge(vec2 p) {
  vec2 d = p - VOL_KNOB.xy;
  float a = atan(d.x, d.y);
  float t = (a - VOL_MIN) / (VOL_MAX - VOL_MIN);
  float r = VOL_KNOB.z * 1.13;
  float w = 0.004 + 0.022 * t;
  return step(0.0, t) * step(t, 1.0) * step(r, length(d)) * step(length(d), r + w);
}

/**
 * The power rocker at p, in its bezel: a vertical rocker that pivots across its middle, \`rock\` -1 (bottom in: OFF) .. 1
 * (top in: ON). The half tipped in sinks into shadow under the bezel's lip; the half standing out catches the room
 * light along its end and throws a shadow. Alpha is 1 on the switch, the shadow's share off it.
 */
vec4 rocker(vec2 p, float rock) {
  vec2 d = p - POWER_SW.xy;
  vec2 hs = POWER_SW.zw;
  float hole = sdBox(d, hs + 0.01, 0.012);
  float bezel = sdBox(d, hs + 0.026, 0.02);
  if (bezel > 0.03) return vec4(0.0);
  if (bezel > 0.0) return vec4(0.0, 0.0, 0.0, 0.55 * smoothstep(0.03, 0.0, sdBox(d - vec2(0.008, -0.012), hs + 0.026, 0.02)));
  if (hole > 0.0) {
    // The bezel: a thin raised frame, lit along its top and left.
    vec3 col = vec3(0.075, 0.072, 0.07) + 0.07 * dot(boxNormal(d, hs + 0.026, 0.02), LIGHT) * smoothstep(-0.006, 0.0, bezel);
    col -= 0.04 * smoothstep(0.006, 0.0, hole);
    return vec4(col, 1.0);
  }
  float face = sdBox(d, hs, 0.008);
  float y = d.y / hs.y;                                     // -1 bottom .. 1 top
  float sunk = 0.5 + 0.5 * rock * y;                        // 0 standing out .. 1 tipped in
  float proud = 1.0 - sunk;
  if (face > 0.0) {
    // The gap round the rocker; the end that stands out shades it.
    return vec4(vec3(0.008) * (1.0 - 0.6 * proud), 1.0);
  }
  // Each half a plane tilted about the pivot: the one facing up catches the light from above, the other faces away.
  vec3 col = vec3(0.115, 0.11, 0.105) * (1.0 + 0.35 * rock * LIGHT.y);
  col *= 1.0 - 0.6 * sunk * sunk;                                                  // down in the bezel's shadow
  col *= 1.0 - 0.5 * smoothstep(hs.y - 0.03 * sunk, hs.y, d.y) * step(0.0, rock); // the lip's shadow on a sunk top
  // The end standing out: a lit edge where it rises out of the bezel.
  float end = smoothstep(-0.012, 0.0, face) * smoothstep(0.4, 1.0, proud);
  col += 0.12 * end * max(0.0, dot(boxNormal(d, hs, 0.008), LIGHT) + 0.4);
  // The pivot: a fine crease across the middle, and a few ridges for the thumb on the half that stands out.
  col *= 1.0 - 0.45 * smoothstep(0.004, 0.0, abs(d.y));
  float ridge = step(0.5, fract(abs(d.y) * 70.0)) * step(0.015, abs(d.y)) * step(abs(d.y), hs.y * 0.8);
  col *= 1.0 - 0.18 * ridge * proud;
  return vec4(col, 1.0);
}
`;
