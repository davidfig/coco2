// Builds the game and copies dist/ into the yopeyopey.com repo at play/coco2/,
// where generate/play.js picks it up for the site deploy. The site's games list reads
// games/coco2.yaml in that repo.
// It only copies files. Committing and deploying in that repo stay manual.
//
//   pnpm deploy:site [path-to-yopeyopey.com]   (or set YOPEYOPEY_REPO; defaults to ../yopeyopey.com)

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siteRepo = resolve(process.argv[2] ?? process.env.YOPEYOPEY_REPO ?? join(root, '../yopeyopey.com'))
const target = join(siteRepo, 'play/coco2')

if (!existsSync(join(siteRepo, 'generate/play.js'))) {
  console.error(`${siteRepo} does not look like the yopeyopey.com repo (no generate/play.js).`)
  process.exit(1)
}

// Relative base so the build works from a subfolder (yopeyopey.com/play/coco2/).
execFileSync('pnpm', ['exec', 'tsc', '--noEmit'], { cwd: root, stdio: 'inherit' })
execFileSync('pnpm', ['exec', 'vite', 'build', '--base', './'], { cwd: root, stdio: 'inherit' })

const dist = join(root, 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
if (/(?:src|href)="\//.test(html)) {
  console.error('dist/index.html has absolute asset paths; they will not resolve under /play/coco2/.')
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
cpSync(dist, target, { recursive: true })

console.log(`Copied ${readdirSync(target).length} top-level entries to ${target}`)
console.log(`Next: review and commit in ${siteRepo}, check with \`wrangler dev\`, then deploy.`)
