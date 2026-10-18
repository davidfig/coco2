/** The VDG's colours as RGB bytes, tuned to look right through the TV shader rather than as raw signal levels. */
export type Rgb = readonly [number, number, number];

/** The eight semigraphics colours, in VDG order (a semigraphics byte's bits 6..4). */
export const SG_COLORS: readonly Rgb[] = [
  [30, 214, 36], // green
  [236, 236, 84], // yellow
  [36, 40, 214], // blue
  [196, 24, 36], // red
  [236, 236, 210], // buff
  [48, 210, 168], // cyan
  [204, 52, 204], // magenta
  [232, 124, 28], // orange
];

/** Alphanumeric mode: the bright green paper and the dark green ink. */
export const TEXT_GREEN: Rgb = [30, 214, 36];
export const TEXT_DARK: Rgb = [0, 58, 6];
export const BLACK: Rgb = [6, 8, 6];
