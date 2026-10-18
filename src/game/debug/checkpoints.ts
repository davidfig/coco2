import { ADVENT, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';
import { DECODER, HANGMAN_REM_LINE, MESSAGE_LINE } from '../puzzles/listingsMay';

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
  ['issue1-done', 'story: the evening ends'],
  ['issue1-closed', 'switched off after it'],
  ['issue2-waiting', 'next day: May and its tape'],
  ['may-loaded', 'loaded from the May tape'],
  ['hangman-loaded', 'HANGMAN in memory'],
  ['hangman-checked', 'CHECK on HANGMAN'],
  ['hangman-rem', `LISTed line ${HANGMAN_REM_LINE} (OK's REM)`],
  ['message-seen', `LISTed line ${MESSAGE_LINE}`],
  ['data-decoded', 'decoder printed OK\'s message'],
  ['seen-mayHangman', 'looked at the HANGMAN page'],
  ['oracle-passed', 'tape went past ORACLE'],
  ['oracle-asked', 'ORACLE answered in code'],
  ['oracle-read', 'decoded WHO ARE YOU'],
  ['oracle-answered', 'answered in DATA'],
  ['prompt-on-time', 'story: OK on time again'],
  ['issue2-done', 'story: the evening ends'],
  ['issue2-closed', 'switched off after it'],
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
const THANKS = [...FOUND, 'ok-thanks', 'saw-thanks'];
const MAY = [...THANKS, 'tape-inserted', 'issue1-done', 'issue1-closed', 'issue2-waiting'];
const SEEN_990 = [...MAY, 'may-loaded', 'hangman-loaded', 'message-seen'];
const DECODED = [...SEEN_990, 'hangman-checked', 'hangman-rem', 'data-decoded', 'seen-mayHangman'];
const ASKED = [...DECODED, 'oracle-passed', 'oracle-asked'];
const ANSWERED = [...ASKED, 'oracle-read', 'oracle-answered'];
const HANGMAN = 'CLOAD "HANGMAN"\n';
const DECODING = `${HANGMAN}${DECODER.join('\n')}\n`;
const ORACLE = 'CLOAD "ORACLE"\n';

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
  { label: 'Saw THANK YOU', flags: THANKS, named: true, typed: `${GUESS}${GUESS_EXTRA_LINE} REM ${GUESS_EXTRA_TEXT}. THANK YOU\n` },
  { label: 'May came (issue 2)', flags: MAY, named: true },
  { label: `HANGMAN, saw line ${MESSAGE_LINE}`, flags: SEEN_990, named: true, typed: HANGMAN },
  { label: 'Decoder typed in (RUN next)', flags: SEEN_990, named: true, typed: DECODING },
  { label: 'Decoded: ORACLE next', flags: DECODED, named: true, typed: ORACLE },
  { label: 'ORACLE asked (answer next)', flags: ASKED, named: true, typed: 'NEW\n10 DATA 1,0,6,18,9,5,14,4,-1\n' },
  { label: 'Answered ORACLE', flags: ANSWERED, named: true },
];
