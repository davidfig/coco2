import type { FaceRule } from './fonts';
import { drawPage } from './issue';
import { linksOf } from './pageLinks';
import { ISSUES, type IssueId } from './pages';
import { Ctx, PAGE_H, PAGE_W, pageContext } from './paper';

/**
 * The page painter's worker (`pagePainter.ts`): it paints the magazine's pages with the very same `drawPage`, on an
 * OffscreenCanvas, and sends each back as an ImageBitmap, so a painted cover never holds up a frame.
 */

/** From the book: the typefaces to make (the document's own `@font-face` rules, and the faces to load), then pages. */
export type ToWorker = { kind: 'fonts'; rules: FaceRule[]; faces: readonly string[] } | { kind: 'paint'; issue: IssueId; page: number; flags: string[] };

export type FromWorker =
  | { kind: 'ready' }
  | { kind: 'unsupported'; why: string }
  | { kind: 'page'; bitmap: ImageBitmap; links: ReturnType<typeof linksOf> };

interface Scope {
  fonts?: FontFaceSet;
  postMessage(m: FromWorker, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<ToWorker>) => void) | null;
}
const scope = self as unknown as Scope;

let canvas: OffscreenCanvas | null = null;
let ctx: Ctx | null = null;

scope.onmessage = (e) => {
  const m = e.data;
  if (m.kind === 'fonts') void start(m.rules, m.faces);
  else paint(m.issue, m.page, m.flags);
};

async function start(rules: FaceRule[], faces: readonly string[]): Promise<void> {
  const fonts = scope.fonts;
  if (typeof OffscreenCanvas === 'undefined' || !fonts) return scope.postMessage({ kind: 'unsupported', why: 'no OffscreenCanvas or fonts' });
  canvas = new OffscreenCanvas(PAGE_W, PAGE_H);
  ctx = pageContext(canvas);
  if (!ctx) return scope.postMessage({ kind: 'unsupported', why: 'no 2D OffscreenCanvas' });
  for (const r of rules) fonts.add(new FontFace(r.family, r.src, r.descriptors));
  // The same loads as the document's (`loadFonts`), so the same faces are in when the first page is painted.
  await Promise.all(faces.map((f) => fonts.load(f, 'AaBb1'))).catch(() => undefined);
  scope.postMessage({ kind: 'ready' });
}

function paint(issue: IssueId, page: number, flags: string[]): void {
  drawPage(issue, page, ctx!, { flags: new Set(flags) });
  const bitmap = canvas!.transferToImageBitmap();
  scope.postMessage({ kind: 'page', bitmap, links: linksOf(ISSUES[issue][page]) }, [bitmap]);
}
