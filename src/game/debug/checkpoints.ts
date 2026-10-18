import { ADVENT, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';

/**
 * Playtesting only: every story flag in the order a player usually earns it, with a word on what earns it. The debug
 * menu lists them in this order and a checkpoint sets them in this order (the notebook writes notes in flag order).
 */
export const STORY_FLAGS: readonly [flag: string, label: string][] = [
  ['booted', 'switched on'],
  ['printed', 'PRINT at the prompt'],
  ['first-program', 'ran the name program'],
  ['adventure-loaded', 'ran ADVENT'],
  ['adventure-sn', 'saw ?SN ERROR IN 30'],
  ['adventure-runs', 'fixed line 30'],
  ['looked', 'a room was described'],
  ['tamper-lamp', 'story: LAMP WAITS ON IT'],
  ['has-lamp', 'carrying the lamp'],
  ['mapped', 'stood in every room but the vault'],
  ['door-examined', 'EXAMINE DOOR'],
  ['lock-examined', 'asked about the lock'],
  ['plate-read', 'EXAMINE PLATE (the order)'],
  ['clock-read', 'EXAMINE CLOCK (6)'],
  ['mirror-read', 'EXAMINE MIRROR (7)'],
  ['box-seen', 'saw the locked box'],
  ['has-key', 'carrying the key'],
  ['box-opened', 'unlocked the box'],
  ['card-read', 'read the card (9)'],
  ['whisper-heard', 'heard the chapel whisper'],
  ['altar-read', 'EXAMINE ALTAR'],
  ['whisper-found', 'LISTed the whisper (2)'],
  ['code-tried', 'a wrong code'],
  ['read-code', 'LISTed the code line (the cheat)'],
  ['door-open', 'opened the vault door'],
  ['tamper-name', 'story: the name at the prompt'],
  ['adventure-won', 'took the cassette'],
  ['tamper-voice', 'story: the vault\'s "OK."'],
  ['seen-guess', 'looked at the GUESS page'],
  ['found-extra-line', `saw line ${GUESS_EXTRA_LINE}`],
  ['deleted-extra-line', `deleted line ${GUESS_EXTRA_LINE}`],
  ['ok-pleads', 'story: line back, PLEASE'],
  ['saw-pleads', 'listed it and saw PLEASE'],
  ['ok-thanks', 'story: line says THANK YOU'],
  ['saw-thanks', 'listed it and saw THANK YOU'],
];

/** ADVENT's line 30 as the magazine prints it (the tape's copy misspells PRINT). */
const FIX_30 = `${ADVENT.typo} PRINT "THE TAPE CRACKLES."\n`;

/**
 * A place in the story to jump to: exactly these flags (in this order), whether the first program's name is kept,
 * and what is typed at the CoCo afterwards to put the right program in memory (left for the player to RUN).
 */
export interface Checkpoint {
  label: string;
  flags: readonly string[];
  named?: boolean;
  typed?: string;
}

const START = ['booted'];
const HELLO = [...START, 'printed', 'first-program'];
const BROKEN = [...HELLO, 'adventure-loaded', 'adventure-sn'];
const FIXED = [...BROKEN, 'adventure-runs'];
const LAMP = [...FIXED, 'looked', 'tamper-lamp', 'has-lamp'];
const AT_DOOR = [...LAMP, 'mapped', 'door-examined', 'lock-examined', 'plate-read'];
const CLUES = [...AT_DOOR, 'clock-read', 'mirror-read', 'box-seen', 'has-key', 'box-opened', 'card-read', 'whisper-heard', 'altar-read', 'whisper-found'];
const OPEN = [...CLUES, 'door-open'];
const WON = [...OPEN, 'tamper-name', 'adventure-won', 'tamper-voice'];
const FOUND = [...WON, 'seen-guess', 'found-extra-line'];
const DELETED = [...FOUND, 'deleted-extra-line'];

const ADVENT_FIXED = `CLOAD "ADVENT"\n${FIX_30}`;
const GUESS = 'CLOAD "GUESS"\n';

export const CHECKPOINTS: readonly Checkpoint[] = [
  { label: 'Fresh start', flags: START },
  { label: 'Said hello', flags: [...START, 'printed'] },
  { label: 'Ran the name program', flags: HELLO, named: true },
  { label: 'ADVENT loaded, ?SN', flags: BROKEN, named: true, typed: 'CLOAD "ADVENT"\n' },
  { label: 'ADVENT fixed, before LOOK', flags: FIXED, named: true, typed: ADVENT_FIXED },
  { label: 'Lamp in hand', flags: LAMP, named: true, typed: ADVENT_FIXED },
  { label: 'Mapped, at the door', flags: AT_DOOR, named: true, typed: ADVENT_FIXED },
  { label: 'All four clues found', flags: CLUES, named: true, typed: ADVENT_FIXED },
  { label: 'Door open (name tamper next)', flags: OPEN, named: true, typed: ADVENT_FIXED },
  { label: 'Adventure won', flags: WON, named: true, typed: GUESS },
  { label: 'Found the extra line (kept)', flags: FOUND, named: true, typed: GUESS },
  { label: 'Deleted it (PLEASE next)', flags: DELETED, named: true, typed: `${GUESS}${GUESS_EXTRA_LINE}\n` },
  { label: 'Saw PLEASE', flags: [...DELETED, 'ok-pleads', 'saw-pleads'], named: true, typed: `${GUESS}${GUESS_EXTRA_LINE} REM ${GUESS_EXTRA_TEXT}, PLEASE\n` },
  { label: 'Saw THANK YOU', flags: [...FOUND, 'ok-thanks', 'saw-thanks'], named: true, typed: `${GUESS}${GUESS_EXTRA_LINE} REM ${GUESS_EXTRA_TEXT}. THANK YOU\n` },
];
