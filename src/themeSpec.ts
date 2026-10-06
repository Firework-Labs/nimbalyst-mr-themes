/**
 * The Nimbalyst theme model.
 *
 * Nimbalyst applies 75 CSS custom properties to <html>. Extensions can
 * contribute only the 20 "core" colors through the manifest; the runtime
 * derives the rest. This module knows all 75, how to derive the extended set
 * from the core set, and how to read/write the *.nimtheme file format.
 */
import { adjust, isValidColor, mix, onColor, withAlpha } from './color';

export const CORE_KEYS = [
  'bg', 'bg-secondary', 'bg-tertiary', 'bg-hover', 'bg-selected', 'bg-active',
  'text', 'text-muted', 'text-faint', 'text-disabled',
  'border', 'border-focus',
  'primary', 'primary-hover', 'link', 'link-hover',
  'success', 'warning', 'error', 'info',
] as const;
export type CoreKey = (typeof CORE_KEYS)[number];

export const EXTENDED_KEYS = [
  'on-primary', 'purple',
  'code-bg', 'code-text', 'code-border', 'code-gutter',
  'code-comment', 'code-punctuation', 'code-property', 'code-selector', 'code-operator', 'code-attr', 'code-variable', 'code-function',
  'table-border', 'table-header', 'table-cell', 'table-stripe',
  'toolbar-bg', 'toolbar-border', 'toolbar-hover', 'toolbar-active',
  'highlight-bg', 'highlight-border', 'comment-mark',
  'quote-text', 'quote-border',
  'scrollbar-thumb', 'scrollbar-thumb-hover', 'scrollbar-track',
  'diff-add-bg', 'diff-add-border', 'diff-remove-bg', 'diff-remove-border',
  'terminal-bg', 'terminal-fg', 'terminal-cursor', 'terminal-cursor-accent', 'terminal-selection',
  'terminal-ansi-black', 'terminal-ansi-red', 'terminal-ansi-green', 'terminal-ansi-yellow',
  'terminal-ansi-blue', 'terminal-ansi-magenta', 'terminal-ansi-cyan', 'terminal-ansi-white',
  'terminal-ansi-bright-black', 'terminal-ansi-bright-red', 'terminal-ansi-bright-green', 'terminal-ansi-bright-yellow',
  'terminal-ansi-bright-blue', 'terminal-ansi-bright-magenta', 'terminal-ansi-bright-cyan', 'terminal-ansi-bright-white',
] as const;
export type ExtendedKey = (typeof EXTENDED_KEYS)[number];
export type ThemeKey = CoreKey | ExtendedKey;
export const ALL_KEYS: readonly ThemeKey[] = [...CORE_KEYS, ...EXTENDED_KEYS];

export type CoreColors = Record<CoreKey, string>;
export type ExtendedColors = Record<ExtendedKey, string>;

/** CSS variable name for a theme key. Terminal keys are not under the nim prefix. */
export function cssVar(key: ThemeKey): string {
  return key.startsWith('terminal-') ? `--${key}` : `--nim-${key}`;
}

export const THEME_FILE_VERSION = 1;

/** On-disk *.nimtheme shape. `colors` matches the SDK ThemeContribution exactly. */
export interface ThemeFile {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  isDark: boolean;
  tags?: string[];
  colors: Partial<CoreColors>;
  /** Explicit overrides for derived colors. Missing keys are derived from `colors`. */
  extended?: Partial<ExtendedColors>;
  /** Reserved for a Monaco syntax theme (deferred). */
  monaco?: unknown;
  /** Theme family this preset belongs to (see families.ts). */
  family?: string;
  faction?: 'light' | 'dark';
  variation?: 'subtle' | 'pigment' | 'juicy';
  /** Format version of this file. */
  format?: number;
}

export interface ResolvedTheme {
  core: CoreColors;
  extended: ExtendedColors;
  /** All 75 variables keyed by CSS variable name. */
  vars: Record<string, string>;
  /** Extended keys that were derived rather than set explicitly. */
  derived: Set<ExtendedKey>;
}

