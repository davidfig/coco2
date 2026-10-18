import { Ctx, PAGE_H, PAGE_W, rng } from './paper';

/** Where the moon sits on the cover; lit faces turn toward it. */
const MOON_X = 770;

/**
 * Painted modelling on a ridge already filled with `shape`: each peak gets a moonlit face on the side toward the moon,
 * fading down the slope, and a few dark brushed crevices on the far side.
 */
export function modelRidge(ctx: Ctx, peaks: [number, number][], shape: () => void, light: number, seed: number): void {
  const r = rng(seed);
  // The lit faces are painted small and scaled up, so they come out sprayed, with no hard edge.
  const soft = document.createElement('canvas');
  soft.width = PAGE_W / 8;
  soft.height = Math.ceil(PAGE_H / 8);
  const sc = soft.getContext('2d')!;
  sc.scale(1 / 8, 1 / 8);
  ctx.save();
  ctx.beginPath();
  shape();
  ctx.clip();
  for (let i = 1; i < peaks.length - 1; i++) {
    const [x, y] = peaks[i];
    if (y >= peaks[i - 1][1] || y >= peaks[i + 1][1]) continue;
    const dir = x < MOON_X ? 1 : -1;
    const g = sc.createLinearGradient(x, y, x + dir * 30, y + 120);
    g.addColorStop(0, `rgba(255,226,170,${light})`);
    g.addColorStop(1, 'rgba(255,226,170,0)');
    sc.fillStyle = g;
    sc.beginPath();
    sc.moveTo(x, y - 2);
    sc.lineTo(x + dir * 120, y + 70);
    sc.lineTo(x + dir * 30, y + 150);
    sc.lineTo(x - dir * 4, y + 140);
    sc.fill();
    ctx.strokeStyle = 'rgba(10,8,40,0.3)';
    ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const sx = x - dir * (6 + r() * 40);
      const sy = y + 10 + r() * 30;
      ctx.lineWidth = 1 + r() * 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - dir * 6, sy + 20, sx - dir * (4 + r() * 14), sy + 30 + r() * 40);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  ctx.drawImage(soft, 0, 0, soft.width * 8, soft.height * 8);
  ctx.restore();
}

/** Moonlight catching the castle's edges from behind: a thin bright rim down one side of a tower and along its roof. */
export function rimTower(ctx: Ctx, tx: number, base: number, w: number, h: number, roof: number): void {
  const side = tx < MOON_X ? 1 : -1;
  ctx.strokeStyle = 'rgba(255,224,160,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx + (side * w) / 2 - side, base - 6);
  ctx.lineTo(tx + (side * w) / 2 - side, base - h);
  ctx.moveTo(tx + side * (w / 2 + 5), base - h);
  ctx.lineTo(tx, base - h - roof);
  ctx.stroke();
}

/** The TV cabinet's wood, painted: grain in long dark strokes, a highlight along the top edge, shade pooling underneath. */
export function woodGrain(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const r = rng(907);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const gy = y + 6 + r() * (h - 12);
    ctx.strokeStyle = `rgba(40,20,6,${(0.12 + r() * 0.2).toFixed(2)})`;
    ctx.lineWidth = 0.8 + r() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 10, gy);
    ctx.bezierCurveTo(x + w * 0.3, gy + (r() - 0.5) * 10, x + w * 0.6, gy + (r() - 0.5) * 10, x + w + 10, gy + (r() - 0.5) * 6);
    ctx.stroke();
  }
  const shade = ctx.createLinearGradient(0, y + h * 0.6, 0, y + h);
  shade.addColorStop(0, 'rgba(20,8,0,0)');
  shade.addColorStop(1, 'rgba(20,8,0,0.45)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,225,180,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 5);
  ctx.lineTo(x + w * 0.7, y + 5);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

/** A knob painted round: a soft highlight up and left, a shadow crescent down and right. */
export function knobShade(ctx: Ctx, x: number, y: number, rad: number): void {
  ctx.fillStyle = 'rgba(60,40,20,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, rad, -0.2, Math.PI * 0.9);
  ctx.arc(x - 3, y - 3, rad, Math.PI * 0.9, -0.2, true);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,240,0.6)';
  ctx.beginPath();
  ctx.ellipse(x - rad * 0.4, y - rad * 0.45, rad * 0.32, rad * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();
}
