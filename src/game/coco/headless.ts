import type { TypedKey } from '../../engine';
import { ColorBasic } from './basic';
import { TextScreen } from './screen';

/** One field of the VDG: the harness steps time the way the game's loop does. */
const FRAME = 1 / 60;

/** Settled means no key is waiting and BASIC is at the OK prompt or wants an INPUT reply. */
const settled = (b: ColorBasic): boolean => !b.typing && (b.interp.state === 'idle' || b.interp.state === 'input');

/** A screen byte as text: normal and inverse (lower case) letters, the rest of the 64 glyphs, `#` for a graphics block. */
export function screenChar(code: number): string {
  if (code >= 0x80) return '#';
  const glyph = code & 0x3f;
  const ch = String.fromCharCode(glyph < 32 ? 0x40 + glyph : glyph);
  return code & 0x40 ? ch : ch.toLowerCase();
}

const rowText = (row: Uint8Array): string => Array.from(row, screenChar).join('').trimEnd();

/**
 * The CoCo with no page: keyboard → BASIC → screen, and nothing drawn. For tests and scripts (`pnpm test`); it runs in
 * Node through Vite, so the tapes' `.bas?raw` imports work. Typing runs the machine until it settles (the OK prompt, or
 * an INPUT waiting for a reply), and everything printed is kept, even what scrolled off or was cleared.
 *
 *   const coco = new HeadlessCoco();
 *   coco.type('CLOAD "ADVENT"\nRUN\n');
 *   coco.type('TAKE LAMP\n').output(); // ['> TAKE LAMP', 'TAKEN.', '', '>']
 */
export class HeadlessCoco {
  readonly screen = new TextScreen();
  readonly basic: ColorBasic;
  /** Rows that have left the screen, oldest first. */
  private lost: string[] = [];
  /** Where the last `type` began, in transcript lines. */
  private mark = 0;

  /** `fastTape` (the default) makes CLOAD / CSAVE instant, as `?instant` does. */
  constructor({ fastTape = true } = {}) {
    this.basic = new ColorBasic(this.screen, fastTape);
    this.screen.onLostRow = (row) => this.lost.push(rowText(row));
    this.basic.boot();
  }

  get interp() {
    return this.basic.interp;
  }

  /** Type text ("\n" is ENTER, "\b" is ←) and run until the machine settles. */
  type(text: string, maxSeconds?: number): this {
    const keys: TypedKey[] = [...text].map((ch) => ({ key: ch === '\n' ? 'Enter' : ch === '\b' ? 'Backspace' : ch, shift: false, ctrl: false }));
    return this.keys(keys, maxSeconds);
  }

  /** Press named keys (`{ key: 'Escape', shift: false, ctrl: false }` is BREAK) and run until the machine settles. */
  keys(keys: TypedKey[], maxSeconds?: number): this {
    this.mark = Math.max(0, this.transcript().length - 1);
    this.basic.step(FRAME, keys);
    this.screen.step(FRAME);
    return this.settle(maxSeconds);
  }

  /** BREAK. */
  break(): this {
    return this.keys([{ key: 'Escape', shift: false, ctrl: false }]);
  }

  /**
   * Run until no key waits and BASIC is at OK or an INPUT, or `maxSeconds` of machine time has passed (a program
   * looping on INKEY$ never settles: it runs out the time).
   */
  settle(maxSeconds = 5): this {
    for (let t = 0; t < maxSeconds && !settled(this.basic); t += FRAME) this.run(FRAME);
    return this;
  }

  /** Let `seconds` of machine time pass (SOUND, the tape, a running program). */
  run(seconds: number): this {
    for (let t = 0; t < seconds; t += FRAME) {
      this.basic.step(FRAME, []);
      this.screen.step(FRAME);
    }
    return this;
  }

  /** The 16 rows on screen now, trailing spaces trimmed. */
  lines(): string[] {
    const out: string[] = [];
    for (let r = 0; r < 16; r++) out.push(rowText(this.screen.vram.subarray(r * 32, r * 32 + 32)));
    return out;
  }

  /** Everything printed since boot, a line per screen row, up to the cursor's row. */
  transcript(): string[] {
    return [...this.lost, ...this.lines().slice(0, Math.floor(this.screen.pos / 32) + 1)];
  }

  /** What the last `type` (or `keys`) showed, from the line it was typed on to the cursor. */
  output(): string[] {
    return this.transcript().slice(this.mark);
  }

  /** `output()` as one string, lines joined with "\n". */
  text(): string {
    return this.output().join('\n');
  }
}
