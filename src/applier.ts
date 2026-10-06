/**
 * Runtime theme engine.
 *
 * Nimbalyst's own engine writes theme variables as an inline style on <html>.
 * This module layers a custom theme on top by writing the same variables, and
 * keeps them in place when the native engine rewrites the style attribute.
 *
 * Rules:
 * - Only write a property when its current value differs (loop-safe).
 * - When the inline style changes to values that are not ours, that is the
 *   native engine talking: snapshot those values so we can restore them later.
 * - When data-theme changes after we are enabled, the user picked a native
 *   theme in Settings. Step aside (disable) and say so.
 */
import { getCollection, getEnabledTheme, setEnabledTheme, toast } from './store';
import { resolvePresetId } from './presets';
import { ALL_KEYS, cssVar, resolveTheme, themeFromVars, type ThemeFile } from './themeSpec';

const VAR_NAMES = ALL_KEYS.map(cssVar);
const MARK_ATTR = 'data-nim-custom-theme';
/** Fewer differing variables than this is treated as noise, not a native theme write. */
const WHOLE_THEME_WRITE_THRESHOLD = 20;

type Listener = (state: ApplierState) => void;

export interface ApplierState {
  /** The user's global choice, persisted. */
  enabled: ThemeFile | null;
  /** A per-project override set by another extension (Mr. Projects). Not persisted here. */
  override: ThemeFile | null;
  /** A transient Try-live preview. */
  preview: ThemeFile | null;
  nativeThemeId: string | null;
}

class ThemeApplierEngine {
  private enabled: ThemeFile | null = null;
  private override: ThemeFile | null = null;
  private preview: ThemeFile | null = null;
  private nativeSnapshot: Record<string, string> = {};
  private nativeThemeId: string | null = null;
  private observer: MutationObserver | null = null;
  private listeners = new Set<Listener>();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    const html = document.documentElement;
    this.nativeThemeId = html.getAttribute('data-theme');
    this.nativeSnapshot = this.readInline();
    this.enabled = getEnabledTheme();
    this.applyNow();
    this.observer = new MutationObserver((records) => this.onMutation(records));
    this.observer.observe(html, { attributes: true, attributeFilter: ['style', 'data-theme', 'class'] });
    this.emit();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.started = false;
  }

  /** Put the native theme back and stop watching, without forgetting the enabled theme. */
  suspend(): void {
    this.preview = null;
    if (this.started) this.restoreNative();
    this.stop();
  }

  getState(): ApplierState {
    return { enabled: this.enabled, override: this.override, preview: this.preview, nativeThemeId: this.nativeThemeId };
  }

  /** The native Nimbalyst theme as a ThemeFile, built from the last snapshot of its variables. */
  getNativeTheme(): ThemeFile {
    const id = this.nativeThemeId ?? 'native';
    const isDark = !/light/i.test(id);
    const label = id.split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');
    return themeFromVars(this.nativeSnapshot, `Nimbalyst ${label}`, `native:${id}`, isDark);
  }

  /** What the app is showing right now: preview, then project override, then global, then native. */
  getActiveTheme(): ThemeFile {
    return this.current() ?? this.getNativeTheme();
  }

  /** Layer a project-specific theme over the global one. Pass null to lift it. */
  setOverride(theme: ThemeFile | null): void {
    if (this.override === theme) return;
    this.override = theme;
    if (this.current()) this.applyNow();
    else this.restoreNative();
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Persistently enable a theme, or pass null to return to the native theme. */
  async enable(theme: ThemeFile | null, persist = true): Promise<void> {
    this.enabled = theme;
    if (persist) await setEnabledTheme(theme);
    if (this.current()) this.applyNow();
    else this.restoreNative();
    this.emit();
  }

  /** Temporarily show a theme (Try live). Pass null to end the preview. */
  setPreview(theme: ThemeFile | null): void {
    this.preview = theme;
    if (this.current()) this.applyNow();
    else this.restoreNative();
    this.emit();
  }

  private current(): ThemeFile | null {
    return this.preview ?? this.override ?? this.enabled;
  }

  private readInline(): Record<string, string> {
    const out: Record<string, string> = {};
    const style = document.documentElement.style;
    for (const name of VAR_NAMES) {
      const v = style.getPropertyValue(name);
      if (v) out[name] = v.trim();
    }
    return out;
  }

  private applyNow(): void {
    const theme = this.current();
    if (!theme) return;
    const html = document.documentElement;
    const vars = resolveTheme(theme).vars;
    for (const [name, value] of Object.entries(vars)) {
      if (html.style.getPropertyValue(name).trim() !== value) html.style.setProperty(name, value);
    }
    if (html.getAttribute(MARK_ATTR) !== theme.id) html.setAttribute(MARK_ATTR, theme.id);
    // Keep the light/dark class in step so components that branch on it agree with us.
    html.classList.toggle('dark-theme', theme.isDark);
    html.classList.toggle('light-theme', !theme.isDark);
  }

  private restoreNative(): void {
    const html = document.documentElement;
    for (const name of VAR_NAMES) {
      const native = this.nativeSnapshot[name];
      if (native !== undefined) {
        if (html.style.getPropertyValue(name).trim() !== native) html.style.setProperty(name, native);
      } else {
        html.style.removeProperty(name);
      }
    }
    html.removeAttribute(MARK_ATTR);
    const nativeIsDark = this.nativeThemeId ? !/light/i.test(this.nativeThemeId) : true;
    html.classList.toggle('dark-theme', nativeIsDark);
    html.classList.toggle('light-theme', !nativeIsDark);
  }

  /** How many of our variables the inline style currently disagrees with. */
  private driftCount(inline: Record<string, string>): number {
    const theme = this.current();
    if (!theme) return 0;
    const vars = resolveTheme(theme).vars;
    let n = 0;
    for (const [name, value] of Object.entries(vars)) {
      if (inline[name] !== value) n++;
    }
    return n;
  }

  private onMutation(records: MutationRecord[]): void {
    const html = document.documentElement;
    const themeAttrChanged = records.some((r) => r.attributeName === 'data-theme');
    if (themeAttrChanged) {
      const next = html.getAttribute('data-theme');
      const switched = this.nativeThemeId !== null && next !== this.nativeThemeId;
      this.nativeThemeId = next;
      if (switched && (this.enabled || this.override) && !this.preview) {
        const name = (this.override ?? this.enabled)!.name;
        this.enabled = null;
        this.override = null;
        void setEnabledTheme(null);
        this.nativeSnapshot = this.readInline();
        html.removeAttribute(MARK_ATTR);
        toast('info', `Switched to the ${next ?? 'native'} theme. "${name}" is still in your Theme Library whenever you want it back.`);
        this.emit();
        return;
      }
    }
    if (!this.current()) {
      this.nativeSnapshot = this.readInline();
      return;
    }
    const inline = this.readInline();
    const drift = this.driftCount(inline);
    if (drift === 0) return;
    // A whole-theme rewrite is the native engine talking: remember it so we can
    // restore it later. A handful of stray properties is not, so leave the
    // snapshot alone and just put our values back.
    if (drift >= WHOLE_THEME_WRITE_THRESHOLD) this.nativeSnapshot = inline;
    this.applyNow();
  }

  private emit(): void {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }
}

