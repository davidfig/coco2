import { drawAds } from './ads';
import { drawCleanerAd } from './adsCleaner';
import { drawBackCover, drawInsideBackAd, drawInsideCoverAd } from './adsColor';
import { drawContents, drawEditorial, drawHowTo1, drawHowTo2, drawMap } from './articles';
import { drawClassifieds } from './classifieds';
import { drawCover } from './cover';
import type { IssueState } from './data';
import { drawGuessListing, drawListing } from './extras';
import { drawFirstProgram, drawStopping, drawTape } from './learn';
import { drawLetters } from './letters';
import { ISSUES, ISSUE_DATE, type AnyPageId, type IssueId } from './pages';
import { drawMayCover, drawMayNotice } from './may';
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
  typeIn: { draw: drawListing },
  program: { draw: drawFirstProgram },
  stopping: { draw: drawStopping },
  guess: { draw: drawGuessListing },
  tape: { draw: drawTape },
  classifieds: { draw: drawClassifieds },
  marketplace: { draw: drawAds },
  insideBack: { draw: drawInsideBackAd, colour: true },
  backCover: { draw: drawBackCover, colour: true },
  // May: only the cover and the notice are new; the advertisers ran the same colour ads again.
  mayCover: { draw: drawMayCover, colour: true },
  mayNotice: { draw: drawMayNotice },
  mayInsideBack: { draw: drawInsideBackAd, colour: true },
  mayBackCover: { draw: drawBackCover, colour: true },
};

/** Draw page `i` (0-based) of an issue onto a PAGE_W × PAGE_H canvas. */
export function drawPage(issue: IssueId, i: number, ctx: Ctx, s: IssueState): void {
  ctx.clearRect(0, 0, PAGE_W, PAGE_H);
  const def = PAGES[ISSUES[issue][i]];
  if (def.colour) {
    def.draw(ctx, s);
    return;
  }
  paperBase(ctx, 1000 + i, def.stock);
  def.draw(ctx, s);
  if (!def.noFoot) furniture(ctx, i, ISSUE_DATE[issue]);
  inkPass(ctx, 1000 + i);
}
