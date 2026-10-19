import { createTexture } from '../../engine';
import { savedReply } from './notes';
import { type PageLink, SHEET_W, TEX_H, drawSheet } from './sheet';
import type { FromSheetWorker, SheetJob } from './sheetWorker';
import { wearSeed } from './wear';

/** How long the worker has to say it can paint before the sheets are written here instead. */
const WORKER_WAIT = 4000;

/** A rewrite asked for: what to write, and what the notebook does once it is in (all `Notebook.refresh`'s). */
export interface SheetAsk {
  flags: string[];
  worn: number;
  /** The sheets whose writing changed; the rest keep what they show. */
  sheets: number[];
  /** How many sheets there are now. */
  count: number;
  /** Put the newest sheet on top. */
  fresh: boolean;
  /** Bounce the peeking page: a note was added. */
  nudge: boolean;
}

/** A rewrite done: each sheet written (a canvas, or the worker's ImageBitmap) with its page references. */
export type SheetsDone = Omit<SheetAsk, 'flags' | 'worn' | 'sheets'> & { pages: { sheet: number; page: HTMLCanvasElement | ImageBitmap; links: PageLink[] }[] };

/**
 * Gets the notebook's sheets written. A sheet takes tens of milliseconds to write by hand, so it is written in a worker
 * (`sheetWorker.ts`) and arrives a frame or more after it is asked for; until then the sheets keep what they showed, so
 * a rewrite is never half done on screen. Until the worker is ready (the first writing, at load), or where there is no
 * worker with a 2D OffscreenCanvas, they are written here, at once.
 */
export class SheetPainter {
  private mode: 'starting' | 'worker' | 'here' = 'here';
  private worker: Worker | null = null;
  /** The rewrite the worker is on, and the one waiting for it (asks made meanwhile are merged into one). */
  private busy: SheetAsk | null = null;
  private wanted: SheetAsk | null = null;
  private done: SheetsDone[] = [];
  /** The canvases written here, one a sheet, kept until `take` hands them over. */
  private here: HTMLCanvasElement[] = [];

  constructor() {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return;
    try {
      this.worker = new Worker(new URL('./sheetWorker.ts', import.meta.url), { type: 'module' });
    } catch {
      return;
    }
    this.mode = 'starting';
    this.worker.onmessage = (e: MessageEvent<FromSheetWorker>) => this.heard(e.data);
    this.worker.onerror = () => this.fallBack();
    setTimeout(() => this.mode === 'starting' && this.fallBack(), WORKER_WAIT);
  }

  /** Ask for a rewrite; it comes back from `take`, in the order asked. */
  paint(ask: SheetAsk): void {
    if (this.mode !== 'worker') return this.paintHere(ask);
    this.wanted = this.wanted ? merge(this.wanted, ask) : ask;
    this.pump();
  }

  /** The rewrites finished since the last call, oldest first. */
  take(): SheetsDone[] {
    const done = this.done;
    this.done = [];
    return done;
  }

  private pump(): void {
    if (this.busy || !this.wanted) return;
    const ask = (this.busy = this.wanted);
    this.wanted = null;
    const job: SheetJob = { flags: ask.flags, worn: ask.worn, sheets: ask.sheets, seed: wearSeed(), reply: savedReply() };
    this.worker!.postMessage(job);
  }

  private heard(m: FromSheetWorker): void {
    if (m.kind === 'ready') {
      if (this.mode === 'starting') this.mode = 'worker';
    } else if (m.kind === 'unsupported') this.fallBack();
    else if (this.busy) {
      const { count, fresh, nudge } = this.busy;
      this.busy = null;
      this.done.push({ count, fresh, nudge, pages: m.pages.map((p) => ({ sheet: p.sheet, page: p.bitmap, links: p.links })) });
      this.pump();
    }
  }

  /** No worker after all: whatever it was asked and hadn't finished is written here. */
  private fallBack(): void {
    this.worker?.terminate();
    this.worker = null;
    this.mode = 'here';
    const left = [this.busy, this.wanted].filter((a): a is SheetAsk => !!a);
    this.busy = this.wanted = null;
    if (left.length) this.paintHere(left.reduce(merge));
  }

  private paintHere(ask: SheetAsk): void {
    const set = new Set(ask.flags);
    const pages = ask.sheets.map((sheet) => {
      const c = (this.here[sheet] ??= Object.assign(document.createElement('canvas'), { width: SHEET_W, height: TEX_H }));
      return { sheet, page: c, links: drawSheet(c.getContext('2d')!, set, ask.worn, sheet).links };
    });
    this.done.push({ count: ask.count, fresh: ask.fresh, nudge: ask.nudge, pages });
  }
}

/** Two asks as one: the later's writing, of every sheet either changed. */
function merge(a: SheetAsk, b: SheetAsk): SheetAsk {
  return { ...b, sheets: [...new Set([...a.sheets, ...b.sheets])].filter((k) => k < b.count), fresh: a.fresh || b.fresh, nudge: a.nudge || b.nudge };
}

/** Put a rewrite's sheets into their textures (`texs`, one a sheet, made as they are first needed). */
export function uploadSheets(gl: WebGL2RenderingContext, texs: WebGLTexture[], d: SheetsDone): void {
  for (const p of d.pages) {
    texs[p.sheet] ??= createTexture(gl, SHEET_W, TEX_H);
    gl.bindTexture(gl.TEXTURE_2D, texs[p.sheet]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, p.page);
    gl.generateMipmap(gl.TEXTURE_2D);
    if (p.page instanceof ImageBitmap) p.page.close();
  }
}
