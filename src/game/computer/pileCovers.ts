import { BAND, type Ctx, HEAVY, PAGE_H, PAGE_W, SANS, pageContext, text } from '../magazine/paper';
import { ISSUE_ORDER, type IssueId } from '../magazine/pages';
import { COVER_COLS, COVER_H, COVER_W, PILE_TEX, SPINES, SPINE_H, SPINE_Y } from './pile';

/** Paints an issue's front cover (the book's own page 1), on a page-sized context. */
export type CoverPainter = (issue: IssueId, ctx: Ctx) => void;

/**
 * The pile beside the set, for the computer's pass: which issues lie in it (`issues`, from the bottom: main.ts, those the
 * player has but the one on the table) and its texture (`pile.ts`, `PILE_TEX`): each issue's own cover, painted as the
 * book paints it (`cover`), in its place in `ISSUE_ORDER`, and its spine under them. A cover takes a tenth of a second,
 * so each is painted once, when first wanted (`have`: every issue the player has, so each is painted as it arrives, in
 * the dark of the night, not when it is first put on the pile), into a canvas kept for the next.
 */
export class Pile {
  issues: readonly IssueId[] = [];
  /** One of `issues` whose place is left empty: it is in the air, the book drawing it (main.ts's swap). */
  hidden: IssueId | null = null;
  have: readonly IssueId[] = [];
  cover: CoverPainter = () => {};
  private readonly tex: WebGLTexture;
  private readonly canvas = document.createElement('canvas');
  private readonly page = document.createElement('canvas');
  private readonly painted = new Set<IssueId>();

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.canvas.width = PILE_TEX.w;
    this.canvas.height = PILE_TEX.h;
    this.page.width = PAGE_W;
    this.page.height = PAGE_H;
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  /** Each in the pile as its place in `ISSUE_ORDER`, from the bottom: what the march shows (its covers painted first if they aren't yet). */
  places(): number[] {
    this.paint();
    return this.issues.map((id) => (id === this.hidden ? -1 : ISSUE_ORDER.indexOf(id)));
  }

  /** Issue `id`'s cover as painted for the pile, scaled up onto `ctx` (the book's stand-in till its own is painted); false if it isn't painted yet. */
  coverOf(id: IssueId, ctx: CanvasRenderingContext2D): boolean {
    if (!this.painted.has(id)) return false;
    const i = ISSUE_ORDER.indexOf(id);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.canvas, (i % COVER_COLS) * COVER_W, Math.floor(i / COVER_COLS) * COVER_H, COVER_W, COVER_H, 0, 0, ctx.canvas.width, ctx.canvas.height);
    return true;
  }

  /** The pass's uniforms for the pile, `places` as `places()` gave them; its texture on unit 2. */
  bind(u: Record<string, WebGLUniformLocation | null>, places: readonly number[]): void {
    const gl = this.gl;
    gl.uniform1f(u.uPile, places.length);
    if (places.length) gl.uniform1fv(u.uPileIssue, places);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(u.uPileTex, 2);
  }

  /** Paint whichever of `have` aren't yet, and if any were, put the texture up again, with its mipmaps. */
  private paint(): void {
    const todo = this.have.filter((id) => !this.painted.has(id));
    if (!todo.length) return;
    const gl = this.gl;
    const tex = this.tex;
    const g = this.canvas.getContext('2d')!;
    const pg = pageContext(this.page);
    g.imageSmoothingQuality = 'high';
    for (const id of todo) {
      const i = ISSUE_ORDER.indexOf(id);
      this.cover(id, pg);
      g.drawImage(this.page, (i % COVER_COLS) * COVER_W, Math.floor(i / COVER_COLS) * COVER_H, COVER_W, COVER_H);
      spine(g, SPINE_Y + i * SPINE_H, SPINES[id].colour, SPINES[id].date, SPINES[id].volume);
      this.painted.add(id);
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
}

/** A spine: its colour, the rainbow's bands, RAINBOW, the date and the volume, along it (the cover's top edge at the left). */
function spine(g: Ctx, y: number, colour: string, date: string, volume: string): void {
  const w = PILE_TEX.w;
  g.fillStyle = colour;
  g.fillRect(0, y, w, SPINE_H);
  BAND.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(40 + i * 10, y + 3, 10, SPINE_H - 6);
  });
  g.textBaseline = 'middle';
  text(g, 'THE RAINBOW', 130, y + SPINE_H / 2 + 1, `18px ${HEAVY}`, '#ffffff');
  text(g, date.toUpperCase(), 520, y + SPINE_H / 2 + 1, `bold 15px ${SANS}`, '#ffffff', 'center');
  text(g, volume, w - 40, y + SPINE_H / 2 + 1, `bold 12px ${SANS}`, '#ffffff', 'right');
  g.textBaseline = 'alphabetic';
}
