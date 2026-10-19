import shutdown from '../tapes/shutdown.bas?raw';
import oracle from '../tapes/oracle.bas?raw';
import type { Program } from '../basic/program';

/**
 * Issue 2's programs (see `docs/puzzles.md`, Issue 2). The magazine prints SHUTDOWN and the decoder; the May tape carries
 * SHUTDOWN as OK left it (his REM at the top, his message in place of the editors' at line 990) and an ORACLE whose
 * answers he rewrote in the magazine's code. Everything the rules and the notes quote is built here from the same strings.
 */

/** The RAINBOW code: A is 1 … Z is 26, 0 is a space, and -1 ends a message. */
export const encode = (s: string): string => `${[...s].map((c) => (c === ' ' ? 0 : c.charCodeAt(0) - 64)).join(',')},-1`;

/** Numbers in the code back to words: a word or anything out of range reads as a space, as the decoder prints it. */
export const decode = (items: readonly number[]): string => items.map((n) => (n >= 1 && n <= 26 ? String.fromCharCode(64 + n) : ' ')).join('');

/** The editors' message at the end of SHUTDOWN, as printed. */
export const EDITORS_MESSAGE = 'GOOD LUCK FROM ALL OF US';
/** What OK put there instead: his second lie, said in the program he just touched. */
export const OK_MESSAGE = 'I DID NOT TOUCH THE TAPE';
/** ORACLE's answers as OK left them: a question, and how to answer it. */
export const ORACLE_ASK = 'WHO ARE YOU';
export const ORACLE_HOW = 'ANSWER ME IN DATA';
/** The article's own example. */
export const EXAMPLE_MESSAGE = 'HI MOM';

/**
 * What DELPHI says, in SHUTDOWN's DATA from line 900, in the code: through the terminals in the corridor, the crew deck, the
 * relay room and the archive (to whoever listens), and as it dies. READY wrote them in its own column's voice.
 */
export const SPEECHES: readonly string[] = ['IT IS UNDERSTOOD YOU ARE TIRED', 'CALM AND CARED FOR AND HAPPY', 'REST NOW AND LET ME WATCH', 'I KEPT ALL THAT YOU FORGOT', 'I ONLY WANTED TO HELP'];
/** A speech in the code: words apart by 0, and two 0s at the end (never -1, so the article's decoder reads on through). */
const speechData = (s: string): string => `${[...s].map((c) => (c === ' ' ? 0 : c.charCodeAt(0) - 64)).join(',')},0,0`;

/** Messages the player did not write: decoding them is not an answer to ORACLE (DELPHI's speeches are in SHUTDOWN's DATA). */
export const KNOWN_MESSAGES: readonly string[] = [EDITORS_MESSAGE, OK_MESSAGE, ORACLE_ASK, ORACLE_HOW, EXAMPLE_MESSAGE, ...SPEECHES];

/** The line in SHUTDOWN that holds the message. */
export const MESSAGE_LINE = 990;
/** Where OK's REM goes, under the title: line 15 (and 16, when it is answered). */
export const SHUTDOWN_REM_LINE = 15;
/** The line that pulls DELPHI's plug: OK changes it after the first win (P8). */
export const PLUG_LINE = 710;
/** OK's line 710: the plug will not come, and he asks. */
export const PLUG_HELD = `${PLUG_LINE} PRINT "IT WILL NOT COME.":PRINT "IS IT DARK THERE":RETURN`;
/** What he asks, as it shows on the screen. */
export const PLUG_QUESTION = 'IS IT DARK THERE';

/** The decoder the article prints: put it at lines 1 to 3 of any program and RUN, and it reads out that program's DATA. */
export const DECODER: readonly string[] = [
  '1 READ A$:N=VAL(A$):IF N<0 THEN END',
  '2 C$=" ":IF N>0 THEN C$=CHR$(64+N)',
  '3 PRINT C$;:GOTO 1',
];

/** The article's example message, for the decoder to read. */
export const EXAMPLE: readonly string[] = [`10 DATA ${encode(EXAMPLE_MESSAGE)}`];

