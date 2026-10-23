/**
 * The July issue's pages as placeholders, until each is written (docs/issues.md, Issue 3; puzzles.md, Issue 3): every page
 * has its headline and a box saying what goes there, so the issue can arrive, be read, piled and swapped while it is
 * built. Replace a page's entry in `issue.ts` as its real one is drawn, and this file goes once none is left.
 */
import { STRIP } from './coverArt';
import { drawMasthead } from './cover';
import { type JulyPageId } from './pages';
import { Ctx, INK, MARGIN, PAGE_H, PAGE_W, SANS, SCRIPT, SERIF, colWidth, flow, headline, rowsFor, sidebar, text } from './paper';

/** Each page: its headline, the deck under it, and what the finished page will hold. */
const PLAN: Record<Exclude<JulyPageId, 'julyCover'>, { title: string; deck: string[]; holds: string }> = {
  julyInsideFront: { title: 'Inside front', deck: ['A colour ad'], holds: 'A painted ad that nods to registration: an engraved serial-number plate, so yours is never mistaken for another.' },
  julyContents: { title: 'Contents', deck: ['July 1986'], holds: 'The contents, linking each page, and the masthead box.' },
  julyLetters: { title: 'Letters to Rainbow', deck: ['Our readers write'], holds: 'The first letter to call the Clear Mind “the Quiet”, and readers asking what registering means for them.' },
  julyEditorial: { title: 'PRINT #-2', deck: ['Editor’s notes', 'Registration, and what it asks of you'], holds: 'The law: every machine must be registered. The form, with its serial-number box and a deadline.' },
  julyInterview: { title: 'Getting Out', deck: ['An interview with a hobbyist who put it all away'], holds: 'The cover story, the name blacked out wherever it appears.' },
  julyPlace: { title: 'Finding Your Place', deck: ['SKIPF, the F lines, and the counter'], holds: 'The tutorial on where things are on a tape (puzzles.md, rung E). A file you did not expect shows up as an F line too.' },
  julyRegister: { title: 'Register', deck: ['A helper for the new form'], holds: 'REGISTER: what it asks, the card it prints, and the start of its listing.' },
  julyRegisterList: { title: 'Register', deck: ['The listing, continued'], holds: 'The rest of REGISTER’s listing, each line’s RAINBOW CHECK at its right.' },
  julyTape: { title: 'Rainbow On Tape', deck: ['This month’s cassette'], holds: 'What is on the July tape: ABOUT and REGISTER.' },
  julyClearMind: { title: 'Clear Mind, Clear Code', deck: ['READY’s column'], holds: 'The column in its even voice, lists of three, “it is understood that”. The Line, and booklet MC4471.' },
  julySermon: { title: 'A Word From A Member', deck: ['Warmer, sharper'], holds: 'A follower’s sermon, beside the column: the first drift from READY’s voice to the Elder’s.' },
  julyClassifieds: { title: 'Classified', deck: ['Our readers'], holds: 'Classifieds: machines for sale before the deadline, a tape copier wanted.' },
  julyMarketplace: { title: 'Marketplace', deck: ['Nifty Ned’s July catalogue'], holds: 'A REGISTERED OWNER decal, a filing box for your receipts, a dust cover with no label on it.' },
  julyInsideBack: { title: 'Inside back', deck: ['Mail order'], holds: 'CLOAD-A-MATIC’s tape labels that peel off clean.' },
  julyBackCover: { title: 'Back cover', deck: ['A national ad'], holds: 'To come.' },
};

/** The July cover, unpainted: the masthead on a night-blue ground and the cover story's line. */
export function drawJulyCover(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, 0, 0, PAGE_H);
  g.addColorStop(0, '#1b2440');
  g.addColorStop(1, '#3a3f58');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  drawMasthead(ctx, 'July 1986');
  text(ctx, 'Getting Out', STRIP + 50, 420, `italic bold 64px ${SCRIPT}`, '#f4e24a');
  text(ctx, 'An interview with ██████ ████', STRIP + 54, 470, `bold 30px ${SANS}`, '#ffffff');
  text(ctx, '(cover painting to come)', PAGE_W / 2, PAGE_H - 140, `italic 24px ${SERIF}`, 'rgba(255,255,255,0.6)', 'center');
}

/** A July page that isn't written yet: its headline, and a box saying what it will hold. */
export function julyDraft(id: Exclude<JulyPageId, 'julyCover'>): (ctx: Ctx) => void {
  return (ctx) => {
    const { title, deck, holds } = PLAN[id];
    const y = headline(ctx, title, deck, null);
    const w = PAGE_W - MARGIN * 2;
    sidebar(ctx, 'To come', MARGIN, y + 20, w, 220);
    const cw = colWidth(w - 60, 1);
    flow(ctx, rowsFor(ctx, [{ text: holds }], cw), MARGIN + 30, y + 90, cw, 140, 1);
    ctx.fillStyle = INK;
  };
}
