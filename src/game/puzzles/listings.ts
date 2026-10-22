import advent from '../tapes/advent.bas?raw';
import guess from '../tapes/guess.bas?raw';

/**
 * Programs the player is asked to type in. The magazine prints them and the watcher recognises them, so each lives
 * here once. One string per numbered line, exactly as the magazine shows it.
 */

/** Puzzle 2, the tutorial's first program. */
export const FIRST_PROGRAM: readonly string[] = [
  '10 PRINT "WHAT IS YOUR NAME"',
  '20 INPUT N$',
  '30 PRINT "HELLO, ";N$',
];

/** FIRST_PROGRAM's line that greets the player: by then N$ holds the name they typed. */
export const FIRST_PROGRAM_GREETS = 30;

/**
 * ADVENT (`tapes/advent.bas`): the line numbers the rules watch. Change them together with the tape file.
 * `typo` is the line with the misspelled word (it gives ?SN ERROR) and `fixed` the first line after it; `describe` prints a
 * room; `prompt` is where it waits for a command. The door's lock wants four numbers, one in each of four rooms, set in the
 * order they are read off the player's map like a page (`plate`): the tower clock (`clock`: one hand, straight down, 6), the
 * chapel's whisper (`whisper`: TWO), heard by LISTENing there (`listened`) or read in its REM, which the `altar` points at, the gallery mirror (`mirror`: NEVES, 7)
 * and the cellar's box, opened with the study desk's key (`box` locked, `unlock`, `card`: the nine of clubs). Code 6279.
 * The code is in plain digits at line 930 (`IF C$=`), the last lines of the program, so BREAK at the prompt and a plain LIST
 * shows it: the cheat, alongside the rooms. `door` is EXAMINE DOOR, `cellar` where the cellar shows its box, `tried` a wrong code (it says how many wheels clicked),
 * `vault` the room behind the door and `ending` where taking the gold there wins. `mapRooms` are the room numbers (ADVENT's R)
 * of every room but the vault. The variables are Q (door unlocked), LP (the lamp's room, 0 when carried) and KY (the key's).
 */
export const ADVENT = {
  typo: 30,
  fixed: 40,
  prompt: 60,
  describe: 200,
  vault: 240,
  chapel: 272,
  whisper: 274,
  listened: 576,
  cellar: 282,
  door: 640,
  plate: 645,
  mirror: 660,
  clock: 665,
  altar: 670,
  box: 676,
  card: 685,
  ending: 700,
  unlock: 830,
  tried: 960,
  mapRooms: [1, 2, 3, 5, 6, 7, 8],
} as const;

/** The whisper as ADVENT's REM writes it (read from the tape file, so the rule and the notes quote what LIST shows). */
export const ADVENT_WHISPER = advent
  .split('\n')
  .find((l) => l.startsWith(`${ADVENT.whisper} `))!
  .replace(/^\d+ REM /, '')
  .trim();

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

/**
 * Kessler's typing slips in the tape's GUESS (the Post-it on its page owns up to them): a word on the tape and as printed,
 * by line. Each is two letters swapped inside a string, so the program runs as it should and, a swap keeping a line's sum,
 * CHECK agrees with the magazine's table: they are a payoff for reading closely, not part of the puzzle (that is line 125).
 */
export const GUESS_TYPOS: Readonly<Record<number, readonly [tape: string, printed: string]>> = {
  30: ['NUBMER', 'NUMBER'],
  110: ['HIHG', 'HIGH'],
  120: ['TIRES', 'TRIES'],
};

/** GUESS as the magazine prints it: the tape file without the extra line, and with Kessler's typing put right. */
export const GUESS_PRINTED: readonly string[] = guess
  .split('\n')
  .filter((l) => l.trim() !== '' && !l.startsWith(`${GUESS_EXTRA_LINE} `))
  .map((l) => {
    const typo = GUESS_TYPOS[Number(l.split(' ')[0])];
    return typo ? l.replace(typo[0], typo[1]) : l;
  });

/** The door's code, read from ADVENT's own `IF C$=` line so that the rules can never drift from the tape. */
export const ADVENT_CODE = /IF C\$="(\d+)"/.exec(advent)![1];
