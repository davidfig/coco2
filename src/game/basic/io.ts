import { resetDot, setDot } from '../coco/blocks';
import { args, evaluate, target } from './expr';
import type { Handler, Interpreter } from './interpreter';
import type { Cursor } from './tokens';
import { Vars } from './vars';
import { fail, formatNumber, int } from './values';

/** Move to column `col` on this line by printing spaces (nothing if already past it). */
function tab(m: Interpreter, col: number): void {
  const at = m.screen.pos % 32;
  if (col > at) m.out(' '.repeat(col - at));
}

/** INPUT and LINE INPUT: an optional "prompt"; then the variables. */
function input(m: Interpreter, c: Cursor, whole: boolean): void {
  let prompt = '';
  const t = c.peek();
  if (t?.k === 'str') {
    c.p++;
    prompt = t.v;
    c.expectOp(';');
  }
  const targets = [target(m, c)];
  while (!whole && c.eatOp(',')) targets.push(target(m, c));
  if (whole && !Vars.isString(targets[0].name)) fail('TM');
  m.awaitInput(prompt + (whole ? '' : '? '), targets, whole);
}

/** The screen and the keyboard: PRINT, INPUT, CLS, SET/RESET, POKE, SOUND. */
export const IO: Record<string, Handler> = {
  PRINT: (m, c) => {
    const s = m.screen;
    if (c.eatOp('@')) {
      s.pos = int(evaluate(m, c), 0, 511);
      if (!c.eatOp(',')) c.eatOp(';');
    }
    let newline = true;
    while (!c.atStatementEnd()) {
      if (c.eatOp(';')) newline = false;
      else if (c.eatOp(',')) {
        if (s.pos % 32 >= 16) s.newline();
        else tab(m, 16);
        newline = false;
      } else if (c.eatKw('TAB')) {
        c.expectOp('(');
        tab(m, int(evaluate(m, c), 0, 255) % 32);
        c.expectOp(')');
        newline = false;
      } else {
        const v = evaluate(m, c);
        m.out(typeof v === 'number' ? (v >= 0 ? ' ' : '') + formatNumber(v) + ' ' : v);
        newline = true;
      }
    }
    if (newline) s.newline();
  },

  INPUT: (m, c) => input(m, c, false),

  LINE: (m, c) => {
    c.expectKw('INPUT');
    input(m, c, true);
  },

  // CLS n fills with a colour (0 black, 1–8 the semigraphics colours); past 8 the ROM shows off.
  CLS: (m, c) => {
    const s = m.screen;
    if (c.atStatementEnd()) return s.cls();
    const n = int(evaluate(m, c), 0, 255);
    if (n > 8) {
      s.cls();
      m.out('MICROSOFT');
    } else s.cls(n === 0 ? 0x80 : 0x8f | ((n - 1) << 4));
  },

  SET: (m, c) => {
    const a = args(m, c);
    if (a.length !== 3) fail('SN');
    setDot(m.screen.vram, int(a[0], 0, 63), int(a[1], 0, 31), int(a[2], 0, 8));
    m.screen.touch();
  },

  RESET: (m, c) => {
    const a = args(m, c);
    if (a.length !== 2) fail('SN');
    resetDot(m.screen.vram, int(a[0], 0, 63), int(a[1], 0, 31));
    m.screen.touch();
  },

  POKE: (m, c) => {
    const addr = int(evaluate(m, c), 0, 65535);
    c.expectOp(',');
    const v = int(evaluate(m, c), 0, 255);
    if (addr >= 1024 && addr < 1536) {
      m.screen.vram[addr - 1024] = v;
      m.screen.touch();
    }
  },

  // SOUND tone, duration: silent for now, but it takes its time (a duration unit is about 1/16 s).
  SOUND: (m, c) => {
    int(evaluate(m, c), 1, 255);
    c.expectOp(',');
    m.pause(int(evaluate(m, c), 1, 255) * 0.06);
  },
};
