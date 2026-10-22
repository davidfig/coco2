/**
 * The cassette recorder beside the set, and the cassettes: their size and shape, where they stand, single source for
 * the model's SDF (`recorderGlsl.ts`), its print (`print.ts`), the cords to it (`computer/cords.ts`) and where it can
 * be clicked. Modelled on Radio Shack's Realistic CCR-81 (1981), the recorder sold for the Color Computer: a slim black
 * portable, a brushed-aluminium top with the speaker grille on the left, a top-loading door with a smoked window on the
 * right, six piano keys along the front, the EAR, MIC and REM jacks in its right side for the CoCo's cassette cable, and
 * its AC socket in the left.
 * About 23.5 × 14.3 × 5.1 cm.
 *
 * Units are the CoCo's model frame (`computer/layout.ts`: about 13.5 cm a unit, x right, y up off the table, z toward
 * the viewer, from the centre of the CoCo's footprint). The recorder's own frame: the same axes from the centre of its
 * footprint, turned by `yaw` (anticlockwise seen from above: its front turns toward the machine). Nothing is imported
 * here, so that the cords and the desk's bounds can use it.
 */

/** The body: centre on the table, turn, half width and depth, height. Beside the set's front-left corner, room left between them for the power cord to show. */
export const REC = { x: -3.55, z: -2.7, yaw: 0.15, hw: 0.87, hd: 0.53, h: 0.38 } as const;
/**
 * The cassette door, in the recorder's frame: its sides (x), its hinge at the back and its front edge (z), its
 * thickness, and how far it opens (radians: nearly upright, so a cassette can be lowered in under it). The well under it holds the cassette, `WELL` deep and inset from the door.
 */
export const LID = { x0: -0.02, x1: 0.82, z0: -0.47, z1: 0.21, t: 0.05, open: 1.42 } as const;
export const WELL = { depth: 0.17, inset: 0.03 } as const;
/** The smoked window in the door, in the door's frame (z measured from the hinge). */
export const WIN = { x0: 0.07, x1: 0.73, z0: 0.12, z1: 0.52 } as const;
/** The six piano keys across the front, under the door: RECORD, PLAY, REWIND, F.FWD, STOP/EJECT, PAUSE. */
export const KEYS = { x0: -0.02, x1: 0.82, z0: 0.27, z1: 0.525, n: 6 } as const;
export const KEY_NAMES = ['RECORD', 'PLAY', 'REW', 'F.FWD', 'STOP/EJ', 'PAUSE'] as const;
/** The speaker grille, left of the door; the record lamp in front of it. */
export const GRILLE = { x0: -0.8, x1: -0.1, z0: -0.45, z1: 0.17 } as const;
export const LED = { x: -0.16, z: 0.41, r: 0.016 } as const;
/** The jacks in the right side (z in the recorder's frame, height, radius): REM's is the small one. */
export const JACKS = [
  { name: 'REM', z: -0.27, y: 0.19, r: 0.014 },
  { name: 'MIC', z: -0.12, y: 0.19, r: 0.02 },
  { name: 'EAR', z: 0.03, y: 0.19, r: 0.02 },
] as const;

/** A compact cassette: half width, half thickness, half depth (100.4 × 63.8 × 12 mm). Its tape edge is +z. */
export const CAS = { hw: 0.372, hh: 0.044, hd: 0.236 } as const;
/** Its hubs: x either side of the middle, z, and the reel of tape round each, empty and full (radius). */
export const HUB = { x: 0.158, z: -0.035, r: 0.05, empty: 0.06, full: 0.15 } as const;
/** The cassette seated in the well, in the recorder's frame. */
export const SEAT = { x: (LID.x0 + LID.x1) / 2, y: REC.h - WELL.depth + CAS.hh + 0.004, z: (LID.z0 + LID.z1) / 2 } as const;

