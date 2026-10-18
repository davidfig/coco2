import type { TypedKey } from '../../engine';
import { Interpreter } from '../basic/interpreter';
import { Tape } from '../basic/tape';
import { RAINBOW_TAPE } from '../tapes';
import type { TextScreen } from './screen';

/** What a CoCo 2 with Extended Color BASIC says when it is switched on. */
export const BOOT_MESSAGE = 'EXTENDED COLOR BASIC 1.1\nCOPYRIGHT (C) 1982 BY TANDY\nUNDER LICENSE FROM MICROSOFT\n\nOK\n';

/** Longest line BASIC's input buffer takes. */
const MAX_LINE = 249;

/** What INKEY$ sees for the keys that aren't characters (the CoCo's arrow keys, ENTER, CLEAR). */
const INKEY_CODES: Record<string, number> = { Enter: 13, Backspace: 8, ArrowLeft: 8, ArrowRight: 9, ArrowDown: 10, ArrowUp: 94, Home: 12, Clear: 12 };

/** BREAK is Esc or Ctrl-C. */
const isBreak = (k: TypedKey): boolean => (k.key === 'Escape' && !k.shift) || (k.ctrl && k.key.toLowerCase() === 'c');

/**
 * The keyboard side of the machine: BASIC's line editor (type, ←, ENTER) at the OK prompt and for INPUT replies, keys
 * for INKEY$ while a program runs, BREAK (Esc or Ctrl-C) and CLEAR (Home). The language itself is `Interpreter`.
 */
export class ColorBasic {
  readonly interp: Interpreter;
  private line = '';
  private backlog: TypedKey[] = [];

  /** `fastTape` makes CLOAD / CSAVE instant instead of taking tape time. */
  constructor(private readonly screen: TextScreen, fastTape = false) {
    this.interp = new Interpreter(screen, new Tape(RAINBOW_TAPE));
    if (fastTape) this.interp.deck.speed = Infinity;
  }

  /** Keys typed ahead are still waiting their turn (for the tape, or for the OK). */
  get typing(): boolean {
    return this.backlog.length > 0;
  }

  boot(): void {
    this.screen.cls();
    this.screen.print(BOOT_MESSAGE);
  }

  /**
   * Take this frame's keys, run a slice of the program, and show the cursor only when BASIC is waiting for typing.
   * Keys typed after an ENTER wait until that line has run (a pasted program types in line by line).
   */
  step(dt: number, keys: TypedKey[]): void {
    this.backlog.push(...keys);
    while (this.backlog.length) {
      const busy = this.interp.state === 'tape' || this.interp.state === 'prompt';
      if (busy && !isBreak(this.backlog[0])) break; // typed ahead: waits for the tape, or for the OK
      const k = this.backlog.shift()!;
      this.key(k);
      if (k.key === 'Enter' && this.interp.state !== 'idle' && this.interp.state !== 'input') break;
    }
    this.interp.step(dt);
    const st = this.interp.state;
    const on = st === 'idle' || st === 'input';
    if (on !== this.screen.cursorOn) {
      this.screen.cursorOn = on;
      this.screen.touch();
    }
  }

  key(k: TypedKey): void {
    const s = this.screen;
    const st = this.interp.state;
    if (isBreak(k)) return this.breakKey();
    if (k.ctrl) return;
    if (st === 'running' || st === 'waiting') {
      const code = INKEY_CODES[k.key] ?? (k.key.length === 1 ? k.key.toUpperCase().charCodeAt(0) : -1);
      if (code >= 0) this.interp.pressKey(String.fromCharCode(code));
      return;
    }
    s.wake();
    if (k.key === 'Enter') {
      s.newline();
      const line = this.line;
      this.line = '';
      if (st === 'input') this.interp.input(line);
      else if (line.trim() !== '') this.interp.enter(line);
    } else if (k.key === 'Backspace' || k.key === 'ArrowLeft') {
      if (this.line.length > 0) {
        this.line = this.line.slice(0, -1);
        s.backspace();
      }
    } else if (k.key === 'Home' || k.key === 'Clear' || (k.key === 'Escape' && k.shift)) {
      s.cls();
      this.line = '';
      if (st === 'input') this.interp.halt();
    } else if (k.key.length === 1 && this.line.length < MAX_LINE) {
      const ch = k.key.toUpperCase(); // a CoCo types upper case until SHIFT-0
      if (ch < ' ' || ch > ']') return;
      this.line += ch;
      s.print(ch);
    }
  }

  /** BREAK stops a program; at the OK prompt it throws away the line being typed. */
  private breakKey(): void {
    if (this.interp.state !== 'idle') {
      this.line = '';
      this.backlog = [];
      this.interp.halt();
    } else if (this.line) {
      this.line = '';
      this.screen.newline();
    }
  }
}
