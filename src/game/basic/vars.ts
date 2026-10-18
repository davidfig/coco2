import { Value, fail, int } from './values';

interface BasicArray {
  dims: number[];
  data: Value[];
}

/** A variable reference ready to be assigned to: a name and, for an array element, its subscripts. */
export interface Target {
  name: string;
  index?: number[];
}

/**
 * Variables and arrays. Only the first two letters of a name count (SCORE and SCALE are both SC), `$` makes it a
 * string; arrays live apart from plain variables and spring into being with 11 slots (0–10) per dimension if used
 * without DIM.
 */
export class Vars {
  private readonly scalars = new Map<string, Value>();
  private readonly arrays = new Map<string, BasicArray>();

  static key(name: string): string {
    const isStr = name.endsWith('$');
    return name.replace('$', '').slice(0, 2) + (isStr ? '$' : '');
  }

  static isString(name: string): boolean {
    return name.endsWith('$');
  }

  clear(): void {
    this.scalars.clear();
    this.arrays.clear();
  }

  get(t: Target): Value {
    const isStr = Vars.isString(t.name);
    if (t.index) {
      const a = this.array(t.name, t.index.length);
      return a.data[this.offset(a, t.index)] ?? (isStr ? '' : 0);
    }
    return this.scalars.get(Vars.key(t.name)) ?? (isStr ? '' : 0);
  }

  set(t: Target, v: Value): void {
    if (Vars.isString(t.name) !== (typeof v === 'string')) fail('TM');
    if (typeof v === 'string' && v.length > 255) fail('LS');
    if (t.index) {
      const a = this.array(t.name, t.index.length);
      a.data[this.offset(a, t.index)] = v;
    } else this.scalars.set(Vars.key(t.name), v);
  }

  dim(name: string, sizes: number[]): void {
    const key = Vars.key(name);
    if (this.arrays.has(key)) fail('DD');
    const dims = sizes.map((s) => int(s, 0, 32767) + 1);
    const total = dims.reduce((a, b) => a * b, 1);
    if (total > 32767) fail('OM');
    this.arrays.set(key, { dims, data: new Array(total) });
  }

  private array(name: string, rank: number): BasicArray {
    const key = Vars.key(name);
    if (!this.arrays.has(key)) this.dim(name, new Array(rank).fill(10));
    const a = this.arrays.get(key)!;
    if (a.dims.length !== rank) fail('BS');
    return a;
  }

  private offset(a: BasicArray, index: number[]): number {
    let off = 0;
    index.forEach((i, d) => {
      const n = Math.floor(i);
      if (n < 0 || n >= a.dims[d]) fail('BS');
      off = off * a.dims[d] + n;
    });
    return off;
  }
}
