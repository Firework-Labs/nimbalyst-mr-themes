// OKLCH family builder (prototype, 2026-09-24). Replaces the kit's
// Tailwind-ladder generator for families built from uicolors ramps.
//
// Principles (settled over review rounds 1-7, 2026-09-24/25):
// - Every color is placed in OKLCH. Contrast targets are met by moving
//   lightness; chroma is a share (`rel`) of the gamut maximum at that
//   lightness, so every hue reads equally rich.
// - Variants: subtle ~ Everforest (soft, not washed out), pigment ~ gem tones
//   printed on matte stock, juicy ~ Tokyo Night with jewel tones.
// - Each accent starts near its hue's own peak lightness, not a shared one
//   (forcing gold and sage to one lightness is what made them "sickly").
// - Hues move freely to avoid mud (planHues): toward hues that stay rich at
//   the lightness a color must sit at, gemstone hues in juicy, amber instead
//   of dark yellow. Guardrails keep roles apart and status colors semantic;
//   status colors and keywords keep each family's flavor.
// - Surfaces are near-neutral in the family's neutral hue, stepped by fixed
//   lightness offsets; the accents carry the color.
//
//   node work/oklch-family.mjs              # every family -> work/v2/<id>.nimfamily
//   node work/oklch-family.mjs desert       # one family
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, serializeFamilyFile } from '../lib/mr-themes-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pal = JSON.parse(readFileSync(join(here, 'uicolors-palettes.json'), 'utf8')).palettes;
const ramps = {};
for (const p of Object.values(pal)) for (const [k, v] of Object.entries(p)) if (Array.isArray(v.ramp)) ramps[k] = v.ramp;

// ---------- OKLCH <-> sRGB ----------
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hexToOklch(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787745 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}
function oklchToLinRgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const inGamut = (rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);
// Gamut-map by reducing chroma at fixed L and h.
function oklch(L, C, h) {
  L = Math.min(1, Math.max(0, L));
  let lo = 0, hi = C, rgb = oklchToLinRgb(L, C, h);
  if (!inGamut(rgb)) {
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToLinRgb(L, mid, h))) lo = mid; else hi = mid; }
    rgb = oklchToLinRgb(L, lo, h);
  }
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toGam(Math.min(1, Math.max(0, c))))) * 255).toString(16).padStart(2, '0')).join('');
}
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  return `rgba(${[0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')}, ${a})`;
};
const WHITE = '#ffffff';

// Lightness nearest to L0 (searching outward, preferring `dir` first) at which
// every predicate holds. Returns the hex.
function solve(h, C, L0, preds, dir) {
  for (let d = 0; d <= 1; d += 0.0025) {
    for (const L of [L0 + dir * d, L0 - dir * d]) {
      if (L < 0 || L > 1) continue;
      const c = oklch(L, C, h);
      if (preds.every((p) => p(c))) return c;
    }
  }
  return oklch(L0, C, h);
}
// Largest in-gamut chroma at (L, h), and the lightness where a hue peaks.
function maxC(L, h) {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToLinRgb(L, mid, h))) lo = mid; else hi = mid; }
  return lo;
}
function cuspL(h) {
  let best = 0.5, bc = 0;
  for (let L = 0.3; L <= 0.95; L += 0.01) { const c = maxC(L, h); if (c > bc) { bc = c; best = L; } }
  return best;
}
// Like solve(), but chroma is a fixed share of the gamut maximum at each
// lightness tried, so every hue reads equally rich (gem tones).
function solveRel(h, rel, L0, preds, dir) {
  for (let d = 0; d <= 1; d += 0.0025) {
    for (const L of [L0 + dir * d, L0 - dir * d]) {
      if (L < 0.05 || L > 0.98) continue;
      const c = oklch(L, rel * maxC(L, h), h);
      if (preds.every((p) => p(c))) return c;
    }
  }
  return oklch(L0, rel * maxC(L0, h), h);
}
const on = (bgs, min) => (c) => bgs.every((b) => contrastRatio(c, b) >= min);
const under = (min) => (c) => contrastRatio(WHITE, c) >= min;
const below = (bg, max) => (c) => contrastRatio(c, bg) <= max;

