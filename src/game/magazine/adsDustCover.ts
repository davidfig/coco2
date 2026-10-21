import { airbrush, glint, roundShade } from './adsDetail';
import { sweep } from './adsProducts';
import type { Area } from './coverPaint';
import { Ctx, PAGE_W, rng } from './paper';

// The back cover's painting, before its type goes on.

const TAU = Math.PI * 2;

/**
 * DUST-O-GARD: a CoCo under a black vinyl cover, looking like a cat, as the studio photograph in the back cover's ad:
 * glossy vinyl lit from the upper left on a seamless sweep, fitted into `box`.
 */
export function dustCoverScene(ctx: Ctx, box: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  sweep(ctx, box, '#3d4658', '#b8bcc4', 'rgba(255,240,210,0.4)');
  // The scene was drawn round (cx, 600) in page units; scale it into the box, standing a little below the middle.
  const cx = PAGE_W / 2;
  const k = Math.min(box.w / 690, box.h / 320);
  ctx.translate(box.x + box.w / 2, box.y + box.h * 0.55);
  ctx.scale(k, k);
  ctx.translate(-cx, -600);
  const floor = { x: cx - 400, y: 640, w: 800, h: 140 };
  airbrush(ctx, floor, 6, (sc) => {
    sc.fillStyle = 'rgba(15,15,25,0.6)';
    sc.beginPath();
    sc.ellipse(cx + 30, 704, 340, 20, 0, 0, TAU);
    sc.fill();
  });
  drawCat(ctx, cx);
  ctx.restore();
}

// The CoCo 2 is a low wedge, about 16 in wide and 13 deep, 3 in high at the back and barely 1 at the front, seen from
// a little above: a thin front lip, the keyboard's slope rising away from it, the back edge where the ears stand.
const HEM = 700; // the floor
const LIP = 652; // the front edge, where the cover folds over onto the slope
const BACK = 538; // the back edge, the top of the slope
const HALF = 300; // half the width at the front
const BACK_HALF = 268; // and at the back, further off
const EYE_Y = 592;

/** The cover's outline: the front lip and the slope behind it, corners soft as vinyl over plastic. */
function body(ctx: Ctx, cx: number): void {
  ctx.moveTo(cx - HALF, HEM);
  ctx.lineTo(cx - HALF, LIP + 8);
  ctx.quadraticCurveTo(cx - HALF, LIP - 6, cx - HALF + 4, LIP - 20);
  ctx.lineTo(cx - BACK_HALF - 6, BACK + 22);
  ctx.quadraticCurveTo(cx - BACK_HALF + 2, BACK, cx - BACK_HALF + 26, BACK);
  ctx.lineTo(cx + BACK_HALF - 26, BACK);
  ctx.quadraticCurveTo(cx + BACK_HALF - 2, BACK, cx + BACK_HALF + 6, BACK + 22);
  ctx.lineTo(cx + HALF - 4, LIP - 20);
  ctx.quadraticCurveTo(cx + HALF, LIP - 6, cx + HALF, LIP + 8);
  ctx.lineTo(cx + HALF, HEM);
  ctx.closePath();
}

/** The covered computer, in the page units it was first painted in: the vinyl body and ears, its sheen, the face. */
function drawCat(ctx: Ctx, cx: number): void {
  // Each ear runs left to right, so it winds the same way as the body and the overlap fills instead of cutting a hole.
  const ears: [number, number][][] = [
    [[cx - 235, BACK + 6], [cx - 200, BACK - 70], [cx - 140, BACK + 4]],
    [[cx + 140, BACK + 4], [cx + 200, BACK - 70], [cx + 235, BACK + 6]],
  ];
  const shape = (): void => {
    ctx.beginPath();
    body(ctx, cx);
    for (const [a, b, c] of ears) {
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
    }
  };
  ctx.fillStyle = '#1b1b24';
  shape();
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  // The slope faces up to the lamp and catches more of it than the lip, which faces the camera.
  const slope = ctx.createLinearGradient(cx - HALF, BACK - 70, cx + 200, HEM);
  slope.addColorStop(0, 'rgba(110,115,150,0.55)');
  slope.addColorStop(0.5, 'rgba(110,115,150,0.08)');
  slope.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = slope;
  ctx.fillRect(cx - HALF - 10, BACK - 80, HALF * 2 + 20, HEM - BACK + 90);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(cx - HALF - 10, LIP, HALF * 2 + 20, HEM - LIP + 10);
  vinyl(ctx, cx);
  for (const [a, b, c] of ears) {
    ctx.fillStyle = 'rgba(150,155,200,0.22)';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo((a[0] + c[0]) / 2, a[1]);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,40,45,0.6)';
    ctx.beginPath();
    ctx.moveTo(a[0] * 0.8 + c[0] * 0.2, BACK + 2);
    ctx.lineTo(b[0] * 0.8 + (a[0] + c[0]) * 0.1, BACK - 46);
    ctx.lineTo(c[0] * 0.8 + a[0] * 0.2, BACK);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,225,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  ctx.restore();
  catFace(ctx, cx);
}

