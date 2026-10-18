import { Ctx, MARGIN, PAGE_H, PAGE_W, SANS, colWidth, flow, headline, rowsFor, sidebar } from './paper';

const W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 100;
const GAP = 24;
const CW = colWidth(W, 3, GAP);

/** One small ad: a bold line to catch the eye, then the notice. */
const ad = (head: string, body: string, first = false): { text: string; font?: string; align?: 'left'; before?: number; keep?: boolean }[] => [
  { text: head, font: `bold 15px ${SANS}`, align: 'left', before: first ? 0 : 14, keep: true },
  { text: body },
];

/** The small ads, in the order they run. */
export const CLASSIFIEDS: readonly [string, string][] = [
  ['FOR SALE', 'CoCo 2, 16K, Extended BASIC, cassette recorder and manual. Runs perfectly. $140 or best offer. Dayton, OH.'],
  ['FREE TO GOOD HOME', 'One CoCo 2 with a box of tapes, found in a closet when we cleared my uncle’s house. It works. Please take it. Call evenings, Prospect, KY.'],
  ['USERS GROUP', 'The Tri-County CoCo Club meets the first Tuesday, 7 p.m., at the Elks Hall. Bring a tape and a friend. All levels welcome.'],
  ['WANTED', 'Back issues of the RAINBOW, any year. I will pay the postage. Priscilla M., Box 88, Lima, OH.'],
  ['PEN PALS', 'Fourteen, likes adventure games and mazes. Would like to trade maps. Kevin R., Akron, OH.'],
  ['TAPE COPIES', 'Careful duplicates of your cassettes. Ten for $9. Every copy guaranteed to load.'],
  ['HEADS CLEANED', 'If your tapes will not load, it may be the recorder and not the tape. Cleaned and aligned, $6 plus postage.'],
  ['LOST', 'A cassette labelled in pencil, “TWO”, left at the library after the meeting. Sentimental. Reward.'],
  ['WANTED', 'Anyone who remembers the big machines from before the limit. Stories, manuals, anything. Will pay. Box 31, Prospect, KY.'],
  ['MAPS FOR SALE', 'Hand-drawn maps of the popular adventures, neat and complete. $2 each. Stamped envelope please.'],
  ['SWAP', 'My spare joystick for your spare cassette cable. Mansfield, OH.'],
  ['TYPING SERVICE', 'Tired of typing in listings? I will type any program from this magazine onto your tape and check it with the RAINBOW CHECK. Twenty-five cents a line. Marge T., Gary, IN.'],
  ['BUSINESS SOFTWARE', 'Mailing lists, checkbook and inventory for the small shop. Cassette, $19.95. Ask for our free sheet. Delmar Data, Erie, PA.'],
  ['COMPUTER CAMP', 'Summer camp for young programmers, ages 10 to 16. Mazes, maps and marshmallows. Write for a brochure. Camp Wabash, IN.'],
  ['LOST AND FOUND', 'Found at the Elks Hall: one blue spiral notebook, full of numbered notes in pencil. Describe it and it is yours.'],
  ['TRADE', 'Original tapes, never loaded twice: Space Raiders, Cave Quest, Fruit Stand. Will swap for adventures. Boise, ID.'],
  ['GRANDMOTHER SEEKS', 'to learn what her grandson does all day with that machine. Will bake. Elmira, NY.'],
  ['PEN PALS', 'Retired schoolteacher seeks correspondents who enjoy puzzles. Every letter answered. Mrs. D., Provo, UT.'],
  ['STICKY STICK?', 'Joysticks that only go right, repaired. Most makes. $8 and return postage. Ohio Stick Shop.'],
  ['HELP WANTED', 'Someone to teach my brother BASIC. Pay in cookies, and he is very patient. Toledo, OH.'],
  ['FOR SALE', 'Printer, nearly new, used twice for a school report. $90. You collect. Gary, IN.'],
];

/** The classified page: readers' small ads in three narrow columns, and a notice to readers boxed below. */
export function drawClassifieds(ctx: Ctx): void {
  const y = headline(ctx, 'Classified', ['Readers writing to readers . . .', 'Ten cents a word. Box number extra . . .'], null);
  const paras = CLASSIFIEDS.flatMap(([head, body], i) => ad(head, body, i === 0));
  const ny = BOTTOM - 150;
  flow(ctx, rowsFor(ctx, paras, CW), MARGIN, y, W, ny - y - 20, 3, GAP);
  sidebar(ctx, 'Notice To Readers', MARGIN, ny, W, 150);
  flow(
    ctx,
    rowsFor(ctx, [{ text: 'Advertisers are reminded that all hardware offered in these columns must fall within the Federal computing limit. The editors cannot accept notices for any machine above it, and will not forward replies to them.', before: 0 }], W - 60),
    MARGIN + 30,
    ny + 62,
    W - 60,
    80,
  );
}
