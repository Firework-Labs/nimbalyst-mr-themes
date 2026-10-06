#!/usr/bin/env node
/**
 * Smoke test for the preview pages' data path.
 *
 * Does NOT render any HTML/CSS/DOM — it only proves the two things every
 * preview page depends on:
 *   1. `lib/mr-themes-core.js` (the browser IIFE) loads and exposes every
 *      function/constant `preview.js` and the per-page scripts call on
 *      `MrThemes`.
 *   2. Whatever `preview/data/current.js` currently holds (or, if absent,
 *      the same demo fallback `preview.js` uses) resolves to all 75 CSS
 *      variables per theme and produces a well-formed audit.
 *
 * It does not claim the pages render correctly in a browser — only that the
 * data they're fed is structurally sound. Run: `node preview/smoke.mjs`.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
}

// --- Load lib/mr-themes-core.js and (if present) preview/data/current.js
// into one vm context, the same way a <script> tag would. ---------------

const libPath = path.join(root, 'lib/mr-themes-core.js');
if (!fs.existsSync(libPath)) {
  console.error(`Missing ${libPath} — run "node build.mjs" first.`);
  process.exit(1);
}

const context = {};
context.window = context; // so `window.X = ...` in current.js also lands on `context`
context.console = console;
vm.createContext(context);

vm.runInContext(fs.readFileSync(libPath, 'utf8'), context, { filename: libPath });

const dataPath = path.join(__dirname, 'data/current.js');
let hasData = false;
if (fs.existsSync(dataPath)) {
  vm.runInContext(fs.readFileSync(dataPath, 'utf8'), context, { filename: dataPath });
  hasData = Array.isArray(context.MR_THEMES_DATA?.themes) && context.MR_THEMES_DATA.themes.length > 0;
}

const MrThemes = context.MrThemes;
check('lib/mr-themes-core.js exposes global MrThemes', !!MrThemes);
if (!MrThemes) process.exit(1);

// --- Every function/constant the preview pages call on MrThemes ---------

const REQUIRED = [
  'resolveTheme', 'fullAudit', 'familyAudit', 'summarize', 'BUILTIN_FAMILIES',
  'generateFamilyThemes', 'GROUPS', 'LABELS', 'CORE_KEYS', 'EXTENDED_KEYS',
  'cssVar', 'contrastRatio', 'parseImport',
];
for (const name of REQUIRED) {
  check(`MrThemes.${name} exists`, MrThemes[name] !== undefined);
}

const EXPECTED_VAR_COUNT = MrThemes.CORE_KEYS.length + MrThemes.EXTENDED_KEYS.length;
check(`CORE_KEYS + EXTENDED_KEYS = 75 (got ${EXPECTED_VAR_COUNT})`, EXPECTED_VAR_COUNT === 75);

// --- Data: current.js if present and non-empty, else the same demo fallback
// preview.js falls back to. -----------------------------------------------

let themes;
let source;
if (hasData) {
  themes = context.MR_THEMES_DATA.themes;
  source = context.MR_THEMES_DATA.source;
  console.log(`\nUsing preview/data/current.js (${source}), ${themes.length} theme(s).`);
} else {
  const demoFamily = MrThemes.BUILTIN_FAMILIES[0];
  themes = MrThemes.generateFamilyThemes(demoFamily);
  source = null;
  console.log(`\npreview/data/current.js absent or empty — using demo fallback (${demoFamily.name}), ${themes.length} theme(s).`);
}
check('at least one theme is available', themes.length > 0);

for (const theme of themes) {
  const resolved = MrThemes.resolveTheme(theme);
  const varCount = Object.keys(resolved.vars).length;
  check(`${theme.id}: resolveTheme() produces 75 vars (got ${varCount})`, varCount === 75);

  const checks = MrThemes.fullAudit(theme);
  check(`${theme.id}: fullAudit() returns checks`, Array.isArray(checks) && checks.length > 0);
  const summary = MrThemes.summarize(checks);
  const total = summary.pass + summary.warn + summary.fail;
  check(`${theme.id}: summarize() accounts for every check (${total}/${checks.length})`, total === checks.length);
}

if (themes.length > 1) {
  const famChecks = MrThemes.familyAudit(themes);
  check('familyAudit() returns checks for a multi-theme set', Array.isArray(famChecks));
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
