import { airbrush, glint } from './adsDetail';
import type { Area } from './coverPaint';
import { Ctx, SANS, rng } from './paper';

// The product shots in the inside back cover's ads, painted as the studio photographs they stand for (lit from the upper
// left), before the paint pass and the type.

const TAU = Math.PI * 2;

/** A seamless paper sweep: darker up the wall, lightest where it curves into the floor, a soft key light up left. */
export function sweep(ctx: Ctx, a: Area, wall: string, floor: string, light = 'rgba(255,255,255,0.35)'): void {
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
  g.addColorStop(0, wall);
  g.addColorStop(0.62, floor);
  g.addColorStop(1, floor);
  ctx.fillStyle = g;
  ctx.fillRect(a.x, a.y, a.w, a.h);
  airbrush(ctx, a, 6, (sc) => {
    const s = sc.createRadialGradient(a.x + a.w * 0.3, a.y + a.h * 0.25, 0, a.x + a.w * 0.3, a.y + a.h * 0.25, a.w * 0.6);
    s.addColorStop(0, light);
    s.addColorStop(1, 'rgba(255,255,255,0)');
    sc.fillStyle = s;
    sc.fillRect(a.x, a.y, a.w, a.h);
  });
}

/** A soft contact shadow under something standing on the sweep. */
export function shadow(ctx: Ctx, a: Area, x: number, y: number, rx: number, ry: number, alpha: number): void {
  airbrush(ctx, a, 4, (sc) => {
    sc.fillStyle = `rgba(20,22,30,${alpha})`;
    sc.beginPath();
    sc.ellipse(x, y, rx, ry, 0, 0, TAU);
    sc.fill();
  });
}

export function quad(ctx: Ctx, p: [number, number][], fill: string | CanvasGradient): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  p.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fill();
}