// ---------- Variant character ----------
// L: OKLCH lightness 0..1. nC: neutral chroma. tC: text chroma.
// aL: accent base lightness, pulled toward each hue's own peak by `cusp`.
// rel: accent chroma as a share of the gamut maximum at that lightness
//   (subtle ~ soft, pigment ~ gem tones printed on matte stock, juicy ~ gems).
const VARIANTS = {
  dark: {
    subtle:  { bg: 0.255, bg2: 0.225, bg3: 0.315, border: 0.36, active: 0.34, nC: 0.008, text: 0.86, muted: 0.74, faint: 0.66, tC: 0.012, aL: 0.76, cusp: 0.30, rel: 0.58, sel: 0.14, hover: 0.05 },
    pigment: { bg: 0.235, bg2: 0.205, bg3: 0.300, border: 0.35, active: 0.33, nC: 0.008, text: 0.90, muted: 0.78, faint: 0.68, tC: 0.012, aL: 0.74, cusp: 0.40, rel: 0.72, sel: 0.18, hover: 0.06 },
    juicy:   { bg: 0.190, bg2: 0.150, bg3: 0.260, border: 0.32, active: 0.30, nC: 0.006, text: 0.93, muted: 0.80, faint: 0.66, tC: 0.010, aL: 0.72, cusp: 1.00, rel: 1.00, sel: 0.24, hover: 0.08, jewel: true },
  },
  light: {
    subtle:  { bg: 0.955, bg2: 0.925, bg3: 0.890, border: 0.83, active: 0.86, nC: 0.022, text: 0.40, muted: 0.46, faint: 0.55, tC: 0.025, aL: 0.54, cusp: 0.25, rel: 0.60, sel: 0.12, hover: 0.04 },
    pigment: { bg: 0.962, bg2: 0.930, bg3: 0.895, border: 0.84, active: 0.87, nC: 0.024, text: 0.30, muted: 0.45, faint: 0.54, tC: 0.030, aL: 0.50, cusp: 0.30, rel: 0.85, sel: 0.16, hover: 0.05 },
    juicy:   { bg: 1.000, bg2: 0.960, bg3: 0.920, border: 0.87, active: 0.89, nC: 0.018, text: 0.20, muted: 0.38, faint: 0.52, tC: 0.020, aL: 0.50, cusp: 1.00, rel: 1.00, sel: 0.20, hover: 0.05, jewel: true },
  },
};
// Hues move freely to avoid mud. A color that has to sit at lightness L takes
// the hue within +-35 degrees of its source that can be most saturated at L:
// on a light background (L ~0.5) ochre/gold/sage/teal/sky (h 60-240) top out
// around C 0.09-0.12 and turn brown or olive, so they drift toward carnelian,
// emerald or sapphire, as gem palettes do. Status pill fills must be dark
// enough for white text (L ~0.62 even in dark themes), so the same applies.
const gemCache = new Map();
const hdist = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const oliveFix = (h, L) => (h >= 78 && h <= 115 && L < 0.7 ? 75 : h); // dark yellow reads olive; use amber
function gemHue(h, L) {
  const key = `${h}@${L}`;
  if (!gemCache.has(key)) {
    let best = h, score = -1;
    for (let d = -35; d <= 35; d++) {
      const s = maxC(L, (h + d + 360) % 360) - 0.0005 * Math.abs(d);
      if (s > score) { score = s; best = (h + d + 360) % 360; }
    }
    gemCache.set(key, oliveFix(best, L));
  }
  return gemCache.get(key);
}
// Juicy snaps to gemstone hues: among the stones within 45 degrees, the one
// that can be most saturated at the lightness the color must sit at.
const JEWELS = { ruby: 20, carnelian: 42, topaz: 65, citrine: 95, peridot: 125, emerald: 155, turquoise: 190, sapphire: 262, amethyst: 305, rhodolite: 345 };
function jewelHue(h, L) {
  let best = null, score = -1;
  for (const j of Object.values(JEWELS)) {
    const d = hdist(h, j);
    if (d > 45) continue;
    const s = maxC(L, j) - 0.001 * d;
    if (s > score) { score = s; best = j; }
  }
  return best === null ? gemHue(h, L) : oliveFix(best, L);
}

