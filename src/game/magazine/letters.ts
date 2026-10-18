import { Ctx, INK, MARGIN, PAGE_H, PAGE_W, SANS, SERIF, colWidth, flow, rowsFor, text, HEAVY } from './paper';
import { pageNo } from './pages';

const W = PAGE_W - MARGIN * 2;
const GAP = 22;

/** One letter in the magazine's way: a centred bold caps head, "Editor:" in italic, the body, a right-aligned signature. */
function letter(head: string, body: string, who: string, where: string, reply?: string): { text: string; font?: string; align?: 'center' | 'right' | 'left' | 'justify'; before?: number; keep?: boolean }[] {
  const items: { text: string; font?: string; align?: 'center' | 'right' | 'left' | 'justify'; before?: number; keep?: boolean }[] = [
    { text: head, font: `bold 15px ${SANS}`, align: 'center', before: 16, keep: true },
    { text: 'Editor:', font: `italic 15px ${SERIF}`, align: 'left', before: 3, keep: true },
    { text: body, before: 0 },
    { text: who, font: `italic 15px ${SERIF}`, align: 'right', before: 4 },
    { text: where, font: `italic 15px ${SERIF}`, align: 'right', before: 0 },
  ];
  if (reply) items.push({ text: `Editor’s Note: ${reply}`, font: `bold 14px ${SANS}`, align: 'left', before: 8 });
  return items;
}

/** Letters to RAINBOW, set as the original is: a huge masthead word, then dense three-column mail. */
export function drawLetters(ctx: Ctx): void {
  text(ctx, 'letters to', MARGIN, 120, `italic bold 40px ${SERIF}`);
  ctx.save();
  ctx.translate(MARGIN + 200, 138);
  ctx.font = `118px ${HEAVY}`;
  ctx.scale((W - 200) / ctx.measureText('RAINBOW').width, 1);
  ctx.fillStyle = INK;
  ctx.fillText('RAINBOW', 0, 0);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, 152, W, 3);
  const cw = colWidth(W, 3, GAP);
  const items = [
    ...letter('OK MEANS READY', 'I turned on my CoCo and it just says OK. Is it broken? I have waited a long time and nothing else has happened. My husband says to call the store, but I thought I would write to you first.', 'Walter D.', 'Dayton, OH', 'Not at all. OK means the machine is ready and waiting for you. See page ' + pageNo('screen') + '.'),
    ...letter('NOTHING BUT SNOW', 'My brother borrowed the set to watch the game and now the CoCo shows nothing but snow. The computer is on and I have checked every plug twice.', 'Diane F.', 'Wichita, KS', 'Turn the dial back to channel 3. That is where the CoCo sends its picture. Channel 4 picks up a little of it, but not enough to read.'),
    ...letter('?SN ERROR BLUES', 'Every time I type LOOK I get ?SN ERROR. I have tried it a dozen ways, in capitals and in small letters, with spaces and without. Nothing helps.', 'Ellen P.', 'Tucson, AZ', 'Until the adventure is running, BASIC will say that to LOOK. Start the adventure first.'),
    ...letter('THE TAPE THAT ATE MY SUMMER', 'I typed in last month’s whole program, all 211 lines, and it ran perfectly. Then I turned off the set. Can you tell me where the program went?', 'Hank B.', 'Boise, ID', 'To the same place all programs go when you do not save them. See CSAVE.'),
    ...letter('MONDAY TAPES', 'My tapes load fine on Sunday and give ?IO ERROR on Monday. My father says it is the weather. My mother says it is my father. I have kept a chart and it is not the weather.', 'Jim K.', 'Elmira, NY', 'Clean the heads. A cotton swab and a little alcohol, once a month, and keep the tapes out of the sun.'),
    ...letter('OFF THE MAP', 'I drew a map of the first few rooms and it went off the page. What do I do now? I used pen and I cannot rub anything out.', 'Priya S.', 'Portland, OR', 'Tape another sheet to the first. Every mapper does it sooner or later. Use pencil.'),
    ...letter('WHAT DOES ENTER DO?', 'I have read your beginners’ column twice and I still do not understand what the ENTER key does. Everything seems to wait for it.', 'Tom A.', 'Calgary, AB'),
    ...letter('A CAT HAS WON', 'My cat walked on the keyboard and now the screen says OK. Did she win? She is very proud of herself and will not come down.', 'Gwen H.', 'Duluth, MN', 'That is exactly what it says when everything is fine. Your cat has the right idea.'),
    ...letter('A QUESTION OF MEMORY', 'I have a 4K CoCo. Everyone seems to say I need 16K. How much is enough? I only want to play adventures and maybe write a very short one.', 'Rosa M.', 'Albuquerque, NM', 'Enough is whatever the program asks for on the label. Read the label.'),
    ...letter('LIKE THE OLD DAYS', 'My son brought home a CoCo and I had to sit down. I worked on the big systems before they were switched off, and I never thought I would hear a keyboard again. It is small and slow and it asks nothing of me. Thank you for printing a magazine for it.', 'Arthur L.', 'Lexington, KY', 'You are very welcome. Mind the Act, and enjoy it.'),
    ...letter('LONGER LISTINGS?', 'Please print more programs with fewer lines. My fingers hurt after the second page, and my mother says I should go outside.', 'Kevin R.', 'Akron, OH'),
  ];
  flow(ctx, rowsFor(ctx, items, cw), MARGIN, 176, W, PAGE_H - 176 - 90, 3, GAP);
}
