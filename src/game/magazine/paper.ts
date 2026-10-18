/** Page size in texels (8.5 × 11 in), the inks, and the typesetting helpers every page is drawn with. */
export const PAGE_W = 1024;
export const PAGE_H = 1325;
export const MARGIN = 72;

/** Black ink on uncoated stock: it never prints darker than a warm charcoal. */
export const INK = '#2c2925';
export const PAPER = '#f7f5ee';
/** The six bands of the Rainbow logo, red to violet. */
export const BAND = ['#d93a2b', '#f08a24', '#f4c61c', '#3b9c47', '#2c68b8', '#7b3f9d'];
export const SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif';
export const SANS = 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif';
export const HEAVY = '"Archivo Black", Archivo, "Arial Black", sans-serif';
export const OPTIMA = SANS;
export const SCRIPT = '"Kaushan Script", "Brush Script MT", cursive';
export const MONO = '"Courier Prime", "Courier New", Courier, monospace';
export const PENCIL = 'Caveat, "Bradley Hand", "Comic Sans MS", cursive';

export type Ctx = CanvasRenderingContext2D;

/**
 * The 2D context a whole page is painted on, in software. The paint passes read the page back (`paintify`), and after a
 * few readbacks the browser moves a canvas off the GPU: the pages have always been painted on one that had moved (the
 * book's one canvas, after its first painted page), so this one is moved before the first. A GPU canvas's edges and
 * gradients come out a little differently, and not quite the same from one run to the next.
 */
export function pageContext(canvas: HTMLCanvasElement | OffscreenCanvas): Ctx {
  // A worker's OffscreenCanvas doesn't move for readbacks: it is asked to be a software one from the start.
  if (typeof document === 'undefined') return canvas.getContext('2d', { willReadFrequently: true }) as unknown as Ctx;
  const ctx = canvas.getContext('2d') as Ctx;
  for (let i = 0; i < 2; i++) ctx.getImageData(0, 0, 1, 1);
  return ctx;
}

/**
 * A scratch canvas `w`×`h` to paint on and draw from: a document's, or an OffscreenCanvas where there is none (the page
 * painter's worker). Typed as the document's, which is all the pages ask of it.
 */
export function scratch(w: number, h: number): HTMLCanvasElement {
  if (typeof document === 'undefined') return new OffscreenCanvas(w, h) as unknown as HTMLCanvasElement;
  const c = document.createElement('canvas');
  [c.width, c.height] = [w, h];
  return c;
}

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Newsprint: cream stock, speckle, a yellowed edge. */
export function paperBase(ctx: Ctx, seed: number, stock = PAPER): void {
  ctx.fillStyle = stock;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  const r = rng(seed);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(70,60,50,${(0.01 + r() * 0.03).toFixed(3)})`;
    ctx.fillRect(r() * PAGE_W, r() * PAGE_H, 1 + r() * 2, 1 + r() * 2);
  }
  const g = ctx.createRadialGradient(PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.35, PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.8);
  g.addColorStop(0, 'rgba(120,110,90,0)');
  g.addColorStop(1, 'rgba(120,110,90,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
}

/** Ink laid on the stock, not over it: the paper's grain lifts the solids in specks, so no black is flat. */
export function inkPass(ctx: Ctx, seed: number): void {
  const r = rng(seed ^ 0x5eed);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(90,84,74,${(0.04 + r() * 0.1).toFixed(3)})`;
    ctx.fillRect(r() * PAGE_W, r() * PAGE_H, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.restore();
}

/** A line of text and how it sits in its column. */
export interface Row {
  text: string;
  font: string;
  lh: number;
  color?: string;
  /** Space above, unless it starts a column. */
  before?: number;
  justify?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Keep this line on the same column as the next one (a heading, say). */
  keep?: boolean;
  dx?: number;
  /** A drop capital drawn beside the first lines of a paragraph. */
  cap?: string;
}

function wrapLines(ctx: Ctx, text: string, widthOf: (line: number) => number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const trial = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(trial).width > widthOf(out.length)) {
      out.push(cur);
      cur = word;
    } else cur = trial;
  }
  if (cur) out.push(cur);
  return out;
}