export const applier = new ThemeApplierEngine();

/** Bridge for other extensions (Mr. Projects depends on this). */
export interface ThemeEditorBridge {
  version: 1;
  listThemes(): ThemeFile[];
  getTheme(id: string): ThemeFile | null;
  getEnabled(): ThemeFile | null;
  /** The native Nimbalyst theme as a ThemeFile (id `native:<data-theme>`). */
  getNativeTheme(): ThemeFile;
  /** Whatever is on screen now: preview, project override, global, or native. */
  getActiveTheme(): ThemeFile;
  apply(themeOrId: ThemeFile | string | null, persist?: boolean): Promise<void>;
  /** Per-project layer above the global theme. Pass null to lift it. */
  setOverride(themeOrId: ThemeFile | string | null): void;
  preview(theme: ThemeFile | null): void;
  getState(): ApplierState;
  subscribe(fn: Listener): () => void;
}

export function installBridge(): void {
  const bridge: ThemeEditorBridge = {
    version: 1,
    listThemes: () => getCollection(),
    getTheme: (id) => {
      const list = bridge.listThemes();
      return list.find((t) => t.id === id) ?? list.find((t) => t.id === resolvePresetId(id)) ?? null;
    },
    getEnabled: () => applier.getState().enabled,
    getNativeTheme: () => applier.getNativeTheme(),
    getActiveTheme: () => applier.getActiveTheme(),
    apply: async (themeOrId, persist = true) => {
      const theme = typeof themeOrId === 'string' ? bridge.getTheme(themeOrId) : themeOrId;
      await applier.enable(theme, persist);
    },
    setOverride: (themeOrId) => {
      const theme = typeof themeOrId === 'string' ? bridge.getTheme(themeOrId) : themeOrId;
      applier.setOverride(theme);
    },
    preview: (theme) => applier.setPreview(theme),
    getState: () => applier.getState(),
    subscribe: (fn) => applier.subscribe(fn),
  };
  (window as unknown as { __nimbalystThemeEditor?: ThemeEditorBridge }).__nimbalystThemeEditor = bridge;
}

export function uninstallBridge(): void {
  delete (window as unknown as { __nimbalystThemeEditor?: ThemeEditorBridge }).__nimbalystThemeEditor;
}
