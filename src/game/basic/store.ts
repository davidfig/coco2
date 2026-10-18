import { evaluate, evalNum, target } from './expr';
import type { Handler } from './interpreter';
import { Vars } from './vars';
import { fail, int, isNumberText } from './values';

/** Variables and data: LET, DIM, READ/DATA/RESTORE, CLEAR, REM, TIMER=. */
export const STORE: Record<string, Handler> = {
  LET: (m, c) => {
    const t = target(m, c);
    c.expectOp('=');
    m.vars.set(t, evaluate(m, c));
  },

  DIM: (m, c) => {
    do {
      const t = c.next();
      if (t.k !== 'id') fail('SN');
      c.expectOp('(');
      const sizes = [evalNum(m, c)];
      while (c.eatOp(',')) sizes.push(evalNum(m, c));
      c.expectOp(')');
      m.vars.dim(t.v, sizes);
    } while (c.eatOp(','));
  },

  READ: (m, c) => {
    const items = m.program.dataItems();
    do {
      const t = target(m, c);
      const item = items[m.dataIndex++] ?? fail('OD');
      if (Vars.isString(t.name)) m.vars.set(t, item.text);
      else if (!item.quoted && (item.text === '' || isNumberText(item.text))) m.vars.set(t, Number(item.text) || 0);
      else fail('SN');
    } while (c.eatOp(','));
  },

  DATA: (_m, c) => {
    if (c.peek()?.k === 'raw') c.p++;
  },

  RESTORE: (m, c) => {
    if (c.peek()?.k !== 'num') {
      m.dataIndex = 0;
      return;
    }
    const n = c.lineNumber();
    const items = m.program.dataItems();
    const i = items.findIndex((d) => d.line >= n);
    m.dataIndex = i < 0 ? items.length : i;
  },

  // CLEAR [string space[, top of memory]]: the sizes don't matter here, the wipe does.
  CLEAR: (m, c) => {
    if (!c.atStatementEnd()) {
      evalNum(m, c);
      if (c.eatOp(',')) evalNum(m, c);
    }
    m.vars.clear();
    m.stack = [];
    m.dataIndex = 0;
  },

  REM: (_m, c) => {
    c.p = c.toks.length;
  },

  TIMER: (m, c) => {
    c.expectOp('=');
    m.timer = int(evaluate(m, c), 0, 65535);
  },
};
