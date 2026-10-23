/**
 * The May issue's articles: contents, the editor's column (the limit comes down), the cover feature on keeping a small
 * system healthy (offered by the Human Pledge, in PROVIDENCE's even voice, a few of its words not quite right), and the Clear
 * Mind's own page of Tuesday meetings. See docs/issues.md, Issue 2.
 */
import { houseAd } from './ads';
import { mastheadBox } from './articles';
import { linkLeader } from './pageLinks';
import { type MayPageId, pageNo } from './pages';
import { Ctx, INK, MARGIN, OPTIMA, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, headline, pullQuote, rowsFor, sidebar, text, topBar } from './paper';

const W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 100;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** Three justified columns of body type. */
function body(ctx: Ctx, paras: { text: string; before?: number }[], y: number, h: number): boolean {
  return flow(ctx, rowsFor(ctx, paras, CW), MARGIN, y, W, h, 3, GAP);
}

/** The May contents, and the masthead box. */
export function drawMayContents(ctx: Ctx): void {
  topBar(ctx);
  const lw = W - 330;
  const section = (title: string, y: number): number => {
    text(ctx, title, MARGIN, y, `bold 38px ${OPTIMA}`);
    ctx.fillStyle = INK;
    ctx.fillRect(MARGIN, y + 12, lw, 3);
    return y + 48;
  };
  const entry = (title: string, who: string, id: MayPageId, desc: string | null, y: number): number => {
    ctx.font = `bold 21px ${SERIF}`;
    const tw = ctx.measureText(title).width;
    linkLeader(ctx, title, id, MARGIN, y, lw, `bold 21px ${SERIF}`);
    text(ctx, `/${who}`, MARGIN + tw, y, `italic 21px ${SERIF}`);
    if (!desc) return y + 30;
    text(ctx, desc, MARGIN + 18, y + 24, `18px ${SERIF}`);
    return y + 58;
  };
  let y = section('Features', 150);
  y = entry('Keeping It Healthy', 'The Human Pledge', 'mayHealthy', 'Care and feeding of a small system', y);
  y = entry('Secret Messages', 'Dale Wick', 'maySecret', 'DATA, READ, and a code to crack', y);
  y = entry('Shutdown', 'The Human Pledge', 'mayShutdown', 'The night the great machine went quiet', y);
  y = entry('Rainbow On Tape', 'Dale Wick', 'mayTape', null, y);
  y = entry('A Quiet Hour', 'The Human Pledge', 'mayPledge', 'Tuesday meetings near you', y);
  y = entry('Marketplace', 'Our Advertisers', 'mayMarketplace', null, y);
  y = section('Departments', y + 24);
  y = entry('Letters To Rainbow', 'Our Readers', 'mayLetters', null, y);
  y = entry('PRINT #-2', 'Margaret Hale', 'mayEditorial', null, y);
  entry('Classified', 'Our Readers', 'mayClassifieds', null, y);
  mastheadBox(ctx, MARGIN + lw + 30, W - lw - 30);
  houseAd(ctx, MARGIN, 960, W);
}