/** The vinyl's sheen: a broad soft shine on the slope, a sharp streak along the back, creases draping off the lip, a warm rim on the right. */
function vinyl(ctx: Ctx, cx: number): void {
  const r = rng(71);
  const a = { x: cx - HALF - 20, y: BACK - 90, w: HALF * 2 + 40, h: HEM - BACK + 110 };
  airbrush(ctx, a, 6, (sc) => {
    sc.lineCap = 'round';
    // Creases: a lit fold on the left of each, its shadow on the right, both dying away up the cloth.
    for (const fx of [-210, -70, 60, 200]) {
      const x0 = cx + fx + (r() - 0.5) * 30;
      const topY = LIP - 20 - r() * 30;
      const bend = (r() - 0.5) * 30;
      for (const [dx, c, lw] of [[0, '150,160,205', 16], [13, '0,0,0', 13]] as const) {
        const g = sc.createLinearGradient(0, HEM, 0, topY);
        g.addColorStop(0, `rgba(${c},${c === '0,0,0' ? 0.5 : 0.28})`);
        g.addColorStop(1, `rgba(${c},0)`);
        sc.strokeStyle = g;
        sc.lineWidth = lw;
        sc.beginPath();
        sc.moveTo(x0 + dx, HEM + 10);
        sc.quadraticCurveTo(x0 + dx + bend, (HEM + topY) / 2, x0 + dx + bend * 0.6, topY);
        sc.stroke();
      }
    }
    // The keys underneath show through as faint lumpy rows on the slope.
    for (let row = 0; row < 4; row++) {
      const y = BACK + 34 + row * 24;
      const g = sc.createLinearGradient(cx - 220, 0, cx + 220, 0);
      g.addColorStop(0, 'rgba(150,160,205,0.12)');
      g.addColorStop(0.5, 'rgba(150,160,205,0.04)');
      g.addColorStop(1, 'rgba(150,160,205,0)');
      sc.strokeStyle = g;
      sc.lineWidth = 6;
      sc.beginPath();
      sc.moveTo(cx - 230 - row * 8, y);
      sc.lineTo(cx + 230 + row * 8, y);
      sc.stroke();
    }
    const rim = sc.createLinearGradient(cx + HALF - 30, 0, cx + HALF + 2, 0);
    rim.addColorStop(0, 'rgba(255,125,55,0)');
    rim.addColorStop(1, 'rgba(255,125,55,0.4)');
    sc.fillStyle = rim;
    sc.fillRect(cx + BACK_HALF - 30, BACK + 20, HALF - BACK_HALF + 40, HEM - BACK);
  });
  glint(ctx, cx - 120, BACK + 12, 130, 14, -0.02, 0.35);
  const pool = ctx.createLinearGradient(0, LIP + 10, 0, HEM);
  pool.addColorStop(0, 'rgba(0,0,0,0)');
  pool.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = pool;
  ctx.fillRect(cx - HALF, LIP + 10, HALF * 2, HEM - LIP - 10);
  ctx.lineCap = 'round';
  // The lamp's line along the top-left: up the slope's edge, round the corner to the ear.
  ctx.strokeStyle = 'rgba(240,244,255,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - HALF + 6, LIP - 24);
  ctx.lineTo(cx - BACK_HALF - 4, BACK + 22);
  ctx.quadraticCurveTo(cx - BACK_HALF + 3, BACK + 2, cx - BACK_HALF + 26, BACK + 2);
  ctx.lineTo(cx - 238, BACK + 2);
  ctx.stroke();
  // The fold over the front edge.
  ctx.strokeStyle = 'rgba(200,205,240,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - HALF + 8, LIP - 4);
  ctx.lineTo(cx + HALF - 8, LIP - 4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,165,200,0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(cx - HALF + 12, HEM - 10);
  ctx.lineTo(cx + HALF - 12, HEM - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'butt';
}

/** Glowing yellow eyes with slit pupils and a glint, lying on the slope so a little squashed, and whiskers. */
function catFace(ctx: Ctx, cx: number): void {
  for (const ex of [cx - 85, cx + 85]) {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(ex, EYE_Y, 24, ex, EYE_Y, 64);
    glow.addColorStop(0, 'rgba(255,210,70,0.3)');
    glow.addColorStop(1, 'rgba(255,210,70,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(ex - 64, EYE_Y - 64, 128, 128);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, EYE_Y, 28, 22, 0, 0, TAU);
    ctx.clip();
    roundShade(ctx, ex, EYE_Y, 30, -0.5, -0.6, '#fffbd0', '#f4e24a', '#c47c14');
    const lid = ctx.createLinearGradient(0, EYE_Y - 22, 0, EYE_Y - 4);
    lid.addColorStop(0, 'rgba(60,30,0,0.45)');
    lid.addColorStop(1, 'rgba(60,30,0,0)');
    ctx.fillStyle = lid;
    ctx.fillRect(ex - 30, EYE_Y - 22, 60, 20);
    ctx.fillStyle = '#14141c';
    ctx.beginPath();
    ctx.ellipse(ex, EYE_Y, 5, 19, 0, 0, TAU);
    ctx.fill();
    glint(ctx, ex - 11, EYE_Y - 10, 7, 4, -0.5, 0.95);
    ctx.restore();
  }
  ctx.strokeStyle = '#f4e24a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const wy = LIP - 22;
  for (const s of [-1, 1]) {
    for (const dy of [-6, 6]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 30, wy + dy);
      ctx.quadraticCurveTo(cx + s * 90, wy + dy * 1.6, cx + s * 140, wy + dy * 2.5 + 4);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
}
