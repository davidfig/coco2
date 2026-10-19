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
  // The scene was drawn round (cx, 540) in page units; scale it into the box, standing a little below the middle.
  const cx = PAGE_W / 2;
  const k = Math.min(box.w / 640, box.h / 470);
  ctx.translate(box.x + box.w / 2, box.y + box.h * 0.52);
  ctx.scale(k, k);
  ctx.translate(-cx, -540);
  const floor = { x: cx - 400, y: 640, w: 800, h: 140 };
  airbrush(ctx, floor, 6, (sc) => {
    sc.fillStyle = 'rgba(15,15,25,0.6)';
    sc.beginPath();
    sc.ellipse(cx + 30, 704, 320, 22, 0, 0, TAU);
    sc.fill();
  });
  drawCat(ctx, cx);
  ctx.restore();
}

/** The covered computer, in the page units it was first painted in: the vinyl body and ears, its sheen, the face. */
function drawCat(ctx: Ctx, cx: number): void {
  // Each ear runs left to right, so it winds the same way as the body and the overlap fills instead of cutting a hole.
  const ears: [number, number][][] = [
    [[cx - 250, 430], [cx - 210, 340], [cx - 140, 425]],
    [[cx + 140, 425], [cx + 210, 340], [cx + 250, 430]],
  ];
  const shape = (): void => {
    ctx.beginPath();
    ctx.roundRect(cx - 270, 420, 540, 280, 40);
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
  const body = ctx.createLinearGradient(cx - 270, 340, cx + 200, 720);
  body.addColorStop(0, 'rgba(110,115,150,0.5)');
  body.addColorStop(0.45, 'rgba(110,115,150,0)');
  body.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = body;
  ctx.fillRect(cx - 280, 330, 560, 380);
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
    ctx.moveTo(a[0] * 0.8 + c[0] * 0.2, 424);
    ctx.lineTo(b[0] * 0.8 + (a[0] + c[0]) * 0.1, 368);
    ctx.lineTo(c[0] * 0.8 + a[0] * 0.2, 422);
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

/** The vinyl's sheen: a broad soft shine on the shoulder, a sharp streak along the top, creases draping to the hem, a warm rim on the right. */
function vinyl(ctx: Ctx, cx: number): void {
  const r = rng(71);
  const a = { x: cx - 290, y: 320, w: 580, h: 400 };
  airbrush(ctx, a, 6, (sc) => {
    sc.lineCap = 'round';
    // Creases: a lit fold on the left of each, its shadow on the right, both dying away up the cloth.
    for (const fx of [-190, -60, 70, 200]) {
      const x0 = cx + fx + (r() - 0.5) * 30;
      const topY = 570 + r() * 50;
      const bend = (r() - 0.5) * 40;
      for (const [dx, c, lw] of [[0, '150,160,205', 20], [16, '0,0,0', 16]] as const) {
        const g = sc.createLinearGradient(0, 705, 0, topY);
        g.addColorStop(0, `rgba(${c},${c === '0,0,0' ? 0.5 : 0.28})`);
        g.addColorStop(1, `rgba(${c},0)`);
        sc.strokeStyle = g;
        sc.lineWidth = lw;
        sc.beginPath();
        sc.moveTo(x0 + dx, 712);
        sc.quadraticCurveTo(x0 + dx + bend, (705 + topY) / 2, x0 + dx + bend * 0.6, topY);
        sc.stroke();
      }
    }
    const rim = sc.createLinearGradient(cx + 240, 0, cx + 272, 0);
    rim.addColorStop(0, 'rgba(255,125,55,0)');
    rim.addColorStop(1, 'rgba(255,125,55,0.4)');
    sc.fillStyle = rim;
    sc.fillRect(cx + 240, 450, 40, 250);
  });
  glint(ctx, cx - 150, 452, 140, 24, -0.05, 0.35);
  const pool = ctx.createLinearGradient(0, 620, 0, 700);
  pool.addColorStop(0, 'rgba(0,0,0,0)');
  pool.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = pool;
  ctx.fillRect(cx - 270, 620, 540, 80);
  ctx.strokeStyle = 'rgba(240,244,255,0.6)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - 230, 460, 36, Math.PI * 1.08, Math.PI * 1.5);
  ctx.lineTo(cx + 40, 424);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,165,200,0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(cx - 245, 688);
  ctx.lineTo(cx + 245, 688);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'butt';
}

/** Glowing yellow eyes with slit pupils and a glint, and whiskers. */
function catFace(ctx: Ctx, cx: number): void {
  for (const ex of [cx - 90, cx + 90]) {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(ex, 520, 30, ex, 520, 80);
    glow.addColorStop(0, 'rgba(255,210,70,0.3)');
    glow.addColorStop(1, 'rgba(255,210,70,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(ex - 80, 440, 160, 160);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, 520, 28, 36, 0, 0, TAU);
    ctx.clip();
    roundShade(ctx, ex, 520, 34, -0.5, -0.6, '#fffbd0', '#f4e24a', '#c47c14');
    const lid = ctx.createLinearGradient(0, 484, 0, 512);
    lid.addColorStop(0, 'rgba(60,30,0,0.45)');
    lid.addColorStop(1, 'rgba(60,30,0,0)');
    ctx.fillStyle = lid;
    ctx.fillRect(ex - 30, 484, 60, 30);
    ctx.fillStyle = '#14141c';
    ctx.beginPath();
    ctx.ellipse(ex, 520, 5, 31, 0, 0, TAU);
    ctx.fill();
    glint(ctx, ex - 11, 504, 7, 5, -0.5, 0.95);
    ctx.restore();
  }
  ctx.strokeStyle = '#f4e24a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (const dy of [-8, 8]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 30, 600 + dy);
      ctx.quadraticCurveTo(cx + s * 80, 600 + dy * 1.6, cx + s * 122, 600 + dy * 2.5 + 4);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
}
