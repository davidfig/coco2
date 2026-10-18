/** A BASIC value: numbers are floats, strings are up to 255 characters (char codes 0–255). */
export type Value = number | string;

/**
 * Color BASIC's two-letter error codes: SN syntax, NF NEXT without FOR, RG RETURN without GOSUB, OD out of data,
 * FC illegal function call, OV overflow, OM out of memory, UL undefined line, BS bad subscript, DD redimensioned
 * array, /0 division by zero, ID illegal direct, TM type mismatch, LS string too long, CN can't continue, IO tape error.
 */
export type ErrorCode = 'SN' | 'NF' | 'RG' | 'OD' | 'FC' | 'OV' | 'OM' | 'UL' | 'BS' | 'DD' | '/0' | 'ID' | 'TM' | 'LS' | 'CN' | 'IO';

export class BasicError extends Error {
  constructor(readonly code: ErrorCode) {
    super(`?${code} ERROR`);
  }
}

export function fail(code: ErrorCode): never {
  throw new BasicError(code);
}

export function num(v: Value): number {
  if (typeof v !== 'number') fail('TM');
  if (!Number.isFinite(v)) fail('OV');
  return v;
}

export function str(v: Value): string {
  if (typeof v !== 'string') fail('TM');
  if (v.length > 255) fail('LS');
  return v;
}

/** A number as a whole number in [min, max] (BASIC truncates toward minus infinity), else ?FC. */
export function int(v: Value, min = -32768, max = 65535): number {
  const n = Math.floor(num(v));
  if (n < min || n > max) fail('FC');
  return n;
}

/**
 * A number the way Microsoft BASIC writes it: up to 9 significant digits, no leading zero (.5), and E notation from
 * 1E+09 up or below .01 (1E-03).
 */
export function formatNumber(n: number): string {
  if (n === 0) return '0';
  const [mant, expText] = Math.abs(n).toExponential(8).split('e');
  const e = Number(expText);
  const digits = mant.replace('.', '').replace(/0+$/, '');
  let s: string;
  if (e >= 9 || e < -2) {
    s = digits[0] + (digits.length > 1 ? '.' + digits.slice(1) : '') + 'E' + (e < 0 ? '-' : '+') + String(Math.abs(e)).padStart(2, '0');
  } else if (e < 0) s = '.' + '0'.repeat(-e - 1) + digits;
  else if (digits.length <= e + 1) s = digits + '0'.repeat(e + 1 - digits.length);
  else s = digits.slice(0, e + 1) + '.' + digits.slice(e + 1);
  return (n < 0 ? '-' : '') + s;
}

/** STR$: a leading space where the minus sign would go. */
export function strNumber(n: number): string {
  return (n >= 0 ? ' ' : '') + formatNumber(n);
}

/** VAL: the number at the start of a string (spaces ignored), 0 if there isn't one. */
export function parseNumberPrefix(s: string): number {
  const m = /^[+-]?(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/i.exec(s.replace(/ /g, ''));
  return m ? Number(m[0]) || 0 : 0;
}

/** Is this exactly a number, as INPUT wants one typed? */
export function isNumberText(s: string): boolean {
  return /^[+-]?(\d+\.?\d*|\.\d+)(E[+-]?\d+)?$/i.test(s);
}
