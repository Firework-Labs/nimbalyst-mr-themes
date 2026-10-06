// Builds one .nimfamily per uicolors palette (work/uicolors-palettes.json).
// The kit's generator only knows Tailwind hue names, so each uicolors ramp is
// registered in the (exported, mutable) TAILWIND table under a `uic-` prefix
// and passed to generateFamilyThemes like a built-in hue. Status colors are
// hard-wired to emerald/amber/red inside the generator, so a family that brings
// its own status ramps swaps them in for its own run and restores them after.
//
//   node work/build-families.mjs            # writes work/<id>.nimfamily
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TAILWIND, generateFamilyThemes, serializeFamilyFile, fullAudit, contrastRatio, mix,
} from '../lib/mr-themes-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'uicolors-palettes.json'), 'utf8'));

const ramps = {};
for (const pal of Object.values(data.palettes))
  for (const [name, { ramp }] of Object.entries(pal))
    if (Array.isArray(ramp)) ramps[name] = ramp.map((c) => c.toLowerCase());
for (const [name, ramp] of Object.entries(ramps)) TAILWIND[`uic-${name}`] = ramp;
const u = (name) => (TAILWIND[name] ? name : `uic-${name}`);

// dominant = the palette's primary; pops = [links, info, code-variable, code-property + juicy highlight].
// Borrowed hues (from other palettes or Tailwind) are marked in `borrowed`.
const FAMILIES = [
  { id: 'reef', name: 'Reef', palette: 'Palette 1',
    description: 'Tropical shallows: turquoise with orchid and clay.',
    dominant: 'bright-turquoise', pops: ['carissma', 'cornflower-blue', 'tumbleweed', 'golden-grass'], neutral: 'gray',
    borrowed: ['cornflower-blue', 'golden-grass'] },
  { id: 'nautical', name: 'Nautical', palette: 'Palette 2',
    description: 'Night watch: sea blue with sea glass, cornflower and brass.',
    dominant: 'viking', pops: ['riptide', 'cornflower-blue', 'golden-grass', 'carissma'], neutral: 'slate',
    borrowed: ['golden-grass', 'carissma'] },
  { id: 'desert', name: 'Desert', palette: 'Palette 3',
    description: 'Sun on sandstone: wheat with melon, sage and saffron.',
    dominant: 'wheat', pops: ['melon', 'deco', 'golden-grass', 'tumbleweed'], neutral: 'stone',
    borrowed: ['golden-grass', 'tumbleweed'] },
  { id: 'meadow', name: 'Meadow', palette: 'Palette 4',
    description: 'High summer: spring green with corn and sky.',
    dominant: 'trendy-green', pops: ['corn-harvest', 'viking', 'golden-grass', 'tumbleweed'], neutral: 'zinc',
    borrowed: ['viking', 'tumbleweed'] },
  { id: 'canyon', name: 'Canyon', palette: 'Palette 5',
    description: 'Red rock at dusk: terracotta with gold, teal and maroon.',
    dominant: 'trinidad', pops: ['golden-grass', 'cornflower-blue', 'maroon-flush', 'wheat'], neutral: 'stone',
    borrowed: ['cornflower-blue', 'wheat'] },
  { id: 'nordic', name: 'Nordic', palette: 'Palette 6',
    description: 'Fjord light: steel blue with lichen and lingonberry.',
    dominant: 'boston-blue', pops: ['sycamore', 'cornflower-blue', 'copper-rust', 'mosque'], neutral: 'gray',
    borrowed: ['cornflower-blue', 'mosque'] },
  { id: 'tealberry', name: 'Tealberry', palette: 'Palette 7',
    description: 'Deep teal and cherry with its own gray and status colors.',
    dominant: 'mosque', pops: ['rose-bud-cherry', 'cornflower-blue', 'golden-grass', 'carissma'], neutral: 'gray',
    customNeutral: true,
    status: { emerald: 'screamin-green', amber: 'gold-drop', red: 'punch' },
    borrowed: ['cornflower-blue', 'golden-grass', 'carissma'] },
];

