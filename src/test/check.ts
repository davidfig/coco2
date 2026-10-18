/**
 * The smallest test kit: `test` registers, `expect` throws on a mismatch, and `scripts/test.mjs` runs every
 * `src/**\/*.test.ts` through Vite in Node. No test framework, as the project has no runtime dependencies.
 */
interface Case {
  name: string;
  fn: () => void | Promise<void>;
}

const cases: Case[] = [];
let file = '';

export function test(name: string, fn: Case['fn']): void {
  cases.push({ name: file ? `${file} › ${name}` : name, fn });
}

/** Set by the runner before it loads each test file, so failures say where they came from. */
export function setFile(name: string): void {
  file = name;
}

const show = (v: unknown): string => (typeof v === 'string' ? JSON.stringify(v) : Array.isArray(v) ? `[${v.map(show).join(', ')}]` : String(v));

export function expect<T>(actual: T) {
  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  const text = (): string => (Array.isArray(actual) ? actual.join('\n') : String(actual));
  return {
    toBe(want: T): void {
      if (actual !== want) fail(`expected ${show(want)}, got ${show(actual)}`);
    },
    toEqual(want: T): void {
      if (JSON.stringify(actual) !== JSON.stringify(want)) fail(`expected ${show(want)}, got ${show(actual)}`);
    },
    /** For strings, and for arrays of lines (searched as one text). */
    toContain(part: string): void {
      if (!text().includes(part)) fail(`expected to contain ${show(part)}, got:\n${text()}`);
    },
    notToContain(part: string): void {
      if (text().includes(part)) fail(`expected not to contain ${show(part)}, got:\n${text()}`);
    },
  };
}

/** Run every registered case whose name includes `filter`; prints a line each and returns how many failed. */
export async function run(filter = ''): Promise<number> {
  let failed = 0;
  let passed = 0;
  for (const c of cases.filter((c) => c.name.includes(filter))) {
    try {
      await c.fn();
      passed++;
      console.log(`  ok  ${c.name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL  ${c.name}\n      ${(e instanceof Error ? e.message : String(e)).replace(/\n/g, '\n      ')}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  return failed;
}
