import { drawAds } from './ads';
import { drawBackCover, drawInsideBackAd, drawInsideCoverAd } from './adsColor';
import { drawContents, drawEditorial, drawHowTo1, drawHowTo2, drawMap } from './articles';
import { drawClassifieds } from './classifieds';
import { drawCover } from './cover';
import type { IssueState } from './data';
import { HINT_STOCK, drawGuessListing, drawHints, drawListing } from './extras';
import { drawFirstProgram, drawStopping, drawTape } from './learn';
import { drawLetters } from './letters';
import { PAGE_IDS, type PageId } from './pages';
import { Ctx, Hotspot, PAGE_H, PAGE_W, furniture, inkPass, paperBase } from './paper';

/** The issue on the table: its pages in `pages.ts` order, the cover being page 1 (index 0). */
export const PAGE_COUNT = PAGE_IDS.length;

interface PageDef {
  draw: (ctx: Ctx, s: IssueState) => Hotspot[] | void;
  /** Colour pages are drawn edge to edge, without the paper or the running foot. */
  colour?: boolean;
  /** Paper colour, if not the usual stock. */
  stock?: string;
  /** No running foot (the letters page sets its own). */
  noFoot?: boolean;
}

const PAGES: Record<PageId, PageDef> = {
  cover: { draw: drawCover, colour: true },
  insideFront: { draw: drawInsideCoverAd, colour: true },
  contents: { draw: drawContents },
  letters: { draw: drawLetters, noFoot: true },
  editorial: { draw: drawEditorial },
  screen: { draw: drawHowTo1 },
  words: { draw: drawHowTo2 },
  map: { draw: drawMap },
  hints: { draw: drawHints, stock: HINT_STOCK },
  typeIn: { draw: drawListing },
  program: { draw: drawFirstProgram },
  stopping: { draw: drawStopping },
  guess: { draw: drawGuessListing },
  tape: { draw: drawTape },
  classifieds: { draw: drawClassifieds },
  marketplace: { draw: drawAds },
  insideBack: { draw: drawInsideBackAd, colour: true },
  backCover: { draw: drawBackCover, colour: true },
};

/** Draw page `i` (0-based) onto a PAGE_W × PAGE_H canvas and return its clickable regions. */
export function drawPage(i: number, ctx: Ctx, s: IssueState): Hotspot[] {
  ctx.clearRect(0, 0, PAGE_W, PAGE_H);
  const def = PAGES[PAGE_IDS[i]];
  if (def.colour) {
    def.draw(ctx, s);
    return [];
  }
  paperBase(ctx, 1000 + i, def.stock);
  const spots = def.draw(ctx, s) ?? [];
  if (!def.noFoot) furniture(ctx, i);
  inkPass(ctx, 1000 + i);
  return spots;
}