export const LABELS: Record<ThemeKey, string> = {
  bg: 'Background', 'bg-secondary': 'Background, secondary', 'bg-tertiary': 'Background, tertiary',
  'bg-hover': 'Hover', 'bg-selected': 'Selected', 'bg-active': 'Active',
  text: 'Text', 'text-muted': 'Muted text', 'text-faint': 'Faint text', 'text-disabled': 'Disabled text',
  border: 'Border', 'border-focus': 'Focus ring',
  primary: 'Primary', 'primary-hover': 'Primary hover', link: 'Link', 'link-hover': 'Link hover',
  success: 'Success', warning: 'Warning', error: 'Error', info: 'Info',
  'on-primary': 'Text on primary', purple: 'Purple accent',
  'code-bg': 'Code background', 'code-text': 'Code text', 'code-border': 'Code border', 'code-gutter': 'Code gutter',
  'code-comment': 'Comment', 'code-punctuation': 'Punctuation', 'code-property': 'Property', 'code-selector': 'Keyword / selector',
  'code-operator': 'Operator', 'code-attr': 'String / attribute', 'code-variable': 'Variable', 'code-function': 'Function',
  'table-border': 'Table border', 'table-header': 'Table header', 'table-cell': 'Table cell', 'table-stripe': 'Table stripe',
  'toolbar-bg': 'Toolbar background', 'toolbar-border': 'Toolbar border', 'toolbar-hover': 'Toolbar hover', 'toolbar-active': 'Toolbar active',
  'highlight-bg': 'Highlight', 'highlight-border': 'Highlight border', 'comment-mark': 'Comment mark',
  'quote-text': 'Quote text', 'quote-border': 'Quote border',
  'scrollbar-thumb': 'Scrollbar thumb', 'scrollbar-thumb-hover': 'Scrollbar thumb hover', 'scrollbar-track': 'Scrollbar track',
  'diff-add-bg': 'Diff added', 'diff-add-border': 'Diff added border', 'diff-remove-bg': 'Diff removed', 'diff-remove-border': 'Diff removed border',
  'terminal-bg': 'Terminal background', 'terminal-fg': 'Terminal text', 'terminal-cursor': 'Cursor', 'terminal-cursor-accent': 'Cursor accent', 'terminal-selection': 'Terminal selection',
  'terminal-ansi-black': 'Black', 'terminal-ansi-red': 'Red', 'terminal-ansi-green': 'Green', 'terminal-ansi-yellow': 'Yellow',
  'terminal-ansi-blue': 'Blue', 'terminal-ansi-magenta': 'Magenta', 'terminal-ansi-cyan': 'Cyan', 'terminal-ansi-white': 'White',
  'terminal-ansi-bright-black': 'Bright black', 'terminal-ansi-bright-red': 'Bright red', 'terminal-ansi-bright-green': 'Bright green', 'terminal-ansi-bright-yellow': 'Bright yellow',
  'terminal-ansi-bright-blue': 'Bright blue', 'terminal-ansi-bright-magenta': 'Bright magenta', 'terminal-ansi-bright-cyan': 'Bright cyan', 'terminal-ansi-bright-white': 'Bright white',
};

export interface ThemeGroup {
  id: string;
  title: string;
  hint?: string;
  keys: ThemeKey[];
}

export const GROUPS: ThemeGroup[] = [
  { id: 'surfaces', title: 'Surfaces', keys: ['bg', 'bg-secondary', 'bg-tertiary', 'bg-hover', 'bg-selected', 'bg-active', 'border', 'border-focus'] },
  { id: 'text', title: 'Text', keys: ['text', 'text-muted', 'text-faint', 'text-disabled'] },
  { id: 'accents', title: 'Accents', keys: ['primary', 'primary-hover', 'on-primary', 'link', 'link-hover', 'purple'] },
  { id: 'status', title: 'Status', keys: ['success', 'warning', 'error', 'info'] },
  { id: 'code', title: 'Code blocks', hint: 'Markdown code blocks and syntax colors', keys: ['code-bg', 'code-text', 'code-border', 'code-gutter', 'code-comment', 'code-punctuation', 'code-property', 'code-selector', 'code-operator', 'code-attr', 'code-variable', 'code-function'] },
  { id: 'tables', title: 'Tables and toolbars', keys: ['table-border', 'table-header', 'table-cell', 'table-stripe', 'toolbar-bg', 'toolbar-border', 'toolbar-hover', 'toolbar-active'] },
  { id: 'marks', title: 'Highlights, quotes, diffs, scrollbars', keys: ['highlight-bg', 'highlight-border', 'comment-mark', 'quote-text', 'quote-border', 'diff-add-bg', 'diff-add-border', 'diff-remove-bg', 'diff-remove-border', 'scrollbar-thumb', 'scrollbar-thumb-hover', 'scrollbar-track'] },
  { id: 'terminal', title: 'Terminal', hint: 'Colors for the integrated terminal, including the 16 ANSI colors', keys: ['terminal-bg', 'terminal-fg', 'terminal-cursor', 'terminal-cursor-accent', 'terminal-selection', 'terminal-ansi-black', 'terminal-ansi-red', 'terminal-ansi-green', 'terminal-ansi-yellow', 'terminal-ansi-blue', 'terminal-ansi-magenta', 'terminal-ansi-cyan', 'terminal-ansi-white', 'terminal-ansi-bright-black', 'terminal-ansi-bright-red', 'terminal-ansi-bright-green', 'terminal-ansi-bright-yellow', 'terminal-ansi-bright-blue', 'terminal-ansi-bright-magenta', 'terminal-ansi-bright-cyan', 'terminal-ansi-bright-white'] },
];