/** Where a cassette lies on the table when it is out (model frame: centre and turn), in front of the recorder. */
export const SPOTS: readonly { x: number; z: number; yaw: number }[] = [
  { x: -4.02, z: -1.72, yaw: 0.3 },
  { x: -3.18, z: -1.62, yaw: -0.12 },
];

/** A cassette's place: centre (model frame), turn about the vertical, tilt about its own x (its tape edge up). */
export interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  tilt: number;
}

/** A point in the recorder's frame, in the model frame. */
export function recToModel(x: number, y: number, z: number): [number, number, number] {
  const [c, s] = [Math.cos(REC.yaw), Math.sin(REC.yaw)];
  return [REC.x + x * c + z * s, y, REC.z - x * s + z * c];
}

/** The cassette seated in the recorder, as a pose. */
export function seatPose(): Pose {
  const [x, y, z] = recToModel(SEAT.x, SEAT.y, SEAT.z);
  return { x, y, z, yaw: REC.yaw, tilt: 0 };
}

/** A cassette lying at a spot on the table. */
export function spotPose(i: number): Pose {
  const s = SPOTS[i];
  return { x: s.x, y: CAS.hh + 0.002, z: s.z, yaw: s.yaw, tilt: 0 };
}

/** A cassette's corners at a pose (model frame). */
export function cassetteCorners(p: Pose): [number, number, number][] {
  const [c, s, ct, st] = [Math.cos(p.yaw), Math.sin(p.yaw), Math.cos(p.tilt), Math.sin(p.tilt)];
  const out: [number, number, number][] = [];
  for (const x of [-CAS.hw, CAS.hw])
    for (const y of [-CAS.hh, CAS.hh])
      for (const z of [-CAS.hd, CAS.hd]) {
        // Tilt in its own frame, then turn: as the shader's casLocal, undone.
        const [ty, tz] = [y * ct + z * st, -y * st + z * ct];
        out.push([p.x + x * c + tz * s, p.y + ty, p.z - x * s + tz * c]);
      }
  return out;
}

/**
 * A cassette carried from one side of the set to the other (between the recorder and the pile of old issues) goes in
 * front of the set and over the machine: through this point (model frame) halfway, clear of the CoCo's rear hump.
 */
export const ACROSS = { x: 0, y: 1.0, z: -0.75 } as const;

/** The box (model frame: least and greatest corner) that way across lies in, a cassette's size round it, from the recorder's side of the set to the pile's (`x0`, `x1`). */
export function acrossBox(x0: number, x1: number, z0: number): [[number, number, number], [number, number, number]] {
  const r = Math.hypot(CAS.hw, CAS.hd) + 0.05;
  return [
    [x0, 0, z0],
    [x1, ACROSS.y + r, ACROSS.z + r],
  ];
}

/** The highest a cassette is carried (over the open door), and the open door's top: for the bounds the pass draws in. */
export const LIFT = 0.36;
export const REC_TOP = REC.h + (LID.z1 - LID.z0) * Math.sin(LID.open) + 0.02;

/** The recorder's box at its tallest (the door open), its plugs, and the cassettes' spots and their way in (model frame). */
export function recorderExtent(): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (const x of [-REC.hw, REC.hw + 0.2]) for (const y of [0, REC_TOP]) for (const z of [-REC.hd, REC.hd]) pts.push(recToModel(x, y, z));
  for (let i = 0; i < SPOTS.length; i++) {
    const p = spotPose(i);
    pts.push(...cassetteCorners(p), ...cassetteCorners({ ...p, y: p.y + LIFT + REC.h }));
  }
  return pts;
}

/** The box (model frame: least and greatest corner) everything in `recorderExtent` lies in, with a margin. */
export function recorderBox(): [[number, number, number], [number, number, number]] {
  const pts = recorderExtent();
  const lo = [0, 1, 2].map((c) => Math.min(...pts.map((p) => p[c])) - 0.05) as [number, number, number];
  const hi = [0, 1, 2].map((c) => Math.max(...pts.map((p) => p[c])) + 0.05) as [number, number, number];
  return [[lo[0], 0, lo[2]], hi];
}
