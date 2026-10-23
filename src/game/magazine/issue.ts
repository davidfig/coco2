import { drawAds } from './ads';
import { drawCleanerAd } from './adsCleaner';
import { drawBackCover } from './adsBackCover';
import { drawInsideCoverAd } from './adsColor';
import { drawInsideBackAd } from './adsInsideBack';
import { drawMemoryAd } from './adsMemory';
import { drawContents, drawEditorial, drawHowTo1, drawHowTo2, drawMap } from './articles';
import { drawClassifieds } from './classifieds';
import { drawCover } from './cover';
import type { IssueState } from './data';
import { drawGuessListing } from './extras';
import { drawFirstProgram, drawStopping, drawTape } from './learn';
import { drawLetters } from './letters';
import { ISSUES, ISSUE_DATE, type AnyPageId, type IssueId } from './pages';
import { drawJulyCover, julyDraft } from './julyDraft';
import { drawMayCover } from './may';
import { drawMayBackCover } from './mayBackCover';
import { drawMayInsideBack } from './mayInsideBack';
import { drawMayInsideFront } from './mayInsideFront';
import { drawMayNed } from './mayNed';
import { drawClearMind, drawHealthy, drawMayContents, drawMayEditorial } from './mayArticles';
import { drawMayTape, drawSecret } from './mayCode';
import { drawShutdown, drawShutdownEnd, drawShutdownList } from './mayShutdown';
import { drawMayClassifieds, drawMayLetters } from './mayLetters';
import { beginLinks } from './pageLinks';
import { drawSlip } from './slips';
import { Ctx, PAGE_H, PAGE_W, furniture, inkPass, paperBase } from './paper';

/** The most pages any issue has: the book's texture array holds that many layers. */
export const MAX_PAGES = Math.max(...Object.values(ISSUES).map((ids) => ids.length));

interface PageDef {
  draw: (ctx: Ctx, s: IssueState) => void;
  /** Colour pages are drawn edge to edge, without the paper or the running foot. */
  colour?: boolean;
  /** Paper colour, if not the usual stock. */
  stock?: string;
  /** No running foot (the letters page sets its own). */
  noFoot?: boolean;
}

const PAGES: Record<AnyPageId, PageDef> = {
  cover: { draw: drawCover, colour: true },
  insideFront: { draw: drawInsideCoverAd, colour: true },
  contents: { draw: drawContents },
  letters: { draw: drawLetters, noFoot: true },
  editorial: { draw: drawEditorial },
  screen: { draw: drawHowTo1 },
  words: { draw: drawHowTo2 },
  map: { draw: drawMap },
  cleanerAd: { draw: drawCleanerAd },
  memoryAd: { draw: drawMemoryAd },
  program: { draw: drawFirstProgram },
  stopping: { draw: drawStopping },
  guess: { draw: drawGuessListing },
  tape: { draw: drawTape },
  classifieds: { draw: drawClassifieds },
  insideBack: { draw: drawInsideBackAd, colour: true },
  backCover: { draw: drawBackCover, colour: true },
  marketplace: { draw: drawAds },
  // May: every ad is new (docs/issues.md, Advertisements), and Ned's catalogue is back without its tape copier.
  mayCover: { draw: drawMayCover, colour: true },
  mayInsideFront: { draw: drawMayInsideFront, colour: true },
  mayContents: { draw: drawMayContents },
  mayLetters: { draw: drawMayLetters, noFoot: true },
  mayEditorial: { draw: drawMayEditorial },
  mayHealthy: { draw: drawHealthy },
  maySecret: { draw: drawSecret },
  mayShutdown: { draw: drawShutdown },
  mayShutdownList: { draw: drawShutdownList },
  mayShutdownEnd: { draw: drawShutdownEnd },
  mayTape: { draw: drawMayTape },
  mayClearMind: { draw: drawClearMind },
  mayClassifieds: { draw: drawMayClassifieds },
  mayMarketplace: { draw: drawMayNed },
  mayInsideBack: { draw: drawMayInsideBack, colour: true },
  mayBackCover: { draw: drawMayBackCover, colour: true },
  // July: placeholders until each page is written (julyDraft.ts).
  julyCover: { draw: drawJulyCover, colour: true },
  julyInsideFront: { draw: julyDraft('julyInsideFront') },
  julyContents: { draw: julyDraft('julyContents') },
  julyLetters: { draw: julyDraft('julyLetters') },
  julyEditorial: { draw: julyDraft('julyEditorial') },
  julyInterview: { draw: julyDraft('julyInterview') },
  julyPlace: { draw: julyDraft('julyPlace') },
  julyRegister: { draw: julyDraft('julyRegister') },
  julyRegisterList: { draw: julyDraft('julyRegisterList') },
  julyTape: { draw: julyDraft('julyTape') },
  julyClearMind: { draw: julyDraft('julyClearMind') },
  julySermon: { draw: julyDraft('julySermon') },
  julyClassifieds: { draw: julyDraft('julyClassifieds') },
  julyMarketplace: { draw: julyDraft('julyMarketplace') },
  julyInsideBack: { draw: julyDraft('julyInsideBack') },
  julyBackCover: { draw: julyDraft('julyBackCover') },
};

/** Draw page `i` (0-based) of an issue onto a PAGE_W × PAGE_H canvas. */
export function drawPage(issue: IssueId, i: number, ctx: Ctx, s: IssueState): void {
  ctx.clearRect(0, 0, PAGE_W, PAGE_H);
  const id = ISSUES[issue][i];
  const def = PAGES[id];
  beginLinks(id);
  if (def.colour) def.draw(ctx, s);
  else {
    paperBase(ctx, 1000 + i, def.stock);
    def.draw(ctx, s);
    if (!def.noFoot) furniture(ctx, i, ISSUE_DATE[issue]);
    inkPass(ctx, 1000 + i);
  }
  // Anything tucked in at this page lies on top of the print.
  drawSlip(ctx, id);
}
