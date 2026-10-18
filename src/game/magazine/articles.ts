import { houseAd } from './ads';
import { COMMANDS } from './data';
import { PageId, pageNo } from './pages';
import { linkLeader } from './pageLinks';
import { drawPlayerMap } from './playerMap';
import { Ctx, INK, MARGIN, MONO, OPTIMA, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, headline, pullQuote, rowsFor, sidebar, text, topBar } from './paper';

const W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 100;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** Three justified columns of body type. */
function body(ctx: Ctx, paras: { text: string; before?: number }[], y: number, h: number): boolean {
  return flow(ctx, rowsFor(ctx, paras, CW), MARGIN, y, W, h, 3, GAP);
}

/** the contents and the masthead box. */
export function drawContents(ctx: Ctx): void {
  topBar(ctx);
  const lw = W - 330;
  const section = (title: string, y: number): number => {
    text(ctx, title, MARGIN, y, `bold 38px ${OPTIMA}`);
    ctx.fillStyle = INK;
    ctx.fillRect(MARGIN, y + 12, lw, 3);
    return y + 48;
  };
  const entry = (title: string, who: string, id: PageId, desc: string | null, y: number): number => {
    ctx.font = `bold 21px ${SERIF}`;
    const tw = ctx.measureText(title).width;
    linkLeader(ctx, title, id, MARGIN, y, lw, `bold 21px ${SERIF}`);
    text(ctx, `/${who}`, MARGIN + tw, y, `italic 21px ${SERIF}`);
    if (!desc) return y + 30;
    text(ctx, desc, MARGIN + 18, y + 24, `18px ${SERIF}`);
    return y + 58;
  };
  let y = section('Features', 150);
  y = entry('How To Play: The Screen', 'Dale Wick', 'screen', 'Reading the green and typing back', y);
  y = entry('How To Play: The Words', 'Dale Wick', 'words', 'The verbs the adventure understands', y);
  y = entry('Map Your Way', 'Priya Rao', 'map', 'Graph paper, a pencil and a sense of north', y);
  y = entry('Say Your Name', 'Tom Brannigan', 'typeIn', null, y);
  y = entry('Your First Program', 'Dale Wick', 'program', null, y);
  y = entry('Stopping a Program', 'Dale Wick', 'stopping', null, y);
  y = entry('Guess My Number', 'Dale Wick', 'guess', null, y);
  y = entry('Rainbow On Tape', 'Dale Wick', 'tape', null, y);
  y = entry('Marketplace', 'Our Advertisers', 'marketplace', 'Games, gadgets and a few bold claims', y);
  y = section('Departments', y + 24);
  y = entry('Letters To Rainbow', 'Our Readers', 'letters', null, y);
  y = entry('PRINT #-2', 'Margaret Hale', 'editorial', null, y);
  y = entry('Classified', 'Our Readers', 'classifieds', null, y);
  y += 24;
  const box = rowsFor(
    ctx,
    [{ text: 'Leave this magazine open beside the set while you play. Click the edge of a page, or press PAGE DOWN and PAGE UP, to turn it. Scroll to zoom in on small print, and drag to move about the page. Press TAB to put it away.', before: 0 }],
    lw - 40,
  );
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(MARGIN, y, lw, 60 + box.length * 22);
  text(ctx, 'USING THIS MAGAZINE', MARGIN + 20, y + 30, `bold 15px ${SANS}`, '#7a2c1c');
  flow(ctx, box, MARGIN + 20, y + 44, lw - 40, 200, 1);
  // The masthead box.
  const sx = MARGIN + lw + 30;
  const sw = W - lw - 30;
  mastheadBox(ctx, sx, sw);
  houseAd(ctx, MARGIN, 960, W);
}

