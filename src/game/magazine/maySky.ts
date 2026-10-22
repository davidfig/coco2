/**
 * The May cover's background: a clear spring morning over still water, nothing like March's night. The sun is up-left
 * (`SUN_X`, `SUN_Y`), so the clouds, the far shore and the water's glitter all take their light from there.
 */
import { airbrush } from './adsDetail';
import { STRIP } from './coverArt';
import { roughLine, type Area } from './coverPaint';
import { Ctx, PAGE_H, PAGE_W, rng } from './paper';

export const SUN_X = 170;
export const SUN_Y = 540;
/** Where the water meets the far shore. */
export const HORIZON = 1035;

const PAGE: Area = { x: 0, y: 0, w: PAGE_W, h: PAGE_H };

/** The sky: deep blue at the top (the masthead's white needs it), paling to a warm haze at the horizon, the sun sprayed on. */
function sky(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#1f4c9a');
  g.addColorStop(0.35, '#3d74bf');
  g.addColorStop(0.75, '#9dbfe0');
  g.addColorStop(1, '#f3d9b8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, HORIZON);
  airbrush(ctx, PAGE, 8, (sc) => {
    const halo = sc.createRadialGradient(SUN_X, SUN_Y, 30, SUN_X, SUN_Y, 520);
    halo.addColorStop(0, 'rgba(255,244,210,0.9)');
    halo.addColorStop(0.25, 'rgba(255,228,185,0.4)');
    halo.addColorStop(1, 'rgba(255,220,180,0)');
    sc.fillStyle = halo;
    sc.fillRect(0, 0, PAGE_W, HORIZON);
    // Uneven spray across the sky, so the gradient is never perfectly even.
    const r = rng(51);
    for (let i = 0; i < 14; i++) {
      const x = r() * PAGE_W;
      const y = 300 + r() * (HORIZON - 300);
      const b = sc.createRadialGradient(x, y, 0, x, y, 120 + r() * 200);
      b.addColorStop(0, r() < 0.5 ? 'rgba(255,240,230,0.12)' : 'rgba(30,60,140,0.1)');
      b.addColorStop(1, 'rgba(0,0,0,0)');
      sc.fillStyle = b;
      sc.fillRect(0, 0, PAGE_W, HORIZON);
    }
  });
  const disc = ctx.createRadialGradient(SUN_X - 12, SUN_Y - 12, 4, SUN_X, SUN_Y, 64);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(0.7, '#fff8de');
  disc.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, 64, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A cumulus whose flat base sits at y, centred on x: a row of small puffs along the base and a crown of bigger ones
 * heaped toward the middle, placed one at a time from a seed so no two clouds match.
 */
function cumulus(ctx: Ctx, x: number, y: number, w: number, seed: number): void {
  const r = rng(seed);
  const puffs: [number, number, number][] = [];
  const base = Math.round(w / 45);
  for (let i = 0; i < base; i++) {
    const rad = w * (0.06 + r() * 0.04);
    puffs.push([x - w / 2 + rad + (i / (base - 1)) * (w - rad * 2) + (r() - 0.5) * 10, y - rad, rad]);
  }
  const crown = 3 + Math.floor(r() * 3);
  for (let i = 0; i < crown; i++) {
    const t = (i + 0.5) / crown - 0.5 + (r() - 0.5) * 0.12;
    const hump = 1 - Math.abs(t) * 1.6;
    const rad = w * (0.1 + hump * 0.1) * (0.85 + r() * 0.3);
    puffs.push([x + t * w * 0.8, y - w * 0.07 - rad * (0.6 + hump * 0.5), rad]);
  }
  const shape = (c: Ctx): void => {
    c.beginPath();
    for (const [px, py, pr] of puffs) {
      c.moveTo(px + pr, py);
      c.arc(px, py, pr, 0, Math.PI * 2);
    }
  };
  ctx.save();
  ctx.fillStyle = '#e4ebf5';
  shape(ctx);
  ctx.fill();
  shape(ctx);
  ctx.clip();
  // Sprayed coarsely, so the puffs melt into one another: blue-grey away from the sun and under the base, warm white toward it.
  airbrush(ctx, { x: x - w, y: y - w, w: w * 2, h: w * 1.1 }, Math.max(5, w / 30), (sc) => {
    for (const [px, py, pr] of puffs) {
      const d = Math.hypot(SUN_X - px, SUN_Y - py);
      const ux = (SUN_X - px) / d;
      const uy = (SUN_Y - py) / d;
      const lit = sc.createRadialGradient(px + ux * pr * 0.35, py + uy * pr * 0.35, 0, px + ux * pr * 0.35, py + uy * pr * 0.35, pr * 0.9);
      lit.addColorStop(0, 'rgba(255,251,238,0.7)');
      lit.addColorStop(1, 'rgba(255,251,238,0)');
      sc.fillStyle = lit;
      sc.fillRect(px - pr * 2, py - pr * 2, pr * 4, pr * 4);
    }
    const under = sc.createLinearGradient(0, y - w * 0.18, 0, y);
    under.addColorStop(0, 'rgba(110,128,180,0)');
    under.addColorStop(1, 'rgba(110,128,180,0.6)');
    sc.fillStyle = under;
    sc.fillRect(x - w, y - w * 0.18, w * 2, w * 0.2);
    const away = sc.createLinearGradient(x - (SUN_X < x ? w / 2 : -w / 2), 0, x + (SUN_X < x ? w / 2 : -w / 2), 0);
    away.addColorStop(0, 'rgba(120,140,190,0)');
    away.addColorStop(1, 'rgba(120,140,190,0.35)');
    sc.fillStyle = away;
    sc.fillRect(x - w, y - w, w * 2, w * 1.1);
  });
  ctx.restore();
}

/** The far shore: a low, hazy blue headland along the horizon, its lit edge toward the sun. */
function shore(ctx: Ctx): void {
  const r = rng(61);
  const pts: [number, number][] = [
    [STRIP - 40, HORIZON - 12],
    [120, HORIZON - 30],
    [240, HORIZON - 22],
    [420, HORIZON - 8],
    [620, HORIZON - 14],
    [760, HORIZON - 46],
    [880, HORIZON - 58],
    [980, HORIZON - 40],
    [PAGE_W + 20, HORIZON - 34],
  ];
  const g = ctx.createLinearGradient(0, HORIZON - 60, 0, HORIZON);
  g.addColorStop(0, '#7f93c0');
  g.addColorStop(1, '#a9b6d2');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], HORIZON);
  ctx.lineTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) roughLine(ctx, ...pts[i - 1], ...pts[i], r, 3);
  ctx.lineTo(PAGE_W + 20, HORIZON);
  ctx.fill();
}

