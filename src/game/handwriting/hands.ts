import { GLYPHS, parseSet, type Glyph } from './glyphs';

/**
 * Who is writing: their letterforms and the habits of their hand. The player's (`PLAYER`) is a young hand in ballpoint;
 * another writer gets their own skeletons and habits (`KESSLER`, below). Every number is a multiplier or a default that the
 * player's hand leaves at its neutral value, so their writing comes out exactly as it always has.
 */
export interface Hand {
  glyphs: Record<string, Glyph[]>;
  /** A hand with no lower case writes it as small capitals this high (a share of the cap height). */
  smallCaps?: number;
  /** The lean when the pen doesn't say. */
  slant: number;
  /** How much each letter's size, tilt, slant and place wander: 1 is the player's, less is a more careful writer. */
  wander: number;
  /** The gap after each letter and the width of a space, in cap heights. */
  gap: number;
  space: number;
  /** The line's thickness, a share of the player's. */
  weight: number;
  /** A fine shake along every stroke, as an old hand has; 0 for none. */
  tremor: number;
  /** Graphite instead of a ballpoint: grainy, with the pressure in how dark it is rather than how wide. */
  pencil?: boolean;
  ink: [number, number, number];
}

/** The player's hand: their letters (`glyphs.ts`), a forward lean, blue-black ballpoint. */
export const PLAYER: Hand = { glyphs: GLYPHS, slant: 0.14, wander: 1, gap: 0.15, space: 0.42, weight: 1, tremor: 0, ink: [28, 58, 170] };

/**
 * M. Kessler's hand, on the cassette labels and the slips in the box: an older writer who learned to letter on coding
 * sheets. Capitals only (lower case comes out as small capitals), upright, spaced out, drawn a stroke at a time with
 * corners rather than curves where a draughtsman would make them: a flat-topped A, chamfered B, D and P, a flat-topped 3,
 * and the habits of someone who wrote programs by hand for others to type, a slashed zero, a crossed 7 and Z, a 1 with a
 * foot. Careful, so each letter wanders less than the player's, but with a fine shake in every line, in a soft
 * pencil pressed hard (black, where the player's ballpoint is blue). Not a good speller with a long word: everyday words come
 * out right, and a hard one is written the way it sounds (acurate), never the way a finger slips on a key. The spelling
 * is in the text (`magazine/slips.ts`); the hand only draws it.
 * Same `"width; stroke | stroke"` form as `glyphs.ts`.
 */
