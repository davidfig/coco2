import { TAPE_KEY } from '../basic/tape';
import { MAY_TAPE_KEY } from '../tapes';
import type { ColorBasic } from '../coco/basic';
import type { Magazine } from '../magazine/book';
import type { Notebook } from '../notes';
import { saveHandled } from '../notes/wear';
import { NAME_KEY } from '../story';
import type { Tv } from '../tv/tv';
import { Checkpoint, CHECKPOINTS, STORY_FLAGS } from './checkpoints';
import { DEBUG_CSS } from './debugStyle';

/** What the debug menu reaches into. */
export interface DebugHooks {
  magazine: Magazine;
  notebook: Notebook;
  basic: ColorBasic;
  keyboard: { type(text: string): void };
  tv: Tv;
  tamperTest: () => void;
  stationTest: (channel: number) => void;
}

/** The name a checkpoint keeps when none has been typed in yet. */
const DEFAULT_NAME = 'TESTER';
/** How often the open menu re-reads the flags (the game sets them as it goes). */
const REFRESH_MS = 400;

const readName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
const writeName = (name: string): void => {
  try {
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* blocked storage */
  }
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}
const button = (text: string, onclick: () => void, title = ''): HTMLButtonElement => el('button', { textContent: text, onclick, title });
const section = (title: string, ...kids: Node[]): HTMLElement => el('section', {}, el('h3', { textContent: title }), ...kids);

/**
 * Playtesting only: a panel (F2, or `?debug` to open it at start) that jumps to a checkpoint in the story, ticks or
 * clears single flags, sets the kept name and the notebook's wear, and pokes the TV's story hooks. Keys typed into it
 * stay out of the CoCo. It changes the live game; story timers already running carry on, so reload for a clean run.
 */
export class DebugMenu {
  private readonly root: HTMLElement;
  private readonly flagList: HTMLElement;
  private readonly nameInput: HTMLInputElement;
  private readonly wearInput: HTMLInputElement;
  private readonly typeProgram: HTMLInputElement;
  private timer = 0;
  private shown = '';

  constructor(private readonly h: DebugHooks) {
    document.head.append(el('style', { textContent: DEBUG_CSS }));
    this.flagList = el('div', { className: 'flags' });
    this.nameInput = el('input', { type: 'text', maxLength: 12, placeholder: '(none)' });
    this.wearInput = el('input', { type: 'number', min: '0', step: '1' });
    this.typeProgram = el('input', { type: 'checkbox', checked: true });
    this.root = el(
      'div',
      { className: 'coco-debug' },
      el('header', {}, el('b', { textContent: 'Debug' }), el('span', { textContent: 'F2' }), button('×', () => this.toggle(false), 'Close')),
      section(
        'Jump to',
        el('label', { className: 'row' }, this.typeProgram, ' type the CLOAD (and fixes) at the CoCo'),
        el('div', { className: 'grid' }, ...CHECKPOINTS.map((c) => button(c.label, () => this.jump(c), c.typed?.trim().replace(/\n/g, ' · ') ?? ''))),
      ),
      section('Flags', this.flagList),
      section(
        'Player',
        el('label', { className: 'row' }, 'Name ', this.nameInput, button('Keep', () => writeName(this.nameInput.value.trim().toUpperCase().slice(0, 12)))),
        el('label', { className: 'row' }, 'Notebook wear ', this.wearInput, button('Set', () => this.setWear(Number(this.wearInput.value))), button('0', () => this.setWear(0)), button('60', () => this.setWear(60))),
      ),
      section(
        'TV',
        el(
          'div',
          { className: 'grid' },
          button('Drift off tune', () => h.tv.tuning.drift(0.6)),
          button('Roll the picture', () => h.tv.tuning.upsetHold(1.2)),
          button('Loose contact', () => h.tv.tuning.loosen(0.6)),
          button('Far station on 9', () => h.stationTest(9)),
          button('Tamper a few letters', () => h.tamperTest()),
          button('Reset knobs (reload)', () => this.forget('coco2.tv')),
        ),
      ),
      section(
        'Start over',
        el(
          'div',
          { className: 'grid' },
          button('Erase CSAVEs', () => [TAPE_KEY, MAY_TAPE_KEY].forEach((k) => this.forget(k, false))),
          button('Reload', () => location.reload()),
          button('Wipe everything (?clear)', () => {
            const url = new URL(location.href);
            url.searchParams.set('clear', '');
            location.href = url.toString();
          }),
        ),
      ),
    );
    // Typing in the panel (and scrolling it) must not reach the CoCo, the book or the knobs, which listen on window.
    for (const type of ['keydown', 'keyup', 'wheel', 'pointerdown']) this.root.addEventListener(type, (e) => e.stopPropagation());
    document.body.append(this.root);
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'F2') return;
      e.preventDefault();
      this.toggle();
    });
  }

  toggle(show = !this.root.classList.contains('show')): void {
    this.root.classList.toggle('show', show);
    clearInterval(this.timer);
    if (!show) return;
    this.shown = '';
    this.nameInput.value = readName();
    this.wearInput.value = String(this.h.notebook.handled);
    this.refresh();
    this.timer = window.setInterval(() => this.refresh(), REFRESH_MS);
  }

  /** Redraw the flag list if the flags changed (story order first, then any others the game has set). */
  private refresh(): void {
    const flags = this.h.magazine.state.flags;
    const sig = [...flags].join(',');
    if (sig === this.shown) return;
    this.shown = sig;
    const known = new Set(STORY_FLAGS.map(([f]) => f));
    const rows: [string, string][] = [...STORY_FLAGS, ...[...flags].filter((f) => !known.has(f)).map((f): [string, string] => [f, ''])];
    this.flagList.replaceChildren(
      ...rows.map(([flag, label]) => {
        const box = el('input', { type: 'checkbox', checked: flags.has(flag), onchange: () => this.setFlag(flag, box.checked) });
        return el('label', { className: 'flag' }, box, el('code', { textContent: flag }), el('span', { textContent: label }));
      }),
    );
  }

  /** Write the flags (in this order) over the magazine's, save them, and have its pages and the notebook redrawn. */
  private setFlags(list: readonly string[]): void {
    const { magazine } = this.h;
    magazine.state.flags.clear();
    for (const f of list) magazine.state.flags.add(f);
    magazine.save();
    magazine.repaint();
    this.refresh();
  }

  private setFlag(flag: string, on: boolean): void {
    const list = [...this.h.magazine.state.flags].filter((f) => f !== flag);
    this.setFlags(on ? [...list, flag] : list);
  }

  private jump(c: Checkpoint): void {
    this.setFlags(c.flags);
    // The issue on the table goes with the checkpoint (the tape in the recorder follows the flags by itself).
    this.h.magazine.setIssue(c.flags.includes('issue2-waiting') ? 'may' : 'march');
    if (c.named) {
      if (!readName()) writeName(this.nameInput.value.trim().toUpperCase() || DEFAULT_NAME);
    } else writeName('');
    this.nameInput.value = readName();
    if (!this.typeProgram.checked) return;
    // BREAK whatever is running (or the half-typed line), clear the screen, then put the program in memory.
    this.h.basic.key({ key: 'Escape', shift: false, ctrl: false });
    this.h.keyboard.type(`NEW\nCLS\n${c.typed ?? ''}`);
  }

  private setWear(n: number): void {
    const handled = Math.max(0, Math.floor(n) || 0);
    this.h.notebook.handled = handled;
    saveHandled(handled);
    this.wearInput.value = String(handled);
  }

  private forget(key: string, reload = true): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* blocked storage */
    }
    if (reload) location.reload();
  }
}
