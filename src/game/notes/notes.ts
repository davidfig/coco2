/**
 * The player's own notebook page. The words are data (`notes.json`); this file reads them. Entries are what the player has
 * worked out, in their words, so each one appears only once the flag that earns it is set (`when`; null = from the start).
 * A question (`ask`) is the open end of the trail: it points at a page or a tape, never at the answer, and is crossed out
 * when its `solved` flag arrives. `mood` is how rushed the hand is, and climbs as the notes turn from learning BASIC to
 * what is going on. The clues are written as seen (what the player noticed in each room, never the digit itself), and OK
 * cannot hold a pencil: he changes the machine (see src/game/story), and the player writes down what they notice.
 *
 * In the text, `{p:id}` is page `id`'s number (`pageNo`), `{NAME}` one of `VALUES` below (`{NAME|sentence}` in sentence
 * case), `{day:N}` the date of day N and `{reply}` what the player answered ORACLE.
 */
import { pageNo, type AnyPageId } from '../magazine/pages';
import { ADVENT, ADVENT_WHISPER, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';
import { MESSAGE_LINE, ECHO_MESSAGE, ORACLE_ASK, ORACLE_HOW, PLUG_LINE, PLUG_QUESTION, SHUTDOWN_REM_LINE } from '../puzzles/listingsMay';
import { REPLY_KEY } from '../puzzles/rulesMay';
import data from './notes.json';

/** What is written: plain, or one of two lines depending on what the player went on to do. */
export type NoteText = string | { if: string; then: string; else: string };

export interface Note {
  id: string;
  /** The flag (or every one of several) that earns the note; null = from the start. */
  when: string | readonly string[] | null;
  text: NoteText;
  mood: number;
  ask?: boolean;
  /** The flag (or every one of several) that answers a question. */
  solved?: string | readonly string[];
  /** Another flag that also answers it on its own (the player found a different way past). */
  orSolved?: string;
  /** Not worth writing if this flag arrived first: the player is already past it (a dark room, once the lamp is in hand). */
  skipIf?: string;
  /** A new day's date, written at the right as a heading over that day's notes. */
  date?: boolean;
}

/**
 * The day each issue is read: the first is the first sheet's heading, and each one after starts with its date, written when
 * its box arrives (the flag). Each issue is one day, the next one's box coming the morning after (docs/story.md).
 */
export const DAYS: readonly { when: string | null; date: string }[] = data.days;

export const NOTES: readonly Note[] = data.notes as readonly Note[];

/** Flags that change a note's words, so the page is rewritten when they arrive. */
export const noteReads = (n: Note): string[] => (typeof n.text === 'string' ? [] : [n.text.if]);

/** The listings' words and numbers the notes quote. */
const VALUES: Record<string, string | number> = {
  ADVENT_WHISPER_LINE: ADVENT.whisper,
  ADVENT_WHISPER,
  GUESS_EXTRA_LINE,
  GUESS_EXTRA_TEXT,
  MESSAGE_LINE,
  ECHO_MESSAGE,
  ORACLE_ASK,
  ORACLE_HOW,
  PLUG_LINE,
  PLUG_QUESTION,
  SHUTDOWN_REM_LINE,
  SHUTDOWN_REM_NEXT: SHUTDOWN_REM_LINE + 1,
};

const sentence = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase();

/** One `{…}` in a note's text, filled in; throws on one it doesn't know (the test runs every note through). */
function fill(key: string): string {
  if (key === 'reply') return savedReply();
  const [kind, arg] = key.split(':');
  if (kind === 'p') {
    const n = pageNo(arg as AnyPageId);
    if (n < 1) throw new Error(`notes: no page "${arg}"`);
    return String(n);
  }
  if (kind === 'day') return DAYS[Number(arg)].date;
  const [name, how] = key.split('|');
  const value = VALUES[name];
  if (value === undefined) throw new Error(`notes: no value "${name}"`);
  return how === 'sentence' ? sentence(String(value)) : String(value);
}

/** The reply as the sheet worker (`sheetWorker.ts`) was told it: it has no localStorage. */
let told: string | null = null;
export function tellReply(reply: string): void {
  told = reply;
}

/** What the player answered ORACLE (`oracle-answered` keeps it). */
export function savedReply(): string {
  if (told !== null) return told;
  try {
    return localStorage.getItem(REPLY_KEY) ?? '';
  } catch {
    return '';
  }
}

/** The words of a note, given what the player has done. */
export const noteText = (n: Note, flags: ReadonlySet<string>): string => {
  const text = typeof n.text === 'string' ? n.text : flags.has(n.text.if) ? n.text.then : n.text.else;
  return text.replace(/\{([^}]+)\}/g, (_, key: string) => fill(key));
};

/**
 * The notes the player has earned, in the order they were earned: the flags remember the order they were set in, so a
 * note goes where the player would have written it, and the question they are on is always the newest line.
 */
const all = (need: string | readonly string[], flags: ReadonlySet<string>): boolean => (typeof need === 'string' ? flags.has(need) : need.every((f) => flags.has(f)));

/** True once a question has been answered (it is then crossed out). */
export const isSolved = (n: Note, flags: ReadonlySet<string>): boolean => (n.solved !== undefined && all(n.solved, flags)) || (n.orSolved !== undefined && flags.has(n.orSolved));

export const visibleNotes = (flags: ReadonlySet<string>): Note[] => {
  const order = [...flags];
  // A note earned by several flags is written when the last of them arrives.
  const earned = (n: Note): number => (n.when === null ? -1 : Math.max(...[n.when].flat().map((f) => order.indexOf(f))));
  // A note made moot by something that happened first is never written.
  const moot = (n: Note): boolean => n.skipIf !== undefined && flags.has(n.skipIf) && order.indexOf(n.skipIf) < earned(n);
  return NOTES.filter((n) => (n.when === null || all(n.when, flags)) && !moot(n)).sort((a, b) => earned(a) - earned(b));
};
