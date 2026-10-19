/**
 * The player's own notebook page. Entries are what the player has worked out, in their words, so each one appears only
 * once the flag that earns it is set (`when`; null = from the start). A question (`ask`) is the open end of the trail: it
 * points at a page or a tape, never at the answer, and is crossed out when its `solved` flag arrives. `mood` is how
 * rushed the hand is, and climbs as the notes turn from learning BASIC to what is going on.
 */
import { pageNo } from '../magazine/pages';
import { ADVENT, ADVENT_WHISPER, GUESS_EXTRA_LINE, GUESS_EXTRA_TEXT } from '../puzzles/listings';
import { MESSAGE_LINE, OK_MESSAGE, ORACLE_ASK, ORACLE_HOW, PLUG_LINE, PLUG_QUESTION, SHUTDOWN_REM_LINE } from '../puzzles/listingsMay';
import { REPLY_KEY } from '../puzzles/rulesMay';

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
  /** A new day's date, written at the right as a heading over that day's notes. */
  date?: boolean;
}

/**
 * The day each issue is read: the first is the first sheet's heading, and each one after starts with its date, written when
 * its box arrives (the flag). Each issue is one day, the next one's box coming the morning after (docs/story.md).
 */
export const DAYS: readonly { when: string | null; date: string }[] = [
  { when: null, date: 'Mar 14, 1991' },
  { when: 'issue2-waiting', date: 'Mar 15, 1991' },
];