// ---------- Families ----------
// Each role names a uicolors ramp whose 500 seeds the hue; the hue plan may
// move it (see planHues). Status roles only seed a hue inside their range.
// neutralHue: hue of the near-gray surfaces and text per faction.
// neutralC: multiplier on the variant's neutral chroma (1 = near-neutral).
const FAMILIES = {
  reef: {
    name: 'Reef',
    description: 'Tropical shallows: turquoise water, coral and orchid, over sea-glass gray and beach sand.',
    neutralHue: { dark: 215, light: 75 }, neutralC: { dark: 1.8, light: 1 },
    roles: {
      primary: 'bright-turquoise', link: 'carissma',
      success: 'riptide', warning: 'golden-grass', error: 'melon', info: 'cornflower-blue',
      keyword: 'bright-turquoise', func: 'tumbleweed', string: 'golden-grass', variable: 'carissma', property: 'cornflower-blue', purple: 'carissma', cyan: 'riptide',
    },
  },
  nautical: {
    name: 'Nautical',
    description: 'Night watch: sea blue and sea glass with brass fittings, over deep navy and chart paper.',
    neutralHue: { dark: 255, light: 235 }, neutralC: { dark: 3.5, light: 0.8 },
    roles: {
      primary: 'viking', link: 'riptide',
      success: 'screamin-green', warning: 'golden-grass', error: 'maroon-flush', info: 'viking',
      keyword: 'viking', func: 'golden-grass', string: 'riptide', variable: 'carissma', property: 'cornflower-blue', purple: 'carissma', cyan: 'riptide',
    },
  },
  desert: {
    name: 'Desert',
    description: 'Sun on sandstone: ochre and sage over warm sand, with a desert-sky blue.',
    neutralHue: { dark: 70, light: 85 }, // warm charcoal / pale sand
    roles: {
      primary: 'wheat', link: 'viking',
      success: 'deco', warning: 'golden-grass', error: 'melon', info: 'viking',
      keyword: 'wheat', func: 'golden-grass', string: 'deco', variable: 'melon', property: 'viking', purple: 'carissma', cyan: 'riptide',
    },
  },
  meadow: {
    name: 'Meadow',
    description: 'High summer: spring green and corn gold with poppy and sky, over moss gray and straw.',
    neutralHue: { dark: 125, light: 100 }, neutralC: { dark: 2, light: 1 },
    roles: {
      primary: 'trendy-green', link: 'viking',
      success: 'trendy-green', warning: 'corn-harvest', error: 'melon', info: 'viking',
      keyword: 'trendy-green', func: 'corn-harvest', string: 'riptide', variable: 'melon', property: 'viking', purple: 'carissma', cyan: 'riptide',
    },
  },
  canyon: {
    name: 'Canyon',
    description: 'Red rock at dusk: terracotta, turquoise and gold, over warm umber and adobe.',
    neutralHue: { dark: 40, light: 60 }, neutralC: { dark: 1.5, light: 1 },
    roles: {
      primary: 'trinidad', link: 'mosque',
      success: 'deco', warning: 'golden-grass', error: 'maroon-flush', info: 'mosque',
      keyword: 'trinidad', func: 'golden-grass', string: 'deco', variable: 'maroon-flush', property: 'mosque', purple: 'carissma', cyan: 'mosque',
    },
  },
  nordic: {
    name: 'Nordic',
    description: 'Fjord light: steel blue with lichen and lingonberry, over slate and birch.',
    neutralHue: { dark: 245, light: 225 }, neutralC: { dark: 3, light: 0.8 },
    roles: {
      primary: 'boston-blue', link: 'cornflower-blue',
      success: 'sycamore', warning: 'golden-grass', error: 'copper-rust', info: 'boston-blue',
      keyword: 'boston-blue', func: 'sycamore', string: 'deco', variable: 'copper-rust', property: 'mosque', purple: 'carissma', cyan: 'mosque',
    },
  },
  tealberry: {
    name: 'Tealberry',
    description: 'Deep teal and cherry, with a bright green, gold and punch-red status set.',
    neutralHue: { dark: 200, light: 200 }, neutralC: { dark: 1.5, light: 0.6 },
    roles: {
      primary: 'mosque', link: 'rose-bud-cherry',
      success: 'screamin-green', warning: 'gold-drop', error: 'punch', info: 'cornflower-blue',
      keyword: 'mosque', func: 'gold-drop', string: 'screamin-green', variable: 'rose-bud-cherry', property: 'cornflower-blue', purple: 'carissma', cyan: 'mosque',
    },
  },
};

