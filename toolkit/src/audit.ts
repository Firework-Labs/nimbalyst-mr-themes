/**
 * Full contrast/quality audit for Mr. Themes Toolkit.
 *
 * Builds on the extension's 17-check `auditTheme` (contrast.ts) and adds the
 * checks an AI agent needs to trust a generated theme before shipping it:
 * every surface pairing that actually appears in the app, translucent state
 * layers composited over their real backdrop, code and terminal tokens, and a
 * "hierarchy" pass that looks for things WCAG alone won't catch (indistinct
 * surfaces, a disabled color that reads as readable, status colors that share
 * a hue).
 *
 * Severity:
 * - 'fail'  — a real accessibility problem (below a WCAG-backed target).
 * - 'warn'  — WCAG 1.4.11 (non-text) territory, or a design-quality nit.
 * - 'pass'  — met its target. Some pass checks carry an informational note.
 */
import { contrastRatio, parseColor, formatColor, composite, type RGBA } from '../../src/color';
import { auditTheme } from '../../src/contrast';
import { resolveTheme, type ThemeFile, type CoreKey, type ExtendedKey } from '../../src/themeSpec';

export type CheckGroup = 'text' | 'accent' | 'status' | 'code' | 'terminal' | 'surfaces' | 'states' | 'hierarchy' | 'family';

export interface Check {
  id: string;
  group: CheckGroup;
  label: string;
  fg?: string;
  bg?: string;
  ratio?: number;
  target?: number;
  severity: 'pass' | 'warn' | 'fail';
  note?: string;
}

// ---------------------------------------------------------------------------
// Small helpers built on top of color.ts (which has per-color alpha handling
// in contrastRatio, but no string-level "composite this translucent color
// over that opaque surface" helper — that's the thing this toolkit needed
// and color.ts lacked, so it lives here).
// ---------------------------------------------------------------------------

/** Composite a possibly-translucent color over an opaque surface, returning an opaque color string. */
export function compositeOver(overlay: string, surface: string): string {
  const ov = parseColor(overlay);
  const su = parseColor(surface);
  if (!ov) return surface;
  if (!su) return overlay;
  const surfaceOpaque: RGBA = su.a < 1 ? composite(su, { r: 255, g: 255, b: 255, a: 1 }) : su;
  if (ov.a >= 1) return formatColor(ov);
  return formatColor(composite(ov, surfaceOpaque));
}

function rgbToHsl(c: RGBA): { h: number; s: number; l: number } {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / d + 2) * 60;
      break;
    default:
      h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

/** Hue angle in degrees, or null for colors too close to gray to have a meaningful hue. */
function hueOf(color: string): number | null {
  const c = parseColor(color);
  if (!c) return null;
  const { h, s } = rgbToHsl(c);
  if (s < 0.08) return null;
  return h;
}

function hueDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ---------------------------------------------------------------------------
// Check builders
// ---------------------------------------------------------------------------

function mk(id: string, group: CheckGroup, label: string, fg: string, bg: string, target: number, opts: { warnOnly?: boolean } = {}): Check {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= target;
  return {
    id,
    group,
    label,
    fg,
    bg,
    ratio,
    target,
    severity: pass ? 'pass' : opts.warnOnly ? 'warn' : 'fail',
  };
}

const CHROMATIC_ANSI: ExtendedKey[] = [
  'terminal-ansi-red', 'terminal-ansi-green', 'terminal-ansi-yellow', 'terminal-ansi-blue', 'terminal-ansi-magenta', 'terminal-ansi-cyan',
  'terminal-ansi-bright-red', 'terminal-ansi-bright-green', 'terminal-ansi-bright-yellow', 'terminal-ansi-bright-blue', 'terminal-ansi-bright-magenta', 'terminal-ansi-bright-cyan',
];

const WARN_ONLY_ANSI: ExtendedKey[] = ['terminal-ansi-black', 'terminal-ansi-white', 'terminal-ansi-bright-black'];

const CODE_TOKENS: { key: ExtendedKey; target: number }[] = [
  { key: 'code-comment', target: 3.5 },
  { key: 'code-punctuation', target: 4.5 },
  { key: 'code-property', target: 4.5 },
  { key: 'code-selector', target: 4.5 },
  { key: 'code-operator', target: 4.5 },
  { key: 'code-attr', target: 4.5 },
  { key: 'code-variable', target: 4.5 },
  { key: 'code-function', target: 4.5 },
  { key: 'code-text', target: 7 },
];

