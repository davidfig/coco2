import { tellReply } from './notes';
import { type PageLink, SHEET_W, TEX_H, drawSheet } from './sheet';
import { useWearSeed } from './wear';

/**
 * The sheet painter's worker (`sheetPainter.ts`): it writes the notebook's sheets with the very same `drawSheet`, on an
 * OffscreenCanvas, and sends each back as an ImageBitmap, so a rewrite (tens of ms a sheet) never holds up a frame.
 * It has no localStorage: the wear's seed and the ORACLE reply come with each job.
 */

/** One rewrite: the flags in the order they were set, the wear, and which sheets to write. */
export type SheetJob = { flags: string[]; worn: number; sheets: number[]; seed: number; reply: string };

export type FromSheetWorker = { kind: 'ready' } | { kind: 'unsupported' } | { kind: 'sheets'; pages: { sheet: number; bitmap: ImageBitmap; links: PageLink[] }[] };

interface Scope {
  postMessage(m: FromSheetWorker, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<SheetJob>) => void) | null;
}
const scope = self as unknown as Scope;

const canvas = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(SHEET_W, TEX_H);
const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D | null | undefined;

scope.onmessage = async (e) => {
  const job = e.data;
  useWearSeed(job.seed);
  tellReply(job.reply);
  const set = new Set(job.flags);
  const pages = [];
  for (const sheet of job.sheets) {
    const { links } = drawSheet(ctx!, set, job.worn, sheet);
    // Straight alpha, as a canvas uploads: a transferred bitmap is premultiplied, which darkens the torn edges.
    pages.push({ sheet, bitmap: await createImageBitmap(canvas!, { premultiplyAlpha: 'none' }), links });
  }
  scope.postMessage(
    { kind: 'sheets', pages },
    pages.map((p) => p.bitmap),
  );
};

scope.postMessage(ctx ? { kind: 'ready' } : { kind: 'unsupported' });
