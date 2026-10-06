/**
 * Copy the Family Builder Kit (the distributable part of ../toolkit)
 * into ./kit, which src/kit.ts bundles so the Theme Gallery can write it into
 * a project ("Download Family Builder Kit for Agents").
 *
 * Only what an agent needs ships: the guide, reference docs, templates, the
 * prebuilt library, the CLI, and the preview pages. The toolkit's src/ and
 * build.mjs stay behind (they import this extension's sources), as do its
 * work/ outputs and preview/data/current.js (the CLI writes that per run).
 *
 * Run after changing the toolkit: `npm run sync-kit` (also part of `npm run build`).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'toolkit');
const OUT = join(here, '..', 'kit');
const INCLUDE = ['AGENT.md', 'README.md', 'reference', 'templates', 'lib', 'cli', 'preview'];
const SKIP = new Set(['preview/data']);

if (!existsSync(SRC)) {
  // Building from a checkout without the toolkit next to it: keep the committed kit/.
  console.warn(`sync-kit: ${SRC} not found; keeping the existing kit/ (${existsSync(OUT) ? 'present' : 'MISSING: the download button will write nothing'}).`);
  process.exit(0);
}

rmSync(OUT, { recursive: true, force: true });
let n = 0;
const copy = (rel) => {
  if (SKIP.has(rel) || rel.split('/').some((p) => p.startsWith('.'))) return;
  const from = join(SRC, rel);
  if (statSync(from).isDirectory()) {
    for (const e of readdirSync(from)) copy(relative(SRC, join(from, e)));
    return;
  }
  mkdirSync(dirname(join(OUT, rel)), { recursive: true });
  cpSync(from, join(OUT, rel));
  n++;
};
for (const rel of INCLUDE) copy(rel);
console.log(`sync-kit: copied ${n} files into kit/`);
