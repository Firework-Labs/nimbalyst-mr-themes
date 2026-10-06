/**
 * Persistence for the enabled theme and the user's theme library.
 *
 * Source of truth is the extension configuration service (user scope), which
 * is available in activate() before any UI mounts. localStorage mirrors the
 * same data so the applier can paint at startup with zero flash even if the
 * configuration service is slow or unavailable.
 */
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import { BUILTIN_FAMILIES, normalizeFamily, type ThemeFamily } from './collection';
import { PRESETS } from './presets';
import { normalizeTheme, type ThemeFile } from './themeSpec';

const NS = 'com.fireworklabs.theme-editor';
const KEY_ENABLED = 'enabledTheme';
/** The whole theme collection (see getCollection). The key name predates 0.4.0. */
const KEY_USER_THEMES = 'userThemes';
const KEY_FAMILIES = 'themeFamilies';
const KEY_SEEDED = 'collectionSeeded';

let ctx: ExtensionContext | null = null;

export function setExtensionContext(c: ExtensionContext | null): void {
  ctx = c;
}
export function getExtensionContext(): ExtensionContext | null {
  return ctx;
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(`${NS}/${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(`${NS}/${key}`);
    else window.localStorage.setItem(`${NS}/${key}`, JSON.stringify(value));
  } catch {
    /* storage may be unavailable; configuration still holds the value */
  }
}

function cfgGet<T>(key: string): T | null {
  try {
    const v = ctx?.services.configuration?.get<T | null>(key, null);
    return v ?? null;
  } catch {
    return null;
  }
}
async function cfgSet(key: string, value: unknown): Promise<void> {
  try {
    await ctx?.services.configuration?.update(key, value, 'user');
  } catch (e) {
    console.warn('[theme-editor] configuration update failed', e);
  }
}

function safeTheme(v: unknown): ThemeFile | null {
  try {
    return v ? normalizeTheme(v) : null;
  } catch {
    return null;
  }
}

export function getEnabledTheme(): ThemeFile | null {
  return safeTheme(cfgGet(KEY_ENABLED)) ?? safeTheme(lsGet(KEY_ENABLED));
}

export async function setEnabledTheme(theme: ThemeFile | null): Promise<void> {
  lsSet(KEY_ENABLED, theme);
  await cfgSet(KEY_ENABLED, theme);
}

function storedThemes(): ThemeFile[] {
  const fromCfg = cfgGet<unknown[]>(KEY_USER_THEMES);
  const list = Array.isArray(fromCfg) && (fromCfg.length || isSeeded()) ? fromCfg : lsGet<unknown[]>(KEY_USER_THEMES) ?? [];
  return list.map(safeTheme).filter((t): t is ThemeFile => t !== null);
}

/**
 * Before 0.4.0 `userThemes` held only the user's own themes and the presets
 * lived in code. Since then it holds the whole collection: on first run the
 * presets are copied in (after the user's themes) and `collectionSeeded` is
 * set, so presets can be edited and deleted like any other theme.
 */
function isSeeded(): boolean {
  return (cfgGet<number>(KEY_SEEDED) ?? lsGet<number>(KEY_SEEDED) ?? 0) >= 1;
}

/** Every theme, in collection order. Correct before and after seeding. */
export function getCollection(): ThemeFile[] {
  const stored = storedThemes();
  if (isSeeded()) return stored;
  const ids = new Set(stored.map((t) => t.id));
  return [...stored, ...PRESETS.filter((p) => !ids.has(p.id))];
}

export function getFamilies(): ThemeFamily[] {
  if (!isSeeded()) return BUILTIN_FAMILIES.map((f) => ({ ...f }));
  const fromCfg = cfgGet<unknown[]>(KEY_FAMILIES);
  const list = Array.isArray(fromCfg) ? fromCfg : lsGet<unknown[]>(KEY_FAMILIES) ?? [];
  const out: ThemeFamily[] = [];
  for (const f of list) {
    try {
      out.push(normalizeFamily(f));
    } catch {
      /* skip malformed entries */
    }
  }
  return out;
}

export async function setCollection(themes: ThemeFile[], families?: ThemeFamily[]): Promise<void> {
  const fams = families ?? getFamilies();
  lsSet(KEY_USER_THEMES, themes);
  lsSet(KEY_FAMILIES, fams);
  lsSet(KEY_SEEDED, 1);
  await cfgSet(KEY_USER_THEMES, themes);
  await cfgSet(KEY_FAMILIES, fams);
  await cfgSet(KEY_SEEDED, 1);
}

/** Write the seeded collection once, so later reads come from storage. */
export async function ensureSeeded(): Promise<void> {
  if (!isSeeded()) await setCollection(getCollection(), getFamilies());
}

export function toast(kind: 'info' | 'warning' | 'error', message: string): void {
  const ui = ctx?.services.ui;
  if (!ui) return;
  if (kind === 'info') ui.showInfo(message);
  else if (kind === 'warning') ui.showWarning(message);
  else ui.showError(message);
}