/** TYPE-O-MATIC: a Color Computer 2 seen from the front and above, its keyboard under a smooth moulded cover with no keys at all. */
export function keyboardCoverShot(ctx: Ctx, a: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  sweep(ctx, a, '#4f5a6c', '#c9cdd3');
  const X = (u: number): number => a.x + u * a.w;
  const Y = (v: number): number => a.y + v * a.h;
  shadow(ctx, a, X(0.5), Y(0.84), a.w * 0.5, a.h * 0.07, 0.55);
  // The case: top face, then the front edge in shadow.
  const top = ctx.createLinearGradient(X(0.1), Y(0.3), X(0.8), Y(0.75));
  top.addColorStop(0, '#f1efe9');
  top.addColorStop(1, '#bdbab2');
  quad(ctx, [[X(0.15), Y(0.3)], [X(0.85), Y(0.3)], [X(0.95), Y(0.72)], [X(0.05), Y(0.72)]], top);
  quad(ctx, [[X(0.05), Y(0.72)], [X(0.95), Y(0.72)], [X(0.95), Y(0.81)], [X(0.05), Y(0.81)]], '#8e8b85');
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(X(0.05), Y(0.72), a.w * 0.9, 2);
  // The black nameplate band across the back.
  quad(ctx, [[X(0.16), Y(0.33)], [X(0.84), Y(0.33)], [X(0.85), Y(0.38)], [X(0.15), Y(0.38)]], '#26262a');
  ctx.font = `bold ${Math.round(a.h * 0.035)}px ${SANS}`;
  ctx.fillStyle = '#d8d8d8';
  ctx.textAlign = 'left';
  ctx.fillText('TRS-80 Color Computer 2', X(0.18), Y(0.367));
  // The cover: a beige slab where the keys were, lit along its back edge, a lip of shadow at the front.
  const slab: [number, number][] = [[X(0.2), Y(0.42)], [X(0.8), Y(0.42)], [X(0.86), Y(0.67)], [X(0.14), Y(0.67)]];
  quad(ctx, [[X(0.135), Y(0.675)], [X(0.865), Y(0.675)], [X(0.87), Y(0.695)], [X(0.13), Y(0.695)]], 'rgba(40,36,30,0.45)');
  const sg = ctx.createLinearGradient(X(0.2), Y(0.42), X(0.7), Y(0.7));
  sg.addColorStop(0, '#e9dcc0');
  sg.addColorStop(0.55, '#cdbd9c');
  sg.addColorStop(1, '#a8987a');
  quad(ctx, slab, sg);
  ctx.strokeStyle = 'rgba(255,250,235,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0.21), Y(0.425));
  ctx.lineTo(X(0.79), Y(0.425));
  ctx.stroke();
  glint(ctx, X(0.38), Y(0.47), a.w * 0.15, a.h * 0.03, -0.02, 0.45);
  // Its name, moulded in: a light edge above, a dark one below.
  ctx.font = `bold ${Math.round(a.h * 0.07)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(90,75,50,0.55)';
  ctx.fillText('TYPE-O-MATIC', X(0.5) + 1, Y(0.585) + 2);
  ctx.fillStyle = 'rgba(255,248,230,0.6)';
  ctx.fillText('TYPE-O-MATIC', X(0.5) - 1, Y(0.585) - 1);
  ctx.fillStyle = '#c4b493';
  ctx.fillText('TYPE-O-MATIC', X(0.5), Y(0.585));
  // The instruction card, laid against the front.
  ctx.save();
  ctx.translate(X(0.8), Y(0.86));
  ctx.rotate(-0.12);
  ctx.fillStyle = 'rgba(20,20,30,0.3)';
  ctx.fillRect(-a.w * 0.11 + 4, -a.h * 0.1 + 5, a.w * 0.22, a.h * 0.2);
  ctx.fillStyle = '#fbfaf4';
  ctx.fillRect(-a.w * 0.11, -a.h * 0.1, a.w * 0.22, a.h * 0.2);
  ctx.fillStyle = '#2a2a2a';
  ctx.font = `bold ${Math.round(a.h * 0.035)}px ${SANS}`;
  ctx.fillText('INSTRUCTIONS', 0, -a.h * 0.05);
  ctx.font = `${Math.round(a.h * 0.028)}px ${SANS}`;
  ctx.fillText('1. Fit cover.', 0, 0);
  ctx.fillText('2. That is all.', 0, a.h * 0.045);
  ctx.restore();
  ctx.restore();
}

/** One cassette, turned by `angle`: a dark shell, its label, the window with both reels, the screws. */
export function cassette(ctx: Ctx, cx: number, cy: number, w: number, angle: number, label: string, seed: number): void {
  const h = w * 0.63;
  const r = rng(seed);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const body = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  body.addColorStop(0, '#55555c');
  body.addColorStop(0.4, '#2e2e33');
  body.addColorStop(1, '#141417');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.03);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, h / 2 - 6);
  ctx.lineTo(-w / 2 + 4, -h / 2 + 4);
  ctx.lineTo(w / 2 - 6, -h / 2 + 4);
  ctx.stroke();
  // The label, with a red stripe, and the window cut through it.
  ctx.fillStyle = '#efe9d8';
  ctx.fillRect(-w * 0.42, -h * 0.4, w * 0.84, h * 0.56);
  ctx.fillStyle = '#c8302a';
  ctx.fillRect(-w * 0.42, -h * 0.4 + h * 0.13, w * 0.84, h * 0.05);
  ctx.fillStyle = '#2a2a2a';
  ctx.font = `bold ${Math.round(w * 0.062)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -h * 0.3);
  const ww = w * 0.46;
  const wh = h * 0.2;
  ctx.fillStyle = '#1a1612';
  ctx.beginPath();
  ctx.roundRect(-ww / 2, -h * 0.05, ww, wh, wh * 0.4);
  ctx.fill();
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath();
  ctx.ellipse(-ww * 0.18, -h * 0.05 + wh / 2, ww * 0.26, wh * 0.48, 0, 0, TAU);
  ctx.fill();
  for (const s of [-1, 1]) {
    const hx = s * w * 0.2;
    const hy = -h * 0.05 + wh / 2;
    ctx.fillStyle = '#f4f4f0';
    ctx.beginPath();
    ctx.arc(hx, hy, w * 0.06, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1612';
    ctx.beginPath();
    ctx.arc(hx, hy, w * 0.032, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4f4f0';
    const turn = r() * TAU;
    for (let i = 0; i < 6; i++) {
      const t = turn + (i / 6) * TAU;
      ctx.fillRect(hx + Math.cos(t) * w * 0.026 - 1.5, hy + Math.sin(t) * w * 0.026 - 1.5, 3, 3);
    }
  }
  glint(ctx, -ww * 0.1, -h * 0.02, ww * 0.3, wh * 0.18, 0, 0.35);
  // The head opening along the bottom, and five screws.
  ctx.fillStyle = '#202024';
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, h / 2);
  ctx.lineTo(-w * 0.27, h * 0.28);
  ctx.lineTo(w * 0.27, h * 0.28);
  ctx.lineTo(w * 0.32, h / 2);
  ctx.fill();
  for (const [sx, sy] of [[-0.45, -0.43], [0.45, -0.43], [-0.45, 0.43], [0.45, 0.43], [0, 0.37]]) {
    ctx.fillStyle = '#8a8a90';
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, w * 0.016, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(sx * w - w * 0.012, sy * h - 0.6, w * 0.024, 1.2);
  }
  ctx.restore();
}

/** CLOAD-A-MATIC: two of its tapes on white, one propped behind the other. */
export function cassetteShot(ctx: Ctx, a: Area): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  sweep(ctx, a, '#dcdcda', '#fbfbf8', 'rgba(255,255,255,0.5)');
  const cw = a.w * 0.62;
  shadow(ctx, a, a.x + a.w * 0.56, a.y + a.h * 0.86, cw * 0.55, a.h * 0.06, 0.5);
  cassette(ctx, a.x + a.w * 0.62, a.y + a.h * 0.44, cw, 0.12, 'CLOAD-A-MATIC', 5);
  cassette(ctx, a.x + a.w * 0.44, a.y + a.h * 0.56, cw, -0.07, 'CLOAD-A-MATIC', 9);
  ctx.restore();
}