export interface Para {
  text: string;
  font?: string;
  lh?: number;
  color?: string;
  before?: number;
  /** Set the first letter as a three-line drop capital. */
  drop?: boolean;
  align?: 'justify' | 'left' | 'center' | 'right';
  /** Don't leave this paragraph's last line at the foot of a column: heads. */
  keep?: boolean;
}

const BODY = `16px ${SERIF}`;
export const BODY_LH = 19;

/** Break paragraphs into rows for a column `colW` wide. */
export function rowsFor(ctx: Ctx, paras: Para[], colW: number): Row[] {
  const rows: Row[] = [];
  for (const p of paras) {
    const font = p.font ?? BODY;
    const lh = p.lh ?? BODY_LH;
    ctx.font = font;
    const capW = p.drop ? lh * 2.1 : 0;
    const text = p.drop ? p.text.slice(1) : p.text;
    const lines = wrapLines(ctx, text, (i) => colW - (i < 3 ? capW : 0));
    lines.forEach((t, i) =>
      rows.push({
        text: t,
        font,
        lh,
        color: p.color,
        before: i === 0 ? (p.before ?? 8) : 0,
        justify: (p.align ?? 'justify') === 'justify' && i < lines.length - 1,
        align: p.align === 'center' || p.align === 'right' ? p.align : 'left',
        keep: p.keep && i === lines.length - 1,
        dx: i < 3 ? capW : 0,
        cap: i === 0 && p.drop ? p.text[0] : undefined,
      }),
    );
  }
  return rows;
}

/** Width of one column when `w` is poured into `cols` columns. */
export const colWidth = (w: number, cols: number, gap = 34): number => (w - gap * (cols - 1)) / cols;

/** Pour rows into `cols` columns of a box; returns false if they didn't all fit. */
export function flow(ctx: Ctx, rows: Row[], x: number, y: number, w: number, h: number, cols = 1, gap = 34): boolean {
  const cw = (w - gap * (cols - 1)) / cols;
  let col = 0;
  let cy = y;
  ctx.textBaseline = 'alphabetic';
  for (let n = 0; n < rows.length; n++) {
    const row = rows[n];
    const top = cy === y;
    const nx = row.keep ? rows[n + 1] : undefined;
    const need = (top ? 0 : (row.before ?? 0)) + row.lh + (nx ? (nx.before ?? 0) + nx.lh : 0);
    if (cy + need > y + h) {
      if (++col >= cols) return false;
      cy = y;
    }
    cy += (cy === y ? 0 : (row.before ?? 0)) + row.lh;
    const cx = x + col * (cw + gap);
    const base = cy - row.lh * 0.27;
    ctx.font = row.font;
    ctx.fillStyle = row.color ?? INK;
    if (row.cap) {
      ctx.font = `bold ${Math.round(row.lh * 3.1)}px ${SANS}`;
      ctx.fillText(row.cap, cx - 2, base + row.lh * 2);
      ctx.font = row.font;
    }
    const tx = cx + (row.dx ?? 0);
    const tw = cw - (row.dx ?? 0);
    const words = row.text.split(' ');
    if (row.justify && words.length > 1) {
      const used = words.reduce((s, t) => s + ctx.measureText(t).width, 0);
      const space = (tw - used) / (words.length - 1);
      let px = tx;
      for (const t of words) {
        ctx.fillText(t, px, base);
        px += ctx.measureText(t).width + space;
      }
    } else if (row.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(row.text, tx + tw / 2, base);
      ctx.textAlign = 'left';
    } else if (row.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(row.text, tx + tw, base);
      ctx.textAlign = 'left';
    } else ctx.fillText(row.text, tx, base);
  }
  return true;
}

/** Single line of text, optionally centred on x. Returns its width. */
export function text(ctx: Ctx, s: string, x: number, y: number, font: string, color = INK, align: CanvasTextAlign = 'left'): number {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
  return ctx.measureText(s).width;
}

