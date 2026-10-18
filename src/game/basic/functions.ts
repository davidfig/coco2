import { pointDot } from '../coco/blocks';
import { args } from './expr';
import type { Machine } from './machine';
import type { Cursor } from './tokens';
import { Value, fail, int, num, parseNumberPrefix, str, strNumber } from './values';

/** RND's generator: a seedable LCG so RND(-n) can restart a sequence, as on the CoCo. */
let seed = 0x2f6b9a1;
function random(): number {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
  return seed / 4294967296;
}

/** Functions that take no parentheses. */
function bare(m: Machine, name: string): Value | undefined {
  switch (name) {
    case 'INKEY$': return m.takeKey();
    case 'MEM': return m.memFree();
    case 'TIMER': return Math.floor(m.timer) & 0xffff;
  }
  return undefined;
}

/** A built-in function, its name already read; parses its own arguments. */
export function callFunction(m: Machine, name: string, c: Cursor): Value {
  const b = bare(m, name);
  if (b !== undefined) return b;
  const a = args(m, c);
  const n = (i: number) => num(a[i] ?? fail('SN'));
  const s = (i: number) => str(a[i] ?? fail('SN'));
  const arity = (k: number, max = k) => { if (a.length < k || a.length > max) fail('SN'); };
  switch (name) {
    case 'ABS': arity(1); return Math.abs(n(0));
    case 'INT': arity(1); return Math.floor(n(0));
    case 'FIX': arity(1); return Math.trunc(n(0));
    case 'SGN': arity(1); return Math.sign(n(0));
    case 'SQR': arity(1); if (n(0) < 0) fail('FC'); return Math.sqrt(n(0));
    case 'SIN': arity(1); return Math.sin(n(0));
    case 'COS': arity(1); return Math.cos(n(0));
    case 'TAN': arity(1); return Math.tan(n(0));
    case 'ATN': arity(1); return Math.atan(n(0));
    case 'LOG': arity(1); if (n(0) <= 0) fail('FC'); return Math.log(n(0));
    case 'EXP': arity(1); if (n(0) > 88) fail('OV'); return Math.exp(n(0));
    case 'RND': {
      arity(1);
      const x = Math.floor(n(0));
      if (x < 0) { seed = (-x * 7919) >>> 0; return random(); }
      return x === 0 ? random() : Math.floor(random() * x) + 1;
    }
    case 'LEN': arity(1); return s(0).length;
    case 'ASC': arity(1); if (s(0) === '') fail('FC'); return s(0).charCodeAt(0);
    case 'CHR$': arity(1); return String.fromCharCode(int(a[0], 0, 255));
    case 'STR$': arity(1); return strNumber(n(0));
    case 'VAL': arity(1); return parseNumberPrefix(s(0));
    case 'HEX$': arity(1); return int(a[0], 0, 65535).toString(16).toUpperCase();
    case 'LEFT$': arity(2); return s(0).slice(0, int(a[1], 0, 255));
    case 'RIGHT$': { arity(2); const k = int(a[1], 0, 255); return k === 0 ? '' : s(0).slice(-k); }
    case 'MID$': {
      arity(2, 3);
      const start = int(a[1], 1, 255);
      return a.length > 2 ? s(0).substr(start - 1, int(a[2], 0, 255)) : s(0).slice(start - 1);
    }
    case 'INSTR': {
      arity(2, 3);
      const [from, hay, needle] = a.length === 3 ? [int(a[0], 1, 255), s(1), s(2)] : [1, s(0), s(1)];
      if (from > hay.length) return 0;
      return hay.indexOf(needle, from - 1) + 1;
    }
    case 'STRING$': {
      arity(2);
      const ch = typeof a[1] === 'string' ? (a[1] === '' ? fail('FC') : a[1][0]) : String.fromCharCode(int(a[1], 0, 255));
      return ch.repeat(int(a[0], 0, 255));
    }
    case 'PEEK': {
      arity(1);
      const addr = int(a[0], 0, 65535);
      return addr >= 1024 && addr < 1536 ? m.screen.vram[addr - 1024] : 0;
    }
    case 'POINT': arity(2); return pointDot(m.screen.vram, int(a[0], 0, 63), int(a[1], 0, 31));
    case 'POS': arity(1); return m.screen.pos % 32;
  }
  return fail('SN');
}
