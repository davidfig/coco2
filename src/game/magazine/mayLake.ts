import { airbrush } from './adsDetail';
import { type Area, roughLine } from './coverPaint';
import { bass, fishPoint, splash } from './mayFish';
import { Ctx, rng } from './paper';

// The May inside front cover's painting, before its type goes on: THE ONE THAT GOT AWAY. Dawn on a lake in mist, the
// sun just up behind the pines at the left; an angler in a rowboat, his rod bent double, and the bass that has just
// cleared the water at the end of his line.

const TAU = Math.PI * 2;

/** Where the sun sits, how far down the far shore meets the water, and the water line under the boat and the fish. */
const SUN = { x: 180, y: 300 };
const HORIZON = 420;
const BOAT = { x: 250, y: 600 };
const FISH = { x: 690, y: 430, len: 340, rot: 0.6 };

function sky(ctx: Ctx, a: Area): void {
  const g = ctx.createLinearGradient(0, a.y, 0, HORIZON);
  g.addColorStop(0, '#162b4c');
  g.addColorStop(0.45, '#4d6f95');
  g.addColorStop(0.85, '#e9b98a');
  g.addColorStop(1, '#f6d8a6');
  ctx.fillStyle = g;
  ctx.fillRect(a.x, a.y, a.w, HORIZON - a.y);
  airbrush(ctx, a, 8, (sc) => {
    const halo = sc.createRadialGradient(SUN.x, SUN.y, 20, SUN.x, SUN.y, 460);
    halo.addColorStop(0, 'rgba(255,238,200,0.95)');
    halo.addColorStop(0.3, 'rgba(255,205,150,0.4)');
    halo.addColorStop(1, 'rgba(255,190,140,0)');
    sc.fillStyle = halo;
    sc.fillRect(a.x, a.y, a.w, a.h);
    // Long thin streaks of cloud, lit pink from underneath.
    const r = rng(101);
    for (let i = 0; i < 7; i++) {
      const cx = r() * a.w;
      const cy = 90 + r() * 220;
      sc.fillStyle = `rgba(255,${Math.round(180 + r() * 40)},${Math.round(160 + r() * 30)},${(0.18 + r() * 0.2).toFixed(2)})`;
      sc.beginPath();
      sc.ellipse(cx, cy, 120 + r() * 200, 5 + r() * 8, (r() - 0.5) * 0.06, 0, TAU);
      sc.fill();
    }
  });
  const disc = ctx.createRadialGradient(SUN.x - 8, SUN.y - 8, 2, SUN.x, SUN.y, 42);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(0.7, '#fff2cf');
  disc.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, 42, 0, TAU);
  ctx.fill();
}

/** The far pines, one ragged tip at a time from a seed (no two alike), hazed blue with distance, and the mist at their feet. */
function pines(ctx: Ctx, a: Area): void {
  const r = rng(103);
  const ridge = (base: number, tall: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x - 10, HORIZON + 2);
    let x = a.x - 10;
    let prev: [number, number] = [x, base];
    ctx.lineTo(...prev);
    while (x < a.x + a.w + 10) {
      const h = tall * (0.4 + r() * 0.6) * (1 + 0.5 * Math.sin(x / 140));
      const w = 6 + r() * 12;
      const tip: [number, number] = [x + w / 2, base - h];
      const notch: [number, number] = [x + w, base - h * (0.25 + r() * 0.3)];
      roughLine(ctx, ...prev, ...tip, r, 1.5);
      roughLine(ctx, ...tip, ...notch, r, 1.5);
      prev = notch;
      x += w;
    }
    ctx.lineTo(a.x + a.w + 10, HORIZON + 2);
    ctx.fill();
  };
  ridge(HORIZON - 14, 38, '#6c7a92');
  ridge(HORIZON - 4, 56, '#2f3e4f');
  airbrush(ctx, a, 6, (sc) => {
    const m = sc.createLinearGradient(0, HORIZON - 40, 0, HORIZON + 30);
    m.addColorStop(0, 'rgba(246,220,190,0)');
    m.addColorStop(0.55, 'rgba(246,220,190,0.75)');
    m.addColorStop(1, 'rgba(246,220,190,0.2)');
    sc.fillStyle = m;
    sc.fillRect(a.x, HORIZON - 40, a.w, 70);
    // The sun's light spilling over the tree tops nearest it.
    const spill = sc.createRadialGradient(SUN.x, HORIZON - 30, 0, SUN.x, HORIZON - 30, 200);
    spill.addColorStop(0, 'rgba(255,225,170,0.7)');
    spill.addColorStop(1, 'rgba(255,225,170,0)');
    sc.fillStyle = spill;
    sc.fillRect(a.x, HORIZON - 120, a.w, 160);
  });
}