/** Title / dot leader / page number, as in a contents list. */
export function leader(ctx: Ctx, left: string, right: string, x: number, y: number, w: number, font: string): void {
  ctx.font = font;
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  const lw = ctx.measureText(left).width;
  const rw = ctx.measureText(right).width;
  ctx.fillText(left, x, y);
  ctx.fillText(right, x + w - rw, y);
  const dot = ctx.measureText(' .').width;
  let px = x + lw + 8;
  while (px < x + w - rw - 8) {
    ctx.fillText('.', px, y);
    px += dot;
  }
}

/** The rainbow arc rule used under headings: six thin stripes. */
export function rainbowRule(ctx: Ctx, x: number, y: number, w: number, thick = 3): void {
  BAND.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y + i * thick, w, thick);
  });
}

/** The heavy black bar that tops an article. */
export function topBar(ctx: Ctx, y = 70): void {
  ctx.fillStyle = INK;
  ctx.fillRect(MARGIN, y, PAGE_W - MARGIN * 2, 18);
}

/**
 * An article's opening: black bar, heavy sans headline, italic deck lines ending in ". . .", a byline. Returns the y
 * below it.
 */
export function headline(ctx: Ctx, title: string, deck: string[], by: string | null, size = 56): number {
  const x = MARGIN;
  const w = PAGE_W - MARGIN * 2;
  topBar(ctx);
  let y = 70 + 18 + size + 14;
  text(ctx, title.toUpperCase(), x, y, `bold ${size}px ${SANS}`);
  y += 12;
  for (const d of deck) {
    y += 30;
    text(ctx, d, x + 14, y, `italic 23px ${SERIF}`);
  }
  if (by) {
    y += 34;
    text(ctx, by, x + 14, y, `bold 18px ${SANS}`);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(x, y + 18, w, 2);
  return y + 40;
}

/** A pull quote between double rules. */
export function pullQuote(ctx: Ctx, quote: string, x: number, y: number, w: number): number {
  const font = `italic 29px ${SERIF}`;
  const rows = rowsFor(ctx, [{ text: `\u201C${quote}\u201D`, font, lh: 37, align: 'left', before: 0 }], w - 60);
  const h = rows.length * 37 + 36;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + 6, w, 1);
  flow(ctx, rows, x + 30, y + 22, w - 60, h);
  ctx.fillRect(x, y + h + 4, w, 1);
  ctx.fillRect(x, y + h + 9, w, 2);
  return y + h + 30;
}

/** A shaded sidebar box with a bold title. */
export function sidebar(ctx: Ctx, title: string, x: number, y: number, w: number, h: number, shade = 'rgba(60,60,60,0.12)'): void {
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  text(ctx, title, x + w / 2, y + 42, `bold 28px ${SANS}`, INK, 'center');
}

/** Running foot, as the magazine sets it: date, the title (italic "the", bold "RAINBOW") and the folio. */
export function furniture(ctx: Ctx, index: number, month = 'March 1986'): void {
  const n = String(index + 1);
  const y = PAGE_H - 40;
  const left = index % 2 === 1;
  const parts = (ctx2: Ctx, x: number, dir: 1 | -1, items: [string, string][]): void => {
    let px = x;
    for (const [s, f] of dir === 1 ? items : [...items].reverse()) {
      ctx2.font = f;
      const w = ctx2.measureText(s).width;
      ctx2.fillStyle = INK;
      ctx2.fillText(s, dir === 1 ? px : px - w, y);
      px += dir * (w + 10);
    }
  };
  ctx.textBaseline = 'alphabetic';
  const date: [string, string] = [month, `14px ${SANS}`];
  const the: [string, string] = ['the', `italic 14px ${SERIF}`];
  const name: [string, string] = ['RAINBOW', `bold 15px ${SANS}`];
  if (left) parts(ctx, MARGIN, 1, [[n, `bold 18px ${SANS}`], the, name, date]);
  else parts(ctx, PAGE_W - MARGIN, -1, [date, the, name, [n, `bold 18px ${SANS}`]]);
}

/** A gray tab of white italic text, like the "Software Review" label that heads a review. */
export function banner(ctx: Ctx, label: string, x = MARGIN, y = 72, w = 260): void {
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(x, y, w, 26);
  text(ctx, label, x + 10, y + 20, `italic bold 19px ${SERIF}`, '#ffffff');
}
