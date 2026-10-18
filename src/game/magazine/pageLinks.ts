import { type AnyPageId, pageNo } from './pages';
import { Ctx, leader } from './paper';

/** A spot on a page (texels) that turns the book to another page when clicked: the contents' page numbers. */
export interface PageLink {
  x: number;
  y: number;
  w: number;
  h: number;
  to: AnyPageId;
}

/** Each page's links, noted while it is painted (`drawPage` says which page that is). */
const links = new Map<AnyPageId, PageLink[]>();
let painting: AnyPageId | null = null;

export function beginLinks(id: AnyPageId): void {
  painting = id;
  links.set(id, []);
}

/** The links noted on page `id` when it was painted, and putting them back where it was painted elsewhere (the worker). */
export const linksOf = (id: AnyPageId): PageLink[] => links.get(id) ?? [];
export const setLinks = (id: AnyPageId, list: PageLink[]): void => void links.set(id, list);

/** The link on page `id` under texel (`x`, `y`), if any. */
export function linkAt(id: AnyPageId, x: number, y: number): AnyPageId | undefined {
  return links.get(id)?.find((l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h)?.to;
}

/** A contents line (title, dot leader, page number) whose number is a link to that page. */
export function linkLeader(ctx: Ctx, title: string, to: AnyPageId, x: number, y: number, w: number, font: string): void {
  const no = String(pageNo(to));
  leader(ctx, title, no, x, y, w, font);
  const nw = ctx.measureText(no).width;
  // A little slack round the figures, so a short number is easy to hit.
  if (painting) links.get(painting)!.push({ x: x + w - nw - 12, y: y - 26, w: nw + 24, h: 34, to });
}