export function fullAudit(theme: ThemeFile): Check[] {
  const checks: Check[] = [];
  const r = resolveTheme(theme);
  const core = r.core;
  const ext = r.extended;

  // 1. The 17 legacy checks, carried over as hard failures.
  for (const c of auditTheme(theme)) {
    const group: CheckGroup = c.id.includes('primary') || c.id === 'link-bg'
      ? 'accent'
      : /success|warning|error|info/.test(c.id)
        ? 'status'
        : c.id === 'text-active'
          ? 'states'
          : 'text';
    checks.push({
      id: c.id,
      group,
      label: c.label,
      fg: c.fg,
      bg: c.bg,
      ratio: c.ratio,
      target: c.target,
      severity: c.pass ? 'pass' : 'fail',
    });
  }

  // 2. Text/muted/faint on every surface (fills in the cells the 17 checks skip).
  checks.push(mk('text-bg3', 'text', 'Text on tertiary', core.text, core['bg-tertiary'], 7));
  checks.push(mk('muted-bg2', 'text', 'Muted on secondary', core['text-muted'], core['bg-secondary'], 4.5));
  checks.push(mk('faint-bg2', 'text', 'Faint on secondary', core['text-faint'], core['bg-secondary'], 4.5));
  checks.push(mk('faint-bg3', 'text', 'Faint on tertiary', core['text-faint'], core['bg-tertiary'], 4.5));

  // 3. Link on secondary.
  checks.push(mk('link-bg2', 'accent', 'Link on secondary', core.link, core['bg-secondary'], 4.5));

  // 4. Code tokens on code-bg.
  for (const { key, target } of CODE_TOKENS) {
    checks.push(mk(`code-${key}`, 'code', `${key} on code background`, ext[key], ext['code-bg'], target));
  }

  // 5. Terminal.
  checks.push(mk('terminal-fg', 'terminal', 'Terminal text', ext['terminal-fg'], ext['terminal-bg'], 7));
  for (const key of CHROMATIC_ANSI) {
    checks.push(mk(key, 'terminal', `${key} on terminal background`, ext[key], ext['terminal-bg'], 4.5));
  }
  for (const key of WARN_ONLY_ANSI) {
    checks.push(mk(key, 'terminal', `${key} on terminal background`, ext[key], ext['terminal-bg'], 3, { warnOnly: true }));
  }

  // 6. Translucent state layers, composited over the surface they actually sit on.
  const stateLayers: { id: string; label: string; overlayKey: ExtendedKey | CoreKey; surface: string; fg: string }[] = [
    { id: 'state-selected', label: 'Text on selected (over bg)', overlayKey: 'bg-selected', surface: core.bg, fg: core.text },
    { id: 'state-hover', label: 'Text on hover (over bg-secondary)', overlayKey: 'bg-hover', surface: core['bg-secondary'], fg: core.text },
    { id: 'state-diff-add-code', label: 'Code text on diff-add (over code-bg)', overlayKey: 'diff-add-bg', surface: ext['code-bg'], fg: ext['code-text'] },
    { id: 'state-diff-add', label: 'Text on diff-add (over bg)', overlayKey: 'diff-add-bg', surface: core.bg, fg: core.text },
    { id: 'state-diff-remove-code', label: 'Code text on diff-remove (over code-bg)', overlayKey: 'diff-remove-bg', surface: ext['code-bg'], fg: ext['code-text'] },
    { id: 'state-diff-remove', label: 'Text on diff-remove (over bg)', overlayKey: 'diff-remove-bg', surface: core.bg, fg: core.text },
    { id: 'state-highlight', label: 'Text on highlight (over bg)', overlayKey: 'highlight-bg', surface: core.bg, fg: core.text },
    { id: 'state-toolbar-active', label: 'Text on toolbar-active (over toolbar-bg)', overlayKey: 'toolbar-active', surface: ext['toolbar-bg'], fg: core.text },
    { id: 'state-terminal-selection', label: 'Terminal text on terminal-selection', overlayKey: 'terminal-selection', surface: ext['terminal-bg'], fg: ext['terminal-fg'] },
  ];
  for (const s of stateLayers) {
    const overlay = (core as Record<string, string>)[s.overlayKey] ?? (ext as Record<string, string>)[s.overlayKey];
    const effectiveBg = compositeOver(overlay, s.surface);
    checks.push(mk(s.id, 'states', s.label, s.fg, effectiveBg, 4.5));
  }

  // 7. Quote text, table header.
  checks.push(mk('quote-text', 'text', 'Quote text on background', ext['quote-text'], core.bg, 4.5));
  checks.push(mk('table-header-text', 'text', 'Table header text', core.text, ext['table-header'], 4.5));

  // 8. Non-text contrast (WCAG 1.4.11), warn not fail.
  checks.push(mk('border-focus-bg', 'surfaces', 'Focus ring vs background', core['border-focus'], core.bg, 3, { warnOnly: true }));
  checks.push(mk('primary-fill-bg', 'surfaces', 'Primary fill vs background', core.primary, core.bg, 3, { warnOnly: true }));
  checks.push(mk('scrollbar-thumb-bg', 'surfaces', 'Scrollbar thumb vs background', ext['scrollbar-thumb'], core.bg, 3, { warnOnly: true }));

  // 9. Hierarchy: things WCAG pairs alone don't catch.
  const textRatio = contrastRatio(core.text, core.bg);
  const mutedRatio = contrastRatio(core['text-muted'], core.bg);
  const faintRatio = contrastRatio(core['text-faint'], core.bg);
  const disabledRatio = contrastRatio(core['text-disabled'], core.bg);
  const orderPairs: [string, string, number, number][] = [
    ['text', 'muted', textRatio, mutedRatio],
    ['muted', 'faint', mutedRatio, faintRatio],
    ['faint', 'disabled', faintRatio, disabledRatio],
  ];
  for (const [a, b, ra, rb] of orderPairs) {
    checks.push({
      id: `hierarchy-order-${a}-${b}`,
      group: 'hierarchy',
      label: `${a} contrast (${ra.toFixed(2)}) > ${b} contrast (${rb.toFixed(2)})`,
      ratio: Number(ra.toFixed(3)),
      target: Number(rb.toFixed(3)),
      severity: ra > rb ? 'pass' : 'warn',
      note: ra > rb ? undefined : `${a} on bg is not strictly greater than ${b} on bg`,
    });
  }
  checks.push({
    id: 'hierarchy-disabled-reads-disabled',
    group: 'hierarchy',
    label: `Disabled text stays below 4.5 (${disabledRatio.toFixed(2)})`,
    ratio: disabledRatio,
    target: 4.5,
    severity: disabledRatio < 4.5 ? 'pass' : 'warn',
    note: disabledRatio < 4.5 ? undefined : 'disabled text is as readable as normal text and will not look disabled',
  });

  const surfacePairs: [string, string, string, string][] = [
    ['bg', 'bg-secondary', core.bg, core['bg-secondary']],
    ['bg', 'bg-tertiary', core.bg, core['bg-tertiary']],
    ['bg-secondary', 'bg-tertiary', core['bg-secondary'], core['bg-tertiary']],
  ];
  for (const [an, bn, a, b] of surfacePairs) {
    const ratio = contrastRatio(a, b);
    checks.push({
      id: `hierarchy-surfaces-${an}-${bn}`,
      group: 'hierarchy',
      label: `${an} vs ${bn}`,
      fg: a,
      bg: b,
      ratio,
      target: 1.05,
      severity: ratio >= 1.05 ? 'pass' : 'warn',
      note: ratio >= 1.05 ? undefined : 'surfaces indistinguishable',
    });
  }

  const borderRatio = contrastRatio(core.border, core.bg);
  checks.push(mk('hierarchy-border-bg', 'hierarchy', 'Border vs background', core.border, core.bg, 1.2, { warnOnly: true }));

  const statusKeys: CoreKey[] = ['success', 'warning', 'error', 'info'];
  for (let i = 0; i < statusKeys.length; i++) {
    for (let j = i + 1; j < statusKeys.length; j++) {
      const ka = statusKeys[i];
      const kb = statusKeys[j];
      const ha = hueOf(core[ka]);
      const hb = hueOf(core[kb]);
      const diff = ha === null || hb === null ? null : hueDiff(ha, hb);
      const distinguishable = diff === null ? true : diff >= 25;
      checks.push({
        id: `hierarchy-hue-${ka}-${kb}`,
        group: 'hierarchy',
        label: `${ka} vs ${kb} hue${diff === null ? '' : ` (Δ=${diff.toFixed(0)}°)`}`,
        severity: distinguishable ? 'pass' : 'warn',
        note: distinguishable ? undefined : `${ka} and ${kb} are too close in hue to distinguish by color alone`,
      });
    }
  }

  checks.push({
    id: 'hierarchy-primary-link',
    group: 'hierarchy',
    label: 'Primary vs link',
    severity: 'pass',
    note: core.primary.toLowerCase() === core.link.toLowerCase() ? 'primary and link use the same color' : undefined,
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Family-level audit
// ---------------------------------------------------------------------------

const EXPECTED_FACTIONS = ['dark', 'light'] as const;
const EXPECTED_VARIATIONS = ['subtle', 'pigment', 'juicy'] as const;

export function familyAudit(themes: ThemeFile[]): Check[] {
  const checks: Check[] = [];
  if (!themes.length) return checks;

  const families = new Map<string, ThemeFile[]>();
  for (const t of themes) {
    const fam = t.family ?? '(none)';
    if (!families.has(fam)) families.set(fam, []);
    families.get(fam)!.push(t);
  }

  for (const [famId, famThemes] of families) {
    const withFactionVariation = famThemes.filter((t) => t.faction && t.variation);
    if (withFactionVariation.length) {
      for (const faction of EXPECTED_FACTIONS) {
        for (const variation of EXPECTED_VARIATIONS) {
          const found = withFactionVariation.some((t) => t.faction === faction && t.variation === variation);
          checks.push({
            id: `family-${famId}-${faction}-${variation}`,
            group: 'family',
            label: `${famId}: ${faction} ${variation} present`,
            severity: found ? 'pass' : 'warn',
            note: found ? undefined : `missing ${faction} ${variation} variant`,
          });
        }
      }

      // Primary hue consistent across variants of this family.
      const hues = withFactionVariation
        .map((t) => ({ id: t.id, hue: hueOf(resolveTheme(t).core.primary) }))
        .filter((x): x is { id: string; hue: number } => x.hue !== null);
      if (hues.length > 1) {
        const ref = hues[0].hue;
        for (const h of hues.slice(1)) {
          const diff = hueDiff(ref, h.hue);
          checks.push({
            id: `family-${famId}-hue-${h.id}`,
            group: 'family',
            label: `${h.id}: primary hue within 30° of ${hues[0].id}`,
            ratio: diff,
            target: 30,
            severity: diff <= 30 ? 'pass' : 'warn',
            note: diff <= 30 ? undefined : `primary hue drifted ${diff.toFixed(0)}° from the family's reference variant`,
          });
        }
      }

      // Each faction's text contrast sits in a sensible band (not below target, not absurdly high).
      for (const faction of EXPECTED_FACTIONS) {
        const inFaction = withFactionVariation.filter((t) => t.faction === faction);
        for (const t of inFaction) {
          const ratio = contrastRatio(resolveTheme(t).core.text, resolveTheme(t).core.bg);
          const inBand = ratio >= 7 && ratio <= 19;
          checks.push({
            id: `family-${famId}-band-${t.id}`,
            group: 'family',
            label: `${t.id}: text contrast in a sensible band (${ratio.toFixed(2)})`,
            ratio,
            target: 7,
            severity: inBand ? 'pass' : 'warn',
            note: inBand ? undefined : ratio < 7 ? 'below the enforced text target' : 'unusually high — check it is not pure black/white by accident',
          });
        }
      }
    }
  }

  // Unique ids across the whole set.
  const seen = new Map<string, number>();
  for (const t of themes) seen.set(t.id, (seen.get(t.id) ?? 0) + 1);
  for (const [id, count] of seen) {
    if (count > 1) {
      checks.push({
        id: `family-duplicate-${id}`,
        group: 'family',
        label: `id "${id}" used ${count} times`,
        severity: 'fail',
        note: 'duplicate theme ids will collide on import',
      });
    }
  }

  // Roll up each theme's own fullAudit fail count.
  for (const t of themes) {
    const fails = fullAudit(t).filter((c) => c.severity === 'fail').length;
    checks.push({
      id: `family-fails-${t.id}`,
      group: 'family',
      label: `${t.id}: ${fails} failing check(s)`,
      severity: fails > 0 ? 'fail' : 'pass',
    });
  }

  return checks;
}

export function summarize(checks: Check[]): { pass: number; warn: number; fail: number } {
  const out = { pass: 0, warn: 0, fail: 0 };
  for (const c of checks) out[c.severity]++;
  return out;
}
