import { callFunction } from './functions';
import type { Machine } from './machine';
import { Cursor } from './tokens';
import { Target } from './vars';
import { Value, fail, num, str } from './values';

/**
 * Expressions, with Microsoft's precedence from loosest to tightest: OR, AND, NOT, relations (= <> < > <= >=),
 * + -, * /, unary minus, ^. Relations give -1 for true and 0 for false; AND, OR and NOT work on 16-bit integers.
 */
export function evaluate(m: Machine, c: Cursor): Value {
  let a = andLevel(m, c);
  while (c.eatKw('OR')) a = bits(a) | bits(andLevel(m, c));
  return a;
}

export function evalNum(m: Machine, c: Cursor): number {
  return num(evaluate(m, c));
}

export function evalStr(m: Machine, c: Cursor): string {
  return str(evaluate(m, c));
}

function bits(v: Value): number {
  const n = Math.floor(num(v));
  if (n < -32768 || n > 32767) fail('FC');
  return n;
}

function andLevel(m: Machine, c: Cursor): Value {
  let a = notLevel(m, c);
  while (c.eatKw('AND')) a = bits(a) & bits(notLevel(m, c));
  return a;
}

function notLevel(m: Machine, c: Cursor): Value {
  if (c.eatKw('NOT')) return ~bits(notLevel(m, c));
  return relation(m, c);
}

const RELATIONS = ['=', '<>', '<', '>', '<=', '>='];

function relation(m: Machine, c: Cursor): Value {
  let a = sum(m, c);
  for (;;) {
    const t = c.peek();
    if (!t || t.k !== 'op' || !RELATIONS.includes(t.v)) return a;
    c.p++;
    const b = sum(m, c);
    if (typeof a !== typeof b) fail('TM');
    const cmp = a < b ? -1 : a > b ? 1 : 0;
    const yes = t.v === '=' ? cmp === 0 : t.v === '<>' ? cmp !== 0 : t.v === '<' ? cmp < 0 : t.v === '>' ? cmp > 0 : t.v === '<=' ? cmp <= 0 : cmp >= 0;
    a = yes ? -1 : 0;
  }
}

function sum(m: Machine, c: Cursor): Value {
  let a = product(m, c);
  for (;;) {
    if (c.eatOp('+')) {
      const b = product(m, c);
      if (typeof a === 'string') {
        a = a + str(b);
        if (a.length > 255) fail('LS');
      } else a = checked(a + num(b));
    } else if (c.eatOp('-')) a = checked(num(a) - num(product(m, c)));
    else return a;
  }
}

function product(m: Machine, c: Cursor): Value {
  let a = unary(m, c);
  for (;;) {
    if (c.eatOp('*')) a = checked(num(a) * num(unary(m, c)));
    else if (c.eatOp('/')) {
      const b = num(unary(m, c));
      if (b === 0) fail('/0');
      a = checked(num(a) / b);
    } else return a;
  }
}

function unary(m: Machine, c: Cursor): Value {
  if (c.eatOp('-')) return -num(unary(m, c));
  if (c.eatOp('+')) return num(unary(m, c));
  return power(m, c);
}

function power(m: Machine, c: Cursor): Value {
  let a = primary(m, c);
  while (c.eatOp('^')) {
    const b = c.eatOp('-') ? -num(primary(m, c)) : num(primary(m, c));
    const base = num(a);
    if (base < 0 && b !== Math.floor(b)) fail('FC');
    if (base === 0 && b < 0) fail('/0');
    a = checked(Math.pow(base, b));
  }
  return a;
}

function checked(n: number): number {
  if (!Number.isFinite(n) || Math.abs(n) > 1.7e38) fail('OV');
  return n;
}

function primary(m: Machine, c: Cursor): Value {
  const t = c.next();
  switch (t.k) {
    case 'num': return t.v;
    case 'str': return t.v;
    case 'id':
      c.p--;
      return m.vars.get(target(m, c));
    case 'kw': return callFunction(m, t.v, c);
    case 'op':
      if (t.v === '(') {
        const v = evaluate(m, c);
        c.expectOp(')');
        return v;
      }
  }
  return fail('SN');
}

/** A variable or array element named at the cursor (subscripts evaluated now). */
export function target(m: Machine, c: Cursor): Target {
  const t = c.next();
  if (t.k !== 'id') fail('SN');
  if (!c.eatOp('(')) return { name: t.v };
  const index = [evalNum(m, c)];
  while (c.eatOp(',')) index.push(evalNum(m, c));
  c.expectOp(')');
  return { name: t.v, index };
}

/** "(" expr {, expr} ")": a function's arguments. */
export function args(m: Machine, c: Cursor): Value[] {
  c.expectOp('(');
  const out = [evaluate(m, c)];
  while (c.eatOp(',')) out.push(evaluate(m, c));
  c.expectOp(')');
  return out;
}