/** The masthead box beside the contents: who makes the magazine, and where. */
export function mastheadBox(ctx: Ctx, sx: number, sw: number): void {
  sidebar(ctx, 'The Rainbow', sx, 130, sw, 780);
  const staff: [string, string][] = [
    ['Margaret Hale', 'Editor'],
    ['Walt Pruitt', 'Managing Editor'],
    ['Dale Wick', 'Technical Editor'],
    ['Priya Rao', 'Associate Editor'],
    ['Sal Ricci', 'Art Director'],
    ['Edna Sparks', 'Assistant Art Director'],
    ['Joe Tuttle', 'Editorial Assistant'],
    ['Tom Brannigan', 'Contributing Editor'],
    ['Gloria Banks', 'Advertising Manager'],
    ['Ned Overby', 'General Manager'],
  ];
  staff.forEach(([n, role], i) => {
    text(ctx, n, sx + sw / 2, 200 + i * 66, `bold 19px ${SANS}`, INK, 'center');
    text(ctx, role, sx + sw / 2, 223 + i * 66, `italic 17px ${SANS}`, INK, 'center');
  });
  text(ctx, 'Box 209, Prospect, Kentucky', sx + sw / 2, 880, `15px ${SANS}`, INK, 'center');
}

/** the editor's column. */
export function drawEditorial(ctx: Ctx): void {
  const y = headline(ctx, 'PRINT #-2', ['Editor’s Notes . . .', 'A welcome to beginners . . .', 'And a magazine to keep beside the set . . .'], 'Margaret Hale, Editor');
  body(
    ctx,
    [
      { text: 'Some of you have written to say you bought a CoCo, switched it on, saw the word OK and then sat very still. Welcome. Everybody does that the first time, and the machine is perfectly happy to wait.', before: 0 },
      { text: 'This month is our Adventure Issue. An adventure is a story that you walk through by typing. The computer tells you where you are, you tell it what to do, and it tells you what happened. There is no joystick and nothing to shoot. There is only reading, thinking and a pencil.' },
      { text: 'We have laid out this issue as a field guide. Keep it beside the set. Read how the screen works, learn the handful of words the adventure understands, and draw a map as you go.' },
      { text: 'If you get stuck, go back to your map and read each room again, slowly. Everything you need is in the game, or in these pages. Try for ten minutes. Then try for ten more.' },
      { text: 'Here is what is in the issue. On pages ' + pageNo('screen') + ' and ' + pageNo('words') + ' Dale Wick explains the screen and the words, which is everything you need before your first command. Priya Rao shows how to map a place so that you never walk in a circle without noticing. On page ' + pageNo('typeIn') + ' Tom Brannigan has a short program for you to type, with the RAINBOW CHECK to prove you typed it right, and on pages ' + pageNo('program') + ' and ' + pageNo('stopping') + ' Dale explains how programs work and what to do when one stops or goes wrong.' },
      { text: 'Turn to page ' + pageNo('letters') + ' for the mail. We are told this is the part of the magazine people read first, and that some of you skip our columns to get to it. We do not mind. We read it first, too.' },
      { text: 'And please, read the advertisements. Our advertisers are the reason this magazine costs as little as it does, and some of them are very, very sure of themselves. A few have made claims that we have not tested, and do not intend to.' },
      { text: 'A word about errors. When the CoCo prints ?SN ERROR it is not cross with you. It simply did not understand. Check your spelling, check your spaces and try again. Nobody ever broke a computer by typing the wrong word.' },
    ],
    y,
    470,
  );
  const qy = pullQuote(ctx, 'Nobody ever broke a computer by typing the wrong word.', MARGIN, y + 500, W);
  body(
    ctx,
    [
      { text: 'Next month we look at keeping a small system healthy, and at what the new rules mean for the machine on your desk. Until then, we hope you find something worth walking into. Happy adventuring.', before: 0 },
      { text: 'A note for the careful. Several of you have asked about the Small Systems Act. It limits the size of the machines that may be sold, and it says very little about the ones you already own. A CoCo, even a 64K one, is well inside it. Nothing in this magazine changes.' },
      { text: 'We are always glad to hear from you, and we answer as many letters as we can. Please include your town and state, and say which memory size your machine has.' },
    ],
    qy,
    BOTTOM - qy,
  );
}