/** The water: pale under the haze, deepening toward the reader, ripples brushed across it and the sun's glitter beneath it. */
function water(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, HORIZON, 0, PAGE_H);
  g.addColorStop(0, '#b9c8df');
  g.addColorStop(0.25, '#5f84b8');
  g.addColorStop(1, '#173a78');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON, PAGE_W, PAGE_H - HORIZON);
  const r = rng(71);
  ctx.lineCap = 'round';
  // Ripples: long thin strokes, closer together and fainter toward the horizon.
  for (let i = 0; i < 260; i++) {
    const d = r();
    const y = HORIZON + 4 + d * d * (PAGE_H - HORIZON);
    const len = 20 + d * 140 * (0.5 + r());
    const x = r() * PAGE_W;
    const dark = r() < 0.5;
    ctx.strokeStyle = dark ? `rgba(10,30,80,${(0.1 + d * 0.2).toFixed(2)})` : `rgba(230,240,255,${(0.08 + d * 0.15).toFixed(2)})`;
    ctx.lineWidth = 0.8 + d * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len / 2, y + (r() - 0.5) * 2, x + len, y);
    ctx.stroke();
  }
  // The glitter: dashes of light in a column under the sun, widening toward the reader.
  for (let i = 0; i < 160; i++) {
    const d = r();
    const y = HORIZON + 3 + d * (PAGE_H - HORIZON);
    const spread = 30 + d * 170;
    const x = SUN_X + (r() + r() - 1) * spread;
    const len = 4 + d * 26 * r();
    ctx.strokeStyle = `rgba(255,248,220,${(0.35 + r() * 0.55 * (1 - d * 0.6)).toFixed(2)})`;
    ctx.lineWidth = 1 + d * 2;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, y);
    ctx.lineTo(x + len / 2, y);
    ctx.stroke();
  }
}

/** The whole background, before the bottle goes on. */
export function drawMaySky(ctx: Ctx): void {
  sky(ctx);
  cumulus(ctx, 830, 570, 380, 3);
  cumulus(ctx, 560, 990, 420, 4);
  cumulus(ctx, 960, 960, 260, 5);
  cumulus(ctx, 110, 1000, 240, 6);
  shore(ctx);
  water(ctx);
}
