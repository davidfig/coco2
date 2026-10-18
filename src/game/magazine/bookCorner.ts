import type { Magazine } from './book';
import { PAGE_UNIT_H, bookToScreen } from './bookLayout';
import { ISSUE_DATE, type IssueId } from './pages';

/**
 * The magazine's corner buttons: starbursts like the cover's red "INSIDE" badge, a few words on each, slapped on over
 * the top-right corner of the page in view and stuck on a little crooked. They follow that corner wherever the page
 * goes: sliding out and away with the book (always on it, so they never pop in), turning, reading size, a tall
 * window; zoomed in past the edge, they stay inside the window. Only a book that is all the way out takes clicks.
 */

/** How far the bursts hang out past the page corner (CSS px): right, and up. */
const OVERHANG = [14, 14];
/** The closest they come to the window's edge (CSS px). */
const MARGIN = 4;
/** Room round the bursts inside their box (CSS px), so a tilted point isn't cut off by the mask below. */
const PAD = 10;

/** Something drawn over the book on the canvas (a notebook sheet): centre and half size in canvas pixels, bottom-left origin, turned by `rot`. */
export type Cover = { cx: number; cy: number; hx: number; hy: number; rot: number };

type Pt = [number, number];

/** A jagged starburst's outline, in percent of its box. */
function burst(points: number): Pt[] {
  const p: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 ? 41 : 50;
    p.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  return p;
}

const polygon = (p: Pt[]): string => `polygon(${p.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(',')})`;

const BURST = burst(14);
/**
 * Where "Put away" has started to come unstuck: its top-right points lift along a straight crease from one valley of
 * the outline to another (`FROM` and `TO`, indices into it), so whole points come up and each end of the crease sits
 * in a notch, the way a sticker lets go. The lifted part curls back over the face on a roll of radius `CURL`, its far
 * edges foreshortened and bowed rather than a flat mirror image.
 */
const PEEL = { FROM: 23, TO: 27, CURL: 11 };
const [A, B] = [BURST[PEEL.FROM], BURST[PEEL.TO]];
/** The crease's outward normal (y down), and its distance from the centre (percent). */
const N: Pt = (() => {
  const [dx, dy] = [B[0] - A[0], B[1] - A[1]];
  const len = Math.hypot(dx, dy);
  const n: Pt = [dy / len, -dx / len];
  return (A[0] - 50) * n[0] + (A[1] - 50) * n[1] > 0 ? n : [-n[0], -n[1]];
})();
const AT = (A[0] - 50) * N[0] + (A[1] - 50) * N[1];
/** How far past the crease a point is (percent; negative on the side that stays stuck). */
const past = ([x, y]: Pt): number => (x - 50) * N[0] + (y - 50) * N[1] - AT;

/** The part of outline `p` where `side` is ≤ 0 (Sutherland–Hodgman against one line). */
function clipTo(p: Pt[], side: (q: Pt) => number): Pt[] {
  const out: Pt[] = [];
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length];
    const [da, db] = [side(a), side(b)];
    if (da <= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  });
  return out;
}