/** reading the screen. */
export function drawHowTo1(ctx: Ctx): void {
  const y = headline(ctx, 'The Screen', ['How To Play, Part 1 . . .', 'Reading the green, and typing back . . .'], 'Dale Wick');
  body(
    ctx,
    [
      { text: 'Look at the set. It should be on channel 3; anywhere else you will see only snow. Green paper, dark letters, and a small square that changes colour every moment. That square is the cursor, and it shows where your next letter will appear.', before: 0 },
      { text: 'The word OK is the prompt. When you see it the machine has finished and is waiting for you. Type a command, then press ENTER. Nothing happens until you press ENTER, so you can change your mind. The left arrow rubs out the last letter.' },
      { text: 'The CoCo knows only capital letters, so everything you type will come out as capitals. This is perfectly normal. A line can be up to 249 letters long, but the commands you need are only two words.' },
    ],
    y,
    290,
  );
  // Figure 1: the screen, as a printed halftone box.
  const bx = MARGIN + 18;
  const by = y + 340;
  ctx.fillStyle = INK;
  ctx.fillRect(bx - 18, by - 18, 548, 380);
  ctx.fillStyle = '#d4d4d0';
  ctx.fillRect(bx, by, 512, 344);
  ctx.fillStyle = INK;
  ctx.font = `24px ${MONO}`;
  ['EXTENDED COLOR BASIC 1.1', 'COPYRIGHT (C) 1982 BY TANDY', 'UNDER LICENSE FROM MICROSOFT', '', 'OK', 'PRINT "HELLO"'].forEach((l, i) => ctx.fillText(l, bx + 14, by + 38 + i * 34));
  ctx.fillRect(bx + 14 + 14.4 * 13, by + 38 + 5 * 34 - 22, 14, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 300, by + 100, 200, 40);
  ctx.fillRect(bx + 300, by + 255, 200, 40);
  text(ctx, 'THE PROMPT', bx + 312, by + 128, `bold 18px ${SANS}`, INK);
  text(ctx, 'WHAT YOU TYPED', bx + 312, by + 283, `bold 18px ${SANS}`, INK);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx + 300, by + 128);
  ctx.lineTo(bx + 70, by + 172);
  ctx.moveTo(bx + 300, by + 275);
  ctx.lineTo(bx + 240, by + 215);
  ctx.stroke();
  flow(ctx, rowsFor(ctx, [{ text: 'Fig. 1: The screen when the machine is switched on and you have typed a line. The CoCo prints back whatever you ask it to, then OK again.', font: `italic 17px ${SERIF}`, lh: 21, align: 'left', before: 0 }], 548), bx - 18, by + 386, 548, 80);
  body(
    ctx,
    [
      { text: 'The cursor is your friend. If it is not blinking through its colours, the machine is busy and has not heard you yet. Wait a moment before you type. If it still will not move, press ENTER once and see whether OK comes back.', before: 0 },
      { text: 'Lines that run off the right edge wrap to the next row. That is only the screen being tidy; the machine still sees one long line. When the screen fills up, everything slides up one row and the top line is gone for good. If you need to keep something, write it down.' },
      { text: 'Last, a note on small letters. Because this CoCo prints capitals only, you will see PRINT where a book might say print. Read them as the same word. Nothing in this magazine will ever ask you to type a small letter, and the adventure will not mind which you use.' },
    ],
    by + 478,
    BOTTOM - by - 478,
  );
  const sx = bx + 560;
  const sw = MARGIN + W - sx;
  sidebar(ctx, 'Try It Now', sx, by - 18, sw, 380);
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'Type PRINT "HELLO" with the quotation marks, and press ENTER.', before: 0, align: 'left' },
        { text: 'If the machine says HELLO, you are talking to it.', align: 'left' },
        { text: 'If you see ?SN ERROR, a letter or a quote mark is wrong. Press ENTER, then type the line again.', align: 'left' },
      ],
      sw - 36,
    ),
    sx + 18,
    by + 66,
    sw - 36,
    300,
  );
}

