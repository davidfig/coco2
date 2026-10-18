import { Token, crunch, upperOutsideQuotes } from './tokens';
import { fail } from './values';

/** One numbered line: as typed (for LIST) and crunched (to run). */
export interface Line {
  num: number;
  text: string;
  toks: Token[];
}

/** One item of a DATA list and the line it's on. */
export interface DataItem {
  text: string;
  quoted: boolean;
  line: number;
}

export const MAX_LINE_NUMBER = 63999;

/** The program in memory: numbered lines kept in order. */
export class Program {
  lines: Line[] = [];
  private data: DataItem[] | null = null;

  /** Store a line, replacing any with the same number; empty text deletes it (?UL if there's nothing to delete). */
  set(num: number, text: string): void {
    if (num > MAX_LINE_NUMBER) fail('SN');
    const at = this.lines.findIndex((l) => l.num >= num);
    const same = at >= 0 && this.lines[at].num === num;
    this.data = null;
    if (text.trim() === '') {
      if (!same) fail('UL');
      this.lines.splice(at, 1);
      return;
    }
    const clean = upperOutsideQuotes(text.replace(/^ +/, ''));
    const line = { num, text: clean, toks: crunch(clean) };
    if (same) this.lines[at] = line;
    else if (at < 0) this.lines.push(line);
    else this.lines.splice(at, 0, line);
  }

  clear(): void {
    this.lines = [];
    this.data = null;
  }

  /** The index of line `num`, or -1. */
  index(num: number): number {
    return this.lines.findIndex((l) => l.num === num);
  }

  /** The index of the first line numbered `num` or later, or -1. */
  indexFrom(num: number): number {
    return this.lines.findIndex((l) => l.num >= num);
  }

  /** LIST: the lines from `from` to `to` (inclusive) as text. */
  list(from = 0, to = MAX_LINE_NUMBER): string[] {
    return this.lines.filter((l) => l.num >= from && l.num <= to).map((l) => `${l.num} ${l.text}`);
  }

  /** The whole program as text, one line each (for the cassette). */
  save(): string {
    return this.list().join('\n');
  }

  load(text: string): void {
    this.clear();
    for (const row of text.split('\n')) {
      const m = /^\s*(\d+)(.*)$/.exec(row);
      if (m && m[2].trim()) this.set(Number(m[1]), m[2]);
    }
  }

  /** Rough size in bytes, for MEM: crunched lines are about 5 bytes of overhead plus their text. */
  bytes(): number {
    return this.lines.reduce((sum, l) => sum + 5 + l.text.length, 0);
  }

  /** Every DATA item in the program, in order (worked out once per edit). */
  dataItems(): DataItem[] {
    if (this.data) return this.data;
    const out: DataItem[] = [];
    for (const l of this.lines) {
      l.toks.forEach((t, i) => {
        const raw = l.toks[i + 1];
        if (t.k !== 'kw' || t.v !== 'DATA' || !raw || raw.k !== 'raw') return;
        for (const item of splitList(raw.v)) out.push({ ...item, line: l.num });
      });
    }
    this.data = out;
    return out;
  }
}

/** Split a DATA list or an INPUT reply at commas; "quoted" items keep their commas and spaces. */
export function splitList(text: string): { text: string; quoted: boolean }[] {
  const out: { text: string; quoted: boolean }[] = [];
  let i = 0;
  for (;;) {
    while (text[i] === ' ') i++;
    if (text[i] === '"') {
      const end = text.indexOf('"', i + 1);
      const stop = end < 0 ? text.length : end;
      out.push({ text: text.slice(i + 1, stop), quoted: true });
      i = stop + 1;
      while (i < text.length && text[i] !== ',') i++;
    } else {
      let j = text.indexOf(',', i);
      if (j < 0) j = text.length;
      out.push({ text: text.slice(i, j).trim(), quoted: false });
      i = j;
    }
    if (text[i] !== ',') return out;
    i++;
  }
}
