#!/usr/bin/env node
/**
 * Builds screenshots/harness/dist/harness.js from harness.tsx.
 *
 * Uses esbuild's JS API (not the CLI) only because the CLI has no equivalent
 * of `alias`, which is needed here: @nimbalyst/extension-sdk's root barrel
 * (dist/index.js) statically pulls in @nimbalyst/runtime, yjs and
 * y-protocols/awareness for features Mr. Themes never uses (Monaco host
 * component, tracker reference chips, the collab editor hook). Those
 * packages are not installed (and are out of scope to add), so the three
 * imports are aliased to tiny local stubs (./stubs/) that only need to exist,
 * never to do anything, for the module graph to resolve in a plain browser
 * bundle. See stubs/*.ts for details.
 *
 * `../kit` (imported by src/components/ThemeLibraryPanel.tsx) needs the same
 * treatment but can't go through `alias`, which rejects relative specifiers
 * ("Invalid alias name"): it's swapped for stubs/kit.ts by a one-off
 * onResolve plugin instead. The real src/kit.ts calls Vite's
 * `import.meta.glob(...)` at module load to embed the Family Builder Kit's
 * files as text; esbuild leaves `import.meta` empty in an iife bundle, so
 * that call would throw and crash the whole gallery panel on import.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const stub = (name) => path.join(here, 'stubs', name);

/** Redirects the one `import ... from '../kit'` to stubs/kit.ts (see header comment). */
const kitStubPlugin = {
  name: 'kit-stub',
  setup(b) {
    b.onResolve({ filter: /^\.\.\/kit$/ }, () => ({ path: stub('kit.ts') }));
  },
};

await build({
  entryPoints: [path.join(here, 'harness.tsx')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.nimtheme': 'json' },
  alias: {
    '@nimbalyst/runtime': stub('nimbalyst-runtime.ts'),
    yjs: stub('yjs.ts'),
    'y-protocols/awareness': stub('y-protocols-awareness.ts'),
  },
  plugins: [kitStubPlugin],
  outfile: path.join(here, 'dist', 'harness.js'),
  logLevel: 'info',
});

console.log('Built screenshots/harness/dist/harness.js');