const src = (name) => hexToOklch(ramps[name][5]);

// ---------- Hue plan ----------
// Moving hues freely must not collapse roles onto each other, so hues are
// assigned role by role, in priority order. Each role takes the candidate hue
// with the best score: the chroma it can reach at the lightness it must sit at
// (counted only up to `cap`, so a hue that is already rich enough stays put),
// minus a cost per degree moved. Constraints: status colors stay in their
// semantic range; primary stays within 20 degrees of its source and never
// snaps to a stone, so the family keeps one identity; UI roles stay >= 30
// degrees apart and code roles >= 24 unless they are meant to match.
// Juicy candidates are the gemstone hues within 30 degrees, then (at a cost)
// any hue within 35 degrees.
const ORDER = ['primary', 'error', 'warning', 'success', 'info', 'link', 'keyword', 'func', 'string', 'variable', 'property', 'purple', 'cyan'];
const GROUP = { error: 'ui', warning: 'ui', success: 'ui', info: 'ui', primary: 'ui', link: 'ui', keyword: 'code', func: 'code', string: 'code', variable: 'code', property: 'code', purple: 'code' };
const SEP = { ui: 30, code: 24 };
// The kit's audit measures hue differently from OKLCH and compresses the
// red-to-amber span, so warning and error need a wider gap in the plan.
const PAIR_SEP = { 'warning:error': 42 };
const RANGE = { error: [5, 38], warning: [70, 90], success: [125, 170], info: [215, 275] };
const MAY_MATCH = new Set(['link:info', 'property:link', 'property:info', 'warning:primary']);
const STATUS = new Set(['error', 'warning', 'success', 'info']);
const inRange = (h, [a, b]) => h >= a && h <= b;
function planHues(fam, dark, v) {
  const plan = {};
  const cap = v.jewel ? 0.22 : 0.15;
  for (const role of ORDER) {
    const h0 = src(fam.roles[role]).h;
    const L = STATUS.has(role) ? (dark ? 0.62 : 0.5) : dark ? v.aL : 0.5;
    const primary = role === 'primary';
    const win = primary ? 12 : role === 'purple' ? 60 : 35; // purple only colors literals and ANSI magenta
    const cands = [];
    // Status colors keep their family's flavor: distance is measured from the
    // seed pulled into range, and costs ~4x more, so they stay near the seed.
    let seed = h0, pen = 0.0008;
    if (RANGE[role]) {
      const [a, b] = RANGE[role];
      seed = inRange(h0, RANGE[role]) ? h0 : hdist(h0, a) <= hdist(h0, b) ? a : b;
      pen = 0.003;
      // Status colors may come from any seed; search their whole semantic range.
      for (const j of Object.values(JEWELS)) if (v.jewel && inRange(j, RANGE[role])) cands.push([j, 0]);
      for (let h = RANGE[role][0]; h <= RANGE[role][1]; h++) cands.push([h, v.jewel ? 0.03 : 0]);
    } else {
      if (v.jewel && !primary) for (const j of Object.values(JEWELS)) if (hdist(h0, j) <= 30) cands.push([j, 0]);
      for (let d = -win; d <= win; d++) cands.push([(h0 + d + 360) % 360, v.jewel && !primary ? 0.03 : 0]);
    }
    let best = null, score = -Infinity;
    for (const [raw, extra] of cands) {
      const h = oliveFix(raw, L);
      if (RANGE[role] && !inRange(h, RANGE[role])) continue;
      const clash = Object.entries(plan).some(([r, ph]) =>
        GROUP[r] && GROUP[r] === GROUP[role] && !MAY_MATCH.has(`${role}:${r}`) && !MAY_MATCH.has(`${r}:${role}`) &&
        hdist(h, ph) < (PAIR_SEP[`${role}:${r}`] ?? PAIR_SEP[`${r}:${role}`] ?? SEP[GROUP[r]]));
      if (clash) continue;
      const s = Math.min(maxC(L, h), cap) - pen * hdist(h, seed) - extra;
      if (s > score) { score = s; best = h; }
    }
    if (best === null) console.warn(`  ! ${fam.id} ${dark ? 'dark' : 'light'}: no hue satisfies the constraints for ${role}; kept seed ${Math.round(h0)}`);
    plan[role] = best ?? h0;
  }
  return plan;
}

