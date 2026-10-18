import { Ctx, INK, MARGIN, MONO, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, headline, pullQuote, rowsFor, sidebar, text } from './paper';
import { pageNo } from './pages';

const W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 100;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** Three justified columns of body type. */
function body(ctx: Ctx, paras: { text: string; before?: number }[], y: number, h: number): boolean {
  return flow(ctx, rowsFor(ctx, paras, CW), MARGIN, y, W, h, 3, GAP);
}

/** A printed screen: light grey, dark monospace, one string per row. Returns the y below it. */
function screenBox(ctx: Ctx, x: number, y: number, w: number, rows: readonly string[], caption: string): number {
  const h = 20 + rows.length * 26;
  ctx.fillStyle = INK;
  ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
  ctx.fillStyle = '#d4d4d0';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = INK;
  ctx.font = `20px ${MONO}`;
  rows.forEach((r, i) => ctx.fillText(r, x + 14, y + 32 + i * 26));
  flow(ctx, rowsFor(ctx, [{ text: caption, font: `italic 17px ${SERIF}`, lh: 21, align: 'left', before: 0 }], w + 24), x - 12, y + h + 22, w + 24, 60);
  return y + h + 70;
}

/** The error codes Color BASIC prints here, in the words a beginner needs. */
const ERRORS: readonly [string, string][] = [
  ['?SN ERROR', 'Syntax. A word, quote mark or bracket is wrong.'],
  ['?UL ERROR', 'Undefined line. GOTO or RUN names a line that is not there.'],
  ['?TM ERROR', 'Type mismatch. Words where a number belongs, or the reverse.'],
  ['?CN ERROR', 'Cannot continue. Nothing to carry on, or the program was changed.'],
];

/** writing a program, and what the error messages mean. */
export function drawFirstProgram(ctx: Ctx): void {
  const y = headline(ctx, 'Your First Program', ['Line numbers, RUN, and a machine that remembers . . .', 'And what to do when it says ERROR . . .'], 'Dale Wick');
  body(
    ctx,
    [
      { text: 'Until now the CoCo has forgotten each line the moment it obeyed it. Start a line with a number and that changes: the CoCo keeps it. A line with a number is part of a program.', before: 0 },
      { text: 'Type 10 PRINT "HI" and press ENTER. Nothing happens, because the line has been stored, not run. Type 20 PRINT "THERE", then type RUN. The lines run in number order, whatever order you typed them in. We count by tens so there is room to squeeze a line between.' },
      { text: 'LIST shows the CoCo what it remembers. To change a line, type it again with the same number. To remove one, type only its number. NEW wipes the lot. Try each; none of them can hurt.' },
      { text: 'The program on page ' + pageNo('typeIn') + ' asks your name. INPUT waits for a reply and puts it in N$. The dollar sign means words, not figures. GOTO sends the CoCo back to line 20, so it asks again and again until you press BREAK (Esc).' },
      { text: 'Type it in exactly as printed, one line at a time, and check your sums against the table. When you have finished, type RUN.' },
    ],
    y,
    290,
  );
  const fy = screenBox(
    ctx,
    MARGIN + 12,
    y + 300,
    420,
    ['10 PRINT "HI"', '20 PRINT "THERE"', 'LIST', '10 PRINT "HI"', '20 PRINT "THERE"', 'OK', 'RUN', 'HI', 'THERE'],
    'Fig. 3: Two lines stored, listed, and run.',
  );
  const sx = MARGIN + 470;
  const sw = W - 470;
  sidebar(ctx, 'Try It Now', sx, y + 288, sw, fy - y - 288 - 50);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Type the lines in Fig. 3 yourself, then add 15 PRINT "AND" and LIST again. It lands between the others.', before: 0, align: 'left' },
        { text: 'Then type 15 on its own and press ENTER. Line 15 is gone.', align: 'left' },
        { text: 'Now type 10 PRINT "HELLO" and LIST. Line 10 has changed. The old one is gone.', align: 'left' },
      ],
      sw - 36,
    ),
    sx + 18,
    y + 288 + 66,
    sw - 36,
    200,
  );
  // The error table.
  let ty = fy + 10;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ty, W, 4);
  text(ctx, 'When It Goes Wrong', MARGIN, ty + 44, `bold 32px ${SANS}`);
  flow(
    ctx,
    rowsFor(
      ctx,
      [{ text: 'An error is not a scolding. It is the CoCo telling you what it could not do. When the message ends IN and a number, that is the line it was on. Type LIST and that number, as in LIST 30, read the line slowly, and type it again with its number to replace it. Then type RUN again. Programs that come on tape can be flawed too, and the message works just the same.', before: 0 }],
      W - 20,
    ),
    MARGIN,
    ty + 60,
    W - 20,
    100,
  );
  ty += 150;
  ERRORS.forEach(([code, what]) => {
    text(ctx, code, MARGIN + 10, ty + 26, `bold 21px ${MONO}`);
    text(ctx, what, MARGIN + 220, ty + 26, `19px ${SERIF}`);
    ty += 36;
    ctx.fillRect(MARGIN, ty - 6, W, 1);
  });
}

