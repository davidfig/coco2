import { airbrush, cloud, grass, planks } from './adsDetail';
import { type Area, roughLine } from './coverPaint';
import { Ctx, rng } from './paper';

// The inside front cover's second painting, before its type goes on.

const TAU = Math.PI * 2;

/** LEMONADE: a stand on a summer lawn under an awning, lit by the sun up and to the right. Returns the price board's label point. */
export function lemonadeScene(ctx: Ctx, x: number, y: number, w: number, h: number): [number, number] {
  const area = { x, y, w, h };
  const sunX = x + 266;
  const sunY = y + 104;
  const H = y + 300;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, H);
  sky.addColorStop(0, '#3a92e4');
  sky.addColorStop(0.7, '#a6d8fb');
  sky.addColorStop(1, '#e6f4fc');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 170);
  halo.addColorStop(0, 'rgba(255,240,170,0.6)');
  halo.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const sun = ctx.createRadialGradient(sunX - 10, sunY - 10, 4, sunX, sunY, 46);
  sun.addColorStop(0, '#fffce6');
  sun.addColorStop(0.6, '#ffe46a');
  sun.addColorStop(1, '#ffc93a');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 46, 0, TAU);
  ctx.fill();
  cloud(ctx, [[x + 58, y + 118, 20], [x + 86, y + 104, 28], [x + 118, y + 112, 22], [x + 98, y + 122, 18], [x + 140, y + 122, 14]], sunX, sunY, area);
  cloud(ctx, [[x + 170, y + 80, 11], [x + 186, y + 73, 15], [x + 206, y + 80, 11]], sunX, sunY, area);

  // Far hills, hazy, their sunny slopes lit.
  const peaks: [number, number][] = [[x - 10, H - 18], [x + 70, H - 44], [x + 150, H - 26], [x + 240, H - 52], [x + 340, H - 28]];
  const r = rng(52);
  const hills = (c: Ctx): void => {
    c.beginPath();
    c.moveTo(peaks[0][0], peaks[0][1]);
    for (let i = 1; i < peaks.length; i++) roughLine(c, peaks[i - 1][0], peaks[i - 1][1], peaks[i][0], peaks[i][1], r, 2);
    c.lineTo(x + w + 10, H + 10);
    c.lineTo(x - 10, H + 10);
    c.closePath();
  };
  ctx.save();
  hills(ctx);
  ctx.fillStyle = '#8ab79a';
  ctx.fill();
  ctx.clip();
  airbrush(ctx, area, 4, (sc) => {
    for (const [px, py] of peaks) {
      const g = sc.createLinearGradient(px, py, px + 30, py + 40);
      g.addColorStop(0, 'rgba(255,245,200,0.55)');
      g.addColorStop(1, 'rgba(255,245,200,0)');
      sc.fillStyle = g;
      sc.beginPath();
      sc.moveTo(px, py);
      sc.lineTo(px + 70, py + 40);
      sc.lineTo(px + 10, py + 50);
      sc.fill();
    }
  });
  ctx.restore();
  const lawn = ctx.createLinearGradient(0, H, 0, y + h);
  lawn.addColorStop(0, '#86c46e');
  lawn.addColorStop(1, '#3a843a');
  ctx.fillStyle = lawn;
  ctx.fillRect(x, H, w, y + h - H);
  grass(ctx, x, H, w, y + h, 53);
  const sign = stand(ctx, x + 70, x + 250, y, area);
  ctx.restore();
  return sign;
}