/** the commands, in a ruled table. */
export function drawHowTo2(ctx: Ctx): void {
  const y = headline(ctx, 'The Words', ['How To Play, Part 2 . . .', 'The verbs the adventure understands . . .'], 'Dale Wick');
  body(ctx, [{ text: 'The adventure listens for a verb and, usually, a noun: what you want to do, and what to do it to. Anything else it will not understand, and it will say so. Here is the whole vocabulary to begin with.', before: 0 }], y, 150);
  let ty = y + 160;
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, ty, W, 4);
  ctx.fillRect(MARGIN, ty + 8, W, 1.5);
  text(ctx, 'TYPE THIS', MARGIN + 18, ty + 44, `bold 19px ${SANS}`);
  text(ctx, 'AND THE ADVENTURE WILL', MARGIN + 300, ty + 44, `bold 19px ${SANS}`);
  ty += 62;
  ctx.fillRect(MARGIN, ty, W, 2);
  COMMANDS.forEach(([c, d]) => {
    text(ctx, c, MARGIN + 18, ty + 38, `bold 24px ${MONO}`);
    text(ctx, d, MARGIN + 300, ty + 38, `20px ${SERIF}`);
    ty += 54;
    ctx.fillRect(MARGIN, ty, W, 1);
  });
  ctx.fillRect(MARGIN, ty, W, 4);
  const qy = pullQuote(ctx, 'A command that does nothing costs you nothing.', MARGIN, ty + 30, W);
  body(
    ctx,
    [
      { text: 'Read everything. The descriptions of places are clues, and objects named in them are usually worth a closer look.', before: 0 },
      { text: 'You may use only the first few letters of a word if you like. Spelling still counts, though.' },
      { text: 'Try the odd thing. Sometimes the story answers in a way that tells you what to try next. If you get lost, type LOOK. If you are still lost, turn to your map.' },
    ],
    qy,
    BOTTOM - qy,
  );
}

/** mapping, with a grid of graph paper for the reader's own map (the player has already drawn theirs on it). */
export function drawMap(ctx: Ctx): void {
  const y = headline(ctx, 'Map Your Way', ['Graph paper, a pencil and a good sense of north . . .'], 'Priya Rao');
  body(
    ctx,
    [
      { text: 'Every room is a box. Every exit is a line. Write the room’s name in its box, and put a small note beside anything you could not carry or could not open. When you come back with a key, you will know where to use it.', before: 0 },
      { text: 'Always draw north at the top. That way your map agrees with the adventure, which says NORTH when it means up the page.' },
    ],
    y,
    190,
  );
  const gx = MARGIN;
  const gy = y + 210;
  const gh = 560;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gx, gy, W, gh);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let x = gx; x <= gx + W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x, gy + gh);
    ctx.stroke();
  }
  for (let v = gy; v <= gy + gh; v += 30) {
    ctx.beginPath();
    ctx.moveTo(gx, v);
    ctx.lineTo(gx + W, v);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(gx, gy, W, gh);
  ctx.lineWidth = 3;
  text(ctx, 'N', gx + W - 56, gy + 52, `bold 34px ${SANS}`, INK, 'center');
  ctx.beginPath();
  ctx.moveTo(gx + W - 56, gy + 120);
  ctx.lineTo(gx + W - 56, gy + 66);
  ctx.lineTo(gx + W - 66, gy + 82);
  ctx.moveTo(gx + W - 56, gy + 66);
  ctx.lineTo(gx + W - 46, gy + 82);
  ctx.stroke();
  // The reader's own map: the player filled this grid in before the game begins (see playerMap.ts).
  drawPlayerMap(ctx, gx + 50, gy + 50, gx + W, gy + gh);
  flow(ctx, rowsFor(ctx, [{ text: 'Fig. 2: Your first map goes on this grid. Pencil, not pen.', font: `italic 17px ${SERIF}`, lh: 21, align: 'left', before: 0 }], W), MARGIN, gy + gh + 12, W, 40);
}
