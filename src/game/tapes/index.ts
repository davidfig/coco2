import type { TapeFile } from '../basic/tape';
import { ORACLE_ON_TAPE, shutdownOnTape } from '../puzzles/listingsMay';
import about from './about.bas?raw';
import aboutMay from './aboutMay.bas?raw';
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

/** Where the May cassette's own recordings are kept (each cassette has its own; March's is the tape's default). */
export const MAY_TAPE_KEY = 'coco2.tape.may';

/**
 * The May cassette: ABOUT and SHUTDOWN, as the magazine lists them, and ORACLE, which it does not (OK came with it). SHUTDOWN
 * carries OK's REM, which depends on whether the player deleted GUESS's extra line in March.
 */
export const mayTape = (deleted: boolean): readonly TapeFile[] => [
  { name: 'ABOUT', text: aboutMay },
  { name: 'SHUTDOWN', text: shutdownOnTape(deleted) },
  { name: 'ORACLE', text: ORACLE_ON_TAPE },
];