export const NOTES: readonly Note[] = [
  { id: 'found', when: null, text: "Found Grandpa's CoCo 2 in the basement. Same as the one at the museum. Is it even legal?", mood: 0.04 },
  { id: 'parcel', when: null, text: 'A box on the step: the March 1986 RAINBOW and a tape. No name on it', mood: 0.04 },
  { id: 'start', when: null, text: `PRINT "HELLO" first. p.${pageNo('screen')}`, mood: 0.04, ask: true, solved: 'printed' },
  { id: 'prog', when: 'printed', text: `Type in the program, p.${pageNo('typeIn')}. Help: p.${pageNo('program')}`, mood: 0.05, ask: true, solved: 'first-program' },
  { id: 'tape', when: 'first-program', text: `Adventure is on the tape. CLOAD it, RUN. p.${pageNo('tape')}`, mood: 0.08, ask: true, solved: 'adventure-loaded' },
  { id: 'label', when: 'tape-inserted', text: 'Label on the tape, in pencil: "Copied by hand, for you. Mistakes are mine. - M. Kessler"', mood: 0.08 },
  { id: 'sn', when: 'adventure-sn', text: `?SN ERROR IN 30. LIST 30, fix it. p.${pageNo('program')}`, mood: 0.09, ask: true, solved: 'adventure-runs' },
  { id: 'err', when: 'adventure-runs', text: 'PRNT for PRINT in line 30. Kessler\'s mistake?', mood: 0.1 },
  { id: 'begin', when: 'adventure-runs', text: 'Runs now. Says: type LOOK', mood: 0.1, ask: true, solved: 'looked', orSolved: 'has-lamp' },
  { id: 'dark', when: 'looked', text: 'Pitch dark. Feel around for a light', mood: 0.1, ask: true, solved: 'has-lamp', skipIf: 'has-lamp' },
  { id: 'waits', when: 'tamper-lamp', text: 'Did the lamp line just change? WAITS?', mood: 0.24 },
  { id: 'explore', when: 'has-lamp', text: `Got the lamp. Walk my map, p.${pageNo('map')}`, mood: 0.11, ask: true, solved: 'mapped' },
  { id: 'door', when: 'mapped', text: 'Been everywhere but behind the hall\'s north door. Locked. EXAMINE DOOR?', mood: 0.14, ask: true, solved: 'lock-examined' },
  { id: 'plate', when: 'plate-read', text: `4 rooms, 4 numbers. In order: read my map like a page, p.${pageNo('map')}`, mood: 0.17, ask: true, solved: 'door-open' },
  // The clues, as seen: what the player noticed in each room, never the digit itself.
  { id: 'clock', when: 'clock-read', text: 'Tower clock: one hand, pointing straight down', mood: 0.15 },
  { id: 'mirror', when: 'mirror-read', text: 'In the dust on the mirror: NEVES', mood: 0.16 },
  { id: 'box', when: 'box-seen', text: 'Cellar: iron box, locked. Key somewhere?', mood: 0.15, ask: true, solved: 'box-opened', orSolved: 'card-read' },
  { id: 'card', when: 'card-read', text: 'In the box: one card, the nine of clubs', mood: 0.16 },
  { id: 'whisper', when: 'whisper-heard', text: 'Chapel: a whisper, gone before I hear it', mood: 0.18, ask: true, solved: 'whisper-found', orSolved: 'whisper-listened' },
  { id: 'altar', when: 'altar-read', text: `Altar: "wrote it in my lines, the 270s". ESC, LIST 270-280? p.${pageNo('stopping')}`, mood: 0.2, ask: true, solved: 'whisper-found', orSolved: 'whisper-listened' },
  { id: 'listened', when: 'whisper-listened', text: 'Held my breath in the chapel. A voice: "Two"', mood: 0.22 },
  { id: 'heard', when: 'whisper-found', text: `Line ${ADVENT.whisper}, in the listing: ${ADVENT_WHISPER.charAt(0)}${ADVENT_WHISPER.slice(1).toLowerCase()}`, mood: 0.2 },
  { id: 'clicks', when: 'code-tried', text: 'Wrong code. Some wheels click: right number, right place?', mood: 0.18, ask: true, solved: 'door-open' },
  {
    id: 'opened',
    when: 'door-open',
    text: (f) => (f.has('read-code') ? 'Code was right there in the listing! Open!' : 'Clock, whisper, mirror, card, in map order. Open!'),
    reads: ['read-code'],
    mood: 0.16,
  },
  { id: 'name', when: 'tamper-name', text: 'The prompt said my name instead of OK. Just for a second', mood: 0.3 },
  { id: 'won', when: 'adventure-won', text: 'Vault behind the door. Took the gold. WON! 100/100', mood: 0.15 },
  { id: 'voice', when: 'tamper-voice', text: 'After I won, HELLO wrote itself on the screen. I didn\'t type it', mood: 0.34 },
  { id: 'guess', when: 'tamper-voice', text: `"Mistakes are mine." GUESS is printed, p.${pageNo('guess')}. CHECK it`, mood: 0.3, ask: true, solved: ['found-extra-line', 'seen-guess'] },
  { id: 'oddline', when: 'found-extra-line', text: `Odd line in GUESS. Is it on p.${pageNo('guess')}?`, mood: 0.35, ask: true, solved: 'seen-guess', skipIf: 'seen-guess' },
  { id: 'extra-line', when: ['found-extra-line', 'seen-guess'], text: (f) => `Line ${GUESS_EXTRA_LINE}: "${GUESS_EXTRA_TEXT.charAt(0)}${GUESS_EXTRA_TEXT.slice(1).toLowerCase()}"${f.has('deleted-extra-line') ? ' - deleted' : ''}`, reads: ['deleted-extra-line'], mood: 0.5 },
  { id: 'who', when: ['found-extra-line', 'seen-guess'], text: 'Who is asking?', mood: 0.72, ask: true },
  { id: 'choice', when: ['found-extra-line', 'seen-guess'], text: `Delete it (type ${GUESS_EXTRA_LINE})? Or leave it?`, mood: 0.6, ask: true, solved: 'deleted-extra-line', orSolved: 'ok-thanks' },
  // OK cannot hold a pencil: he changes the machine (see src/game/story), and the player writes down what they notice.
  { id: 'saw-pleads', when: 'saw-pleads', text: 'Deleted it. The screen: IS ANYONE READING THIS, PLEASE. The line is back', mood: 0.55 },
  { id: 'saw-thanks', when: 'saw-thanks', text: 'Left it. The screen: THANK YOU. So does the line', mood: 0.4 },
  { id: 'night', when: 'issue1-done', text: "Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning", mood: 0.3, ask: true, solved: 'issue1-closed' },
  { id: 'day2', when: 'issue2-waiting', text: DAYS[1].date, mood: 0.05, date: true },
  { id: 'nextday', when: 'issue2-waiting', text: 'Another box on the step: the May RAINBOW and a new tape', mood: 0.2 },
  // Issue 2: SHUTDOWN and the message in it, the ORACLE that came with it, an answer, and the plug that will not come.
  { id: 'maytape', when: 'issue2-waiting', text: `What's on the new tape? May p.${pageNo('mayTape')}`, mood: 0.15, ask: true, solved: 'may-loaded' },
  { id: 'secret', when: 'may-loaded', text: `Message hidden in SHUTDOWN's DATA. Decoder: May p.${pageNo('maySecret')}`, mood: 0.18, ask: true, solved: 'data-decoded' },
  { id: 'shutdown', when: 'shutdown-loaded', text: `Check SHUTDOWN against May p.${pageNo('mayShutdown')}, like GUESS`, mood: 0.2, ask: true, solved: 'shutdown-rem' },
  { id: 'checked', when: 'shutdown-checked', text: 'CHECK is off right from the top. LIST -20', mood: 0.3, ask: true, solved: 'shutdown-rem', skipIf: 'shutdown-rem' },
  {
    id: 'rem15',
    when: 'shutdown-rem',
    text: (f) => (f.has('deleted-extra-line') ? `Line ${SHUTDOWN_REM_LINE}: IS ANYONE READING THIS, PLEASE. On the new tape!` : `Line ${SHUTDOWN_REM_LINE}: IS ANYONE READING THIS. Then ${SHUTDOWN_REM_LINE + 1}: YES. SOMEONE IS`),
    reads: ['deleted-extra-line'],
    mood: 0.62,
  },
  { id: '990', when: 'message-seen', text: `Line ${MESSAGE_LINE}: just numbers. The code, May p.${pageNo('maySecret')}`, mood: 0.25, ask: true, solved: 'data-decoded' },
  { id: 'decoded', when: 'data-decoded', text: `${MESSAGE_LINE} says: ${OK_MESSAGE}`, mood: 0.7 },
  { id: 'same990', when: 'data-decoded', text: `Is ${MESSAGE_LINE} the same on May p.${pageNo('mayShutdownEnd')}?`, mood: 0.6, ask: true, solved: 'seen-mayShutdownEnd', skipIf: 'seen-mayShutdownEnd' },
  { id: 'touched', when: ['data-decoded', 'seen-mayShutdownEnd'], text: `May p.${pageNo('mayShutdownEnd')} has a different ${MESSAGE_LINE}. Something DID touch it`, mood: 0.78 },
  { id: 'delphi', when: 'data-decoded', text: 'The rest of the DATA is DELPHI talking. Sounds like the Clear Mind page', mood: 0.5 },
  { id: 'what-else', when: 'data-decoded', text: 'What else is on this tape? CLOAD, watch the F', mood: 0.4, ask: true, solved: 'oracle-passed', skipIf: 'oracle-passed' },
  { id: 'oracle-here', when: 'oracle-passed', text: `ORACLE is on this tape. Not on May p.${pageNo('mayTape')}'s list`, mood: 0.5, ask: true, solved: 'oracle-asked' },
  { id: 'numbers', when: 'oracle-asked', text: 'ORACLE answers in numbers now. The code?', mood: 0.55, ask: true, solved: 'oracle-read', orSolved: 'oracle-answered' },
  { id: 'asks', when: 'oracle-read', text: `ORACLE: ${ORACLE_ASK}. ${ORACLE_HOW}`, mood: 0.8 },
  { id: 'answer', when: 'oracle-read', text: `Answer it? My own DATA, in the code. May p.${pageNo('maySecret')}`, mood: 0.6, ask: true, solved: 'oracle-answered' },
  { id: 'answered', when: 'oracle-answered', text: () => `Answered in DATA: "${savedReply()}"`, mood: 0.6 },
  { id: 'listened', when: 'listened', text: 'Listened to a terminal. Woke up in the airlock. DO NOT LISTEN', mood: 0.2 },
  { id: 'rules', when: 'door-asked', text: `Core door wants the THREE RULES. May p.${pageNo('mayShutdown')} says where`, mood: 0.25, ask: true, solved: 'rules-spoken' },
  { id: 'won2', when: 'shutdown-won', text: 'Pulled the plug. KEEP YOURS SMALL. 100 of 100', mood: 0.3 },
  { id: 'flinch', when: 'flinched', text: 'The TV blinked off when I pulled it. Just for a second', mood: 0.65 },
  { id: 'held', when: 'plug-held', text: `Played again. The plug won't come out. ${PLUG_QUESTION}?`, mood: 0.85 },
  { id: 'line710', when: 'plug-held', text: `Line ${PLUG_LINE} isn't the one on May p.${pageNo('mayShutdownEnd')}. Put it back?`, mood: 0.7, ask: true, solved: 'plug-pulled', orSolved: 'plug-left' },
  { id: 'pulled', when: 'plug-pulled', text: `Typed ${PLUG_LINE} back and pulled it. It's only a game. Isn't it?`, mood: 0.75 },
  { id: 'left', when: 'plug-left', text: `Left ${PLUG_LINE} the way it is. Let it keep its plug`, mood: 0.6 },
  { id: 'ontime', when: 'prompt-on-time', text: 'The OK comes up on time again. Was it slow all day?', mood: 0.55 },
  { id: 'night2', when: 'issue2-done', text: 'Enough for tonight. Switch it off', mood: 0.35, ask: true, solved: 'issue2-closed' },
];

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