/** Outline `p` with its edges cut into short steps, so bending it bends the edges too. */
function finer(p: Pt[], step: number): Pt[] {
  return p.flatMap((a, i) => {
    const b = p[(i + 1) % p.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    return Array.from({ length: n }, (_, k): Pt => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  });
}

/** The face that is still stuck down. */
const STUCK = clipTo(BURST, past);
/** The lifted tip, rolled back over the crease: each point `d` past it lands `CURL·sin(d / CURL)` back on the face. */
const FLAP = finer(
  clipTo(BURST, (q) => -past(q)),
  1,
).map((q): Pt => {
  const d = past(q);
  const back = d + PEEL.CURL * Math.sin(Math.min(d / PEEL.CURL, Math.PI / 2));
  return [q[0] - N[0] * back, q[1] - N[1] * back];
});
/** The flap's shading runs from the crease (in the roll's shadow) across to its far edge (catching the light). */
const SHADE = (() => {
  const len = 100 * (Math.abs(N[0]) + Math.abs(N[1]));
  const at = (d: number) => (50 - ((AT - d) * 100) / len).toFixed(1);
  const deg = (Math.atan2(-N[0], N[1]) * 180) / Math.PI;
  return `linear-gradient(${deg.toFixed(1)}deg, #aaa395 ${at(0)}%, #ddd7ca ${at(PEEL.CURL * 0.35)}%, #f8f5ee ${at(PEEL.CURL * 0.8)}%, #e9e4d9 ${at(PEEL.CURL)}%)`;
})();

// The burst's shape is on its face, not the button, so the button can turn and scale it freely.
const CSS = `
.book-corner {
  position: fixed; display: flex; gap: 2px; padding: ${PAD}px; user-select: none;
  mask-repeat: no-repeat; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; -webkit-mask-size: 100% 100%;
}
.book-corner.away { pointer-events: none; }
.book-corner button {
  border: 0; padding: 0; background: none; cursor: pointer; transform: rotate(var(--tilt));
  transition: transform 0.18s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.book-corner button[hidden] { display: none; }
.book-corner button:hover {
  transform: rotate(calc(var(--tilt) + 8deg)) scale(1.07);
}
.book-corner button:active { transform: rotate(var(--tilt)) scale(0.96); }
.book-corner .face {
  position: relative; display: flex; align-items: center; justify-content: center; width: 52px; height: 52px;
  padding: 0 6px; box-sizing: border-box; clip-path: ${polygon(BURST)};
  /* Flat printed ink, lit like the TV's glass: a soft wash from up-left, one faint diagonal streak, falling off down-right. */
  background:
    linear-gradient(125deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.13) 40%, rgba(255, 255, 255, 0) 52%),
    radial-gradient(ellipse 80% 60% at 18% 12%, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 70%),
    linear-gradient(135deg, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.1)),
    var(--ink);
  color: #fff; font: 700 9px/1.05 Archivo, sans-serif; text-transform: uppercase; letter-spacing: 0;
  text-align: center; text-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.3);
}
/* Peeling: the tip is gone from the face (the page shows through) and lies rolled back over it, its paper backing up. */
.book-corner .face.peel { clip-path: ${polygon(STUCK)}; }
.book-corner .flap {
  position: absolute; inset: 0; clip-path: ${polygon(FLAP)};
  background: ${SHADE};
}
`;

/** Whether point `p` is inside convex quad `q`, either winding. */
function inQuad(q: Pt[], p: Pt): boolean {
  const s = q.map((a, i) => {
    const b = q[(i + 1) % q.length];
    return Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  });
  return s.every((v) => v >= 0) || s.every((v) => v <= 0);
}

/** One burst: its colour, its tilt, and the words that go on it. */
function burstButton(ink: string, tilt: number, title: string, act: () => void): { b: HTMLButtonElement; say: HTMLElement } {
  const b = document.createElement('button');
  b.type = 'button';
  b.style.setProperty('--ink', ink);
  b.style.setProperty('--tilt', `${tilt}deg`);
  const say = document.createElement('span');
  say.className = 'face';
  b.append(say);
  b.title = title;
  b.setAttribute('aria-label', title);
  b.tabIndex = -1;
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', () => {
    act();
    b.blur();
  });
  return { b, say };
}

