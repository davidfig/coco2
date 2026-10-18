import advent from '../tapes/advent.bas?raw';
import guess from '../tapes/guess.bas?raw';

/**
 * Programs the player is asked to type in. The magazine prints them and the watcher recognises them, so each lives
 * here once. One string per numbered line, exactly as the magazine shows it.
 */

/** Puzzle 2, the tutorial's first program. */
export const FIRST_PROGRAM: readonly string[] = [
  '10 CLS',
  '20 PRINT "WHAT IS YOUR NAME"',
  '30 INPUT N$',
  '40 PRINT "HELLO, ";N$',
  '50 GOTO 20',
];

/**
 * ADVENT (`tapes/advent.bas`): the line numbers the rules watch. Change them together with the tape file.
 * `door` is EXAMINE DOOR (a lock and a plate), `desk` the study desk's scrap that sends the player to the program, and `plate` where EXAMINE PLATE gives the riddle for it (answer 4976: Wick, 60 / 6.50, 14 / 2, the six rooms of Fig. 2); `typo` is the line with the misspelled word (it gives ?SN ERROR) and `fixed` the first line after it; `describe` prints a room; `prompt` is where it waits for a command; `rooms` are the three room descriptions; `vault` is
 * the room behind the locked door (its description) and `ending` where taking the gold there wins. The variables are Q (door unlocked) and LP (the lamp's room, 0 when carried).
 */
export const ADVENT = { door: 570, desk: 575, plate: 580, typo: 30, fixed: 40, describe: 200, prompt: 60, rooms: [210, 220, 230], vault: 235, ending: 700 } as const;

/**
 * Puzzle 5: the tape's GUESS has this extra line, which the magazine's printed copy lacks. It is inside the program, after the
 * win message, and near enough the end that a plain LIST (the screen holds 16 rows, so a long listing scrolls) still shows it.
 */
export const GUESS_EXTRA_LINE = 125;

/** What that line says (read from the tape file, so the rules and the notes always quote what the player will see). */
export const GUESS_EXTRA_TEXT = guess
  .split('\n')
  .find((l) => l.startsWith(`${GUESS_EXTRA_LINE} `))!
  .replace(/^\d+ REM /, '')
  .trim();

/** GUESS as the magazine prints it: the tape file without the extra line. */
export const GUESS_PRINTED: readonly string[] = guess
  .split('\n')
  .filter((l) => l.trim() !== '' && !l.startsWith(`${GUESS_EXTRA_LINE} `));

/** The door's code, read from ADVENT's own `IF C=` line so that the rules and the riddle's answer can never drift from the tape. */
export const ADVENT_CODE = /IF C=(\d+)/.exec(advent)![1];
