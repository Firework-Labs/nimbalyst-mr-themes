#!/usr/bin/env node
/**
 * mrthemes — command-line tool for Mr. Themes Toolkit.
 *
 * Pure Node ESM, no dependencies. Imports the built library at
 * ../lib/mr-themes-core.mjs (run `node ../build.mjs` first, or from the repo
 * root: `node build.mjs`, if that file is missing or stale).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const libPath = path.join(root, 'lib/mr-themes-core.mjs');

if (!fs.existsSync(libPath)) {
  console.error(`Missing ${path.relative(process.cwd(), libPath)}. Run "node build.mjs" from ${root} first.`);
  process.exit(1);
}

const MrThemes = await import(libPath);
const {
  COLOR_HUES, NEUTRAL_HUES, HUES, generateFamilyThemes, normalizeFamily, serializeFamilyFile,
  parseImport, serializeThemeFile, fixContrast, fullAudit, familyAudit, summarize,
  slugify, CORE_KEYS, EXTENDED_KEYS,
} = MrThemes;

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`mrthemes — design, check, and export Nimbalyst color themes for Mr. Themes.

Usage:
  mrthemes hues
  mrthemes generate --name "Tidepool" [--id tidepool] --dominant sky --pops cyan,indigo,amber,rose --neutral slate [--description "..."] [--out work/<id>.nimfamily]
  mrthemes audit <file> [--json] [--all]
  mrthemes fix <file> [--out <path>]
  mrthemes validate <file>
  mrthemes preview <file>
  mrthemes export <file> --out <path>
  mrthemes help

Files:
  *.nimtheme   one theme
  *.nimfamily  a family (id, name, generator) plus its six theme variants

"export" is the canonical re-serialization to hand to a human for
Theme Gallery -> Import themes in the Mr. Themes extension.`);
}

/** Parse `--flag value` and `--flag=value` pairs plus bare positional args. */
function parseArgs(rest) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        opts[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (rest[i + 1] !== undefined && !rest[i + 1].startsWith('--')) {
        opts[a.slice(2)] = rest[++i];
      } else {
        opts[a.slice(2)] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { opts, positional };
}

function readFile(file) {
  return fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
}

function writeFile(file, contents) {
  const p = path.resolve(process.cwd(), file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, contents);
  return p;
}

function loadImport(file) {
  const raw = readFile(file);
  return parseImport(raw);
}

// --- hues --------------------------------------------------------------

function cmdHues() {
  console.log('Color hues:');
  console.log('  ' + COLOR_HUES.join(', '));
  console.log('Neutral hues:');
  console.log('  ' + NEUTRAL_HUES.join(', '));
}

// --- generate ------------------------------------------------------------

function cmdGenerate(rest) {
  const { opts } = parseArgs(rest);
  if (!opts.name || !opts.dominant || !opts.neutral) {
    console.error('generate requires --name, --dominant, and --neutral (and usually --pops)');
    process.exit(1);
  }
  const dominant = opts.dominant;
  const neutral = opts.neutral;
  const pops = typeof opts.pops === 'string' ? opts.pops.split(',').map((s) => s.trim()).filter(Boolean) : [];
  for (const h of [dominant, neutral, ...pops]) {
    if (!HUES.includes(h)) {
      console.error(`Unknown hue "${h}". Run "mrthemes hues" to list valid hues.`);
      process.exit(1);
    }
  }
  const id = opts.id ? slugify(String(opts.id)) : slugify(String(opts.name));
  const family = normalizeFamily({
    id,
    name: opts.name,
    description: opts.description,
    generator: { dominant, pops, neutral },
  });
  const themes = generateFamilyThemes(family);
  if (!themes.length) {
    console.error('Failed to generate themes (generator invalid?)');
    process.exit(1);
  }
  const out = typeof opts.out === 'string' ? opts.out : `work/${id}.nimfamily`;
  const written = writeFile(out, serializeFamilyFile(family, themes));
  console.log(`Wrote ${themes.length} themes to ${written}`);
  for (const t of themes) console.log(`  ${t.id}  (${t.faction}, ${t.variation})`);
}

// --- audit -----------------------------------------------------------------

function fmtCheck(c) {
  const ratio = c.ratio !== undefined ? c.ratio.toFixed(2) : '-';
  const target = c.target !== undefined ? String(c.target) : '-';
  const sev = c.severity.toUpperCase().padEnd(4);
  const note = c.note ? `  (${c.note})` : '';
  return `  [${sev}] ${c.id.padEnd(28)} ${c.label.padEnd(38)} ${ratio}/${target}${note}`;
}

function cmdAudit(rest) {
  const [file] = rest.filter((a) => !a.startsWith('--'));
  if (!file) {
    console.error('audit requires a file');
    process.exit(1);
  }
  const { opts } = parseArgs(rest);
  const { family, themes } = loadImport(file);
  let anyFail = false;
  const jsonOut = { file, family: family ?? null, themes: [] };

  for (const t of themes) {
    const checks = fullAudit(t);
    const s = summarize(checks);
    if (s.fail > 0) anyFail = true;
    const shown = opts.all ? checks : checks.filter((c) => c.severity !== 'pass');
    if (opts.json) {
      jsonOut.themes.push({ id: t.id, name: t.name, summary: s, checks: shown });
      continue;
    }
    console.log(`\n${t.name} (${t.id})  pass=${s.pass} warn=${s.warn} fail=${s.fail}`);
    for (const c of shown) console.log(fmtCheck(c));
  }

  if (themes.length > 1 || family) {
    const fam = familyAudit(themes);
    const s = summarize(fam);
    if (s.fail > 0) anyFail = true;
    const shown = opts.all ? fam : fam.filter((c) => c.severity !== 'pass');
    if (opts.json) {
      jsonOut.familySummary = s;
      jsonOut.familyChecks = shown;
    } else {
      console.log(`\nFamily audit  pass=${s.pass} warn=${s.warn} fail=${s.fail}`);
      for (const c of shown) console.log(fmtCheck(c));
    }
  }

  if (opts.json) console.log(JSON.stringify(jsonOut, null, 2));
  if (anyFail) process.exit(1);
}

// --- fix ---------------------------------------------------------------

function cmdFix(rest) {
  const [file] = rest.filter((a) => !a.startsWith('--'));
  if (!file) {
    console.error('fix requires a file');
    process.exit(1);
  }
  const { opts } = parseArgs(rest);
  const { family, themes } = loadImport(file);
  const fixedThemes = [];
  for (const t of themes) {
    const { theme: fixed, changed } = fixContrast(t);
    fixedThemes.push(fixed);
    console.log(`${t.id}: ${changed.length ? `changed ${changed.join(', ')}` : 'no changes needed'}`);
  }
  const out = typeof opts.out === 'string' ? opts.out : file;
  const contents = family
    ? serializeFamilyFile(family, fixedThemes)
    : serializeThemeFile(fixedThemes[0]);
  const written = writeFile(out, contents);
  console.log(`Wrote ${written}`);
}

// --- validate ------------------------------------------------------------

function cmdValidate(rest) {
  const [file] = rest.filter((a) => !a.startsWith('--'));
  if (!file) {
    console.error('validate requires a file');
    process.exit(1);
  }
  try {
    const { family, themes } = loadImport(file);
    console.log(`OK: ${file}`);
    console.log(`  family: ${family ? `${family.name} (${family.id})${family.generator ? ` [generator: ${family.generator.dominant} / ${family.generator.pops.join(',')} / ${family.generator.neutral}]` : ''}` : 'none'}`);
    console.log(`  themes: ${themes.length}`);
    for (const t of themes) {
      const explicitCore = CORE_KEYS.filter((k) => t.colors[k] !== undefined);
      const explicitExt = EXTENDED_KEYS.filter((k) => t.extended?.[k] !== undefined);
      const derivedExt = EXTENDED_KEYS.filter((k) => t.extended?.[k] === undefined);
      console.log(`  - ${t.id} (${t.name}): isDark=${t.isDark} core set=${explicitCore.length}/${CORE_KEYS.length} extended explicit=${explicitExt.length} derived=${derivedExt.length}`);
    }
  } catch (e) {
    console.error(`Parse error: ${e.message}`);
    process.exit(1);
  }
}

// --- preview -------------------------------------------------------------

function cmdPreview(rest) {
  const [file] = rest.filter((a) => !a.startsWith('--'));
  if (!file) {
    console.error('preview requires a file');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), file);
  const { family, themes } = loadImport(file);
  const data = {
    source: abs,
    family: family ?? null,
    themes,
    generatedAt: new Date().toISOString(),
  };
  const written = writeFile('preview/data/current.js', `window.MR_THEMES_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log(`Wrote ${written}`);
  console.log(`Preview page: ${path.join(root, 'preview/index.html')}`);
}

// --- export ----------------------------------------------------------------

function cmdExport(rest) {
  const [file] = rest.filter((a) => !a.startsWith('--'));
  const { opts } = parseArgs(rest);
  if (!file || !opts.out) {
    console.error('export requires a file and --out <path>');
    process.exit(1);
  }
  const { family, themes } = loadImport(file);
  const contents = family || themes.length > 1
    ? serializeFamilyFile(family ?? normalizeFamily({ id: themes[0].family ?? 'family', name: themes[0].family ?? 'Family' }), themes)
    : serializeThemeFile(themes[0]);
  const written = writeFile(opts.out, contents);
  console.log(`Exported ${themes.length} theme(s) to ${written}`);
}

// --- dispatch --------------------------------------------------------------

switch (cmd) {
  case 'hues':
    cmdHues();
    break;
  case 'generate':
    cmdGenerate(args.slice(1));
    break;
  case 'audit':
    cmdAudit(args.slice(1));
    break;
  case 'fix':
    cmdFix(args.slice(1));
    break;
  case 'validate':
    cmdValidate(args.slice(1));
    break;
  case 'preview':
    cmdPreview(args.slice(1));
    break;
  case 'export':
    cmdExport(args.slice(1));
    break;
  case 'help':
  case undefined:
  case '--help':
  case '-h':
    usage();
    break;
  default:
    console.error(`Unknown command "${cmd}"\n`);
    usage();
    process.exit(1);
}
