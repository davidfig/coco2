import { evaluate, evalNum, target } from './expr';
import type { Frame, Handler, Interpreter } from './interpreter';
import type { Cursor } from './tokens';
import { Vars } from './vars';
import { fail, int } from './values';

type ForFrame = Extract<Frame, { kind: 'for' }>;

/** GOSUBs and FORs nest at most this deep before ?OM. */
const MAX_STACK = 256;

function push(m: Interpreter, f: Frame): void {
  if (m.stack.length >= MAX_STACK) fail('OM');
  m.stack.push(f);
}

/** After THEN or ELSE: a line number is a GOTO; anything else runs on as statements. */
function branch(m: Interpreter, c: Cursor): void | 'inline' {
  if (c.peek()?.k === 'num') return m.goto(c.lineNumber());
  return 'inline';
}

/** Jumps, subroutines, IF, loops, END and STOP. */
export const FLOW: Record<string, Handler> = {
  GOTO: (m, c) => m.goto(c.lineNumber()),

  GOSUB: (m, c) => {
    const n = c.lineNumber();
    push(m, { kind: 'gosub', at: m.here() });
    m.goto(n);
  },

  RETURN: (m) => {
    while (m.stack.length && m.stack[m.stack.length - 1].kind !== 'gosub') m.stack.pop();
    const f = m.stack.pop();
    if (!f) fail('RG');
    m.jump(f.at);
  },

  IF: (m, c) => {
    const cond = evaluate(m, c);
    const yes = typeof cond === 'string' ? cond !== '' : cond !== 0;
    if (!c.eatKw('THEN') && !c.isKw('GOTO')) fail('SN');
    if (yes) return branch(m, c);
    let depth = 0; // skip to this IF's ELSE, past any IFs nested in the THEN part
    while (!c.atEnd()) {
      const t = c.next();
      if (t.k === 'kw' && t.v === 'IF') depth++;
      else if (t.k === 'kw' && t.v === 'ELSE' && depth-- === 0) return branch(m, c);
    }
    return 'inline';
  },

  // Met while running the THEN part: the ELSE part is skipped.
  ELSE: (_m, c) => {
    c.p = c.toks.length;
  },

  FOR: (m, c) => {
    const t = target(m, c);
    if (t.index) fail('SN');
    if (Vars.isString(t.name)) fail('TM');
    c.expectOp('=');
    const start = evalNum(m, c);
    c.expectKw('TO');
    const limit = evalNum(m, c);
    const step = c.eatKw('STEP') ? evalNum(m, c) : 1;
    m.vars.set(t, start);
    const key = Vars.key(t.name);
    for (let i = m.stack.length - 1; i >= 0; i--) {
      const f = m.stack[i];
      if (f.kind === 'gosub') break;
      if (Vars.key(f.name) === key) { m.stack.length = i; break; } // reopening a loop drops it and its insides
    }
    push(m, { kind: 'for', name: t.name, limit, step, at: m.here() });
  },

  NEXT: (m, c) => {
    do {
      const id = c.peek()?.k === 'id' ? (c.next() as { v: string }).v : null;
      let i = m.stack.length - 1;
      for (; i >= 0; i--) {
        const f = m.stack[i];
        if (f.kind === 'gosub') { i = -1; break; }
        if (!id || Vars.key(f.name) === Vars.key(id)) break;
      }
      if (i < 0) fail('NF');
      m.stack.length = i + 1;
      const f = m.stack[i] as ForFrame;
      const v = (m.vars.get({ name: f.name }) as number) + f.step;
      m.vars.set({ name: f.name }, v);
      if (f.step >= 0 ? v <= f.limit : v >= f.limit) return m.jump(f.at);
      m.stack.pop();
    } while (c.eatOp(','));
  },

  ON: (m, c) => {
    const n = int(evaluate(m, c), 0, 255);
    const sub = c.eatKw('GOSUB');
    if (!sub) c.expectKw('GOTO');
    const lines = [c.lineNumber()];
    while (c.eatOp(',')) lines.push(c.lineNumber());
    if (n < 1 || n > lines.length) return;
    if (sub) push(m, { kind: 'gosub', at: m.here() });
    m.goto(lines[n - 1]);
  },

  END: (m) => m.finish(),
  STOP: (m) => m.halt(),
};
