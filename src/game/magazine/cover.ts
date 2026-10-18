import { BAND, Ctx, PAGE_H, PAGE_W, SANS, SCRIPT, rng, text, HEAVY } from './paper';
import { pageNo } from './pages';
import { STRIP, drawScene } from './coverArt';
import { paintify } from './coverPaint';

/**
 * A four-point sparkle, painted by hand so no two match: a soft glow, rays of uneven length (the vertical pair longest)
 * whose sides curve in to a thin tip, a slight tilt, sometimes four short diagonal rays, and a hot core.
 */
export function sparkle(ctx: Ctx, x: number, y: number, r: number, seed: number): void {
  const rnd = rng(seed);
  const vary = (v: number, by = 0.14): number => v * (1 + (rnd() - 0.5) * 2 * by);
  const g = ctx.createRadialGradient(x, y, 0, x + vary(r * 0.05, 1), y + vary(r * 0.05, 1), vary(r * 0.9));
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(225,235,255,0.35)');
  g.addColorStop(1, 'rgba(200,215,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  const ray = (a: number, len: number, w: number): void => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const tip = [x + c * len, y + s * len];
    const side = (k: number): [number, number] => [x - s * w * k, y + c * w * k];
    const [lx, ly] = side(1);
    const [rx, ry] = side(-1);
    // The sides bow inward: a quadratic whose control point sits close to the ray's spine.
    const ctl = (k: number): [number, number] => [x + c * len * 0.3 - s * w * k * 0.25, y + s * len * 0.3 + c * w * k * 0.25];
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(...ctl(1), tip[0], tip[1]);
    ctx.quadraticCurveTo(...ctl(-1), rx, ry);
  };
  const tilt = (rnd() - 0.5) * 0.22;
  const width = r * vary(0.11, 0.25);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ray(tilt - Math.PI / 2, vary(r * 1.05), width);
  ray(tilt + Math.PI / 2, vary(r * 0.9), width);
  ray(tilt, vary(r * 0.72), width * 0.9);
  ray(tilt + Math.PI, vary(r * 0.78), width * 0.9);
  ctx.fill();
  if (rnd() < 0.67) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) ray(tilt + Math.PI / 4 + (i * Math.PI) / 2, vary(r * 0.3, 0.3), width * 0.45);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, vary(width * 1.3), vary(width * 1.3), tilt, 0, Math.PI * 2);
  ctx.fill();
}

/** A cover line: bold sans with a dark drop shadow so it reads over the art. */
function line(ctx: Ctx, s: string, x: number, y: number, color: string, size = 31, align: CanvasTextAlign = 'left'): void {
  text(ctx, s, x + 2, y + 2, `bold ${size}px ${SANS}`, 'rgba(5,5,30,0.8)', align);
  text(ctx, s, x, y, `bold ${size}px ${SANS}`, color, align);
}

/** The UPC-style box on the lower left. */
function barcode(ctx: Ctx, x: number, y: number): void {
  const r = rng(404);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, 130, 74);
  ctx.fillStyle = '#000000';
  for (let px = x + 8; px < x + 122;) {
    const w = 1 + Math.floor(r() * 3);
    ctx.fillRect(px, y + 6, w, 48);
    px += w + 1 + Math.floor(r() * 3);
  }
  text(ctx, '0 44234 00001 7', x + 65, y + 68, `bold 11px ${SANS}`, '#000000', 'center');
}

/**
 * The front cover, in the magazine's cover language: a huge white masthead across the top over a rainbow arc, airbrushed art on a starfield, a script callout, and bold red, pale and yellow cover
 * lines.
 */
