import { hull, inHull, project } from '../computer/layout';
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