function buildTheme(fam, faction, variation) {
  const dark = faction === 'dark';
  const v = VARIANTS[faction][variation];
  const nh = fam.neutralHue[faction];
  const up = dark ? 1 : -1; // direction that increases contrast against the background
  const nC = v.nC * (fam.neutralC?.[faction] ?? 1);
  const surf = (L) => oklch(L, nC, nh);
  const bg = surf(v.bg), bg2 = surf(v.bg2), bg3 = surf(v.bg3);
  const surfaces = [bg, bg2, bg3];
  const neutralText = (L, min, bgs = surfaces) => solve(nh, v.tC, L, [on(bgs, min)], up);
  const text = neutralText(v.text, 7);
  const muted = neutralText(v.muted, 4.5);
  const faint = neutralText(v.faint, 4.5);
  const disabled = solve(nh, v.tC, (v.bg + v.faint) / 2, [on([bg], 2.35), below(bg, 3.0)], up);
  const plan = planHues(fam, dark, v);
  // Very light and fully saturated reads as neon, not jewel: cap where a dark
  // theme's accents start (Tokyo Night's sit around L 0.72-0.80).
  const startL = (h) => { const L = v.aL + (cuspL(h) - v.aL) * v.cusp; return dark ? Math.min(L, 0.8) : L; };
  const accent = (role, bgs, min = 4.5) => { const h = plan[role]; return solveRel(h, v.rel, startL(h), [on(bgs, min)], up); };

  // primary: readable on surfaces, and on-primary text readable on it
  const onPrimary = dark ? surf(Math.min(v.bg2, 0.2)) : oklch(0.99, 0.005, nh);
  const primary = solveRel(plan.primary, v.rel, startL(plan.primary), [on(surfaces, 4.5), (c) => contrastRatio(onPrimary, c) >= 4.5], up);
  const pH = hexToOklch(primary);
  const primaryHover = oklch(pH.L + (dark ? 0.05 : -0.05), pH.C, pH.h);
  const link = accent('link', surfaces);
  const lH = hexToOklch(link);
  const linkHover = oklch(lH.L + (dark ? 0.06 : -0.06), lH.C, lH.h);

  // status: text on bg 4.5 AND white text on the fill 3 (pills)
  const status = (role) =>
    solveRel(plan[role], Math.max(v.rel, 0.6), dark ? 0.66 : 0.55, [on([bg], 4.5 * 1.01), under(3 * 1.01)], dark ? -1 : 1);
  const success = status('success'), warning = status('warning'), error = status('error'), info = status('info');

  const border = surf(v.border);
  const colors = {
    bg, 'bg-secondary': bg2, 'bg-tertiary': bg3,
    'bg-hover': dark ? `rgba(255, 255, 255, ${v.hover})` : `rgba(0, 0, 0, ${v.hover})`,
    'bg-selected': rgba(primary, v.sel), 'bg-active': surf(v.active),
    text, 'text-muted': muted, 'text-faint': faint, 'text-disabled': disabled,
    border, 'border-focus': primary, primary, 'primary-hover': primaryHover,
    link, 'link-hover': linkHover, success, warning, error, info,
  };

  // code on code-bg (= bg-secondary); terminal colors on terminal-bg (= bg-secondary)
  const code = (role) => accent(role, [bg2]);
  const term = (role) => accent(role, [bg2]);
  const tint = (L, min) => solve(nh, v.tC * 1.5, L, [on([bg2], min)], up);
  const extended = {
    'on-primary': onPrimary,
    purple: accent('purple', surfaces),
    'code-selector': code('keyword'),
    'code-function': code('func'),
    'code-attr': code('string'),
    'code-variable': code('variable'),
    'code-property': code('property'),
    'code-comment': tint(dark ? v.faint - 0.08 : v.faint + 0.08, 3.6),
    'code-punctuation': tint(v.muted, 4.5),
    'code-operator': muted,
    'code-text': text,
    'terminal-ansi-black': dark ? tint(0.5, 3.05) : text,
    'terminal-ansi-white': dark ? text : tint(0.6, 3.05),
    'terminal-ansi-red': term('error'),
    'terminal-ansi-green': term('success'),
    'terminal-ansi-yellow': term('warning'),
    'terminal-ansi-blue': term('info'),
    'terminal-ansi-magenta': term('purple'),
    'terminal-ansi-cyan': term('cyan'),
    'terminal-cursor': primary,
    'highlight-bg': rgba(warning, dark ? 0.22 : 0.2),
    'highlight-border': rgba(warning, 0.45),
    'comment-mark': oklch(0.86, 0.6 * maxC(0.86, plan.warning), plan.warning),
    'toolbar-active': rgba(primary, 0.22),
    'diff-add-bg': rgba(success, 0.15), 'diff-add-border': rgba(success, 0.4),
    'diff-remove-bg': rgba(error, 0.15), 'diff-remove-border': rgba(error, 0.4),
  };
  const vName = variation[0].toUpperCase() + variation.slice(1);
  const fName = faction[0].toUpperCase() + faction.slice(1);
  return {
    id: `${fam.id}-${faction}-${variation}`, name: `${fam.name} ${fName} ${vName}`, version: '2.0.0',
    author: 'Mr. Themes', description: fam.description, isDark: dark,
    tags: [faction, variation, fam.id, 'oklch'], family: fam.id, faction, variation,
    colors, extended, format: 1,
  };
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FAMILIES);
mkdirSync(join(here, 'v2'), { recursive: true });
for (const id of ids) {
  const fam = { id, ...FAMILIES[id] };
  const themes = [];
  for (const faction of ['dark', 'light']) for (const v of ['subtle', 'pigment', 'juicy']) themes.push(buildTheme(fam, faction, v));
  const jd = themes.find((t) => t.id === `${id}-dark-juicy`);
  // Keywords share the primary's hue, so the header uses the other code colors.
  const swatches = [jd.colors.primary, jd.colors.link, jd.extended['code-attr'], jd.extended['code-function'], jd.extended['code-variable']];
  writeFileSync(join(here, 'v2', `${id}.nimfamily`), serializeFamilyFile({ id, name: fam.name, description: fam.description, swatches }, themes));
  console.log(`wrote work/v2/${id}.nimfamily`);
}
