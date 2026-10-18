/** How much of the tube the VDG's 256×192 fills (the rest is border). */
export const ACTIVE = [0.76, 0.74] as const;

/**
 * GLSL for what the beam draws on the phosphor, spliced into \`TV_FRAG\` after its uniforms and \`CABINET_GLSL\`: the VDG
 * image through RF (colour smeared, a weak copy on a dead channel, herringbone when off tune), as scanlines, with the
 * tampered cells, the warm-up and switch-off, a channel click's or a smack's jolt, a rolling picture.
 */
export const PICTURE_GLSL = /* glsl */ `
const vec2 ACTIVE = vec2(${ACTIVE[0]}, ${ACTIVE[1]});
const float LINES = 192.0;

const float TAMPER_LIFE = 2.5; // seconds after which no effect is left
const float SCAN = 0.16;       // seconds the beam takes to repaint a row of text

// How many scanlines and VDG dots one screen pixel spans (main() sets them): drawn smaller than that, the lines and the
// herringbone beat against the pixels in moiré, so they fade into an evenly lit picture instead.
float linesPerPx = 0.0;
float dotsPerPx = 0.0;

/** How long ago the cell was tampered with: -1 if it never was, or if BASIC has written over it since (the mark is gone). */
float tamperMark(ivec2 cell) {
  float age = uTamperNow - texelFetch(uTamper, cell, 0).r;
  return age < 0.0 || age > 1e8 ? -1.0 : age;
}

/** The same, but only while the change is still happening (the beam and the ghost): -1 once it has settled. */
float tamperAge(ivec2 cell) {
  float age = tamperMark(cell);
  return age > TAMPER_LIFE ? -1.0 : age;
}

/** The text cell under x (0..1 across) on a scanline. */
ivec2 cellAt(float x, float row) {
  return ivec2(min(x * 32.0, 31.0), row / 12.0);
}

/** The signal at a tampered dot: now is what memory holds, st where it is in the VDG image, row its scanline. */
vec3 tampered(vec3 now, vec2 st, float x, float row) {
  if (uTamperK <= 0.0) return now;
  ivec2 cell = cellAt(x, row);
  // For as long as the text is the story's, a soft light runs along it: something no VDG could ever draw.
  if (tamperMark(cell) >= 0.0) {
    float sheen = 0.5 + 0.5 * sin(uTamperNow * 2.2 - float(cell.x) * 0.9 + float(cell.y) * 1.7);
    now = mix(now, vec3(0.82, 1.0, 0.74), 0.32 * sheen * uTamperK);
  }
  float age = tamperAge(cell);
  if (age < 0.0) return now;
  vec3 was = textureLod(uGhost, st, 0.0).rgb;
  float fy = (row - float(cell.y) * 12.0 + 0.5) / 12.0; // 0..1 down the cell
  vec3 col = now;
  bool both = uTamperStyle == 2;
  if (uTamperStyle == 1 || both) {
    float beam = age / SCAN;
    if (fy > beam) col = was;              // below the beam the tube still shows the old picture
    float d = (beam - fy) * 12.0;          // scanlines behind the beam
    float hot = step(0.0, d) * exp(-d * 0.8);
    col = mix(col, vec3(0.8, 1.0, 0.72), 0.55 * hot * uTamperK);
  }
  if (uTamperStyle == 0 || both) col = mix(col, was, 0.6 * uTamperK * exp(-age / 0.45));
  return col;
}

/** The VDG's colour at x (0..1 across the active area) on a scanline, with crisper-than-linear steps between dots. */
vec3 dotColor(float x, float row) {
  x = clamp(x, 0.0, 1.0);
  // The story's text ripples, a fraction of a dot along each scanline, as if seen through warm air: VDG text never moves.
  if (uTamperK > 0.0 && tamperMark(cellAt(x, row)) >= 0.0) x += sin(row * 0.85 + uTamperNow * 3.1) * 0.002 * uTamperK;
  float tx = x * 256.0 - 0.5;
  float f = fract(tx);
  f = clamp((f - 0.5) * 1.7 + 0.5, 0.0, 1.0);
  vec2 st = vec2((floor(tx) + f + 0.5) / 256.0, (row + 0.5) / LINES);
  return tampered(textureLod(uScreen, st, 0.0).rgb, st, x, row);
}

/**
 * One scanline's colour at x as it arrives over RF: brightness stays sharp, but colour rides a narrow band, so it smears
 * out to the right of every change and lags a little (\`uFringe\`); off tune, a faint echo rings after each edge.
 */
vec3 rowColor(float x, float row) {
  if (row < 0.0 || row >= LINES || x < 0.0 || x > 1.0) return uBorder;
  vec3 c = dotColor(x, row);
  if (uFringe <= 0.0) return c;
  const float D = 1.0 / 256.0;
  const vec3 LUMA = vec3(0.3, 0.6, 0.1);
  vec3 sm = (dotColor(x - D, row) + 2.0 * dotColor(x + 0.6 * D, row) + dotColor(x + 2.2 * D, row)) * 0.25;
  vec3 rf = vec3(dot(c, LUMA)) + (sm - dot(sm, LUMA));
  rf += (dotColor(x - 3.0 * D, row) - c) * 0.18 * uDetune;
  return mix(c, rf, uFringe);
}

/** The beam: each line a gaussian whose width grows with brightness, summed with its neighbours. */
vec3 scanlines(vec2 uv) {
  float y = uv.y * LINES;
  float row = floor(y);
  float fy = y - row - 0.5;
  vec3 col = vec3(0.0);
  for (int i = -1; i <= 1; i++) {
    vec3 c = rowColor(uv.x, row + float(i));
    float w = mix(0.30, 0.46, dot(c, vec3(0.3, 0.6, 0.1)));
    float dy = fy - float(i);
    col += c * exp(-dy * dy / (2.0 * w * w)) * (0.34 / w);
  }
  return col;
}

vec3 glow(vec2 uv, float lod) {
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  vec3 c = textureLod(uScreen, clamp(uv, 0.0, 1.0), lod).rgb;
  return mix(uBorder, c, inside.x * inside.y);
}

/** The tuner's jolt as it clicks to another channel: how strong it still is (1 at the click, gone in a quarter second). */
float jolt() {
  return exp(-uChange * 12.0);
}

/**
 * A dead channel: speckle streaked along the lines, with the odd bright tear. Each channel has its own grain and
 * brightness, and on some a far-off station half comes through: a dark bar rolling down and a sync bar drifting across.
 */
vec3 snow(vec2 uv) {
  float h1 = hash(vec2(uChannel, 1.7)), h2 = hash(vec2(uChannel, 5.3)), h3 = hash(vec2(uChannel, 9.1));
  float frame = floor(uTime * 30.0);
  // Out of sync at a click, it smears into long streaks along the lines.
  vec2 cell = vec2(floor(uv.x * mix(240.0, 420.0, h1) * (1.0 - 0.9 * jolt())), floor(uv.y * LINES * mix(1.0, 1.5, h2)));
  float n = hash(cell + frame * vec2(17.0, 31.0));
  n = mix(n, hash(cell + vec2(1.0, 0.0) + frame * vec2(17.0, 31.0)), 0.35); // the beam smears it along the line
  float tear = step(0.985, hash(vec2(cell.y, frame))) * 0.35;
  float lit = pow(n, mix(1.2, 2.0, h2)) * mix(0.85, 1.3, h1) + tear;
  if (h3 > 0.45) {
    float far = (h3 - 0.45) / 0.55;
    float roll = fract(uv.y - uTime * mix(0.15, 0.6, h1));
    lit *= 1.0 - 0.5 * far * smoothstep(0.0, 0.08, roll) * smoothstep(0.3, 0.12, roll);
    float sync = fract(uv.x - uTime * 0.04 * (h2 - 0.5) + h3);
    lit *= 1.0 - 0.6 * far * smoothstep(0.05, 0.0, abs(sync - 0.5));
  }
  return vec3(0.78, 0.8, 0.86) * lit;
}



/** The picture on the phosphor at tube coordinates q (-1..1), before the glass; \`off\` is uOff. */
vec3 picture(vec2 q, float on, float off) {
  // Warm-up: a bright line that opens into the picture, then the tube coming up to brightness.
  float open = smoothstep(0.12, 0.55, on);
  float widen = smoothstep(0.02, 0.2, on);
  // Switched off: the picture falls to a hot line, the line shrinks to a dot, and the dot dies away.
  float hot = (1.0 - open) * 4.0 * widen;
  vec2 least = vec2(0.02, 0.004); // the thinnest the picture gets: across, down
  float halo = 0.0;
  if (off >= 0.0) {
    open = 1.0 - smoothstep(0.0, 0.08, off);
    widen = 1.0 - smoothstep(0.06, 0.2, off);
    // The dot: round (the tube is 4:3) and pin-sized, shrinking further as it dies.
    float pin = 0.004 * (0.4 + 0.6 * exp(-max(off - 0.2, 0.0) * 4.0));
    least = vec2(pin, pin * 1.333);
    hot = (1.0 - open) * 3.0 + (1.0 - widen) * 10.0;
    hot = (1.0 + hot) * exp(-max(off - 0.15, 0.0) * 5.0) - 1.0;
    // Its glow on the glass, so a spot that small still reads.
    halo = (1.0 - widen) * exp(-max(off - 0.15, 0.0) * 5.0) * 0.5 * exp(-length(q * vec2(1.333, 1.0)) / 0.012);
  }
  vec2 c = q;
  c *= 1.0 + vec2(c.y * c.y, c.x * c.x) * vec2(0.03, 0.045); // barrel
  c.y /= max(open, least.y);
  c.x /= max(widen, least.x);
  if (abs(c.y) > 1.04 || abs(c.x) > 1.04) return vec3(0.42, 0.45, 0.5) * halo;
  // A channel click, a smack on the cabinet or a slipped vertical hold (uRoll): the whole raster, border and all, loses
  // vertical hold and rolls (the blanking bar showing where one frame meets the next), and the lines tear sideways.
  // Rolling the raster, not the picture, keeps the border from wrapping into copies of the picture.
  float j = jolt();
  float sm = exp(-uSmack * 6.0);
  float roll = j * (0.5 + 0.5 * hash(vec2(uChannel, 2.9))) + sm * 0.1 * sin(uSmack * 40.0);
  c.y = mod(c.y + 1.04 + roll * 1.9 + uRoll * 2.08, 2.08) - 1.04;
  vec2 uv = vec2(c.x, -c.y) / ACTIVE * 0.5 + 0.5;
  float tearX = j * 0.08 * sin(uv.y * 23.0 + uTime * 50.0) * (0.5 + hash(vec2(floor(uv.y * 40.0), uChannel)));
  tearX += sm * 0.035 * sin(uv.y * 31.0 + uTime * 70.0);
  uv.x += tearX;
  // A weak signal: the lines lose horizontal hold a little, the picture goes grey and the snow comes through it.
  float weak = 1.0 - max(uSignal, uStationSignal);
  vec2 st = uv;
  st.x += (hash(vec2(floor(uv.y * LINES), floor(uTime * 24.0))) - 0.5) * 0.012 * weak * step(0.02, uSignal);
  vec3 col = vec3(0.0);
  if (uSignal > 0.01) {
    float fine = smoothstep(0.3, 0.6, linesPerPx); // too few pixels to show the lines between the lines
    col = fine < 1.0 ? scanlines(st) : vec3(0.0);
    if (fine > 0.0) col = mix(col, glow(st, max(log2(max(linesPerPx, dotsPerPx)), 0.0)) * 0.85, fine); // the beams' average
    col += glow(st, 2.0) * 0.10 + glow(st, 4.5) * 0.07; // bloom, then halation across the glass
    col = mix(vec3(dot(col, vec3(0.3, 0.6, 0.1))), col, 0.4 + 0.6 * uSignal);
  }
  if (uStationSignal > 0.01) {
    // A far station: its colour lost on the way, and a ghost of it to the right where the signal also came off a hill.
    vec3 s = textureLod(uStation, st, 0.5).rgb + 0.35 * textureLod(uStation, st + vec2(0.04, 0.0), 1.0).rgb;
    float inside = step(0.0, st.x) * step(st.x, 1.0) * step(0.0, st.y) * step(st.y, 1.0);
    col += vec3(dot(s, vec3(0.3, 0.6, 0.1))) * inside * uStationSignal * (0.8 + 0.2 * cos(fract(st.y * LINES) * 6.2832) * (1.0 - smoothstep(0.3, 0.6, linesPerPx)));
  }
  vec2 sp = vec2(c.x, -c.y) * 0.5 + 0.5;
  sp.x += tearX;
  col = col * (1.0 - pow(weak, 2.2)) + snow(sp) * pow(weak, 1.6);
  // Off tune: the sound carrier beats with the picture, herringbone crawling across it and soft bars rolling up.
  float hb = smoothstep(0.2, 0.6, uDetune) * max(uSignal, uStationSignal);
  hb *= 1.0 - smoothstep(0.5, 1.0, dotsPerPx); // its stripes are finer than the dots
  col *= 1.0 + hb * (0.14 * sin(uv.x * 540.0 + uv.y * LINES * 2.3 + uTime * 41.0) - 0.08 * (0.5 + 0.5 * sin(uv.y * 22.0 - uTime * 7.0)));
  float shifted = max(smoothstep(0.05, 0.3, j), max(smoothstep(0.02, 0.1, sm), step(0.003, min(uRoll, 1.0 - uRoll))));
  float blank = smoothstep(0.14, 0.06, 1.04 - abs(c.y));                           // the blanking bar rolling through
  col *= 1.0 - 0.95 * shifted * blank;
  col *= 1.0 - 0.75 * smoothstep(0.3, 0.9, j) - 0.4 * sm * step(0.5, hash(vec2(floor(uTime * 30.0), 4.0))); // dips dark
  // Switching off, the beam falls on one spot with no picture left to draw: all three guns full on, a bluish white.
  if (off >= 0.0) col = mix(col, vec3(0.42, 0.45, 0.5), smoothstep(0.2, 0.9, 1.0 - open));
  float slot = mod(gl_FragCoord.x, 3.0);
  col *= mix(vec3(1.0), vec3(slot < 1.0 ? 1.0 : 0.88, slot >= 1.0 && slot < 2.0 ? 1.0 : 0.88, slot >= 2.0 ? 1.0 : 0.88), 0.7);
  col *= 1.0 + 0.018 * sin((uv.y + uTime * 0.12) * 6.2832);           // the slow hum bar
  col *= 0.985 + 0.015 * hash(vec2(uTime, 3.1));                       // flicker
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;  // RF snow
  float bright = smoothstep(0.1, 1.6, on);
  col *= bright + hot;                                                 // the line is hot before it opens
  return max(col, 0.0) + vec3(0.42, 0.45, 0.5) * halo;
}
`;
