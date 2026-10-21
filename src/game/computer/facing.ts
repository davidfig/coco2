import { EYE_AT, rayMatrix, toPixels } from './layout';

/** A view of the set in buffer pixels (`pictureView`). */
type PicView = { cx: number; cy: number; k: number };

/**
 * A thing on the table seen square on: by an eye slid sideways (`w` of the way, 0..1) until it stands straight in
 * front of `centre`, and the picture it takes moved back to where `centre` shows. Off to the side of the desk view (a
 * wide angle), a flat picture leans everything lying there away from the middle, its sides running off toward the
 * centre of the view; seen this way the magazine and the notes lie as they would straight ahead of the eye: their
 * near and far edges level with the table's, their sides upright, at the slant the table has there. Only they are:
 * the table under them and everything else is drawn by the room's own camera, so each still lies where it should.
 *
 * `toPixels` puts a world point on screen; `eye` is where it is seen from and `rays` the matrix (row-major 3×3) taking
 * a pixel (x, y, 1) to the world direction from there through it, as `rayMatrix` does for the room's camera.
 */
export function facing(view: PicView, centre: readonly number[], w: number): { toPixels: (p: readonly number[]) => [number, number]; eye: [number, number, number]; rays: number[] } {
  const dx = w * (centre[0] - EYE_AT[0]);
  // The eye slid by dx sees the room as the room's eye sees it moved by -dx; then moved back on screen.
  const shifted = (p: readonly number[]) => toPixels(view, [p[0] - dx, p[1], p[2]]);
  const off = toPixels(view, centre)[0] - shifted(centre)[0];
  const A = rayMatrix(view);
  // Pixel x - off → its ray (A's last column takes the shift).
  const rays = [A[0], A[1], A[2] - A[0] * off, A[3], A[4], A[5] - A[3] * off, A[6], A[7], A[8] - A[6] * off];
  return {
    toPixels: (p) => {
      const q = shifted(p);
      return [q[0] + off, q[1]];
    },
    eye: [EYE_AT[0] + dx, EYE_AT[1], EYE_AT[2]],
    rays,
  };
}
