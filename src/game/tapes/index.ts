import { TAPE_KEY, type TapeFile } from '../basic/tape';
import type { IssueId } from '../magazine/pages';
import { ORACLE_ON_TAPE, shutdownOnTape } from '../puzzles/listingsMay';
import { type AboutIssue, aboutTape } from './about';
import advent from './advent.bas?raw';
import guess from './guess.bas?raw';
import oracle from './oracle.bas?raw';
import rainbow from './rainbow.bas?raw';
import register from './register.bas?raw';

/**
 * The cassette in the recorder at power-on: this issue of Rainbow On Tape, in tape order. A new program is a `.bas`
 * file here (plain BASIC, one numbered line each, upper case, no line over 249 characters) plus an entry below; add it
 * to ABOUT's list (`MARCH_ABOUT`) too.
 */
/** March's ABOUT: everything on the tape. */
export const MARCH_ABOUT: AboutIssue = {
  month: 'MARCH 1986',
  next: 'NEXT ISSUE: WHEN YOU ARE READY',
  programs: [
    ['ABOUT', 'THIS PAGE'],
    ['GUESS', 'GUESS MY NUMBER'],
    ['RAINBOW', 'A COLOR SHOW'],
    ['ORACLE', 'ASK THE ORACLE'],
    ['ADVENT', 'THE ADVENTURE'],
  ],
};

export const RAINBOW_TAPE: readonly TapeFile[] = [
  { name: 'ABOUT', text: aboutTape(MARCH_ABOUT) },
  { name: 'GUESS', text: guess },
  { name: 'RAINBOW', text: rainbow },
  { name: 'ORACLE', text: oracle },
  { name: 'ADVENT', text: advent },
];

/** Where the May cassette's own recordings are kept (each cassette has its own; March's is the tape's default). */
export const MAY_TAPE_KEY = 'coco2.tape.may';

/** May's ABOUT: ABOUT and SHUTDOWN, as the magazine lists them; not ORACLE, which OK put there. */
export const MAY_ABOUT: AboutIssue = {
  month: 'MAY 1986',
  next: 'NEXT ISSUE: WHEN YOU ARE READY',
  programs: [
    ['ABOUT', 'THIS PAGE'],
    ['SHUTDOWN', 'PULL THE PLUG'],
  ],
};

/**
 * The May cassette: ABOUT and SHUTDOWN, as the magazine lists them, and ORACLE, which it does not (OK came with it). SHUTDOWN
 * carries OK's REM, which depends on whether the player deleted GUESS's extra line in March.
 */
export const mayTape = (deleted: boolean): readonly TapeFile[] => [
  { name: 'ABOUT', text: aboutTape(MAY_ABOUT) },
  { name: 'SHUTDOWN', text: shutdownOnTape(deleted) },
  { name: 'ORACLE', text: ORACLE_ON_TAPE },
];

/** Where the July cassette's own recordings are kept. */
export const JULY_TAPE_KEY = 'coco2.tape.july';

/** July's ABOUT: ABOUT and REGISTER, as the magazine lists them. */
export const JULY_ABOUT: AboutIssue = {
  month: 'JULY 1986',
  next: 'NEXT ISSUE: WHEN YOU ARE READY',
  programs: [
    ['ABOUT', 'THIS PAGE'],
    ['REGISTER', 'FILL IN THE CARD'],
  ],
};

/** The July cassette (docs/puzzles.md, Issue 3; planned: the file with no name goes after REGISTER). */
export const julyTape = (): readonly TapeFile[] => [
  { name: 'ABOUT', text: aboutTape(JULY_ABOUT) },
  { name: 'REGISTER', text: register },
];

/** Each cassette's own recordings (localStorage). */
export const TAPE_KEYS: Record<IssueId, string> = { march: TAPE_KEY, may: MAY_TAPE_KEY, july: JULY_TAPE_KEY };

/** What is on each issue's cassette as it goes in: May's depends on what the player did with GUESS's extra line in March. */
export function issueTape(id: IssueId, has: (flag: string) => boolean): readonly TapeFile[] {
  if (id === 'may') return mayTape(has('deleted-extra-line'));
  if (id === 'july') return julyTape();
  return RAINBOW_TAPE;
}
