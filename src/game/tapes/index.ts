import type { TapeFile } from '../basic/tape';
import about from './about.bas?raw';
import advent from './advent.bas?raw';
import guess from './guess.bas?raw';
import oracle from './oracle.bas?raw';
import rainbow from './rainbow.bas?raw';

/**
 * The cassette in the recorder at power-on: this issue of Rainbow On Tape, in tape order. A new program is a `.bas`
 * file here (plain BASIC, one numbered line each, upper case, no line over 249 characters) plus an entry below; add it
 * to ABOUT's list (the DATA at line 2000) too.
 */
export const RAINBOW_TAPE: readonly TapeFile[] = [
  { name: 'ABOUT', text: about },
  { name: 'GUESS', text: guess },
  { name: 'RAINBOW', text: rainbow },
  { name: 'ORACLE', text: oracle },
  { name: 'ADVENT', text: advent },
];