/** The water: warm under the mist, darkening toward the reader, ripples brushed across and the sun's glitter beneath it. */
function water(ctx: Ctx, a: Area): void {
  const bottom = a.y + a.h;
  const g = ctx.createLinearGradient(0, HORIZON, 0, bottom);
  g.addColorStop(0, '#efcf9f');
  g.addColorStop(0.18, '#9aa3ad');
  g.addColorStop(0.6, '#3f5a72');
  g.addColorStop(1, '#1d3247');
  ctx.fillStyle = g;
  ctx.fillRect(a.x, HORIZON, a.w, bottom - HORIZON);
  airbrush(ctx, a, 6, (sc) => {
    // The pines' reflection, a soft dark band under the shore.
    sc.fillStyle = 'rgba(40,52,66,0.4)';
    sc.fillRect(a.x, HORIZON + 4, a.w, 26);
  });
  const r = rng(107);
  ctx.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    const d = r();
    const y = HORIZON + 6 + d * d * (bottom - HORIZON);
    const len = 16 + d * 150 * (0.5 + r());
    const x = a.x + r() * a.w;
    ctx.strokeStyle = r() < 0.55 ? `rgba(15,28,45,${(0.1 + d * 0.2).toFixed(2)})` : `rgba(255,236,205,${(0.06 + d * 0.12).toFixed(2)})`;
    ctx.lineWidth = 0.8 + d * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len / 2, y + (r() - 0.5) * 2, x + len, y);
    ctx.stroke();
  }
  for (let i = 0; i < 150; i++) {
    const d = r();
    const y = HORIZON + 3 + d * (bottom - HORIZON);
    const x = SUN.x + (r() + r() - 1) * (24 + d * 150);
    const len = 4 + d * 24 * r();
    ctx.strokeStyle = `rgba(255,244,210,${(0.35 + r() * 0.55 * (1 - d * 0.6)).toFixed(2)})`;
    ctx.lineWidth = 1 + d * 2;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, y);
    ctx.lineTo(x + len / 2, y);
    ctx.stroke();
  }
}