const KESSLER_SOURCE: Record<string, string[]> = {
  A: ['.62; 0,0 .27,1 .35,1 .62,0 | .1,.3 .52,.3'],
  B: ['.54; 0,0 0,1 .36,1 .5,.9 .5,.66 .38,.55 0,.55 | .38,.55 .54,.44 .54,.11 .42,0 0,0'],
  C: ['.56; ~.54,.82 .42,.97 .24,1 .07,.86 0,.5 .07,.14 .24,0 .42,.03 .54,.18'],
  D: ['.56; 0,0 0,1 .3,1 .5,.86 .56,.62 .56,.38 .5,.14 .3,0 0,0'],
  E: ['.48; .48,1 0,1 0,0 .48,0 | 0,.53 .34,.53'],
  F: ['.46; .46,1 0,1 0,0 | 0,.53 .32,.53'],
  G: ['.58; ~.56,.82 .43,.97 .24,1 .07,.86 0,.5 .07,.14 .24,0 .43,.03 .56,.14 | .56,.14 .56,.42 .32,.42'],
  H: ['.56; 0,0 0,1 | .56,0 .56,1 | 0,.53 .56,.53'],
  I: ['.08; .04,1 .04,0'],
  J: ['.44; .44,1 .44,.22 | ~.44,.22 .36,.04 .2,0 .06,.04 0,.2'],
  K: ['.54; 0,0 0,1 | .54,1 0,.36 | .18,.53 .56,0'],
  L: ['.46; 0,1 0,0 .46,0'],
  M: ['.68; 0,0 0,1 .34,.48 .68,1 .68,0'],
  N: ['.56; 0,0 0,1 .56,0 .56,1'],
  O: ['.62; ~.31,1 .1,.9 0,.5 .1,.1 .31,0 .52,.1 .62,.5 .52,.9 .31,1'],
  P: ['.52; 0,0 0,1 .36,1 .5,.9 .5,.62 .36,.5 0,.5'],
  Q: ['.62; ~.31,1 .1,.9 0,.5 .1,.1 .31,0 .52,.1 .62,.5 .52,.9 .31,1 | .36,.24 .64,-.06'],
  R: ['.54; 0,0 0,1 .36,1 .5,.9 .5,.64 .36,.52 0,.52 | .3,.52 .54,0'],
  S: ['.54; ~.52,.86 .4,.98 .18,1 .04,.88 .04,.68 .18,.56 .36,.48 .52,.34 .52,.12 .38,0 .14,0 0,.14'],
  T: ['.56; 0,1 .56,1 | .28,1 .28,0'],
  U: ['.56; ~0,1 0,.24 .1,.04 .28,0 .46,.04 .56,.24 .56,1'],
  V: ['.6; 0,1 .3,0 .6,1'],
  W: ['.84; 0,1 .18,0 .42,.62 .66,0 .84,1'],
  X: ['.56; 0,1 .56,0 | 0,0 .56,1'],
  Y: ['.58; 0,1 .29,.5 .58,1 | .29,.5 .29,0'],
  Z: ['.52; 0,1 .52,1 0,0 .52,0 | .1,.5 .42,.5'],
  0: ['.5; ~.25,1 .07,.86 0,.5 .07,.14 .25,0 .43,.14 .5,.5 .43,.86 .25,1 | .44,.88 .06,.12'],
  1: ['.4; .04,.8 .2,1 .2,0 | 0,0 .4,0'],
  2: ['.5; ~.02,.78 .1,.94 .26,1 .42,.94 .48,.76 .42,.56 | .42,.56 0,0 .5,0'],
  3: ['.5; .02,1 .48,1 .2,.58 | ~.2,.58 .4,.54 .5,.34 .44,.1 .26,0 .08,.02 0,.14'],
  4: ['.52; .38,0 .38,1 0,.32 .52,.32'],
  5: ['.5; .46,1 .06,1 .03,.56 | ~.03,.56 .2,.62 .4,.58 .5,.36 .42,.08 .22,0 .02,.08'],
  6: ['.5; ~.42,1 .2,.84 .05,.5 .04,.2 .2,.02 .4,.06 .48,.28 .36,.5 .16,.48 .05,.34'],
  7: ['.5; 0,1 .5,1 .16,0 | .1,.5 .4,.5'],
  8: ['.5; ~.25,.55 .08,.7 .1,.92 .25,1 .4,.92 .42,.7 .25,.55 .06,.34 .06,.1 .25,0 .44,.1 .44,.34 .25,.55'],
  9: ['.5; ~.46,.7 .38,.5 .18,.52 .04,.7 .1,.94 .26,1 .42,.92 .46,.7 .46,0'],
  '.': ['.16; .06,0 .08,.04'],
  ',': ['.16; .1,.04 .05,-.14'],
  ':': ['.16; .06,.02 .08,.06 | .06,.56 .08,.6'],
  ';': ['.16; .08,.56 .09,.6 | .1,.04 .05,-.14'],
  '!': ['.16; .07,1 .07,.3 | .07,0 .08,.04'],
  '?': ['.5; ~.02,.8 .12,.97 .28,1 .44,.9 .46,.7 .3,.52 .24,.4 .24,.28 | .24,0 .25,.04'],
  '-': ['.44; 0,.48 .44,.48'],
  "'": ['.12; .06,1 .06,.76'],
  '"': ['.26; .04,1 .04,.76 | .2,1 .2,.76'],
  '/': ['.4; .4,1 0,-.04'],
};

export const KESSLER: Hand = {
  glyphs: parseSet(KESSLER_SOURCE),
  smallCaps: 0.74,
  slant: -0.02,
  wander: 0.55,
  gap: 0.24,
  space: 0.58,
  weight: 0.85,
  tremor: 1,
  pencil: true,
  ink: [14, 14, 18],
};
