/**
 * The player's own notebook page. Entries are what the player has worked out, in their words, so each one appears only
 * once the flag that earns it is set (`when`; null = from the start). A question (`ask`) is the open end of the trail: it
 * points at a page or a tape, never at the answer, and is crossed out when its `solved` flag arrives. `mood` is how
 * rushed the hand is, and climbs as the notes turn from learning BASIC to what is going on.
 */
import { pageNo } from '../magazine/pages';
import { ADVENT, ADVENT_WHISPER, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';

export interface Note {
  id: string;
  /** The flag (or every one of several) that earns the note; null = from the start. */
  when: string | readonly string[] | null;
  /** What is written; a function when the line depends on what the player went on to do. */
  text: string | ((flags: ReadonlySet<string>) => string);
  /** Flags that change the words (for a `text` function), so the page is rewritten when they arrive. */
  reads?: readonly string[];
  mood: number;
  ask?: boolean;
  /** The flag (or every one of several) that answers a question. */
  solved?: string | readonly string[];
  /** Another flag that also answers it on its own (the player found a different way past). */
  orSolved?: string;
  /** Not worth writing if this flag arrived first: the player is already past it (a dark room, once the lamp is in hand). */
  skipIf?: string;
}

export const NOTES: readonly Note[] = [
  { id: 'start', when: null, text: `PRINT "HELLO" first. p.${pageNo('screen')}`, mood: 0.04, ask: true, solved: 'printed' },
  { id: 'enter', when: 'printed', text: 'Press ENTER and it answers', mood: 0.04 },
  { id: 'prog', when: 'printed', text: `Type in the program, p.${pageNo('typeIn')}. Help: p.${pageNo('program')}`, mood: 0.05, ask: true, solved: 'first-program' },
  { id: 'lines', when: 'first-program', text: 'Numbered lines stay. RUN = go, ESC = stop', mood: 0.07 },
  { id: 'tape', when: 'first-program', text: `Adventure is on the tape. CLOAD it, RUN. p.${pageNo('tape')}`, mood: 0.08, ask: true, solved: 'adventure-loaded' },
  { id: 'label', when: 'tape-inserted', text: 'Rainbow tape in the recorder. Label, in pencil: "Copied by hand, for you. Mistakes are mine. - M. Kessler"', mood: 0.08 },
  { id: 'sn', when: 'adventure-sn', text: `?SN ERROR IN 30. LIST 30, fix it. p.${pageNo('program')}`, mood: 0.09, ask: true, solved: 'adventure-runs' },
  { id: 'err', when: 'adventure-runs', text: 'Line 30 misspelled. Retyped. Kessler\'s mistake?', mood: 0.1 },
  { id: 'begin', when: 'adventure-runs', text: 'Runs now. Says: type LOOK', mood: 0.1, ask: true, solved: 'looked', orSolved: 'has-lamp' },
  { id: 'dark', when: 'looked', text: 'Pitch dark. Feel around for a light', mood: 0.1, ask: true, solved: 'has-lamp', skipIf: 'has-lamp' },
  { id: 'explore', when: 'has-lamp', text: `Got the lamp. Walk my map, p.${pageNo('map')}`, mood: 0.11, ask: true, solved: 'mapped' },
  { id: 'rooms', when: 'mapped', text: 'Been in every room but one', mood: 0.12 },
  { id: 'door', when: 'mapped', text: 'Hall, north door locked. EXAMINE DOOR?', mood: 0.14, ask: true, solved: 'lock-examined' },
  { id: 'platehint', when: 'door-examined', text: 'Lock has a plate. EXAMINE PLATE', mood: 0.15, ask: true, solved: 'plate-read' },
  { id: 'plate', when: 'plate-read', text: `4 rooms, 4 numbers. In order: read my map like a page, p.${pageNo('map')}`, mood: 0.17, ask: true, solved: 'door-open' },
  // The clues, as seen: what the player noticed in each room, never the digit itself.
  { id: 'clock', when: 'clock-read', text: 'Tower clock: one hand, pointing straight down', mood: 0.15 },
  { id: 'mirror', when: 'mirror-read', text: 'In the dust on the mirror: NEVES. Backwards?', mood: 0.16 },
  { id: 'box', when: 'box-seen', text: 'Cellar: iron box, locked. Key somewhere?', mood: 0.15, ask: true, solved: 'box-opened', orSolved: 'card-read' },
  { id: 'key', when: 'has-key', text: 'Small iron key, from the study desk', mood: 0.14 },
  { id: 'card', when: 'card-read', text: 'In the box: one card, the nine of clubs', mood: 0.16 },
  { id: 'whisper', when: 'whisper-heard', text: 'Chapel: a whisper, gone before I hear it', mood: 0.18, ask: true, solved: 'whisper-found' },
  { id: 'altar', when: 'altar-read', text: `Altar: "wrote it in my lines, the 270s". ESC, LIST 270-280? p.${pageNo('stopping')}`, mood: 0.2, ask: true, solved: 'whisper-found' },
  { id: 'heard', when: 'whisper-found', text: `Line ${ADVENT.whisper}, in the listing: ${ADVENT_WHISPER.charAt(0)}${ADVENT_WHISPER.slice(1).toLowerCase()}`, mood: 0.2 },
  { id: 'clicks', when: 'code-tried', text: 'Wrong code. Some wheels click: right number, right place?', mood: 0.18, ask: true, solved: 'door-open' },
  {
    id: 'opened',
    when: 'door-open',
    text: (f) => (f.has('read-code') ? 'Code was right there in the listing! Open!' : 'Clock, whisper, mirror, card, in map order. Open!'),
    reads: ['read-code'],
    mood: 0.16,
  },
  { id: 'vault', when: 'door-open', text: 'A vault. A chest of gold!', mood: 0.2, ask: true, solved: 'adventure-won' },
  { id: 'won', when: 'adventure-won', text: 'Took the gold. WON! 100/100', mood: 0.15 },
  { id: 'voice', when: 'tamper-voice', text: 'Strange: after the game, HELLO came up on the screen by itself. Shimmering. What is that?', mood: 0.34 },
  { id: 'guess', when: 'tamper-voice', text: `"Mistakes are mine." Check GUESS against p.${pageNo('guess')}`, mood: 0.3, ask: true, solved: ['found-extra-line', 'seen-guess'] },
  { id: 'oddline', when: 'found-extra-line', text: `Odd line in GUESS. Is it on p.${pageNo('guess')}?`, mood: 0.35, ask: true, solved: 'seen-guess', skipIf: 'seen-guess' },
  { id: 'line75', when: ['found-extra-line', 'seen-guess'], text: (f) => `Line ${GUESS_EXTRA_LINE}: "${GUESS_EXTRA_TEXT.charAt(0)}${GUESS_EXTRA_TEXT.slice(1).toLowerCase()}"${f.has('deleted-extra-line') ? ' - deleted' : ''}`, reads: ['deleted-extra-line'], mood: 0.5 },
  { id: 'who', when: ['found-extra-line', 'seen-guess'], text: 'Who is asking?', mood: 0.72, ask: true },
  { id: 'choice', when: ['found-extra-line', 'seen-guess'], text: `Delete it (type ${GUESS_EXTRA_LINE})? Or leave it?`, mood: 0.6, ask: true, solved: 'deleted-extra-line', orSolved: 'ok-thanks' },
  // OK cannot hold a pencil: he changes the machine (see src/game/story), and the player writes down what they notice.
  { id: 'saw-pleads', when: 'saw-pleads', text: 'Deleted it. Then the screen: IS ANYONE READING THIS, PLEASE. Line is back', mood: 0.55 },
  { id: 'saw-thanks', when: 'saw-thanks', text: 'Left it. Then THANK YOU, on the screen. The line says it too', mood: 0.4 },
  { id: 'night', when: 'issue1-done', text: 'Enough for tonight. Switch it off', mood: 0.3, ask: true, solved: 'issue1-closed' },
  { id: 'nextday', when: 'issue2-waiting', text: 'Next day. May RAINBOW came: cover only!', mood: 0.2 },
];

/** The words of a note, given what the player has done. */
export const noteText = (n: Note, flags: ReadonlySet<string>): string => (typeof n.text === 'string' ? n.text : n.text(flags));

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