/** The corner's bursts; `update` keeps their words current and pins them to the page corner. */
export function attachCorner(mag: Magazine, canvas: HTMLCanvasElement, covers: () => Cover[]): { update: () => void } {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const bar = document.createElement('div');
  bar.className = 'book-corner';
  // Once a second issue has come, this swaps to the other one in the pile (it names the issue it goes to).
  const nextIssue = (): IssueId => {
    const have = mag.issues();
    return have[(have.indexOf(mag.issue) + 1) % have.length];
  };
  const swap = burstButton('#2c68b8', -7, '', () => mag.setIssue(nextIssue()));
  const read = burstButton('#f08a24', 5, 'Bigger / smaller magazine', () => mag.setReading(!mag.reading));
  const shut = burstButton('#e8312a', -4, 'Put the magazine away (Tab)', () => mag.close());
  shut.say.textContent = 'Put away';
  shut.say.classList.add('peel');
  const flap = document.createElement('span');
  flap.className = 'flap';
  shut.say.append(flap);
  bar.append(swap.b, read.b, shut.b);
  document.body.append(bar);

  // The stickers are on the page, so the notebook's sheets lie over them, though they are drawn on the canvas below:
  // mask out of them whatever the sheets cover, and let no click through there.
  let masked = '';
  const hide = (left: number, top: number): void => {
    const k = canvas.width / canvas.clientWidth;
    const [bw, bh] = [bar.offsetWidth, bar.offsetHeight];
    const quads = covers()
      .map((s) => {
        const [c, n] = [Math.cos(s.rot), Math.sin(s.rot)];
        return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]): Pt => {
          const [px, py] = [s.cx + c * u * s.hx - n * v * s.hy, s.cy + n * u * s.hx + c * v * s.hy];
          return [px / k - left, canvas.clientHeight - py / k - top];
        });
      })
      .filter((q) => !(q.every((p) => p[0] < 0) || q.every((p) => p[0] > bw) || q.every((p) => p[1] < 0) || q.every((p) => p[1] > bh)));
    for (const btn of bar.children as HTMLCollectionOf<HTMLElement>) {
      const at: Pt = [btn.offsetLeft + btn.offsetWidth / 2, btn.offsetTop + btn.offsetHeight / 2];
      btn.style.pointerEvents = quads.some((q) => inQuad(q, at)) ? 'none' : '';
    }
    const mask = quads.length
      ? `url("data:image/svg+xml,${encodeURIComponent(
          // A CSS mask reads the image's alpha, so the sheets are cut out of an opaque rectangle by the SVG's own mask.
          `<svg xmlns='http://www.w3.org/2000/svg' width='${bw}' height='${bh}'><mask id='m'><rect width='100%' height='100%' fill='white'/>` +
            quads.map((q) => `<polygon points='${q.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}'/>`).join('') +
            `</mask><rect width='100%' height='100%' mask='url(#m)'/></svg>`,
        )}")`
      : '';
    if (mask === masked) return;
    masked = mask;
    bar.style.maskImage = mask;
    bar.style.webkitMaskImage = mask;
  };

  return {
    update() {
      bar.classList.toggle('away', mag.openT < 0.97);
      read.say.textContent = mag.reading ? 'Smaller' : 'Bigger';
      const other = nextIssue();
      swap.b.hidden = other === mag.issue;
      const month = ISSUE_DATE[other].split(' ')[0];
      if (swap.b.title !== `Pick up the ${month} issue`) {
        swap.say.textContent = `${month} issue`;
        swap.b.title = `Pick up the ${month} issue`;
        swap.b.setAttribute('aria-label', swap.b.title);
      }
      // The top-right corner of the page in view, from book space to CSS px.
      const [nx, ny] = bookToScreen(mag.v, mag.v.win[1], PAGE_UNIT_H / 2);
      const [cw, ch] = [canvas.clientWidth, canvas.clientHeight];
      const [w, h] = [bar.offsetWidth - 2 * PAD, bar.offsetHeight - 2 * PAD];
      let x = nx * cw + OVERHANG[0] - w;
      let y = (1 - ny) * ch - OVERHANG[1];
      // Leaning in can carry the corner out of the window: keep them where they can be reached.
      if (mag.zoom > 1) {
        x = Math.max(MARGIN, Math.min(x, cw - MARGIN - w));
        y = Math.max(MARGIN, Math.min(y, ch - MARGIN - h));
      }
      // Fixed to the window, which may hold more than the canvas (the touch keyboard, a phone's safe-area margins).
      const r = canvas.getBoundingClientRect();
      bar.style.left = `${r.left + x - PAD}px`;
      bar.style.top = `${r.top + y - PAD}px`;
      hide(x - PAD, y - PAD);
    },
  };
}
