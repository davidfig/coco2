import { ROWS, UPPER } from '../computer/layout';
import { TOUCH_CSS } from './touchStyle';

/** Whether the page should bring the touch keyboard: `?touch` forces it, `?notouch` leaves it out, else a finger-driven device. */
export function wantsTouchKeys(params: URLSearchParams): boolean {
  if (params.has('notouch')) return false;
  return params.has('touch') || matchMedia('(pointer: coarse)').matches;
}

/** What a press goes to: the rendered machine's keys (`CocoKeys`), which type the key and push its cap down. */
export interface KeyPresser {
  press(row: number, i: number): void;
  release(): void;
}

/**
 * The CoCo's keyboard as a strip along the bottom of the window, for phones and tablets: the same rows and legends as
 * the machine on the table (`ROWS`), pressed with a finger. Each press goes through the machine's own keys, so the
 * cap on the table goes down too and SHIFT latches the same way. No auto-repeat: Color BASIC had none. The canvas
 * takes what is left above it (the engine sizes the buffer to the canvas). A tab on its top edge slides it away.
 */
export class TouchKeys {
  readonly el: HTMLDivElement;
  private readonly pop: HTMLDivElement;
  private readonly shifts: HTMLElement[] = [];
  /** Fingers down, by pointer id, and the key under each. */
  private readonly fingers = new Map<number, HTMLElement>();

  constructor(private readonly keys: KeyPresser) {
    const style = document.createElement('style');
    style.textContent = TOUCH_CSS;
    document.head.append(style);
    document.body.classList.add('coco-touch');
    this.el = document.createElement('div');
    this.el.className = 'coco-kb';
    this.pop = document.createElement('div');
    this.pop.className = 'pop';
    ROWS.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'row';
      row.forEach((k, i) => rowEl.append(this.cap(r, i, k.label, k.x, k.w)));
      this.el.append(rowEl);
    });
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.textContent = 'KEYBOARD';
    tab.addEventListener('click', () => this.toggle());
    this.el.append(tab, this.pop);
    document.body.append(this.el);
    // iOS Safari zooms on a quick double tap even under touch-action: none; a cancelled touchend stops it. The keys
    // type on pointer events, which still come; only the tab needs the click a touchend makes.
    this.el.addEventListener(
      'touchend',
      (e) => {
        if (!(e.target as Element).closest('.tab')) e.preventDefault();
      },
      { passive: false },
    );
    this.measure();
    const up = (e: PointerEvent): void => this.up(e.pointerId);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // Turned on its side or back, the strip docks the other way: slid away, it needs the new size to stay out of sight.
    window.addEventListener('resize', () => this.measure());
  }

  /** Slide the strip away (to read, or look at the set), or bring it back. */
  toggle(show = this.el.classList.contains('hidden')): void {
    this.measure();
    this.el.classList.toggle('hidden', !show);
  }

  /** How far to slide the strip away: down its height, or (docked at the side on a phone on its side) across its width. */
  private measure(): void {
    const hidden = this.el.classList.contains('hidden');
    // Slid away, it is measured as it would stand (taken out and put back in the same frame: nothing shows).
    this.el.style.transition = 'none';
    this.el.classList.remove('hidden');
    this.el.style.setProperty('--kb-h', `${this.el.offsetHeight}px`);
    this.el.style.setProperty('--kb-w', `${this.el.offsetWidth}px`);
    this.el.classList.toggle('hidden', hidden);
    void this.el.offsetWidth;
    this.el.style.transition = '';
  }

  private cap(row: number, i: number, label: string, x: number, w: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'key';
    el.style.left = `calc(var(--u) * ${x})`;
    el.style.width = `calc(var(--u) * ${w} - var(--u) * 0.1)`;
    if (label === 'BREAK') el.classList.add('brk');
    if (label.length > 1) el.classList.add('wide');
    if ('↑↓←→'.includes(label) && label) el.classList.add('arrow');
    if (UPPER[label]) {
      el.classList.add('two');
      // Two signs, as printed: the shifted one above.
      for (const sign of [UPPER[label], label]) el.append(Object.assign(document.createElement('span'), { textContent: sign }));
    } else el.append(label);
    if (label === 'SHIFT') this.shifts.push(el);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // A touch is captured by the key it lands on; let it go, so its end reaches the window wherever it lifts.
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      this.fingers.set(e.pointerId, el);
      el.classList.add('down');
      this.keys.press(row, i);
      if (label === 'SHIFT') {
        const latched = !this.shifts[0].classList.contains('latched');
        for (const s of this.shifts) s.classList.toggle('latched', latched);
      } else {
        if (label.length === 1) this.show(el, label);
        for (const s of this.shifts) s.classList.remove('latched');
      }
      navigator.vibrate?.(8);
    });
    return el;
  }

  /** The letter blown up over the finger, so it can be seen under it. */
  private show(el: HTMLElement, label: string): void {
    const r = el.getBoundingClientRect();
    const shifted = this.shifts[0]?.classList.contains('latched');
    this.pop.textContent = (shifted && UPPER[label]) || label;
    this.pop.style.left = `${r.left + r.width / 2}px`;
    this.pop.style.top = `${r.top - 4}px`;
    this.pop.style.display = 'block';
  }

  private up(id: number): void {
    const el = this.fingers.get(id);
    if (!el) return;
    this.fingers.delete(id);
    el.classList.remove('down');
    if (this.fingers.size > 0) return;
    this.pop.style.display = 'none';
    this.keys.release();
  }
}
