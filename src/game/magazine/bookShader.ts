/**
 * The magazine as a real object. Book space: the spine is x = 0, a page is 1 wide and `uH` tall, y up, z toward the
 * viewer. A camera looks down at it from a tilt. Each pixel casts a ray: it is marched against the book's top surface
 * (a stack of paper whose thickness differs left and right of the spine, with the pages bowing up away from the gutter),
 * which also finds the white paper edges where the ray runs into the side of the block. A turning leaf is a sheet
 * hinged at the spine and bent into an arc, intersected analytically; whichever is nearer wins.
 */
export const BOOK_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform vec2 uRes;
uniform vec4 uClip;       // x0 y0 x1 y1 in pixels: where it may draw
uniform vec3 uRayO;       // the camera (bookLayout.ts's Cam): the eye in book space,
uniform mat3 uRayM;       // and the ray through pixel g along uRayM · (g, 1)
uniform float uScale;     // pixels per book unit at the page (fit × zoom)
uniform float uFocal;     // pixels per book unit at ray distance 1
uniform float uLight;     // the room's light on the paper (1 held out; less lying on the dim table)
uniform float uH;         // page height (page width is 1)
uniform float uTheta;     // turning leaf's angle: 0 flat on the right, PI flat on the left
uniform float uFlipOn;
uniform float uFold;      // 0..1: how much the gutter's fold shades the pages (none with the book put away)
uniform float uBend;      // -1..1: which way the turning leaf bends (positive: its edge further round than its hinge)
uniform float uL, uR, uF, uB; // layers: left page, right page, leaf front, leaf back (negative: none)
uniform vec4 uExt;        // x extents (min, max), then the paper's thickness left and right of the spine
uniform vec2 uWin;        // the part of the book in view (one page): drawn as a clean cut, no paper side shows there
uniform float uTexW;
uniform float uLastPage; // layer of the back cover (the front is 0): the glossy ones
uniform sampler2DArray uPages;
out vec4 outColor;

const float BOWL = 0.05;
const float CURL = 0.035;   // how far the outer corners lift
const float BEND = 2.8;   // radians the leaf's arc turns through when it stands up and bends fully
const float PI = 3.14159265;
const vec3 LIGHT = vec3(-0.4, 0.45, 0.8);

float bowlK() { return smoothstep(0.9, 1.8, uWin.y - uWin.x); }
float bowl(float x) { return BOWL * bowlK() * (1.0 - exp(-abs(x) * 4.5)); }

/** Height of the top of the book at q, ignoring where the book ends. */
float heightAt(vec2 q) {
  float yy = clamp(q.y / (uH * 0.5), -1.0, 1.0);
  // Pages bow up away from the gutter, and the outer corners curl up a little more.
  float lift = CURL * yy * yy * smoothstep(0.25, 1.0, abs(q.x)) + 0.012 * yy * smoothstep(0.2, 1.0, abs(q.x));
  return mix(uExt.z, uExt.w, smoothstep(-0.04, 0.04, q.x)) + bowl(q.x) + lift;
}

/** Height of the top of the book at q, or -1 where there is no book. */
float topAt(vec2 q) {
  if (q.x < uExt.x || q.x > uExt.y || abs(q.y) > uH * 0.5) return -1.0;
  if (q.x < 0.0 && uL < 0.0) return -1.0;
  if (q.x >= 0.0 && uR < 0.0) return -1.0;
  return heightAt(q);
}

vec3 atHeight(vec3 o, vec3 d, float z) { return o + d * ((z - o.z) / d.z); }

bool layerIs(float layer) { return layer < 0.5 || layer > uLastPage - 0.5; }

vec3 samplePage(float layer, vec2 uv) {
  float lod = max(0.0, log2(uTexW / uScale) + 0.1);
  return textureLod(uPages, vec3(uv.x, 1.0 - uv.y, layer), lod).rgb;
}

