import type { Magazine } from './book';
import { attachCorner, type Cover } from './bookCorner';
import { overPage } from './bookLayout';

/** Clicks and drags shorter than this (CSS px) are clicks. */
const CLICK_SLOP = 6;
/** A single click waits this long (ms) to see whether it is half of a double-click. */
const DOUBLE_MS = 230;
/** A drag this many page widths across the spine turns a leaf all the way over. */
const TURN_SPAN = 1.3;
const HINT_KEY = 'coco2.rainbow.hint';

/**
 * Everything the reader does to the magazine, handled like paper rather than a document viewer: drag a page across
 * the spine to turn it (let go early and it falls back), click a page to put it away (at reading size, to turn it), double-click to lean in on it (drag
 * to move about, double-click to lean back), scroll or swipe to flip, pinch to zoom. TAB puts it
 * away, PAGE UP/DOWN turn. A few starbursts on the page corner remain (bookCorner). Typing is left alone so the CoCo keeps listening
 * while the magazine is open.
 */
export function attachBookInput(mag: Magazine, canvas: HTMLCanvasElement, covers: () => Cover[]): { update: (light?: string) => void } {
  const norm = (e: MouseEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };
  const cssToBuf = () => canvas.width / canvas.clientWidth;

  const pointers = new Map<number, { x: number; y: number }>();
  let down: { x: number; y: number; moved: boolean } | null = null;
  let pinch = 0;
  /** A leaf in the hand: which way it turns, where the pointer was grabbed, and how fast it is moving. */
  let hold: { dir: 1 | -1; x0: number; vel: number; lastX: number; lastT: number } | null = null;
  let clickTimer = 0;
  /** The pointer is over a link (a contents page number). */
  let overLink = false;
  /** The view in the hand, sliding to the other page of the same spread: which way, where it started and was grabbed. */
  let slide: { dir: 1 | -1; from: number; x0: number; t: number; vel: number; lastX: number; lastT: number } | null = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [nx, ny] = norm(e);
    if (pointers.size === 1) {
      down = { x: e.clientX, y: e.clientY, moved: false };
    }
    if (pointers.size === 2) pinch = spread();
    if (mag.open || overPage(mag.v, nx, ny)) canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const [nx, ny] = norm(e);
    mag.hover = !mag.open && overPage(mag.v, nx, ny);
    overLink = !down?.moved && mag.linkUnder(nx, ny) !== undefined;
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 2) {
      const d = spread();
      const [mx, my] = mid();
      if (pinch > 0 && d > 0) mag.zoomAt(d / pinch, mx, my);
      pinch = d;
      if (down) down.moved = true;
      return;
    }
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP) down.moved = true;
    if (down?.moved && mag.open && mag.zoom > 1.02) {
      panBy(-dx, dy);
    } else if (down?.moved && mag.open && pointers.size === 1) {
      if (!hold && !slide && Math.abs(e.clientX - down.x) > Math.abs(e.clientY - down.y)) {
        const dir = e.clientX < down.x ? 1 : -1;
        const next = mag.pageGoal + dir;
        if (mag.grab(dir)) hold = { dir, x0: down.x, vel: 0, lastX: e.clientX, lastT: e.timeStamp };
        else if (!mag.flip && next >= 0 && next < mag.count && Math.ceil(next / 2) === Math.ceil(mag.pageGoal / 2)) {
          // No leaf to carry (the other half of the same spread): the view slides across under the hand instead.
          slide = { dir, from: mag.camX, x0: down.x, t: 0, vel: 0, lastX: e.clientX, lastT: e.timeStamp };
          mag.camHeld = true;
        }
      }
      if (slide) {
        // The page moves with the pointer: a page width of drag carries the view all the way over.
        const span = mag.v.scale / cssToBuf();
        slide.t = Math.min(1, Math.max(0, ((slide.x0 - e.clientX) * slide.dir) / span));
        mag.camX = slide.from + slide.t * (0.5 * slide.dir - slide.from);
        const dt = Math.max(1, e.timeStamp - slide.lastT);
        slide.vel = 0.6 * slide.vel + 0.4 * (((slide.lastX - e.clientX) * slide.dir) / dt);
        slide.lastX = e.clientX;
        slide.lastT = e.timeStamp;
      }
      if (hold) {
        const span = (TURN_SPAN * mag.v.scale) / cssToBuf();
        mag.drag(((hold.x0 - e.clientX) * hold.dir) / span);
        const dt = Math.max(1, e.timeStamp - hold.lastT);
        hold.vel = 0.6 * hold.vel + 0.4 * (((hold.lastX - e.clientX) * hold.dir) / dt);
        hold.lastX = e.clientX;
        hold.lastT = e.timeStamp;
      }
    }
  });

  function panBy(dx: number, dy: number): void {
    const k = cssToBuf() / mag.v.scale;
    mag.pan.x += dx * k;
    mag.pan.y += dy * k;
    mag.anchor = null;
  }

  const release = (e: PointerEvent) => {
    if (!pointers.delete(e.pointerId)) return;
    if (pointers.size > 0) return;
    const wasClick = down && !down.moved;
    down = null;
    if (hold) {
      // A quick flick the right way finishes the turn even from a short drag.
      const moving = e.timeStamp - hold.lastT < 100 && hold.vel > 0.4;
      mag.drop(e.type === 'pointercancel' ? -1 : moving ? 0.5 : 0);
      hold = null;
      heardTurn();
    }
    if (slide) {
      // Let go past halfway (or flicked on) and the view finishes the move; short of it, it settles back.
      const moving = e.timeStamp - slide.lastT < 100 && slide.vel > 0.4;
      if (e.type !== 'pointercancel' && slide.t + (moving ? 0.5 : 0) > 0.5) mag.turn(slide.dir);
      mag.camHeld = false;
      slide = null;
      heardTurn();
    }
    if (e.type === 'pointercancel' || !wasClick) return;
    const [nx, ny] = norm(e);
    click(nx, ny);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => (mag.hover = false));

  function click(nx: number, ny: number): void {
    if (!mag.open) {
      if (overPage(mag.v, nx, ny)) mag.show();
      return;
    }
    // A click on the set puts the magazine away, as ✕ does.
    if (mag.inRect(mag.tv, nx, ny)) return mag.close();
    if (!mag.inRect(mag.book, nx, ny)) return;
    clearTimeout(clickTimer);
    // A contents page number turns straight to its page, at any size.
    const to = mag.linkUnder(nx, ny);
    if (to) {
      mag.follow(to);
      return heardTurn();
    }
    const [px, py] = mag.toBook(nx, ny);
    if (mag.zoom > 1.05) return;
    // Wait a moment: a second click is a double-click, which leans in instead.
    // Beside the set, a click puts the magazine away; at reading size it turns the page.
    if (!mag.reading) {
      clickTimer = window.setTimeout(() => mag.close(), DOUBLE_MS);
      return;
    }
    const dir = Math.abs(px - mag.camX) > 0.55 ? 0 : px > mag.camX ? 1 : -1;
    if (!dir || Math.abs(py) >= 0.7) return;
    clickTimer = window.setTimeout(() => {
      mag.turn(dir);
      heardTurn();
    }, DOUBLE_MS);
  }

  canvas.addEventListener('dblclick', (e) => {
    const [nx, ny] = norm(e);
    if (!mag.open || !mag.inRect(mag.book, nx, ny) || mag.linkUnder(nx, ny)) return;
    clearTimeout(clickTimer);
    mag.lean(nx, ny);
    heardTurn();
  });

  function spread(): number {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  function mid(): [number, number] {
    const [a, b] = [...pointers.values()];
    const r = canvas.getBoundingClientRect();
    return [((a.x + b.x) / 2 - r.left) / r.width, 1 - ((a.y + b.y) / 2 - r.top) / r.height];
  }

  // Scrolling: pinch (a ctrl-wheel) zooms; a zoomed page scrolls about; otherwise a swipe or a notch flips one page,
  // once per gesture, so a trackpad's coasting doesn't riffle through the issue.
  let wheelSum = 0;
  let wheelLast = 0;
  let wheelArmed = true;
  canvas.addEventListener(
    'wheel',
    (e) => {
      const [nx, ny] = norm(e);
      if (!mag.open || !mag.inRect(mag.book, nx, ny)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (e.ctrlKey) return mag.zoomAt(Math.exp(-dy * 0.01), nx, ny);
      if (mag.zoom > 1.02) return panBy(dx, -dy);
      if (e.timeStamp - wheelLast > 160) {
        wheelArmed = true;
        wheelSum = 0;
      }
      wheelLast = e.timeStamp;
      wheelSum += Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (wheelArmed && Math.abs(wheelSum) > 40) {
        wheelArmed = false;
        mag.turn(wheelSum > 0 ? 1 : -1);
        heardTurn();
      }
    },
    { passive: false },
  );

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.repeat) mag.toggle();
    } else if (!mag.open) {
      return;
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      mag.turn(1);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      mag.turn(-1);
    } else if (e.key === 'Escape' && !e.shiftKey && mag.reading) {
      mag.setReading(false);
    }
  });

  // ---- the corner's starbursts (bookCorner), and a hint the first few times ----
  const corner = attachCorner(mag, canvas, covers);

  const hint = document.createElement('div');
  hint.className = 'book-hint';
  hint.textContent = 'Drag a page to turn it  ·  double-click to lean in  ·  scroll to flip';
  document.body.append(hint);
  let hintLeft = 0;
  let learned = false;
  try {
    learned = localStorage.getItem(HINT_KEY) === '1';
  } catch {
    /* blocked storage: the hint just shows each visit */
  }
  /** The reader has done something the hint explains: stop showing it, for good. */
  function heardTurn(): void {
    if (learned) return;
    learned = true;
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  return {
    /** `light`: the room's lights as a CSS filter (`RoomLights.css`), for what lies over the canvas. */
    update(light = '') {
      const show = mag.openT > 0.97;
      corner.update(light);
      if (hint.style.filter !== light) hint.style.filter = light;
      canvas.style.cursor = mag.open ? (hold || slide ? 'grabbing' : overLink ? 'pointer' : 'grab') : mag.hover ? 'pointer' : '';
      if (show && !learned) hintLeft = Math.min(hintLeft + 1 / 60, 9);
      if (!show) hintLeft = 0;
      hint.classList.toggle('show', show && !learned && hintLeft < 8);
      if (!show) return;
      hint.style.left = `${(mag.book.x + mag.book.w / 2) * canvas.clientWidth}px`;
      hint.style.bottom = `${Math.max(8, mag.book.y * canvas.clientHeight + 8)}px`;
    },
  };
}