/** The rowboat and the angler, near black against the glare, rimmed warm on the side toward the sun. Returns the rod's butt. */
function boat(ctx: Ctx, a: Area): [number, number] {
  const { x, y } = BOAT;
  airbrush(ctx, a, 4, (sc) => {
    const r = rng(109);
    for (let i = 0; i < 16; i++) {
      sc.fillStyle = `rgba(10,14,22,${(0.4 * (1 - i / 16)).toFixed(2)})`;
      sc.fillRect(x - 120 * (1 - i / 24) + (r() - 0.5) * 14, y + 6 + i * 6, 240 * (1 - i / 24), 4);
    }
  });
  const hull = (c: Ctx): void => {
    c.beginPath();
    c.moveTo(x - 135, y - 30);
    c.quadraticCurveTo(x, y - 22, x + 128, y - 40);
    c.lineTo(x + 150, y - 56);
    c.quadraticCurveTo(x + 140, y - 4, x + 90, y + 6);
    c.quadraticCurveTo(x - 20, y + 14, x - 118, y + 4);
    c.closePath();
  };
  const hg = ctx.createLinearGradient(0, y - 50, 0, y + 10);
  hg.addColorStop(0, '#4a3a2e');
  hg.addColorStop(1, '#1c1714');
  ctx.fillStyle = hg;
  hull(ctx);
  ctx.fill();
  // The angler, sitting, leant toward the fish: a rounded back, a hat, both arms out to the rod.
  ctx.fillStyle = '#1a1612';
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 26);
  ctx.bezierCurveTo(x - 34, y - 60, x - 26, y - 92, x - 4, y - 102);
  ctx.quadraticCurveTo(x + 18, y - 104, x + 24, y - 88);
  ctx.quadraticCurveTo(x + 30, y - 56, x + 32, y - 26);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 6, y - 118, 14, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 127, 27, 6, -0.12, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 150, 25, 24, [8, 8, 0, 0]);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 10;
  for (const [sx, sy, ex, ey, hx, hy] of [[x + 10, y - 94, x + 42, y - 74, x + 56, y - 96], [x + 18, y - 88, x + 36, y - 54, x + 34, y - 72]]) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();
  }
  // The rim of sun along the hat, the shoulders and the gunwale, on the side toward it.
  ctx.strokeStyle = 'rgba(255,214,150,0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 127, 27, 6, -0.12, Math.PI * 0.95, Math.PI * 1.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 6, y - 118, 14, Math.PI * 0.9, Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 31, y - 60);
  ctx.bezierCurveTo(x - 28, y - 88, x - 20, y - 96, x - 4, y - 102);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 135, y - 30);
  ctx.quadraticCurveTo(x - 60, y - 25, x, y - 24);
  ctx.stroke();
  return [x + 58, y - 96];
}

/** The rod from his hands to its tip, bent toward the fish, and the line from the tip to the lure, catching the light. */
function rod(ctx: Ctx, butt: [number, number], mouth: [number, number]): void {
  const tip: [number, number] = [540, 230];
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#17130f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(butt[0] - 26, butt[1] + 22);
  ctx.quadraticCurveTo(420, 210, tip[0], tip[1]);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,220,160,0.6)';
  ctx.beginPath();
  ctx.moveTo(butt[0] - 20, butt[1] + 14);
  ctx.quadraticCurveTo(420, 207, tip[0], tip[1] - 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,246,222,0.9)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(...tip);
  ctx.quadraticCurveTo((tip[0] + mouth[0]) / 2, (tip[1] + mouth[1]) / 2 + 30, ...mouth);
  ctx.stroke();
}

/** The whole painting, fitted to `a` (drawn in page units for a full-width band starting at the top of the page). */
export function lakeScene(ctx: Ctx, a: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  sky(ctx, a);
  pines(ctx, a);
  water(ctx, a);
  const butt = boat(ctx, a);
  const { x, y, len, rot } = FISH;
  const tail = fishPoint(x, y, len, rot, -0.45, 0);
  splash(ctx, a, tail[0] + 10, BOAT.y + 10, 70, [x - len * 0.6, y - len * 0.45, x + len * 0.65, BOAT.y - 10]);
  bass(ctx, x, y, len, rot);
  // Water streaming off the tail back down into the splash.
  const r = rng(111);
  for (let i = 0; i < 16; i++) {
    const t = r();
    const dx = tail[0] + (r() - 0.5) * 16 + t * 8;
    const dy = tail[1] + t * (BOAT.y - tail[1]);
    ctx.fillStyle = `rgba(220,230,236,${(0.55 + r() * 0.35).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 1.2 + r() * 2, 2 + r() * 4, 0, 0, TAU);
    ctx.fill();
  }
  rod(ctx, butt, fishPoint(x, y, len, rot, 0.54, 0.1));
  ctx.restore();
}
