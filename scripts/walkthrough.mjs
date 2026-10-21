// Plays the whole game headlessly and writes what happened to docs/walkthrough.md (src/game/debug/walkthrough.ts).
// `pnpm walkthrough`; run it again after changing a tape, a rule, a story timer or a note, and read the diff.
import fs from 'fs';
import { createServer } from 'vite';

// The game keeps its saves in localStorage: an empty one in memory, as the tests have.
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

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { walkthrough } = await server.ssrLoadModule('/src/game/debug/walkthrough.ts');
  fs.writeFileSync('docs/walkthrough.md', walkthrough() + '\n');
  console.log('wrote docs/walkthrough.md');
} finally {
  await server.close();
}
