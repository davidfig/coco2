// Fails when a source file is over the hard line limit; warns over the soft limit. See CLAUDE.md.
import fs from 'fs';
import path from 'path';

const SOFT = 300;
const HARD = 400;

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

let failed = false;
for (const f of walk('src').filter((f) => f.endsWith('.ts'))) {
  const n = fs.readFileSync(f, 'utf8').split('\n').length;
  if (n > HARD) {
    console.error(`FAIL ${f}: ${n} lines (hard limit ${HARD})`);
    failed = true;
  } else if (n > SOFT) {
    console.warn(`warn ${f}: ${n} lines (soft limit ${SOFT})`);
  }
}
process.exit(failed ? 1 : 0);
