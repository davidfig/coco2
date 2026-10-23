import { pageNo } from '../magazine/pages';
import { ADVENT_CODE, FIRST_PROGRAM, GUESS_EXTRA_LINE } from '../puzzles/listings';
import { DECODER, encode, ORACLE_ASK, PLUG_PRINTED } from '../puzzles/listingsMay';
import type { Part } from './walkthrough';

/**
 * The scripted player's route through the game (`walkthrough.ts` plays it): the main route, and each choice's other
 * branch. A new beat gets a step here.
 */

/** The name the scripted player gives the first program. */
const NAME = 'ALEX';
/** What they answer ORACLE. */
const REPLY = 'A FRIEND';

/** The SHUTDOWN walk from the airlock to the core's plug (the three rules typed at the door). */
const TO_THE_CORE = ['E', 'N', 'N', 'REST IT', 'WATCH IT', 'KEEP IT SMALL'];

export const MARCH: readonly Part[] = [
  {
    title: 'Issue 1 (March): the desk',
    steps: [
      { say: 'The page opens: the set comes on, the CoCo boots. The guide bounces the notes', wait: 0 },
      { say: 'Holds up the notes', act: (p) => p.set('opened-notes') },
      { say: 'Opens the magazine', act: (p) => p.set('opened-magazine') },
      { say: `Says hello (the notes point at p.${pageNo('screen')})`, type: ['PRINT "HELLO"'] },
      { say: `Types in the name program from p.${pageNo('program')}`, type: [...FIRST_PROGRAM] },
      { say: 'Runs it', type: ['RUN'] },
      { say: 'Gives it a name', type: [NAME] },
    ],
  },
  {
    title: 'Issue 1: ADVENT',
    steps: [
      { say: `Loads the adventure (p.${pageNo('tape')}) and runs it`, type: ['CLOAD "ADVENT"', 'RUN'] },
      { say: 'Lists the broken line and types it as the magazine prints it', type: ['LIST 30', '30 PRINT "SOMEONE HAS BEEN HERE BEFORE."', 'RUN'] },
      { say: 'Looks, in the dark, and reads it', type: ['LOOK'], wait: 3 },
      { say: 'Takes the lamp and looks again', type: ['TAKE LAMP', 'LOOK'] },
      { say: 'West to the cellar: the box', type: ['W', 'EXAMINE BOX'] },
      { say: 'Back east, north to the hall: the door and its plate', type: ['E', 'N', 'EXAMINE DOOR', 'EXAMINE PLATE'] },
      { say: 'West to the gallery: the mirror', type: ['W', 'EXAMINE MIRROR'] },
      { say: 'North to the tower: the clock', type: ['N', 'EXAMINE CLOCK'] },
      { say: 'Back to the hall, east to the study: the desk and its key', type: ['S', 'E', 'E', 'EXAMINE DESK', 'TAKE KEY'] },
      { say: 'North to the chapel: the altar, then listens', type: ['N', 'EXAMINE ALTAR', 'LISTEN'] },
      { say: 'Back to the cellar: opens the box', type: ['S', 'W', 'S', 'W', 'OPEN BOX', 'EXAMINE CARD'] },
      { say: 'To the door: a wrong code first', type: ['E', 'N', 'N', '6297'] },
      { say: 'The code, in map order', type: ['N', ADVENT_CODE] },
      { say: 'Takes the gold, and waits', type: ['TAKE GOLD'], wait: 4 },
    ],
  },
  {
    title: 'Issue 1: GUESS and the extra line',
    steps: [
      { say: `Loads GUESS to check it against p.${pageNo('guess')}`, type: ['CLOAD "GUESS"'], wait: 6 },
      { say: 'CHECKs it', type: ['CHECK'] },
      { say: 'Lists it', type: ['LIST'] },
      { say: `Turns to GUESS on p.${pageNo('guess')}`, act: (p) => p.look('guess') },
    ],
  },
];

/** March's extra line: left alone (what players do), or deleted by a curious one. Not a choice the game asks for. */
export const KEPT: readonly Part[] = [{ title: 'Issue 1: the extra line (left)', steps: [{ say: 'Leaves line 125 alone and goes on', wait: 14 }] }];
export const DELETED: readonly Part[] = [{ title: 'Issue 1: the extra line (deleted)', steps: [{ say: `Deletes line ${GUESS_EXTRA_LINE}`, type: [`${GUESS_EXTRA_LINE}`], wait: 7 }] }];