/** The stand itself, front from x0 to x1: shadow on the grass, lit right side, planked front, counter, posts, awning, pitcher, cups. */
function stand(ctx: Ctx, x0: number, x1: number, y: number, area: Area): [number, number] {
  const top = y + 236;
  const foot = y + 335;
  airbrush(ctx, area, 4, (sc) => {
    sc.fillStyle = 'rgba(20,60,20,0.5)';
    sc.beginPath();
    sc.moveTo(x0, foot);
    sc.lineTo(x1 + 18, foot - 6);
    sc.lineTo(x1 - 60, foot + 34);
    sc.lineTo(x0 - 90, foot + 34);
    sc.fill();
  });
  ctx.fillStyle = '#dc9d5c';
  ctx.beginPath();
  ctx.moveTo(x1, top);
  ctx.lineTo(x1 + 18, top - 8);
  ctx.lineTo(x1 + 18, foot - 8);
  ctx.lineTo(x1, foot);
  ctx.fill();
  ctx.fillStyle = '#b06c34';
  ctx.fillRect(x0, top, x1 - x0, foot - top);
  planks(ctx, x0, top, x1 - x0, foot - top, 4, 61);
  // Posts up to the awning: lit on the right, in the awning's shade at the top.
  for (const px of [x0 + 4, x1 - 14]) {
    ctx.fillStyle = '#a8662f';
    ctx.fillRect(px, y + 128, 10, top - y - 128);
    ctx.fillStyle = 'rgba(255,215,160,0.6)';
    ctx.fillRect(px + 7, y + 128, 3, top - y - 128);
    const sh = ctx.createLinearGradient(0, y + 128, 0, y + 170);
    sh.addColorStop(0, 'rgba(30,10,0,0.55)');
    sh.addColorStop(1, 'rgba(30,10,0,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(px, y + 128, 10, 42);
  }
  // Counter: lit top face, a darker front edge with a highlight along it.
  ctx.fillStyle = '#ecb87e';
  ctx.beginPath();
  ctx.moveTo(x0 - 8, top - 10);
  ctx.lineTo(x1 + 8, top - 10);
  ctx.lineTo(x1 + 26, top - 18);
  ctx.lineTo(x0 + 10, top - 18);
  ctx.fill();
  ctx.fillStyle = '#9a5824';
  ctx.fillRect(x0 - 8, top - 10, x1 - x0 + 16, 10);
  ctx.fillStyle = 'rgba(255,230,190,0.7)';
  ctx.fillRect(x0 - 8, top - 10, x1 - x0 + 16, 1.5);
  awning(ctx, x0, x1, y);
  pitcher(ctx, x0 + 40, top - 14, area);
  for (const cx of [x1 - 66, x1 - 40]) cup(ctx, cx, top - 13);
  // The price board nailed to the front, casting a shadow down and to the left.
  airbrush(ctx, area, 2, (sc) => {
    sc.fillStyle = 'rgba(40,15,0,0.5)';
    sc.fillRect(x0 + 12, y + 256, 74, 34);
  });
  ctx.fillStyle = '#d93a2b';
  ctx.fillRect(x0 + 16, y + 252, 74, 34);
  ctx.fillStyle = 'rgba(255,200,170,0.6)';
  ctx.fillRect(x0 + 16, y + 252, 74, 2);
  ctx.fillStyle = 'rgba(80,10,5,0.4)';
  ctx.fillRect(x0 + 16, y + 283, 74, 3);
  return [x0 + 53, y + 276];
}

/** A striped awning: the front sloping out and down, lit along its top edge and shaded toward the hem, with a scalloped valance. */
function awning(ctx: Ctx, x0: number, x1: number, y: number): void {
  const t = y + 102;
  const b = y + 132;
  const n = 8;
  const at = (k: number, yy: number): number => {
    const spread = ((yy - t) / (b - t)) * 14;
    return x0 - 4 - spread + ((x1 - x0 + 8 + spread * 2) * k) / n;
  };
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k % 2 ? '#f6f0e2' : '#d63a2a';
    ctx.beginPath();
    ctx.moveTo(at(k, t), t);
    ctx.lineTo(at(k + 1, t), t);
    ctx.lineTo(at(k + 1, b), b);
    ctx.lineTo(at(k, b), b);
    ctx.fill();
    const sw = (at(k + 1, b) - at(k, b)) / 2;
    ctx.beginPath();
    ctx.arc(at(k, b) + sw, b, sw, 0, Math.PI);
    ctx.fill();
  }
  const shade = ctx.createLinearGradient(0, t, 0, b + 12);
  shade.addColorStop(0, 'rgba(255,240,210,0.35)');
  shade.addColorStop(0.3, 'rgba(255,240,210,0)');
  shade.addColorStop(1, 'rgba(60,10,20,0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(x0 - 20, t, x1 - x0 + 40, b - t + 14);
  ctx.strokeStyle = 'rgba(255,250,230,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(at(0, t), t + 1);
  ctx.lineTo(at(n, t), t + 1);
  ctx.stroke();
}

/** A glass pitcher of lemonade standing at (x, base): glass catching the sun on its right, ice, a slice of lemon on the rim. */
function pitcher(ctx: Ctx, x: number, base: number, area: Area): void {
  const w = 42;
  const top = base - 54;
  airbrush(ctx, area, 2, (sc) => {
    sc.fillStyle = 'rgba(90,40,0,0.35)';
    sc.beginPath();
    sc.ellipse(x + w / 2 - 14, base, 30, 5, 0, 0, TAU);
    sc.fill();
  });
  // The handle: thick glass, a dark edge outside and the sun's streak along it.
  for (const [c, lw] of [['rgba(70,100,120,0.55)', 7], ['rgba(215,238,250,0.95)', 4], ['rgba(255,255,255,0.9)', 1.2]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, top + 24, 13, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(225,242,255,0.55)';
  ctx.fillRect(x, top, w, base - top);
  const juice = ctx.createLinearGradient(x, 0, x + w, 0);
  juice.addColorStop(0, '#d9b018');
  juice.addColorStop(0.6, '#f6da3c');
  juice.addColorStop(1, '#fff3a0');
  ctx.fillStyle = juice;
  ctx.fillRect(x + 2, top + 12, w - 4, base - top - 14);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (const [ix, iy, rot] of [[x + 12, top + 18, 0.3], [x + 26, top + 22, -0.4]]) {
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(rot);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x + w - 7, top + 4, 3, base - top - 10);
  ctx.fillStyle = 'rgba(40,60,80,0.4)';
  ctx.fillRect(x, top, 1.5, base - top);
  ctx.strokeStyle = 'rgba(240,250,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, top, w / 2, 4, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#f4dc3a';
  ctx.beginPath();
  ctx.arc(x + w - 2, top + 2, 9, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,220,0.9)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(x + w - 2, top + 2);
    ctx.lineTo(x + w - 2 - Math.cos((k * Math.PI) / 4) * 8, top + 2 - Math.sin((k * Math.PI) / 4) * 8);
    ctx.stroke();
  }
}

/** A paper cup standing at (x, base): shaded on the left, lit on the right, a red band round the rim. */
function cup(ctx: Ctx, x: number, base: number): void {
  const shape = (): void => {
    ctx.beginPath();
    ctx.moveTo(x - 11, base - 28);
    ctx.lineTo(x + 11, base - 28);
    ctx.lineTo(x + 8, base);
    ctx.lineTo(x - 8, base);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(90,40,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - 8, base, 12, 3, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(x - 11, 0, x + 11, 0);
  g.addColorStop(0, '#b9b4ac');
  g.addColorStop(0.55, '#f2efe8');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  shape();
  ctx.fill();
  ctx.fillStyle = '#c8362a';
  ctx.fillRect(x - 11, base - 28, 22, 4);
}