/** Crystal Dark, as observed on Nimbalyst 0.77.5. */
export const BASE_DARK_CORE: CoreColors = {
  bg: '#0f172a', 'bg-secondary': '#020617', 'bg-tertiary': '#1e293b',
  'bg-hover': 'rgba(255, 255, 255, 0.05)', 'bg-selected': 'rgba(56, 189, 248, 0.15)', 'bg-active': '#4B5563',
  text: '#f8fafc', 'text-muted': '#cbd5e1', 'text-faint': '#94a3b8', 'text-disabled': '#64748b',
  border: '#1e293b', 'border-focus': '#3B82F6',
  primary: '#38bdf8', 'primary-hover': '#7dd3fc', link: '#60A5FA', 'link-hover': '#93C5FD',
  success: '#10B981', warning: '#EAB308', error: '#EF4444', info: '#38bdf8',
};

export const BASE_LIGHT_CORE: CoreColors = {
  bg: '#ffffff', 'bg-secondary': '#f8fafc', 'bg-tertiary': '#f1f5f9',
  'bg-hover': 'rgba(0, 0, 0, 0.04)', 'bg-selected': 'rgba(37, 99, 235, 0.12)', 'bg-active': '#e2e8f0',
  text: '#0f172a', 'text-muted': '#475569', 'text-faint': '#64748b', 'text-disabled': '#94a3b8',
  border: '#e2e8f0', 'border-focus': '#3b82f6',
  primary: '#2563eb', 'primary-hover': '#1d4ed8', link: '#2563eb', 'link-hover': '#1d4ed8',
  success: '#059669', warning: '#d97706', error: '#dc2626', info: '#0284c7',
};

const CODE_TOKENS_DARK = {
  'code-comment': '#6a9955', 'code-punctuation': '#cccccc', 'code-property': '#9cdcfe', 'code-selector': '#d7ba7d',
  'code-operator': '#d4d4d4', 'code-attr': '#92c5f8', 'code-variable': '#4fc1ff', 'code-function': '#dcdcaa',
};
const CODE_TOKENS_LIGHT = {
  'code-comment': '#008000', 'code-punctuation': '#393a34', 'code-property': '#001080', 'code-selector': '#a31515',
  'code-operator': '#000000', 'code-attr': '#0451a5', 'code-variable': '#0070c1', 'code-function': '#795e26',
};

