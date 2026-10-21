/** One key the player typed, in order. `key` is the browser's `KeyboardEvent.key` ("A", "Enter", "Backspace"…). */
export interface TypedKey {
  key: string;
  shift: boolean;
  ctrl: boolean;
  /** Which SHIFT was held, when only one was (from the real keyboard); unset for both, or when it isn't known. */
  shiftSide?: 'left' | 'right';
}

/**
 * Typing, not held keys: every keydown (with auto-repeat) goes on a queue the game drains once per frame.
 * Headless runs and tests call `type("PRINT 1\n")` instead.
 */
export class Keyboard {
  private readonly queue: TypedKey[] = [];
  /** The keys held down now, by `KeyboardEvent.code` (`ShiftLeft`, `KeyA`), with the key each went down as. */
  private readonly down = new Map<string, string>();

  constructor(listen = true) {
    if (!listen) return;
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      if (!e.shiftKey && !e.code.startsWith('Shift')) this.forgetShifts(); // a keyup missed while the page was away
    });
    window.addEventListener('blur', () => this.down.clear());
    window.addEventListener('keydown', (e) => {
      if (!e.shiftKey) this.forgetShifts(); // a keyup missed while the page was away
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.down.set(e.code, 'Shift');
      if (e.metaKey || e.altKey) return; // leave browser shortcuts alone
      if (e.ctrlKey && e.key !== 'c' && e.key !== 'C') return;
      const named = e.key.length > 1;
      if (named && !KEEP.has(e.key)) return;
      this.down.set(e.code, e.key);
      const { left, right } = this.shiftsHeld();
      const k: TypedKey = { key: e.key, shift: e.shiftKey, ctrl: e.ctrlKey };
      if (e.shiftKey && left !== right) k.shiftSide = left ? 'left' : 'right';
      this.queue.push(k);
      e.preventDefault();
    });
  }

  /** Whether the real keyboard's left and right SHIFT are held down now. */
  shiftsHeld(): { left: boolean; right: boolean } {
    return { left: this.down.has('ShiftLeft'), right: this.down.has('ShiftRight') };
  }

  /** The keys held down on the real keyboard now, but SHIFT, as they went down (`KeyboardEvent.key`). */
  held(): string[] {
    return [...this.down.values()].filter((k) => k !== 'Shift');
  }

  /** Everything typed since the last call. */
  drain(): TypedKey[] {
    return this.queue.splice(0);
  }

  private forgetShifts(): void {
    this.down.delete('ShiftLeft');
    this.down.delete('ShiftRight');
  }

  /** Queue one key as if pressed (the CoCo's own keyboard, clicked). */
  push(k: TypedKey): void {
    this.queue.push(k);
  }

  /** Queue a string as if typed ("\n" is Enter, "\b" is Backspace). */
  type(text: string): void {
    for (const ch of text) {
      const key = ch === '\n' ? 'Enter' : ch === '\b' ? 'Backspace' : ch;
      this.queue.push({ key, shift: false, ctrl: false });
    }
  }
}

/** Named keys the game gets; the rest (F-keys, Tab…) stay with the browser. */
const KEEP = new Set(['Enter', 'Backspace', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Home', 'Clear']);