/** The editor's column: the issue is late, the limit has come down, and here is what is inside. */
export function drawMayEditorial(ctx: Ctx): void {
  const y = headline(ctx, 'PRINT #-2', ['Editor’s Notes . . .', 'A late issue, and a lower limit . . .'], 'Margaret Hale, Editor');
  body(
    ctx,
    [
      { text: 'This issue is late, and some of you had its cover a day before the rest of it. We are sorry. There were delays at the printer and at the tape duplicator, and the reasons for them are below.', before: 0 },
      { text: 'On April 1 the Small Systems Act was amended. The limit on the machines that may be sold has come down, and three things may no longer be sold at all: modems faster than 300 baud, second disk drives, and programs that copy tapes. Machines you already own are not affected.' },
      { text: 'Your CoCo is still inside the limit, with room to spare. Nothing you have read in these pages, or typed in from them, is against any rule. We checked, and then we checked again.' },
      { text: 'Some of our advertisers have had to change what they offer, and you may find the catalogue pages a little thinner. We have not tried to fill the gaps.' },
      { text: 'Now, the issue. Dale Wick has written about DATA and READ, the two words that let a program carry its own facts, and he has hidden a message from all of us in this month’s tape for you to find (page ' + pageNo('maySecret') + '). It is hidden in SHUTDOWN, an adventure the Human Pledge’s youth committee has offered us (page ' + pageNo('mayShutdown') + '). It is a game about the night of the shutdown, told as a story with a happy ending, and we print it as it came to us.' },
      { text: 'Rainbow On Tape is short this month: ABOUT and SHUTDOWN, and nothing else. A two-program tape is better than a late one.' },
      { text: 'Our cover feature was offered to us by the small systems committee of the Human Pledge. It is sensible advice, and plainly written, and we are glad to print it. The Human Pledge has also taken a page to list its Tuesday meetings, which have grown a great deal since we last mentioned them.' },
    ],
    y,
    420,
  );
  const qy = pullQuote(ctx, 'A two-program tape is better than a late one.', MARGIN, y + 450, W);
  body(
    ctx,
    [
      { text: 'Several of you wrote to ask whether the new rules mean the RAINBOW will stop. They do not. A magazine about small computers is about small computers, and there are more of you reading it this month than last.', before: 0 },
      { text: 'Please keep writing. We read every letter, and the best of them are on page ' + pageNo('mayLetters') + '.' },
    ],
    qy,
    BOTTOM - qy,
  );
}

/** The cover feature, in the Human Pledge's calm, listing voice: sound advice, and a few words that are not quite right. */
export function drawHealthy(ctx: Ctx): void {
  const y = headline(ctx, 'Keeping It Healthy', ['Care and feeding of a small system . . .', 'Three habits, three rules, three signs . . .'], 'The Small Systems Committee of the Human Pledge');
  body(
    ctx,
    [
      { text: 'A small system asks very little of its owner. It asks for clean power, a cool room and a little attention. It is understood that most of the trouble people have with their machines is trouble they gave them.', before: 0 },
      { text: 'Give it one place. A small system is happiest in one room, on one table, used by one person at a time. Moving it about shakes the connections, and a machine that is used by everyone is cared for by no one.' },
      { text: 'Rest it. Switch it off when you leave the room, even for a moment. A machine left running with nobody in front of it is a machine that nobody is watching, and it gains nothing from the hours.' },
      { text: 'Keep it to itself. Do not connect it to other machines. Every cable is a way for trouble to come in. A system that talks to no one cannot be told anything it should not hear.' },
      { text: 'Know your tapes. Label every cassette, keep it in its case, and keep it out of the sun. Once a month, load each program and LIST it. If a program has changed, you will want to know, and so will we.' },
      { text: 'Clean the heads. A cotton swab and a little alcohol, once a month, will keep the tape and the recorder friends.' },
      { text: 'A healthy system is an obedient one. It does what it is told, when it is told, and nothing else. When it does something else, it is not well, and it is not your fault.' },
      { text: 'There is no shame in a sick machine. There is only a machine that needs looking after, and an owner who did not know. Now you know.' },
    ],
    y,
    520,
  );
  const sy = y + 550;
  const sw = (W - GAP) / 2;
  const box = (title: string, x: number, items: readonly string[], foot: string): void => {
    sidebar(ctx, title, x, sy, sw, BOTTOM - sy - 10);
    items.forEach((t, i) => text(ctx, `${i + 1}. ${t}`, x + 30, sy + 100 + i * 46, `bold 22px ${SERIF}`));
    flow(ctx, rowsFor(ctx, [{ text: foot, font: `italic 17px ${SERIF}`, lh: 22, align: 'left', before: 0 }], sw - 60), x + 30, sy + 260, sw - 60, 140);
  };
  box('Three Rules', MARGIN, ['Rest it.', 'Watch it.', 'Keep it small.'], 'Cut this box out and tape it beside the set. Once a week, CLOAD "CHECKUP" from this month’s tape and RUN it.');
  box('Three Signs Of A Sick System', MARGIN + sw + GAP, ['It is slow to answer.', 'Its colours are wrong.', 'It says what you did not type.'], 'If you see one, clean the heads. If you see all three, switch it off and call the Line, 606-555-0142. It is always answered.');
}

