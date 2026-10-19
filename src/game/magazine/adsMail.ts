import { Ctx, SANS, SERIF } from './paper';

// The type of a mid-80s mail-order ad: headlines set tight on a phototypesetter, prices with raised cents, starbursts and
// rubber-stamp slugs, coupons to clip, the card logos by the order line. Used by the back pages' ads.

/**
 * A line of display type, condensed by `squeeze` (1 = as cut) and narrowed further to fit `maxW`, the way a typesetter
 * set headlines tight. Returns the width it took.
 */
export function setType(ctx: Ctx, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', squeeze = 1, maxW = Infinity): number {
  ctx.font = font;
  const natural = ctx.measureText(s).width;
  const k = Math.min(squeeze, maxW / natural);
  const w = natural * k;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.translate(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y);
  ctx.scale(k, 1);
  ctx.fillText(s, 0, 0);
  ctx.restore();
  return w;
}

/** How wide `price` will set a price. */
export function priceWidth(ctx: Ctx, dollars: string, cents: string, size: number, weight: string, family: string): number {
  ctx.font = `${weight} ${Math.round(size * 0.5)}px ${family}`;
  const small = ctx.measureText('$').width + (cents ? ctx.measureText(cents).width : 0);
  ctx.font = `${weight} ${size}px ${family}`;
  return small + ctx.measureText(dollars).width + size * 0.04;
}

/** A price as the ads printed it: a small raised dollar sign, the dollars, the cents raised and small ("$14⁹⁵"). `weight` goes before the size ("bold", "italic 900"). */
export function price(ctx: Ctx, dollars: string, cents: string, x: number, y: number, size: number, weight: string, family: string, color: string, align: CanvasTextAlign = 'left'): number {
  const w = priceWidth(ctx, dollars, cents, size, weight, family);
  const big = `${weight} ${size}px ${family}`;
  const small = `${weight} ${Math.round(size * 0.5)}px ${family}`;
  let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.font = small;
  ctx.fillText('$', px, y - size * 0.32);
  px += ctx.measureText('$').width;
  ctx.font = big;
  ctx.fillText(dollars, px, y);
  px += ctx.measureText(dollars).width + size * 0.04;
  ctx.font = small;
  if (cents) ctx.fillText(cents, px, y - size * 0.32);
  return w;
}

/** A price struck through, as "Was $39⁹⁵" sat under the new one. */
export function struck(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'right'): void {
  ctx.font = `${size}px ${SANS}`;
  const w = ctx.measureText(s).width;
  const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(s, left, y);
  ctx.fillRect(left + w * 0.45, y - size * 0.36, w * 0.55, Math.max(1.5, size * 0.09));
}

/** A rubber-stamp slug, turned: a box round a word or two, as "REPACK" and "NEW" were dropped in at an angle. */
export function slug(ctx: Ctx, lines: string[], x: number, y: number, size: number, angle: number, ink: string, paper?: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `bold ${size}px ${SANS}`;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 0.8;
  const h = lines.length * size * 1.05 + size * 0.45;
  if (paper) {
    ctx.fillStyle = paper;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + size * 0.22 + (i + 0.85) * size * 1.05));
  ctx.restore();
}

/** A starburst with a few words in it; the points are uneven, as one cut from a sheet of press-on art. */
export function starburst(ctx: Ctx, x: number, y: number, r: number, fill: string, ink: string, lines: string[], angle = -0.2): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.beginPath();
  const n = 22;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.76 : r * (0.98 + 0.05 * Math.sin(i * 2.3));
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  const size = r * 0.36;
  lines.forEach((l, i) => {
    ctx.font = `italic 900 ${i === 0 ? size : size * 0.72}px ${SERIF}`;
    ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 0.95 + size * 0.34);
  });
  ctx.restore();
}

/** A coupon to clip: a dashed border, its offer, and ruled lines to fill in. */
export function coupon(ctx: Ctx, x: number, y: number, w: number, h: number, head: string[], fields: string[], ink: string): void {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 6]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  let hy = y + 8;
  head.forEach((l, i) => {
    const big = i < 2;
    hy += big ? 20 : 15;
    ctx.font = big ? `bold 17px ${SANS}` : `11px ${SANS}`;
    ctx.fillText(l, x + w / 2, hy);
  });
  ctx.textAlign = 'left';
  const top = hy + 6;
  const step = (y + h - 18 - top) / fields.length;
  ctx.font = `12px ${SANS}`;
  ctx.lineWidth = 1;
  fields.forEach((f, i) => {
    const ly = top + (i + 1) * step;
    ctx.fillText(f, x + 16, ly - 3);
    ctx.fillRect(x + 16 + ctx.measureText(f).width + 6, ly, w - 38 - ctx.measureText(f).width, 1);
  });
}

/** The two card marks every order line carried, small. */
export function cards(ctx: Ctx, x: number, y: number, h: number): void {
  const w = h * 1.55;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1a3f94';
  ctx.fillRect(x, y, w, h * 0.26);
  ctx.fillStyle = '#e8a817';
  ctx.fillRect(x, y + h * 0.74, w, h * 0.26);
  ctx.font = `italic 900 ${h * 0.36}px ${SANS}`;
  ctx.fillStyle = '#1a3f94';
  ctx.textAlign = 'center';
  ctx.fillText('VISA', x + w / 2, y + h * 0.63);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const mx = x + w + 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx, y, w, h);
  ctx.strokeRect(mx, y, w, h);
  ctx.fillStyle = '#e3352b';
  ctx.beginPath();
  ctx.arc(mx + w * 0.38, y + h / 2, h * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(244,180,30,0.9)';
  ctx.beginPath();
  ctx.arc(mx + w * 0.62, y + h / 2, h * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic bold ${h * 0.15}px ${SANS}`;
  ctx.fillText('MasterCard', mx + w / 2, y + h * 0.58);
  ctx.textAlign = 'left';
}