/** BREAK, LIST with a range, and CONT. */
export function drawStopping(ctx: Ctx): void {
  const y = headline(ctx, 'Stopping a Program', ['BREAK, LIST and CONT . . .', 'How to look inside a program that is waiting . . .'], 'Dale Wick');
  body(
    ctx,
    [
      { text: 'A program is only lines of text, and you can read them. When one asks you a question you cannot answer, you do not have to guess. Some programs will even tell you that what you want is in the program: when one does, believe it. Press BREAK, which is the Esc key. The program stops, the CoCo tells you which line it was on, and OK comes back.', before: 0 },
      { text: 'Then type LIST. A long program scrolls off the top of the screen before you can read it, so ask for only the part you want. LIST 20 shows line 20. LIST 20-40 shows lines 20 to 40. LIST 20- shows line 20 and everything after it. LIST -40 shows everything up to line 40.' },
      { text: 'Read the lines the way the CoCo does. A line that tests your answer, such as IF P$="MOON", has the answer written in it. Nothing is hidden from you; it is only out of sight.' },
      { text: 'To carry on from where you stopped, type CONT. The program picks up exactly where it was, and everything it had worked out is still there. CONT only works if you have not changed a line since you broke in. If you have, type RUN and begin again.' },
    ],
    y,
    270,
  );
  const fy = screenBox(
    ctx,
    MARGIN + 12,
    y + 300,
    420,
    ['10 INPUT "PASSWORD";P$', '20 IF P$="MOON" THEN 40', '30 PRINT "NO.":GOTO 10', '40 PRINT "WELCOME."', '', 'RUN', 'PASSWORD? (you press BREAK)', 'BREAK IN 10', 'OK', 'LIST 20', '20 IF P$="MOON" THEN 40', 'OK', 'CONT', 'PASSWORD? _'],
    'Fig. 4: A made-up program, stopped, read, and carried on.',
  );
  const qy = pullQuote(ctx, 'A program that asks you a question is also telling you something.', MARGIN + 470, y + 300, W - 470);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'In Fig. 4 the password is plain to see in line 20. A real program will not always be so kind, and its lines may be a long way from the question. Use LIST with a range, and read a little before and after.', before: 0 },
      ],
      W - 470,
    ),
    MARGIN + 470,
    qy + 10,
    W - 470,
    BOTTOM - qy - fy,
  );
  const ky = fy + 10;
  sidebar(ctx, 'Keys To Remember', MARGIN, ky, W, 120);
  text(ctx, 'BREAK = Esc', MARGIN + 30, ky + 90, `bold 24px ${MONO}`);
  text(ctx, 'LIST 20-40', MARGIN + 300, ky + 90, `bold 24px ${MONO}`);
  text(ctx, 'CONT', MARGIN + 600, ky + 90, `bold 24px ${MONO}`);
}

const TAPE: readonly [string, string][] = [
  ['ABOUT', 'What is on the tape, and how to load it.'],
  ['GUESS', 'The CoCo thinks of a number from 1 to 100. You guess it.'],
  ['RAINBOW', 'A show of colours. Press any key to stop it.'],
  ['ORACLE', 'Ask a yes or no question. Believe the answer at your own risk.'],
  ['ADVENT', `Load it with CLOAD "ADVENT", then RUN. Page ${pageNo('words')} has the words.`],
];

const TAPE_COMMANDS: readonly [string, string][] = [
  ['CLOAD', 'Load the next program on the tape.'],
  ['CLOAD "GUESS"', 'Wind to that program and load it.'],
  ['SKIPF', 'Wind past a program without loading it.'],
  ['CSAVE "MINE"', 'Record the program in memory on the tape.'],
  ['CHECK', 'Print the RAINBOW CHECK of the program in memory.'],
];

/** the cassette, its programs, and the commands that work it. */
export function drawTape(ctx: Ctx): void {
  const y = headline(ctx, 'Rainbow On Tape', ['This month’s cassette . . .', 'What is on it, and how to work the recorder . . .'], 'Dale Wick');
  body(
    ctx,
    [
      { text: 'Every issue of the RAINBOW has a cassette to go with it, ready to load. Put it in the recorder, press PLAY, and type CLOAD. The tape moves, the screen says S while it searches and F and a name when it finds a program, and then OK comes back.', before: 0 },
      { text: 'A tape has a place, like a record. CLOAD on its own loads whichever program is next. Name a program and the recorder winds forward to it, showing F and the name of each one it passes. If it goes all the way round and does not find it, you will see ?IO ERROR.' },
      { text: 'Anything you CSAVE goes on the end of the tape, after the programs that came with it, and stays there. Save a program under the name of one already on the tape and you record over it. Do that only if you mean to.' },
    ],
    y,
    230,
  );
  let ty = y + 260;
  const table = (title: string, rows: readonly [string, string][], wide: number): void => {
    ctx.fillStyle = INK;
    ctx.fillRect(MARGIN, ty, W, 4);
    text(ctx, title, MARGIN, ty + 40, `bold 26px ${SANS}`);
    ty += 60;
    ctx.fillRect(MARGIN, ty, W, 1);
    rows.forEach(([a, b]) => {
      text(ctx, a, MARGIN + 10, ty + 34, `bold 22px ${MONO}`);
      text(ctx, b, MARGIN + wide, ty + 34, `19px ${SERIF}`);
      ty += 48;
      ctx.fillRect(MARGIN, ty, W, 1);
    });
    ty += 40;
  };
  table('On This Tape', TAPE, 200);
  table('At The Recorder', TAPE_COMMANDS, 300);
}
