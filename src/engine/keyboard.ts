/** One key the player typed, in order. `key` is the browser's `KeyboardEvent.key` ("A", "Enter", "Backspace"…). */
export interface TypedKey {
  key: string;
  shift: boolean;
  ctrl: boolean;
}

/**
 * Typing, not held keys: every keydown (with auto-repeat) goes on a queue the game drains once per frame.
 * Headless runs and tests call `type("PRINT 1\n")` instead.
 */
export class Keyboard {
  private readonly queue: TypedKey[] = [];

  constructor(listen = true) {
    if (!listen) return;
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.altKey) return; // leave browser shortcuts alone
      if (e.ctrlKey && e.key !== 'c' && e.key !== 'C') return;
      const named = e.key.length > 1;
      if (named && !KEEP.has(e.key)) return;
      this.queue.push({ key: e.key, shift: e.shiftKey, ctrl: e.ctrlKey });
      e.preventDefault();
    });
  }

  /** Everything typed since the last call. */
  drain(): TypedKey[] {
    return this.queue.splice(0);
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
