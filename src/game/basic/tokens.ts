import { fail } from './values';

/** One piece of a crunched line. `raw` is the untouched rest of a DATA list. */
export type Token =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'id'; v: string }
  | { k: 'kw'; v: string }
  | { k: 'op'; v: string }
  | { k: 'raw'; v: string };

/** Color BASIC 1.2 plus the Extended Color BASIC words this machine knows. */
const WORDS = [
  // statements
  'PRINT', 'INPUT', 'LINE', 'LET', 'IF', 'THEN', 'ELSE', 'GOTO', 'GOSUB', 'RETURN', 'FOR', 'TO', 'STEP', 'NEXT',
  'ON', 'END', 'STOP', 'CONT', 'REM', 'DATA', 'READ', 'RESTORE', 'DIM', 'CLS', 'CLEAR', 'LIST', 'RUN', 'NEW',
  'POKE', 'SOUND', 'SET', 'RESET', 'CSAVE', 'CLOAD', 'SKIPF', 'CHECK', 'TAB', 'NOT', 'AND', 'OR',
  // functions
  'ABS', 'INT', 'FIX', 'SGN', 'SQR', 'SIN', 'COS', 'TAN', 'ATN', 'LOG', 'EXP', 'RND', 'LEN', 'ASC', 'CHR$', 'STR$',
  'VAL', 'LEFT$', 'RIGHT$', 'MID$', 'INSTR', 'STRING$', 'HEX$', 'INKEY$', 'PEEK', 'POINT', 'POS', 'MEM', 'TIMER',
];
const KEYWORDS = [...WORDS].sort((a, b) => b.length - a.length);

/** The keyword starting at `s[i]`, if any. Microsoft BASIC finds them anywhere, even inside a variable name. */
function keywordAt(s: string, i: number): string | null {
  for (const w of KEYWORDS) if (s.startsWith(w, i)) return w;
  return null;
}

const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9';
const isLetter = (c: string | undefined) => c !== undefined && c >= 'A' && c <= 'Z';

/** Upper-case everything outside quotes (the CoCo keyboard types capitals; strings keep what they have). */
export function upperOutsideQuotes(text: string): string {
  let quoted = false;
  let out = '';
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    out += quoted ? ch : ch.toUpperCase();
  }
  return out;
}

/**
 * Crunch a line the way Microsoft BASIC does: keywords are matched greedily wherever they start (so `FORI=1TO10` is
 * FOR I = 1 TO 10, and a variable called SCORE is really SC OR E), spaces only separate, REM and ' end the line, and a
 * DATA list is kept as raw text up to the next colon.
 */
export function crunch(src: string): Token[] {
  const s = upperOutsideQuotes(src);
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '"') {
      let j = s.indexOf('"', i + 1);
      if (j < 0) j = s.length;
      out.push({ k: 'str', v: s.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    if (ch === "'") { out.push({ k: 'kw', v: 'REM' }); break; }
    const kw = keywordAt(s, i);
    if (kw) {
      out.push({ k: 'kw', v: kw });
      i += kw.length;
      if (kw === 'REM') break;
      if (kw === 'DATA') {
        let j = i;
        let quoted = false;
        while (j < s.length && (quoted || s[j] !== ':')) { if (s[j] === '"') quoted = !quoted; j++; }
        out.push({ k: 'raw', v: s.slice(i, j) });
        i = j;
      }
      continue;
    }
    if (isDigit(ch) || (ch === '.' && isDigit(s[i + 1]))) {
      let j = i;
      while (isDigit(s[j])) j++;
      if (s[j] === '.') { j++; while (isDigit(s[j])) j++; }
      if (s[j] === 'E' && (isDigit(s[j + 1]) || ((s[j + 1] === '+' || s[j + 1] === '-') && isDigit(s[j + 2])))) {
        j += 2;
        while (isDigit(s[j])) j++;
      }
      out.push({ k: 'num', v: Number(s.slice(i, j)) });
      i = j;
      continue;
    }
    if (ch === '&' && (s[i + 1] === 'H' || s[i + 1] === 'O')) {
      const hex = s[i + 1] === 'H';
      let j = i + 2;
      while (j < s.length && (hex ? /[0-9A-F]/ : /[0-7]/).test(s[j])) j++;
      out.push({ k: 'num', v: parseInt(s.slice(i + 2, j) || '0', hex ? 16 : 8) });
      i = j;
      continue;
    }
    if (isLetter(ch)) {
      let j = i + 1;
      while (j < s.length && (isLetter(s[j]) || isDigit(s[j])) && !keywordAt(s, j)) j++;
      if (s[j] === '$') j++;
      out.push({ k: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '<>', '=<', '=>', '><'].includes(two)) {
      out.push({ k: 'op', v: two === '=<' ? '<=' : two === '=>' ? '>=' : two === '><' ? '<>' : two });
      i += 2;
      continue;
    }
    out.push({ k: 'op', v: ch });
    i++;
  }
  return out;
}

/** Reads a crunched line one token at a time. */
export class Cursor {
  constructor(readonly toks: Token[], public p = 0) {}

  peek(): Token | undefined {
    return this.toks[this.p];
  }

  next(): Token {
    const t = this.toks[this.p++];
    if (!t) fail('SN');
    return t;
  }

  atEnd(): boolean {
    return this.p >= this.toks.length;
  }

  /** The end of a statement: end of line, a colon, or an ELSE. */
  atStatementEnd(): boolean {
    return this.atEnd() || this.isOp(':') || this.isKw('ELSE');
  }

  isOp(v: string): boolean {
    const t = this.toks[this.p];
    return t !== undefined && t.k === 'op' && t.v === v;
  }

  isKw(v: string): boolean {
    const t = this.toks[this.p];
    return t !== undefined && t.k === 'kw' && t.v === v;
  }

  eatOp(v: string): boolean {
    if (!this.isOp(v)) return false;
    this.p++;
    return true;
  }

  eatKw(v: string): boolean {
    if (!this.isKw(v)) return false;
    this.p++;
    return true;
  }

  expectOp(v: string): void {
    if (!this.eatOp(v)) fail('SN');
  }

  expectKw(v: string): void {
    if (!this.eatKw(v)) fail('SN');
  }

  /** A line number written in the program (GOTO 100). */
  lineNumber(): number {
    const t = this.next();
    if (t.k !== 'num') fail('SN');
    return t.v;
  }
}