/** Fill every extended color from the core palette, the way Nimbalyst does. */
export function deriveExtended(core: CoreColors, isDark: boolean): ExtendedColors {
  const tokens = isDark ? CODE_TOKENS_DARK : CODE_TOKENS_LIGHT;
  const magenta = isDark ? '#a855f7' : '#7e22ce';
  const cyan = isDark ? '#06b6d4' : '#0e7490';
  return {
    'on-primary': onColor(core.primary),
    purple: isDark ? '#a78bfa' : '#7c3aed',
    'code-bg': core['bg-secondary'],
    'code-text': core.text,
    'code-border': core.border,
    'code-gutter': core.border,
    ...tokens,
    'table-border': core.border,
    'table-header': core['bg-secondary'],
    'table-cell': core.bg,
    'table-stripe': core['bg-tertiary'],
    'toolbar-bg': core.bg,
    'toolbar-border': core.border,
    'toolbar-hover': core['bg-hover'],
    'toolbar-active': withAlpha(core.link, 0.2),
    'highlight-bg': withAlpha(core.warning, 0.2),
    'highlight-border': withAlpha(core.warning, 0.4),
    'comment-mark': mix(core.warning, '#ffffff', isDark ? 0.45 : 0.1),
    'quote-text': core['text-muted'],
    'quote-border': core.border,
    'scrollbar-thumb': core['text-faint'],
    'scrollbar-thumb-hover': core['text-muted'],
    'scrollbar-track': 'transparent',
    'diff-add-bg': withAlpha(core.success, 0.15),
    'diff-add-border': withAlpha(core.success, 0.4),
    'diff-remove-bg': withAlpha(core.error, 0.15),
    'diff-remove-border': withAlpha(core.error, 0.4),
    'terminal-bg': core['bg-secondary'],
    'terminal-fg': core.text,
    'terminal-cursor': core.primary,
    'terminal-cursor-accent': core['bg-secondary'],
    'terminal-selection': core['bg-selected'],
    'terminal-ansi-black': isDark ? '#000000' : '#1f2937',
    'terminal-ansi-red': core.error,
    'terminal-ansi-green': core.success,
    'terminal-ansi-yellow': core.warning,
    'terminal-ansi-blue': core.primary,
    'terminal-ansi-magenta': magenta,
    'terminal-ansi-cyan': cyan,
    'terminal-ansi-white': isDark ? '#ffffff' : '#e5e7eb',
    'terminal-ansi-bright-black': isDark ? '#6b7280' : '#4b5563',
    'terminal-ansi-bright-red': adjust(core.error, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-green': adjust(core.success, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-yellow': adjust(core.warning, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-blue': adjust(core.primary, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-magenta': adjust(magenta, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-cyan': adjust(cyan, isDark ? 0.25 : -0.15),
    'terminal-ansi-bright-white': isDark ? '#ffffff' : '#f9fafb',
  };
}

export function resolveTheme(theme: ThemeFile): ResolvedTheme {
  const base = theme.isDark ? BASE_DARK_CORE : BASE_LIGHT_CORE;
  const core = { ...base } as CoreColors;
  for (const k of CORE_KEYS) {
    const v = theme.colors[k];
    if (v && isValidColor(v)) core[k] = v;
  }
  const derivedAll = deriveExtended(core, theme.isDark);
  const extended = { ...derivedAll };
  const derived = new Set<ExtendedKey>(EXTENDED_KEYS);
  for (const k of EXTENDED_KEYS) {
    const v = theme.extended?.[k];
    if (v && isValidColor(v)) {
      extended[k] = v;
      derived.delete(k);
    }
  }
  const vars: Record<string, string> = {};
  for (const k of CORE_KEYS) vars[cssVar(k)] = core[k];
  for (const k of EXTENDED_KEYS) vars[cssVar(k)] = extended[k];
  return { core, extended, vars, derived };
}

export function slugify(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'theme';
}

/** Accepts anything JSON-shaped and returns a well-formed ThemeFile or throws. */
export function normalizeTheme(input: unknown): ThemeFile {
  if (!input || typeof input !== 'object') throw new Error('Theme must be a JSON object');
  const o = input as Record<string, unknown>;
  const colorsIn = (o.colors && typeof o.colors === 'object' ? o.colors : {}) as Record<string, unknown>;
  const extIn = (o.extended && typeof o.extended === 'object' ? o.extended : {}) as Record<string, unknown>;
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Untitled theme';
  const colors: Partial<CoreColors> = {};
  for (const k of CORE_KEYS) {
    const v = colorsIn[k];
    if (typeof v === 'string' && isValidColor(v)) colors[k] = v;
  }
  const extended: Partial<ExtendedColors> = {};
  for (const k of EXTENDED_KEYS) {
    const v = extIn[k];
    if (typeof v === 'string' && isValidColor(v)) extended[k] = v;
  }
  const isDark = typeof o.isDark === 'boolean' ? o.isDark : true;
  const out: ThemeFile = {
    id: typeof o.id === 'string' && o.id.trim() ? slugify(o.id) : slugify(name),
    name,
    version: typeof o.version === 'string' ? o.version : '1.0.0',
    isDark,
    colors,
    format: THEME_FILE_VERSION,
  };
  if (typeof o.author === 'string') out.author = o.author;
  if (typeof o.description === 'string') out.description = o.description;
  if (Array.isArray(o.tags)) out.tags = o.tags.filter((t): t is string => typeof t === 'string');
  if (Object.keys(extended).length) out.extended = extended;
  if (o.monaco && typeof o.monaco === 'object') out.monaco = o.monaco;
  if (typeof o.family === 'string') out.family = o.family;
  if (o.faction === 'light' || o.faction === 'dark') out.faction = o.faction;
  if (o.variation === 'subtle' || o.variation === 'pigment' || o.variation === 'juicy') out.variation = o.variation;
  return out;
}

export function parseThemeFile(raw: string): ThemeFile {
  const trimmed = raw.trim();
  if (!trimmed) return normalizeTheme({ name: 'Untitled theme', isDark: true, colors: {} });
  return normalizeTheme(JSON.parse(trimmed));
}

export function serializeThemeFile(theme: ThemeFile): string {
  const ordered: ThemeFile = {
    id: theme.id,
    name: theme.name,
    version: theme.version,
    ...(theme.author ? { author: theme.author } : {}),
    ...(theme.description ? { description: theme.description } : {}),
    isDark: theme.isDark,
    ...(theme.tags && theme.tags.length ? { tags: theme.tags } : {}),
    colors: theme.colors,
    ...(theme.extended && Object.keys(theme.extended).length ? { extended: theme.extended } : {}),
    ...(theme.monaco ? { monaco: theme.monaco } : {}),
    ...(theme.family ? { family: theme.family, faction: theme.faction, variation: theme.variation } : {}),
    format: THEME_FILE_VERSION,
  };
  return JSON.stringify(ordered, null, 2) + '\n';
}

/** Build a ThemeFile from a map of CSS variable names to values (the native snapshot). */
export function themeFromVars(vars: Record<string, string>, name: string, id: string, isDark: boolean): ThemeFile {
  const colors: Partial<CoreColors> = {};
  const extended: Partial<ExtendedColors> = {};
  for (const k of CORE_KEYS) {
    const v = vars[cssVar(k)];
    if (v && isValidColor(v)) colors[k] = v;
  }
  for (const k of EXTENDED_KEYS) {
    const v = vars[cssVar(k)];
    if (v && isValidColor(v)) extended[k] = v;
  }
  const t = normalizeTheme({ name, id, isDark, colors, extended, description: 'Nimbalyst native theme' });
  t.id = id;
  return t;
}

export function cloneTheme(theme: ThemeFile, name: string, id?: string): ThemeFile {
  return {
    ...theme,
    id: id ?? slugify(name),
    name,
    colors: { ...theme.colors },
    extended: theme.extended ? { ...theme.extended } : undefined,
    tags: theme.tags ? [...theme.tags] : undefined,
  };
}

export function emptyTheme(name = 'Untitled theme', isDark = true): ThemeFile {
  const base = isDark ? BASE_DARK_CORE : BASE_LIGHT_CORE;
  return { id: slugify(name), name, version: '1.0.0', isDark, colors: { ...base }, format: THEME_FILE_VERSION };
}

/** Snapshot whatever the app is showing right now into a theme. */
export function captureCurrentTheme(name: string): ThemeFile {
  const cs = getComputedStyle(document.documentElement);
  const colors: Partial<CoreColors> = {};
  const extended: Partial<ExtendedColors> = {};
  for (const k of CORE_KEYS) {
    const v = cs.getPropertyValue(cssVar(k)).trim();
    if (v && isValidColor(v)) colors[k] = v;
  }
  for (const k of EXTENDED_KEYS) {
    const v = cs.getPropertyValue(cssVar(k)).trim();
    if (v && isValidColor(v)) extended[k] = v;
  }
  const isDark = document.documentElement.classList.contains('dark-theme') ||
    !document.documentElement.classList.contains('light-theme');
  return normalizeTheme({ name, isDark, colors, extended, description: `Captured from ${document.documentElement.getAttribute('data-theme') ?? 'the current theme'}` });
}

/** Manifest snippet for a manifest-only theme extension carrying this theme. */
export function toThemeExtensionManifest(theme: ThemeFile, extensionId: string): string {
  const manifest = {
    id: extensionId,
    name: `${theme.name} Theme`,
    version: theme.version,
    description: theme.description ?? `The ${theme.name} theme for Nimbalyst, made with Mr. Themes.`,
    ...(theme.author ? { author: theme.author } : {}),
    apiVersion: '1.0.0',
    contributions: {
      themes: [
        {
          id: theme.id,
          name: theme.name,
          isDark: theme.isDark,
          colors: resolveTheme(theme).core,
          ...(theme.monaco ? { monaco: theme.monaco } : {}),
        },
      ],
    },
  };
  return JSON.stringify(manifest, null, 2) + '\n';
}
