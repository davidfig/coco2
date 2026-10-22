import { hull, inHull, project } from '../computer/layout';
import { PILE_BOUNDS } from '../computer/pile';
import { REC, cassetteCorners, recToModel, recorderExtent } from './layout';
import type { CassetteId, Recorder } from './recorder';

/** The recorder's outline on screen (panel units), its door shut, with the plugs in its side. */
const OUTLINE = hull([-REC.hw, REC.hw + 0.15].flatMap((x) => [0, REC.h].flatMap((y) => [-REC.hd, REC.hd].map((z) => project(...recToModel(x, y, z))))));

/** What is under a panel point: a cassette lying on the table, the recorder (or the cassette in it), or neither. */
export function recorderAt(rec: Recorder, x: number, y: number): CassetteId | 'recorder' | null {
  for (const c of rec.cassettes()) {
    if (!c.out) continue;
    if (inHull(hull(cassetteCorners(c.pose).map((p) => project(...p))), x, y)) return c.id;
  }
  return inHull(OUTLINE, x, y) ? 'recorder' : null;
}

/** Everything the recorder and the cassettes can cover on screen (panel x0, y0, x1, y1): the door open, a cassette carried in. */
export const RECORDER_BOUNDS: readonly [number, number, number, number] = (() => {
  const pts = recorderExtent().map((p) => project(...p));
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
})();

type Bounds = readonly [number, number, number, number];

/**
 * What of the computer's picture a change of the recorder's uniforms (`Recorder.uniforms`, now and as they were) touches
 * (panel bounds): a cassette carried between the recorder and the pile, behind the set, crosses everything (`all`);
 * otherwise the recorder's part if anything there changed, the pile's if a cassette lying on it did (the guide's hop),
 * and wherever a cassette lying out was and is now (the issues changing places puts each in the other's place at once).
 */
export function recorderTouched(r: Recorder, now: readonly number[], was: readonly number[]): Bounds[] | 'all' {
  if (r.carrying() && now.some((v, i) => v !== was[i])) return 'all';
  const { atRec, atPile } = recorderChanged(now, was);
  const swept = cassettesSwept(now, was);
  return [...(atRec ? [RECORDER_BOUNDS] : []), ...(atPile ? [PILE_BOUNDS] : []), ...(swept ? [swept] : [])];
}

/**
 * Where on screen (panel x0, y0, x1, y1) the cassettes whose places changed (`Recorder.uniforms`, now and as they were)
 * lay and lie now, with room for their shadows on the table; null if none moved.
 */
export function cassettesSwept(now: readonly number[], was: readonly number[]): [number, number, number, number] | null {
  const pts: [number, number][] = [];
  for (let c = 0; c < 2; c++) {
    const i = 5 + 4 * c;
    const moved = [i, i + 1, i + 2, i + 3, 13 + c].some((k) => now[k] !== was[k]);
    if (!moved) continue;
    for (const u of [now, was]) {
      if (u[i + 1] < -5) continue;
      const pose = { x: u[i], y: u[i + 1], z: u[i + 2], yaw: u[i + 3], tilt: u[13 + c] };
      pts.push(...cassetteCorners(pose).flatMap((p) => [project(...p), project(p[0], 0, p[2])]));
    }
  }
  if (!pts.length) return null;
  const pad = 0.12;
  return [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];
}

/** Where a cassette's x (model frame) is the pile's side of the set, not the recorder's. */
const PILE_SIDE = 1;

/**
 * What a change of the recorder's uniforms (`Recorder.uniforms`, now and as they were) touches on screen: the recorder
 * and the cassettes by it (`atRec`), or a cassette on the pile beside the set (`atPile`: the guide's hop).
 */
export function recorderChanged(now: readonly number[], was: readonly number[]): { atRec: boolean; atPile: boolean } {
  let [atRec, atPile] = [false, false];
  now.forEach((v, i) => {
    if (v === was[i]) return;
    // Each cassette's centre and turn are four from index 5; its x first.
    const cas = i >= 5 && i < 13 ? 5 + 4 * Math.floor((i - 5) / 4) : -1;
    if (cas >= 0 && (now[cas] > PILE_SIDE || was[cas] > PILE_SIDE)) atPile = true;
    else atRec = true;
  });
  return { atRec, atPile };
}
