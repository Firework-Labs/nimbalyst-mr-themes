/**
 * Minimal, in-memory stand-ins for the Nimbalyst extension-host objects
 * (ExtensionContext, PanelHost, EditorHost) described in
 * node_modules/@nimbalyst/extension-sdk/dist/types/{extension,panel,editor}.d.ts.
 *
 * These exist only to let the REAL extension code (src/) run in a bare
 * browser page for screenshotting. They implement just enough of each
 * interface for Mr. Themes' own code paths (activate, the Theme Gallery
 * panel, the .nimtheme editor) to work; untouched methods are no-ops cast
 * through `as any` rather than fully typed, since this file is bundled with
 * esbuild (no tsc type-checking gate).
 */
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import manifestJson from '../../manifest.json';

/** Demo workspace path shown in the chrome and used by "Save to project" actions (which we never trigger). */
export const DEMO_WORKSPACE_PATH = '/Users/demo/Projects/atlas-api';

function makeConfigStore() {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string, defaultValue?: T): T {
      return (store.has(key) ? store.get(key) : defaultValue) as T;
    },
    async update(key: string, value: unknown): Promise<void> {
      store.set(key, value);
    },
    getAll(): Record<string, unknown> {
      return Object.fromEntries(store);
    },
  };
}

function makeFilesystemStub() {
  const files = new Map<string, string>();
  return {
    async readFile(path: string): Promise<string> {
      const v = files.get(path);
      if (v === undefined) throw new Error(`fake filesystem: no such file ${path}`);
      return v;
    },
    async writeFile(path: string, content: string | Uint8Array): Promise<void> {
      files.set(path, typeof content === 'string' ? content : new TextDecoder().decode(content));
    },
    async fileExists(path: string): Promise<boolean> {
      return files.has(path);
    },
    async findFiles(): Promise<string[]> {
      return [...files.keys()];
    },
  };
}

/** Builds a fake ExtensionContext and calls the real activate() with it. */
export function createFakeExtensionContext(): ExtensionContext {
  const configuration = makeConfigStore();
  const filesystem = makeFilesystemStub();
  const ui = {
    showInfo(message: string) { console.info('[harness] ui.showInfo:', message); },
    showWarning(message: string) { console.warn('[harness] ui.showWarning:', message); },
    showError(message: string) { console.error('[harness] ui.showError:', message); },
  };
  return {
    manifest: manifestJson as unknown as ExtensionContext['manifest'],
    extensionPath: '/Users/demo/extensions/mr-themes',
    services: {
      filesystem,
      ui,
      configuration: configuration as unknown as ExtensionContext['services']['configuration'],
      collab: {} as ExtensionContext['services']['collab'],
    },
    subscriptions: [],
  };
}

/** Builds a fake PanelHost for ThemeLibraryPanel ({ host }: PanelHostProps). */
export function createFakePanelHost(theme: string) {
  const storageMap = new Map<string, unknown>();
  return {
    panelId: 'com.fireworklabs.theme-editor.theme-library',
    extensionId: 'com.fireworklabs.theme-editor',
    theme,
    workspacePath: DEMO_WORKSPACE_PATH,
    onThemeChanged: () => () => {},
    openFile: (path: string) => console.info('[harness] host.openFile (no-op):', path),
    openPanel: () => {},
    close: () => {},
    isSettingsOpen: false,
    openSettings: () => {},
    closeSettings: () => {},
    onWorkspaceEvent: () => () => {},
    storage: {
      get: <T,>(key: string) => storageMap.get(key) as T | undefined,
      set: async (key: string, value: unknown) => void storageMap.set(key, value),
      delete: async (key: string) => void storageMap.delete(key),
    },
    files: {
      getBasePath: async () => '/Users/demo/.nimbalyst-data/theme-editor/workspace',
      getGlobalBasePath: async () => '/Users/demo/.nimbalyst-data/theme-editor/global',
      write: async () => {},
      readText: async () => '',
    },
    exec: undefined,
    ai: undefined,
  } as unknown as import('@nimbalyst/extension-sdk').PanelHost;
}

/** Builds a fake EditorHost for ThemeEditor ({ host }: EditorHostProps), preloaded with `content`. */
export function createFakeEditorHost(opts: { fileName: string; filePath: string; content: string; theme: string }) {
  const storageMap = new Map<string, unknown>();
  return {
    capabilities: undefined,
    filePath: opts.filePath,
    fileName: opts.fileName,
    theme: opts.theme,
    isActive: true,
    visible: true,
    onVisibilityChanged: () => () => {},
    readOnly: false,
    embedded: false,
    onReadOnlyChanged: () => () => {},
    onThemeChanged: () => () => {},
    workspaceId: undefined,
    loadContent: async () => opts.content,
    loadBinaryContent: async () => new ArrayBuffer(0),
    onFileChanged: () => () => {},
    setDirty: () => {},
    saveContent: async () => {},
    onSaveRequested: () => () => {},
    openHistory: () => {},
    openExternal: async () => {},
    onDiffRequested: undefined,
    reportDiffResult: undefined,
    isDiffModeActive: undefined,
    onDiffCleared: undefined,
    onFindRequested: undefined,
    toggleSourceMode: undefined,
    onSourceModeChanged: undefined,
    isSourceModeActive: () => false,
    supportsSourceMode: true,
    getConfig: (_key: string, defaultValue?: unknown) => defaultValue,
    storage: {
      get: <T,>(key: string) => storageMap.get(key) as T | undefined,
      set: async (key: string, value: unknown) => void storageMap.set(key, value),
      delete: async (key: string) => void storageMap.delete(key),
    },
    setEditorContext: () => {},
    setEditorContextItems: () => {},
    registerEditorAPI: () => {},
    collaboration: undefined,
    registerMenuItems: () => {},
  } as unknown as import('@nimbalyst/extension-sdk').EditorHost;
}
