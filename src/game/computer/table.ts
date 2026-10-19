import { CASE, EDGE, PLACE } from './layout';

const f = (n: number): string => n.toFixed(4);

/**
 * GLSL for the table the set and the CoCo stand on, in perspective: from its back edge just short of the wall (it runs
 * back under the set's long back) to its front edge, a little in front of the keyboard, as a desk's is. Its veneer, the room's
 * light falling away toward the viewer, the lamp's pool, the shadows of the set, the case and the cords, the crease
 * where it meets the wall; then its rounded front edge, and the dark under it. Needs the computer shader's AT, CAB,
 * HW, HD, wood, fbm, noise, cords, recShadow and behindSet. It covers the room's flat-drawn table.
 */
export const TABLE_GLSL = /* glsl */ `
const vec2 POOL = vec2(-0.5, 0.1); // the lamp's pool of light on the table, model frame
const float EDGE_Z = ${f(CASE.hd + EDGE.gap)}, EDGE_T = ${f(EDGE.thick)}; // the front edge (model z) and the top's thickness
const float FLOOR_Y = ${f(-EDGE.floor)}, BACK_Z = ${f(EDGE.back - PLACE.z)}, WALL_Z = ${f(EDGE.wall - PLACE.z)}; // the floor, the back edge, the wall (model frame)
const float SET_D = ${f(EDGE.set)}; // how far back the set's cabinet goes from its face

/** The table's colour along a ray from the eye (model frame; \`p\` the panel point), and in \`ta\` how much it covers. */
vec3 table(vec3 ro, vec3 rd, vec2 p, out float ta) {
  vec3 tp = ro + rd * (-ro.y / rd.y);
  ta = 0.0;
  if (rd.y >= 0.0 || tp.z <= BACK_Z || behindSet(tp, p)) return vec3(0.0);
  vec3 tc;
  ta = 1.0;
  if (tp.z < EDGE_Z) {
    vec3 w = tp + AT;
    vec3 top = wood(vec2(w.x * 0.5, w.z * 4.0)) * 0.7;
    vec2 lp = (tp.xz - POOL) / vec2(2.6, 1.7);
    float k = max(mix(0.35, 1.0, exp(-max(w.z, 0.0) * 1.2)), 1.5 * exp(-dot(lp, lp)));
    k *= 1.0 + 0.7 * smoothstep(EDGE_Z - 0.05, EDGE_Z, tp.z); // the edge rounds over and catches the light
    vec2 b = abs(tp.xz - vec2(0.1, -0.1)) - vec2(HW, HD) + 0.05;
    float sd = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.05;
    float s = 0.6 * exp(-max(sd, 0.0) * 14.0); // falling back and right, away from the lamp
    s = max(s, 0.65 * exp(-max(cords(tp, 1.0).x, 0.0) * 30.0)); // the cords on the table
    s = max(s, recShadow(tp.xz)); // the recorder, and the cassettes lying in front of it
    vec2 sb = abs(w.xz - vec2(0.15, -0.5 * SET_D - 0.1)) - vec2(CAB.x, 0.5 * SET_D);
    float ss = length(max(sb, 0.0)) + min(max(sb.x, sb.y), 0.0);
    s = max(s, 0.8 * exp(-max(ss, 0.0) * 5.0)); // the set's, falling back and right, darkest at its foot
    s = max(s, 0.7 * exp(-(tp.z - BACK_Z) * 6.0)); // the dark at its back edge, against the wall
    tc = top * k * (1.0 - s);
  } else {
    vec3 fp = ro + rd * ((EDGE_Z - ro.z) / rd.z);
    if (fp.y > -EDGE_T) {
      // The front edge: the veneer's banding, grain running along it, lit from in front and above, darker down
      // toward the underside; the rounded lip along its top a band of light.
      float v = -fp.y / EDGE_T;
      tc = wood(vec2((fp.x + AT.x) * 0.5, fp.y * 6.0 + 3.0)) * 0.75 * mix(1.1, 0.6, v);
      tc *= 1.0 + 1.1 * (1.0 - smoothstep(0.0, 0.22, v));
      tc *= 1.0 - 0.6 * smoothstep(0.8, 1.0, v);
    } else {
      // Under it: the floor where it shows before the wall behind the set, in the table's shade; only a little of
      // the room's light gets in from the front, and less the further back.
      vec3 q = ro + rd * ((FLOOR_Y - ro.y) / rd.y);
      float back;
      if (q.z > WALL_Z) {
        vec2 c = (q.xz + AT.xz) * 9.0;
        tc = vec3(0.14, 0.085, 0.05) * (0.55 + 0.45 * fbm(c) + 0.25 * noise(c * 6.0)); // an old brown carpet
        back = EDGE_Z - q.z;
      } else {
        vec3 r = ro + rd * ((WALL_Z - ro.z) / rd.z);
        tc = vec3(0.07, 0.058, 0.047) * (0.75 + 0.25 * fbm(r.xy * 3.0));
        tc *= 1.0 - 0.4 * smoothstep(FLOOR_Y + 0.5, FLOOR_Y, r.y); // the corner where it meets the floor
        back = EDGE_Z - WALL_Z;
      }
      tc *= 1.1 * exp(-back * 0.15) * smoothstep(-EDGE_T - 0.02, -EDGE_T - 0.6, fp.y); // the underside's shadow right under the edge
    }
  }
  return tc;
}
`;
