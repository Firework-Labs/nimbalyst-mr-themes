#!/usr/bin/env node
/**
 * Builds lib/mr-themes-core.js (browser IIFE, global `MrThemes`) and
 * lib/mr-themes-core.mjs (platform-neutral ESM) from src/core.ts.
 *
 * Both lib/ files are committed artifacts — run this to refresh them after
 * editing src/, or after the Theme Editor's source (which this toolkit
 * imports from, never modifies) changes underneath it. Uses the esbuild
 * already installed in the extension's node_modules (repo root); this toolkit
 * has no node_modules of its own and nothing is npm-installed for it.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeEditorDir = path.resolve(__dirname, '..');
const require = createRequire(path.join(themeEditorDir, 'package.json'));

let esbuild;
try {
  esbuild = require('esbuild');
} catch (e) {
  console.error(`Could not resolve esbuild from ${themeEditorDir}/node_modules. Run "npm install" there first (do not npm install here).`);
  throw e;
}

const entry = path.join(__dirname, 'src/core.ts');
const outIife = path.join(__dirname, 'lib/mr-themes-core.js');
const outEsm = path.join(__dirname, 'lib/mr-themes-core.mjs');

async function build() {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    globalName: 'MrThemes',
    platform: 'browser',
    target: 'es2020',
    outfile: outIife,
    logLevel: 'info',
  });

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    outfile: outEsm,
    logLevel: 'info',
  });

  console.log(`Built:\n  ${path.relative(__dirname, outIife)}\n  ${path.relative(__dirname, outEsm)}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