float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 g = gl_FragCoord.xy;
  vec3 d = normalize(uRayM * vec3(g, 1.0));
  vec3 o = uRayO;
  float hh = uH * 0.5;
  // The outline's fwidth below needs every pixel of each 2x2 block to get there, so nothing returns before it: a pixel
  // whose neighbour had left (at the clip's edge, or the horizon) got a garbage width and drew a speck of paper.
  vec3 dc = vec3(d.xy, min(d.z, -1e-4));

  // How much of this pixel the book covers. The march below only says hit or miss, which leaves its outline stepped, so
  // the outline is also found where the ray meets the paper's top (a few plane hits that settle onto the curled surface)
  // and the table under the near edge: both are smooth from pixel to pixel, hit or miss, so they can be measured in pixels.
  vec2 xr = vec2(max(uExt.x, uWin.x), min(uExt.y, uWin.y));
  if (uL < 0.0) xr.x = max(xr.x, 0.0);
  if (uR < 0.0) xr.y = min(xr.y, 0.0);
  vec3 E = atHeight(o, dc, heightAt(vec2(0.5 * (xr.x + xr.y), 0.0)));
  for (int i = 0; i < 3; i++) E = atHeight(o, dc, heightAt(clamp(E.xy, vec2(xr.x, -hh), vec2(xr.y, hh))));
  float dFoot = -hh - atHeight(o, dc, 0.0).y;
  float dEdge = max(max(xr.x - E.x, E.x - xr.y), max(E.y - hh, dFoot));
  float cover = clamp(0.5 - dEdge / max(fwidth(dEdge), 1e-6), 0.0, 1.0);
  if (g.x < uClip.x || g.y < uClip.y || g.x > uClip.z || g.y > uClip.w) { outColor = vec4(0.0); return; }
  // Lying on the table, the room's camera sees past the horizon: a ray going up never meets the book or its shadow.
  if (d.z > -1e-4) { outColor = vec4(0.0); return; }
  // A book unit at ray distance t spans about this many pixels.
  float pxUnit = uFocal;

  // The book's top and sides: march the slab it lives in, then bisect onto the surface.
  float tBook = 1e9;
  vec3 P = vec3(0.0);
  float t0 = (0.16 - o.z) / d.z;
  float t1 = (-o.z) / d.z;
  float prev = t0;
  // A ray whose stretch through the slab passes wide of the book can't meet it (topAt is -1 all along): no march.
  vec3 q0 = o + d * t0, q1 = o + d * t1;
  bool wide = max(q0.x, q1.x) < uExt.x || min(q0.x, q1.x) > uExt.y || (min(abs(q0.y), abs(q1.y)) > hh && q0.y * q1.y > 0.0);
  for (int i = 1; i <= (wide ? 0 : 56); i++) {
    float t = mix(t0, t1, float(i) / 56.0);
    vec3 q = o + d * t;
    float h = topAt(q.xy);
    if (h >= 0.0 && q.z <= h) {
      float a = prev, b = t;
      for (int k = 0; k < 6; k++) {
        float m = 0.5 * (a + b);
        vec3 qm = o + d * m;
        float hm = topAt(qm.xy);
        if (hm >= 0.0 && qm.z <= hm) b = m; else a = m;
      }
      tBook = b;
      P = o + d * b;
      break;
    }
    prev = t;
  }

  if (tBook < 1e8 && (P.x < uWin.x || P.x > uWin.y)) tBook = 1e9;

  vec3 col = vec3(0.0);
  float a = 0.0;
  if (tBook < 1e8) {
    float h = topAt(P.xy);
    if (h - P.z < 0.006) {
      // The page itself.
      float x = P.x;
      vec2 uv = vec2(x >= 0.0 ? x : x + 1.0, P.y / uH + 0.5);
      col = samplePage(x >= 0.0 ? uR : uL, uv);
      // Lit flat, the way a leaf is in the hand, so a page looks the same resting as it does turning.
      // The fold at the gutter only shades where a facing page meets it, not at a cover's spine edge.
      float facing = (x >= 0.0 ? uL : uR) >= 0.0 ? uFold : 0.0;
      col *= 1.0 - 0.36 * facing * exp(-abs(x) * 15.0);
      if (uFlipOn > 0.5) {
        // The turning leaf's shadow: the light comes from the left and above, so a point on the page is in shade when the
        // line from it toward the light meets the leaf (at r along the leaf from the hinge, 0 to 1).
        float sn = sin(uTheta), cs = cos(uTheta);
        float k = cs + 0.5 * sn;
        float d = abs(k) > 0.02 ? x / k : -1.0;
        float shade = smoothstep(0.0, 0.12, d) * (1.0 - smoothstep(0.8, 1.1, d));
        col *= 1.0 - 0.5 * shade * smoothstep(0.0, 0.25, sn);
      }
    } else {
      // The paper's thin side: carry the page's own colour over it, a little darker, so no pale edge shows.
      float x = clamp(P.x, uExt.x, uExt.y);
      vec2 uv = clamp(vec2(x >= 0.0 ? x : x + 1.0, P.y / uH + 0.5), 0.001, 0.999);
      col = samplePage(x >= 0.0 ? uR : uL, uv) * 0.7;
    }
    a = 1.0;
  } else if (cover > 0.0) {
    // Just outside what the march found, inside the smooth outline: the paper there, or its side by the near edge.
    vec2 q = clamp(E.xy, vec2(xr.x, -hh), vec2(xr.y, hh));
    vec2 uv = clamp(vec2(q.x >= 0.0 ? q.x : q.x + 1.0, q.y / uH + 0.5), 0.001, 0.999);
    col = samplePage(q.x >= 0.0 ? uR : uL, uv) * (dFoot >= dEdge ? 0.7 : 1.0);
    a = 1.0;
  }
  a *= cover;

  // Its shadow on the table, under whatever of the pixel the book leaves.
  {
    float tt = -o.z / d.z;
    vec3 T = o + d * tt;
    vec2 ec = vec2(0.5 * (uWin.x + uWin.y), 0.0);
    vec2 eh = vec2(0.5 * (uWin.y - uWin.x), hh);
    float sh = sdBox(T.xy - ec - vec2(0.035, -0.07), eh);
    float sa = 0.6 * exp(-max(sh, 0.0) * 16.0) * (1.0 - smoothstep(-0.03, 0.0, sh));
    col *= a;
    a += sa * (1.0 - a);
  }

  // The turning leaf, nearer than the page below it when it is hit first.
  if (uFlipOn > 0.5) {
    float sn = sin(uTheta);
    // Paper, not card: the leaf is bent into an arc (its cross-section is the same all the way up), most when it stands up
    // mid-turn and not at all lying flat. Its chord keeps uTheta, so the shadow below still fits.
    // Neither end may dip below flat, so near the start and end of a turn the bend eases off: early on, a leaf pulled by
    // its edge lifts from the edge while the part by the spine still lies down.
    float lim = 1.95 * min(uTheta, PI - uTheta) + 1e-4;
    float kap = lim * tanh(BEND * sn * uBend / lim);
    float a0 = uTheta - 0.5 * kap;
    // Hinged on top of the paper it leaves, not under it, so a shallow rise by the spine stays above the page below.
    vec2 ro = vec2(o.x, o.z - mix(uExt.w, uExt.z, uTheta / PI)), rd = d.xz;
    float tl = -1.0, psi = 0.0, r = -1.0;
    if (abs(kap) < 1e-3) {
      vec2 n = vec2(sn, -cos(uTheta));
      float den = dot(n, rd);
      if (abs(den) > 1e-5) {
        tl = -dot(n, ro) / den;
        vec2 Q = ro + rd * tl;
        r = dot(Q, vec2(cos(uTheta), sn));
        psi = uTheta;
        if (abs(o.y + d.y * tl) > hh + 3.0 / uScale) tl = -1.0;
      }
    } else {
      // The arc at r along the leaf: C + (sin ψ, -cos ψ) / kap, with ψ = a0 + kap r its angle there.
      vec2 C = vec2(-sin(a0), cos(a0)) / kap;
      vec2 oc = ro - C;
      float A = dot(rd, rd), Bq = dot(oc, rd), Cq = dot(oc, oc) - 1.0 / (kap * kap);
      float disc = Bq * Bq - A * Cq;
      if (disc >= 0.0) {
        float sq = sqrt(disc);
        for (int i = 0; i < 2; i++) {
          float t = (-Bq + (i == 0 ? -sq : sq)) / A;
          if (t <= 0.0) continue;
          vec2 e = (ro + rd * t - C) * kap;
          float ps = atan(e.x, -e.y);
          float dl = ps - (a0 + 0.5 * kap);
          dl -= 6.2831853 * floor(dl / 6.2831853 + 0.5);
          float rr = 0.5 + dl / kap;
          float y = o.y + d.y * t;
          if (rr > 0.0 && rr <= 1.0 + 3.0 / uScale && abs(y) < hh + 3.0 / uScale) { tl = t; r = rr; psi = a0 + kap * rr; break; }
        }
      }
    }
    // Wherever it lies (nearly) flat, the leaf sits on the paper it covers, whose bow would otherwise poke through it.
    float onPaper = 0.09 * (1.0 - smoothstep(0.0, 0.3, abs(sin(psi))));
    if (tl > 0.0 && tl < tBook + onPaper && r > 0.0 && r <= 1.0 + 3.0 / uScale) {
      vec3 Q = o + d * tl;
      vec3 nf = vec3(-sin(psi), 0.0, cos(psi));
      bool front = dot(nf, -d) > 0.0;
      vec2 uv = clamp(vec2(front ? r : 1.0 - r, Q.y / uH + 0.5), 0.0, 1.0);
      vec3 t = samplePage(front ? uF : uB, uv);
      // Lit the way the resting pages are (flat = 1), so the hand-over when the turn ends doesn't jump.
      vec3 Lh = normalize(LIGHT);
      // The face toward the camera is lit only if it faces the light (from the left): one leaning away from it is in shade.
      // Across the bend the light changes, which is what makes it read as round.
      float lam = max(dot(front ? nf : -nf, Lh) / Lh.z, 0.25);
      // Its top, bottom and free edges, softened over a pixel: the hit test above reaches a little past them for this.
      // An edge's distance on the sheet shows on screen shortened by how far its direction points along the ray.
      float px = pxUnit / tl;
      vec3 along = vec3(cos(psi), 0.0, sin(psi));
      float lc = clamp(0.5 + (hh - abs(Q.y)) * sqrt(max(1.0 - d.y * d.y, 0.0)) * px, 0.0, 1.0);
      lc *= clamp(0.5 + (1.0 - r) * sqrt(max(1.0 - dot(along, d) * dot(along, d), 0.0)) * px, 0.0, 1.0);
      col = mix(col, t * min(lam, 1.0) * (1.0 - 0.36 * exp(-r * 15.0)), lc);
      a += lc * (1.0 - a);
    }
  }
  outColor = vec4(col * uLight, a);
}`;