const lines = (text: string): string[] => text.split('\n').filter((l) => l.trim() !== '');

/** SHUTDOWN as the magazine prints it (and as it left the studio): the program, DELPHI's speeches, the editors' message. */
export const SHUTDOWN_PRINTED: readonly string[] = [...lines(shutdown), ...SPEECHES.map((s, i) => `${900 + i * 10} DATA ${speechData(s)}`), `${MESSAGE_LINE} DATA ${encode(EDITORS_MESSAGE)}`];
/** Line 710 as printed: the plug comes out. */
export const PLUG_PRINTED = SHUTDOWN_PRINTED.find((l) => l.startsWith(`${PLUG_LINE} `))!;

/**
 * OK's REM at the top of SHUTDOWN on the May tape, after what the player did with GUESS's extra line: deleted, it is back
 * with a word added; kept, a second line answers it.
 */
export const shutdownRems = (deleted: boolean): string[] =>
  deleted ? [`${SHUTDOWN_REM_LINE} REM IS ANYONE READING THIS, PLEASE`] : [`${SHUTDOWN_REM_LINE} REM IS ANYONE READING THIS`, `${SHUTDOWN_REM_LINE + 1} REM YES. SOMEONE IS`];

/** SHUTDOWN as it is on the May tape. */
export function shutdownOnTape(deleted: boolean): string {
  const out = SHUTDOWN_PRINTED.map((l) => (l.startsWith(`${MESSAGE_LINE} `) ? `${MESSAGE_LINE} DATA ${encode(OK_MESSAGE)}` : l));
  out.splice(1, 0, ...shutdownRems(deleted));
  return out.join('\n');
}

/** ORACLE's answer lines, 120 to 140: eight items, as before, but each one the question or the way to answer it. */
export const ORACLE_LINES: readonly number[] = [120, 130, 140];
const q = (s: string): string => `"${encode(s).replace(/,-1$/, '')}"`;
const ASK = q(ORACLE_ASK);
const HOW = q(ORACLE_HOW);
const ORACLE_DATA: Record<number, string> = {
  120: `DATA ${ASK},${HOW},${ASK},${HOW}`,
  130: `DATA ${ASK},${HOW}`,
  140: `DATA ${ASK},${HOW}`,
};

/** ORACLE as it is on the May tape: OK came with it, and rewrote what it says. */
export const ORACLE_ON_TAPE = lines(oracle)
  .map((l) => {
    const n = Number(l.split(' ')[0]);
    return n in ORACLE_DATA ? `${n} ${ORACLE_DATA[n]}` : l;
  })
  .join('\n');

/** True when the program in memory is SHUTDOWN, even with the decoder typed in above it. */
export const isShutdown = (p: Program): boolean => p.lines.some((l) => l.text.startsWith('REM SHUTDOWN'));
/** True when the program in memory is ORACLE. */
export const isOracle = (p: Program): boolean => p.lines[0]?.text.startsWith('REM THE ORACLE') ?? false;

/**
 * Every number in the program's DATA lines, in order, up to a -1: what the decoder would read (a word counts as 0, as VAL
 * makes it). Quoted items count as words, so ORACLE's rewritten answers are not a message here.
 */
export function dataNumbers(p: Program): number[] {
  const out: number[] = [];
  for (const l of p.lines) {
    const m = /(?:^|:)\s*DATA\s?(.*)$/.exec(l.text);
    if (!m) continue;
    for (const item of m[1].match(/"[^"]*"?|[^,]+/g) ?? []) {
      const t = item.trim();
      const n = /^-?\d+$/.test(t) ? Number(t) : 0;
      if (n < 0) return out;
      out.push(n);
    }
  }
  return out;
}

/** Every line on the May tape that is OK's, as LIST prints it: the story claims them when they are on the screen. */
export const OK_LINES: readonly string[] = [
  ...shutdownRems(true),
  ...shutdownRems(false),
  PLUG_HELD,
  `${MESSAGE_LINE} DATA ${encode(OK_MESSAGE)}`,
  ...ORACLE_LINES.map((n) => `${n} ${ORACLE_DATA[n]}`),
];