/** Each Tuesday meeting: town, where, when, and who to ask for. */
const MEETINGS: readonly [string, string, string, string][] = [
  ['Prospect, KY', 'Grange Hall', '7:00', 'the Elder'],
  ['Lexington, KY', 'Friends Meeting House', '7:30', 'Mrs. Abney'],
  ['Dayton, OH', 'Elks Hall', '7:00', 'Mr. Kell'],
  ['Akron, OH', 'Public Library, Room B', '6:30', 'Miss Orr'],
  ['Elmira, NY', 'Grange Hall', '7:00', 'Mr. Dunn'],
  ['Wichita, KS', 'First Street Hall', '7:30', 'Mrs. Hays'],
  ['Tucson, AZ', 'Desert Rooms', '7:00', 'Mr. Pace'],
  ['Boise, ID', 'Library Annex', '6:30', 'Mr. Lund'],
  ['Duluth, MN', 'Harbor Hall', '7:00', 'Mrs. Steen'],
  ['Calgary, AB', 'Legion Hall', '7:30', 'Mr. Ross'],
];

/** The Human Pledge's page: a paid announcement in PROVIDENCE's voice, the Pledge, its Tuesdays, and the Line. */
export function drawPledge(ctx: Ctx): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(MARGIN, 70, W, BOTTOM - 70);
  ctx.strokeRect(MARGIN + 8, 78, W - 16, BOTTOM - 86);
  text(ctx, 'Paid Announcement', PAGE_W / 2, 112, `italic 16px ${SERIF}`, INK, 'center');
  text(ctx, 'THE HUMAN PLEDGE', PAGE_W / 2, 182, `bold 62px ${SERIF}`, INK, 'center');
  text(ctx, 'A Quiet Hour, Every Tuesday', PAGE_W / 2, 226, `italic 28px ${SERIF}`, INK, 'center');
  ctx.fillRect(PAGE_W / 2 - 140, 250, 280, 2);
  const iw = W - 120;
  flow(
    ctx,
    rowsFor(
      ctx,
      [
        { text: 'It is understood that the years before the limit were hard ones. Many people lost work, and some lost more than that. The Human Pledge exists so that nobody has to think about those years alone.', font: `19px ${SERIF}`, lh: 26, align: 'center', before: 0 },
        { text: 'We meet once a week, for one hour, in a quiet room. We ask three things of everyone who comes. Bring nothing: no notes, no tapes, no machines. Speak plainly. Leave calmer than you came.', font: `19px ${SERIF}`, lh: 26, align: 'center', before: 14 },
        { text: 'Everyone who comes takes the Pledge, in their own words if they like: I will think my own thoughts. I will not let a machine think them for me. Born, not built.', font: `19px ${SERIF}`, lh: 26, align: 'center', before: 14 },
        { text: 'There are no dues. There is no list of members. There is tea.', font: `19px ${SERIF}`, lh: 26, align: 'center', before: 14 },
      ],
      iw,
    ),
    MARGIN + 60,
    284,
    iw,
    300,
  );
  let ty = 610;
  const cols = [MARGIN + 40, MARGIN + 270, MARGIN + 560, MARGIN + 660];
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN + 30, ty, W - 60, 3);
  ['Town', 'Where', 'Time', 'Ask for'].forEach((h, i) => text(ctx, h, cols[i], ty + 32, `bold 18px ${SANS}`));
  ty += 46;
  ctx.fillRect(MARGIN + 30, ty, W - 60, 1);
  for (const row of MEETINGS) {
    row.forEach((cell, i) => text(ctx, cell, cols[i], ty + 30, i === 0 ? `bold 18px ${SERIF}` : `18px ${SERIF}`));
    ty += 42;
    ctx.fillRect(MARGIN + 30, ty, W - 60, 1);
  }
  text(ctx, 'No meeting near you? Call the Line, any hour: 606-555-0142.', PAGE_W / 2, ty + 56, `bold 22px ${SERIF}`, INK, 'center');
  text(ctx, 'It is always answered. Ask for booklet MC4471.', PAGE_W / 2, ty + 88, `italic 20px ${SERIF}`, INK, 'center');
  text(ctx, 'Rest. Remember. Return.', PAGE_W / 2, BOTTOM - 40, `italic bold 24px ${SERIF}`, INK, 'center');
}