// Same rule as the generator's dual() + matte(): the first step along the ramp
// (300..800, quarter steps) that reads on bg at 4.5:1 and carries white text at
// 3:1, then pulled toward the neutral as far as both targets allow.
function statusFrom(ramp, bg, dark, neutral500, matteAmount) {
  const fine = [];
  for (let i = 3; i < 8; i++) fine.push(ramp[i], mix(ramp[i], ramp[i + 1], 0.25), mix(ramp[i], ramp[i + 1], 0.5), mix(ramp[i], ramp[i + 1], 0.75));
  fine.push(ramp[8]);
  const ok = (c) => contrastRatio(c, bg) >= 4.5 * 1.02 && contrastRatio('#ffffff', c) >= 3 * 1.02;
  const pick = (dark ? fine : [...fine].reverse()).find(ok) ?? ramp[dark ? 5 : 6];
  for (let a = matteAmount; a > 0.04; a -= 0.08) {
    const m = mix(pick, neutral500, a);
    if (ok(m)) return m;
  }
  return pick;
}

// Subtle variants take info from the dominant hue. With an amber, orange or
// teal dominant that lands on warning, error or success, so take it from
// pops[1] instead, only where the audit flags the collision.
function separateInfo(t, f, neutral) {
  if (t.variation !== 'subtle') return;
  const clash = fullAudit(t).some((c) => /^hierarchy-hue-.*info/.test(c.id) && c.severity !== 'pass');
  if (!clash) return;
  t.colors.info = statusFrom(TAILWIND[u(f.pops[1])], t.colors.bg, t.isDark, TAILWIND[neutral][5], t.isDark ? 0.35 : 0.3);
}

// Terminal ANSI colors derive from the status colors but sit on the terminal
// background, which can differ from bg. Nudge only the ones that miss 4.5:1.
function fixTerminal(t) {
  for (const c of fullAudit(t)) {
    if (!c.id.startsWith('terminal-ansi-') || c.severity !== 'fail') continue;
    let v = c.fg;
    for (let i = 0; i < 12 && contrastRatio(v, c.bg) < c.target; i++) v = mix(v, t.isDark ? '#ffffff' : '#000000', 0.04);
    t.extended[c.id] = v;
  }
}

const only = process.argv.slice(2);
for (const f of FAMILIES) {
  if (only.length && !only.includes(f.id)) continue;
  const saved = {};
  for (const [tw, name] of Object.entries(f.status ?? {})) { saved[tw] = TAILWIND[tw]; TAILWIND[tw] = ramps[name]; }
  try {
    const neutral = f.customNeutral ? `uic-${f.neutral}` : f.neutral;
    const generator = { dominant: u(f.dominant), pops: f.pops.map(u), neutral };
    const family = { id: f.id, name: f.name, description: f.description, generator };
    const themes = generateFamilyThemes(family).map((t) => ({
      ...t,
      version: '1.0.0',
      tags: [t.faction, t.variation, f.id, 'uicolors'],
    }));
    for (const t of themes) { separateInfo(t, f, neutral); fixTerminal(t); }
    const juicyDark = themes.find((t) => t.id === `${f.id}-dark-juicy`);
    const swatches = [
      juicyDark.colors.primary, juicyDark.colors.link, juicyDark.colors.info,
      juicyDark.extended['code-variable'], juicyDark.extended['code-property'],
    ];
    // No `generator` in the file: Mr. Themes only keeps generators whose hues are built-in Tailwind names.
    const out = { id: f.id, name: f.name, description: f.description, swatches };
    writeFileSync(join(here, `${f.id}.nimfamily`), serializeFamilyFile(out, themes));
    console.log(`${f.id.padEnd(10)} ${f.palette}  dominant ${f.dominant}, pops ${f.pops.join(', ')}, neutral ${f.neutral}`);
  } finally {
    for (const [tw, ramp] of Object.entries(saved)) TAILWIND[tw] = ramp;
  }
}
