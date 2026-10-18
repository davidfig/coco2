// Runs every src/**/*.test.ts in Node, loaded through Vite (TypeScript, `?raw` imports) with no page and no GPU.
// `pnpm test` runs them all; `pnpm test ADVENT` only the cases whose name contains "ADVENT". See src/test/check.ts.
import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';

// The tape keeps CSAVEs in localStorage: give each run an empty one in memory, so tests leave nothing behind.
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
  },
});

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
let failed = 1;
try {
  const check = await server.ssrLoadModule('/src/test/check.ts');
  for (const f of walk('src').filter((f) => f.endsWith('.test.ts')).sort()) {
    check.setFile(path.relative('src', f));
    await server.ssrLoadModule('/' + f.split(path.sep).join('/'));
  }
  failed = await check.run(process.argv[2] ?? '');
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
