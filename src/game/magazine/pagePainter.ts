import type { IssueState } from './data';
import { FACES, faceRules } from './fonts';
import { drawPage } from './issue';
import type { PageTextures } from './pageTextures';
import { setLinks } from './pageLinks';
import { ISSUES, type IssueId } from './pages';
import { PAGE_H, PAGE_W, pageContext } from './paper';
import type { FromWorker, ToWorker } from './pageWorker';

/** How long the worker has to say it can paint before the pages are painted here instead. */
const WORKER_WAIT = 4000;

interface Job {
  issue: IssueId;
  page: number;
  /** `PagePainter.gen` when it was asked for. */
  gen: number;
}

/**
 * Gets the book's pages painted and onto the GPU. A page takes tens of milliseconds to paint (a cover or a painted ad
 * over a hundred), so it is painted in a worker (`pageWorker.ts`) and arrives a frame or more after it is asked for; until
 * then its layer is bare paper. Where a worker can't paint (no OffscreenCanvas 2D, or no fonts in workers: older
 * Safari), a page is painted here when it is asked for, as it always was.
 */
export class PagePainter {
  /** Layers holding the issue's page now. */
  readonly have = new Set<number>();
  private mode: 'starting' | 'worker' | 'here';
  private worker: Worker | null = null;
  /** Pages asked for and not yet sent to the worker, the most wanted first. */
  private queue: Job[] = [];
  /** The page the worker is painting. */
  private busy: Job | null = null;
  /** Painted pages waiting to go up, one a frame. */
  private done: { job: Job; bitmap: ImageBitmap }[] = [];
  /** Bumped when every page painted so far is out of date (another issue, the typefaces in): their results are dropped. */
  private gen = 0;
  private here: CanvasRenderingContext2D | null = null;

  constructor(
    private readonly pages: PageTextures,
    private readonly state: IssueState,
  ) {
    pages.blank();
    this.mode = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' ? 'starting' : 'here';
  }

  /** The typefaces are in: start the worker with them, or (painting here) paint everything again with them. */
  fontsLoaded(): void {
    if (this.mode === 'here') return this.forget(false);
    try {
      this.worker = new Worker(new URL('./pageWorker.ts', import.meta.url), { type: 'module' });
    } catch {
      return this.fallBack();
    }
    this.worker.onmessage = (e: MessageEvent<FromWorker>) => this.heard(e.data);
    this.worker.onerror = () => this.fallBack();
    this.post({ kind: 'fonts', rules: faceRules(), faces: FACES });
    setTimeout(() => this.mode === 'starting' && this.fallBack(), WORKER_WAIT);
  }

  /** Page `page` is in its layer, or on its way there. */
  asked(page: number): boolean {
    return this.have.has(page) || this.isBusy(page) || this.queue.some((j) => j.page === page) || this.done.some((d) => d.job.page === page);
  }

  /** Get page `page` of `issue` painted into its layer; `urgent` (it is in view) puts it ahead of the rest. */
  ensure(issue: IssueId, page: number, urgent = false): void {
    if (this.have.has(page)) return;
    if (this.mode === 'here') return this.paintHere(issue, page);
    if (this.isBusy(page) || this.done.some((d) => d.job.page === page)) return;
    const at = this.queue.findIndex((j) => j.page === page);
    if (at >= 0 && !urgent) return;
    const job = at >= 0 ? this.queue.splice(at, 1)[0] : { issue, page, gen: this.gen };
    urgent ? this.queue.unshift(job) : this.queue.push(job);
    this.pump();
  }

  /** Forget every page painted or on its way (another issue is on the table); `blank` papers over what the layers hold. */
  forget(blank = true): void {
    this.gen++;
    this.have.clear();
    this.queue = [];
    for (const d of this.done) d.bitmap.close();
    this.done = [];
    if (blank) this.pages.blank();
  }

  /** Per frame: put one painted page on the GPU, and keep the worker busy. */
  update(): void {
    const d = this.done.shift();
    if (d) {
      this.pages.upload(d.job.page, d.bitmap);
      d.bitmap.close();
      this.have.add(d.job.page);
    }
    this.pump();
  }

  private isBusy(page: number): boolean {
    return this.busy?.page === page && this.busy.gen === this.gen;
  }

  private pump(): void {
    if (this.mode !== 'worker' || this.busy) return;
    const job = this.queue.shift();
    if (!job) return;
    this.busy = job;
    this.post({ kind: 'paint', issue: job.issue, page: job.page, flags: [...this.state.flags] });
  }

  private heard(m: FromWorker): void {
    if (m.kind === 'ready') {
      this.mode = 'worker';
      this.pump();
    } else if (m.kind === 'unsupported') {
      this.fallBack();
    } else {
      const job = this.busy!;
      this.busy = null;
      this.pump();
      if (job.gen !== this.gen) return m.bitmap.close();
      setLinks(ISSUES[job.issue][job.page], m.links);
      this.done.push({ job, bitmap: m.bitmap });
    }
  }

  /** No worker after all: pages are painted here from now on (the book asks again for any it was waiting on). */
  private fallBack(): void {
    this.worker?.terminate();
    this.worker = null;
    this.mode = 'here';
    this.busy = null;
    this.queue = [];
    this.forget(false);
  }

  private paintHere(issue: IssueId, page: number): void {
    if (!this.here) {
      const c = document.createElement('canvas');
      [c.width, c.height] = [PAGE_W, PAGE_H];
      this.here = pageContext(c);
    }
    drawPage(issue, page, this.here, this.state);
    this.pages.upload(page, this.here.canvas);
    this.have.add(page);
  }

  private post(m: ToWorker): void {
    this.worker!.postMessage(m);
  }
}
