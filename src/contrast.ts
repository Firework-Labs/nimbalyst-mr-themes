/**
 * Contrast audit and repair for any theme, preset or user-made.
 *
 * The audit lists the foreground/background pairs Nimbalyst actually renders
 * (text on surfaces, links, accent, status colors as text and as pill fills)
 * with their ratio and grade. The repair nudges failing foregrounds along the
 * lightness axis until they pass, keeping hue and saturation.
 */
import { adjust, contrastGrade, contrastRatio, onColor } from './color';
import { resolveTheme, type CoreKey, type ThemeFile } from './themeSpec';

export interface ContrastCheck {
  id: string;
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  target: number;
  grade: ReturnType<typeof contrastGrade>;
  pass: boolean;
  /** Which core key to nudge when repairing. Undefined means not repairable automatically. */
  fixKey?: CoreKey;
}

export function auditTheme(theme: ThemeFile): ContrastCheck[] {
  const r = resolveTheme(theme);
  const c = r.core;
  const on = r.extended['on-primary'];
  const rows: [string, string, string, string, number, CoreKey | undefined][] = [
    ['text-bg', 'Text on background', c.text, c.bg, 7, 'text'],
    ['text-bg2', 'Text on secondary', c.text, c['bg-secondary'], 7, 'text'],
    ['muted-bg', 'Muted on background', c['text-muted'], c.bg, 4.5, 'text-muted'],
    ['muted-bg3', 'Muted on tertiary', c['text-muted'], c['bg-tertiary'], 4.5, 'text-muted'],
    ['faint-bg', 'Faint on background', c['text-faint'], c.bg, 4.5, 'text-faint'],
    ['text-active', 'Text on active', c.text, c['bg-active'], 4.5, undefined],
    ['primary-bg', 'Primary on background', c.primary, c.bg, 4.5, 'primary'],
    ['on-primary', 'Text on primary', on, c.primary, 4.5, undefined],
    ['link-bg', 'Link on background', c.link, c.bg, 4.5, 'link'],
    ['success-bg', 'Success as text', c.success, c.bg, 4.5, 'success'],
    ['warning-bg', 'Warning as text', c.warning, c.bg, 4.5, 'warning'],
    ['error-bg', 'Error as text', c.error, c.bg, 4.5, 'error'],
    ['info-bg', 'Info as text', c.info, c.bg, 4.5, 'info'],
    ['success-pill', 'White on success pill', '#ffffff', c.success, 3, undefined],
    ['warning-pill', 'White on warning pill', '#ffffff', c.warning, 3, undefined],
    ['error-pill', 'White on error pill', '#ffffff', c.error, 3, undefined],
    ['info-pill', 'White on info pill', '#ffffff', c.info, 3, undefined],
  ];
  return rows.map(([id, label, fg, bg, target, fixKey]) => {
    const ratio = contrastRatio(fg, bg);
    return { id, label, fg, bg, ratio, target, grade: contrastGrade(ratio), pass: ratio >= target, fixKey };
  });
}

/** Repair failing foreground roles by moving them away from the background. Returns a new theme. */
export function fixContrast(theme: ThemeFile): { theme: ThemeFile; changed: CoreKey[] } {
  const next: ThemeFile = { ...theme, colors: { ...theme.colors } };
  const changed: CoreKey[] = [];
  let guard = 0;
  while (guard++ < 12) {
    const failing = auditTheme(next).filter((x) => !x.pass && !!x.fixKey);
    if (!failing.length) break;
    const r = resolveTheme(next);
    for (const f of failing) {
      const key = f.fixKey!;
      const cur = r.core[key];
      // Move away from the background: lighter on dark surfaces, darker on light.
      const bgIsDark = contrastRatio('#ffffff', f.bg) > contrastRatio('#000000', f.bg);
      next.colors[key] = adjust(cur, bgIsDark ? 0.12 : -0.12);
      if (!changed.includes(key)) changed.push(key);
    }
  }
  // If primary moved, keep on-primary honest.
  if (changed.includes('primary')) {
    const r = resolveTheme(next);
    next.extended = { ...(next.extended ?? {}), 'on-primary': onColor(r.core.primary) };
  }
  return { theme: next, changed };
}

export function auditSummary(theme: ThemeFile): { pass: number; total: number; worst: ContrastCheck | null } {
  const rows = auditTheme(theme);
  const fails = rows.filter((x) => !x.pass).sort((a, b) => a.ratio / a.target - b.ratio / b.target);
  return { pass: rows.length - fails.length, total: rows.length, worst: fails[0] ?? null };
}