export function drawCover(ctx: Ctx): void {
  drawSky(ctx, 11);
  drawScene(ctx);
  sparkle(ctx, 300, 700, 46, 1);
  sparkle(ctx, 880, 470, 60, 2);
  sparkle(ctx, 400, 560, 30, 3);
  paintify(ctx);
  drawMasthead(ctx, 'March 1986');

  // Script callout, in a rounded outline.
  ctx.strokeStyle = '#f4e24a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(STRIP + 30, 340, 410, 124, 62);
  ctx.stroke();
  text(ctx, 'Our Adventure', STRIP + 235, 392, `italic 44px ${SCRIPT}`, '#f4e24a', 'center');
  text(ctx, 'Special Edition', STRIP + 235, 446, `italic bold 52px ${SCRIPT}`, '#f4e24a', 'center');
  // Cover lines: yellow on the right, red and pale blue alternating on the left.
  line(ctx, 'Hints Inside!', PAGE_W - 40, 540, '#f4e24a', 40, 'right');
  line(ctx, '3 Easy-To-Read', PAGE_W - 40, 590, '#f4e24a', 40, 'right');
  line(ctx, 'Pages Of Ads!', PAGE_W - 40, 640, '#f4e24a', 40, 'right');
  const left: [string, string][] = [
    ['Map Your Way', '#ee4036'],
    ['Through Any Adventure', '#ee4036'],
    ['How To Play', '#dfe8ff'],
    ['Text Adventures', '#dfe8ff'],
    ['Your Own Adventure', '#ee4036'],
    ['Classified Ads', '#ee4036'],
    ['A Scratch-Off Hint Page', '#dfe8ff'],
    ['More Than One', '#ee4036'],
    ['Very Funny Ad', '#ee4036'],
  ];
  left.forEach(([s, c], i) => line(ctx, s, STRIP + 30, 560 + i * 38 + (i > 1 ? 14 : 0) + (i > 3 ? 14 : 0) + (i > 5 ? 14 : 0) + (i > 6 ? 14 : 0), c, 32));
  barcode(ctx, STRIP + 20, PAGE_H - 100);

  // Inset: "INSIDE:" with a red starburst.
  ctx.fillStyle = '#e8312a';
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const rad = i % 2 ? 78 : 96;
    ctx.lineTo(PAGE_W - 110 + Math.cos(a) * rad, PAGE_H - 120 + Math.sin(a) * rad);
  }
  ctx.fill();
  text(ctx, 'INSIDE:', PAGE_W - 110, PAGE_H - 140, `bold 17px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'The Ad Page', PAGE_W - 110, PAGE_H - 116, `italic bold 22px ${SCRIPT}`, '#ffffff', 'center');
  text(ctx, `page ${pageNo('marketplace')}`, PAGE_W - 110, PAGE_H - 88, `bold 17px ${SANS}`, '#ffffff', 'center');
}

/** The cover's night sky: a deep blue gradient, airbrushed nebula glows, and brushed-on stars (seeded). */
export function drawSky(ctx: Ctx, seed: number): void {
  const r = rng(seed);
  const bg = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H);
  bg.addColorStop(0, '#10143c');
  bg.addColorStop(0.5, '#262c78');
  bg.addColorStop(1, '#141a52');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  for (const [x, y, rad, c] of [
    [650, 780, 520, 'rgba(120,90,200,0.55)'],
    [250, 1000, 380, 'rgba(60,110,200,0.4)'],
    [800, 300, 360, 'rgba(160,90,170,0.3)'],
  ] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(20,20,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  }
  // Stars flicked and dabbed on with a brush: round, every one a different size and strength, a few with a soft halo.
  for (let i = 0; i < 900; i++) {
    const x = STRIP + r() * (PAGE_W - STRIP);
    const y = r() * PAGE_H;
    const big = r() < 0.05;
    const rad = big ? 1.4 + r() * 1.2 : 0.4 + r() * r() * 1.3;
    const a = 0.25 + r() * 0.75;
    if (big) {
      const h = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
      h.addColorStop(0, `rgba(230,236,255,${(a * 0.4).toFixed(2)})`);
      h.addColorStop(1, 'rgba(230,236,255,0)');
      ctx.fillStyle = h;
      ctx.fillRect(x - rad * 4, y - rad * 4, rad * 8, rad * 8);
    }
    ctx.fillStyle = `rgba(255,${(244 + r() * 11) | 0},${(225 + r() * 30) | 0},${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rad * (0.8 + r() * 0.4), rad * (0.8 + r() * 0.4), r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The masthead, stripped in after the painting: the rainbow arc, a huge white RAINBOW, the tagline, date and price. */
export function drawMasthead(ctx: Ctx, date: string): void {
  // Rainbow arc behind the lower half of the masthead.
  const cx = PAGE_W * 0.55;
  ctx.lineWidth = 24;
  BAND.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, 262, 470 - i * 24, 170 - i * 18, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  });

  // Masthead: a huge, wide, white RAINBOW at the very top.
  text(ctx, 'The', STRIP + 20, 224, `bold 46px ${SANS}`, '#ffffff');
  ctx.save();
  ctx.translate(STRIP + 104, 232);
  ctx.font = `238px ${HEAVY}`;
  ctx.scale((PAGE_W - STRIP - 140) / ctx.measureText('RAINBOW').width, 0.92);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(20,20,70,0.6)';
  ctx.strokeText('RAINBOW', 3, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('RAINBOW', 0, 0);
  ctx.restore();
  text(ctx, '®', PAGE_W - 34, 112, `bold 18px ${SANS}`, '#ffffff');
  line(ctx, 'THE COLOR COMPUTER MONTHLY MAGAZINE', STRIP + 100, 282, '#ffffff', 32);
  text(ctx, date, STRIP + 200, 46, `italic 26px ${SANS}`, '#ffffff');
  text(ctx, '$2.95', PAGE_W - 78, 46, `bold 30px ${SANS}`, '#ffffff', 'right');
  text(ctx, 'U.K. £2.25', PAGE_W - 30, 46, `bold 11px ${SANS}`, '#ffffff', 'right');
  ctx.save();
  ctx.translate(STRIP + 4, 54);
  ctx.rotate(-0.1);
  text(ctx, 'Just for your', 0, 0, `italic 14px ${SANS}`, '#ffffff');
  text(ctx, 'Color Computer', 0, 18, `bold 14px ${SANS}`, '#ffffff');
  text(ctx, '& CoCo 2', 0, 36, `bold 14px ${SANS}`, '#ffffff');
  ctx.restore();
}
