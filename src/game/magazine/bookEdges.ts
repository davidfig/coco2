/**
 * GLSL for the book shader (`bookShader.ts`, which it is pasted into after `heightAt`, `spineS`, `folded` and `samplePage`): the
 * colour of the block of paper's sides.
 */
export const BOOK_EDGES = /* glsl */ `
float hash1(float n) { return fract(sin(n * 91.345) * 47453.21); }
/** Smooth 1D value noise, 0..1. */
float noise1(float x) { float i = floor(x), f = fract(x); return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f)); }

/**
 * The side of the block of paper at P (on it, below the top); a book unit up its side spans pxV pixels on screen. Bound
 * edge (held out, not folded): the cover round the spine. Elsewhere the sheets' edges (the print is only on their faces):
 * off-white layers, each a little uneven along its length and a shade apart from the next, with a dark line where they
 * part. There are as many as show at a pixel and a half or more each, up to one per sheet, so even a band a few pixels
 * tall reads as stacked paper. Lying folded back, they run round the fold. Each face takes the light
 * by which way it looks, and the bottom is in the shade of the table.
 */
vec3 sideColor(vec3 P, float pxV) {
  float hh = uH * 0.5;
  bool right = P.x >= 0.0;
  float top = right ? uR : uL;
  float th = max(right ? uExt.w : uExt.z, 1e-4);
  float v = clamp(P.y / uH + 0.5, 0.001, 0.999);
  float dSpine = !folded() && (right ? uL : uR) < 0.0 ? abs(P.x) : 1e9;
  float dOut = right ? abs(uExt.y - P.x) : abs(P.x - uExt.x);
  float dEnd = hh - abs(P.y);
  vec3 n = dSpine <= min(dOut, dEnd) ? vec3(right ? -1.0 : 1.0, 0.0, 0.0)
         : dOut <= dEnd ? vec3(right ? 1.0 : -1.0, 0.0, 0.0) : vec3(0.0, sign(P.y), 0.0);
  float lit = 0.6 + 0.4 * max(dot(n, normalize(LIGHT)), 0.0);
  if (dSpine <= min(dOut, dEnd)) return samplePage(top, vec2(right ? 0.002 : 0.998, v)) * 0.85 * lit;
  // Height up the side, 0 (on the table) to 1 (the top sheet, wherever the corners curl or the fold swells), and along it.
  float zt = max(heightAt(P.xy), th);
  float z = clamp(P.z / zt, 0.0, 1.0);
  // Which layer: held out, by height. Lying, the sheets run round the fold, outermost on top and bottom, so a layer is how
  // deep in from the outside (0) toward the middle (1), where the two halves meet; at the fold that is the way in from its
  // half round, so the ends show the layers bending round in a U.
  float u = P.x * spineS(), R = max(spineR(), 1e-5);
  float c = !folded() ? z : u < 0.0 ? clamp(1.0 - length(vec2(u, P.z - R)) / R, 0.0, 1.0) : min(z, 1.0 - z) * 2.0;
  float along = abs(n.y) > 0.5 ? P.x : P.y;
  float tall = pxV * zt;
  // Counted where the book's middle is, the same all over it: counted pixel by pixel, a seam shows where the count changes.
  float mid = uFocal / length(uRayO - vec3(0.5 * (uWin.x + uWin.y), 0.0, 0.0)) * th;
  float N = clamp(floor(mid / 1.5), 1.0, 48.0);
  // Lying folded, each half holds half of them.
  if (folded()) N = max(1.0, floor(N * 0.5));
  // The layers waver a little along the edge (the sheets were never cut quite square).
  float zz = c * N + 0.35 * (noise1(along * 23.0 + 5.0) - 0.5);
  float s = floor(zz), f = fract(zz);
  float tone = 0.86 + 0.14 * hash1(s + 0.37 * N);
  tone *= 0.9 + 0.1 * noise1(along * 31.0 + s * 7.3);
  // Where one layer parts from the next, a dark line about a pixel wide.
  float w = (folded() ? 1.0 : 0.5) * N / max(tall, 1.0);
  float e = min(f, 1.0 - f);
  tone *= 1.0 - 0.35 * exp(-e * e / max(w * w, 1e-4));
  // Folded back open, a deeper gap where the half folded under meets the half on top (the covers, back to back).
  if (folded() && (spineS() > 0.0 ? uL : uR) >= 0.0) {
    float gs = (1.0 - c) * 0.5 * tall;
    tone *= 1.0 - 0.45 * exp(-gs * gs);
  }
  tone *= mix(0.72, 1.0, smoothstep(0.0, 0.4, z));
  return vec3(0.9, 0.88, 0.82) * tone * lit;
}
`;