export const MAY: readonly Part[] = [
  {
    title: 'The night between',
    steps: [
      { say: 'Switches the set off', act: (p) => p.switchOff() },
      { say: 'Switches it on: the next day', act: (p) => p.switchOn() },
      { say: 'Puts the May cassette in the recorder', act: (p) => p.insert('may') },
    ],
  },
  {
    title: 'Issue 2 (May): SHUTDOWN, the message',
    steps: [
      { say: `Loads SHUTDOWN (May p.${pageNo('mayTape')})`, type: ['CLOAD "SHUTDOWN"'] },
      { say: `CHECKs it against May p.${pageNo('mayShutdown')}`, type: ['CHECK'] },
      { say: 'Lists the top', type: ['LIST -20'] },
      { say: 'Lists the message line', type: ['LIST 990'] },
      { say: `Types the decoder from May p.${pageNo('maySecret')} and runs it`, type: [...DECODER, 'RUN'] },
      { say: `Turns to SHUTDOWN's last page, May p.${pageNo('mayShutdownEnd')}`, act: (p) => p.look('mayShutdownEnd') },
    ],
  },
  {
    title: 'Issue 2: ORACLE',
    steps: [
      { say: 'Loads the next file on the tape and runs it', type: ['CLOAD', 'RUN', 'WHO WROTE THE TAPE', ''] },
      { say: 'Decodes the answer under the decoder', type: ['NEW', ...DECODER, `10 DATA ${encode(ORACLE_ASK)}`, 'RUN'] },
      { say: 'Answers it in DATA', type: [`10 DATA ${encode(REPLY)}`, 'RUN'] },
    ],
  },
  {
    title: 'Issue 2: SHUTDOWN, the game',
    steps: [
      { say: 'Loads SHUTDOWN and plays: listens to a terminal', type: ['CLOAD "SHUTDOWN"', 'RUN', 'TAKE UNIT', 'E', 'LISTEN'] },
      { say: 'Plays to the core and pulls the plug', type: ['TAKE UNIT', ...TO_THE_CORE, 'PULL PLUG'], wait: 2 },
      { say: 'Plays again', type: ['RUN', 'TAKE UNIT', ...TO_THE_CORE, 'PULL PLUG'] },
    ],
  },
];

/** May's choice: put line 710 back and pull the plug (the default), or leave it. */
export const PULLED: readonly Part[] = [
  {
    title: 'Issue 2: the choice (pulled)',
    steps: [
      { say: 'BREAKs, types line 710 as printed', act: (p) => p.coco.break(), type: [PLUG_PRINTED] },
      { say: 'Plays to the core again and pulls it', type: ['RUN', 'TAKE UNIT', ...TO_THE_CORE, 'PULL PLUG'], wait: 2 },
    ],
  },
];
export const LEFT: readonly Part[] = [{ title: 'Issue 2: the choice (left)', steps: [{ say: 'BREAKs and loads something else', act: (p) => p.coco.break(), type: ['CLOAD "ORACLE"'], wait: 8 }] }];

export const END: readonly Part[] = [{ title: 'The end of issue 2', steps: [{ say: 'Switches the set off', act: (p) => p.switchOff() }] }];

/** Issue 3, as far as it is built: the July box, its tape, REGISTER. */
export const JULY: readonly Part[] = [
  {
    title: 'Issue 3 (July): the box, REGISTER',
    steps: [
      { say: 'Switches it on: the next day', act: (p) => p.switchOn() },
      { say: 'Puts the July cassette in the recorder', act: (p) => p.insert('july') },
      { say: `Loads REGISTER (July p.${pageNo('julyTape')}) and runs it`, type: ['CLOAD "REGISTER"', 'RUN', NAME, '26-3026B', 'DAYTON', '1'] },
    ],
  },
];

export interface Route {
  name: string;
  parts: readonly Part[];
  /** Parts written out in full (the others run, but only the main route shows them). */
  shows?: readonly Part[];
}

export const ROUTES: readonly Route[] = [
  { name: 'Left the line, pulled the plug', parts: [...MARCH, ...KEPT, ...MAY, ...PULLED, ...END, ...JULY] },
  { name: 'Deleted the line', parts: [...MARCH, ...DELETED, ...MAY, ...PULLED, ...END], shows: [...DELETED, MAY[1]] },
  { name: 'Left the plug', parts: [...MARCH, ...KEPT, ...MAY, ...LEFT, ...END], shows: [...LEFT, ...END] },
];
