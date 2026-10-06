# Bridge contract between Mr. Themes and Mr. Projects

Mr. Themes (`com.fireworklabs.theme-editor`) and Mr. Projects (`com.fireworklabs.project-theme`) are separate repositories and separately installed extensions that talk through two objects on `window`. Neither imports the other's code. **This file is identical in both repositories.** When the contract changes, change both repositories in the same session, bump `version` if the change is not backward compatible, and keep each side tolerant of the other being missing or older.

## Who provides what

| Object | Provided by | Installed in | Consumed by |
|---|---|---|---|
| `window.__nimbalystThemeEditor` | Mr. Themes | `installBridge()` in `src/applier.ts` | Mr. Projects, `getBridge()` in `src/store.ts` |
| `window.__nimbalystProjectTheme` | Mr. Projects | `installProjectBridge()` in `src/store.ts` | Mr. Themes, `getProjectBridge()` in `src/projectBridge.ts` |

Each side removes its object on deactivate. Each consumer checks for the functions it needs before using the object (duck typing, not the `version` field), and treats a missing bridge as "companion not installed".

## `window.__nimbalystThemeEditor` (Mr. Themes → Mr. Projects)

```ts
interface ThemeEditorBridge {
  version: 1;
  listThemes(): ThemeFile[];                 // the whole collection
  getTheme(id: string): ThemeFile | null;    // also resolves retired v0.1 preset ids (resolvePresetId)
  getEnabled(): ThemeFile | null;            // the global theme
  getNativeTheme(): ThemeFile;               // id `native:<data-theme>`
  getActiveTheme(): ThemeFile;               // preview > project override > global > native
  apply(themeOrId: ThemeFile | string | null, persist?: boolean): Promise<void>;  // set the global theme
  setOverride(themeOrId: ThemeFile | string | null): void;  // per-project layer; null lifts it
  preview(theme: ThemeFile | null): void;    // Try live
  getState(): ApplierState;
  subscribe(fn: (state: ApplierState) => void): () => void;
}
```

Mr. Projects uses `listThemes`, `getTheme`, `setOverride` and `subscribe` (its local `Bridge` type declares only those). The rail calls `setOverride(look.themeId ?? null)` whenever the active project changes and `setOverride(null)` on teardown. The settings page lists themes from `listThemes()`; without the bridge it shows an install hint and the rail and poster keep working.

The applier has three layers: **enabled** (global, persisted), **override** (per project, set only through this bridge), **preview** (Try live). If the user picks a native theme in Settings › Appearance, Mr. Themes steps aside with a toast and the project override stays lifted until the next project switch. That is deliberate.

## `window.__nimbalystProjectTheme` (Mr. Projects → Mr. Themes)

```ts
interface ProjectInfo {
  path: string;            // absolute project path, the key everywhere
  name: string;            // folder name
  label: string;           // short name from the look, or the folder name
  active: boolean;
  themeId: string | null;  // Mr. Themes theme id, or null = follows the global theme
  posterUri: string | null;// poster or tile image as a data/file URL, without the title overlay
}

interface ProjectThemeBridge {
  version: 1;
  listProjects(): ProjectInfo[];   // open projects, in Mr. Projects' rail order
  setProjectTheme(path: string, themeId: string | null): Promise<void>;  // writes .nimbalyst/project-theme.json and the cache
  subscribe(fn: () => void): () => void;
}
```

Mr. Themes' gallery uses it for the **Theme usage** tray (one card per open project, in rail order, with the poster thumbnail), the "Use for project…" picker, and the project chips on theme cards.

## Load order

Extension load order is not guaranteed. Mr. Themes' gallery polls briefly after mount for `__nimbalystProjectTheme` and subscribes once found (`ThemeLibraryPanel.tsx`). Mr. Projects does not poll: it calls `getBridge()` at the moment of use (the rail on every active-project change in `RailEnhancer.tsx`, the settings page on mount in `ProjectThemeSettings.tsx`). So if Mr. Themes loads late, the active project's override can be missed until the next project switch or remount, and a settings page opened before the bridge arrives shows the install hint until reopened (read from the code, never observed in the app). Older notes (lessons-learned 2026-09-11) say both sides poll; the code above is what is true as of 2026-09-28.

## Shared data

- A project's theme lives in `<project>/.nimbalyst/project-theme.json` as `themeId`, a Mr. Themes theme id. Mr. Projects owns the file; Mr. Themes only writes it through `setProjectTheme`.
- Theme ids are `<family>-<faction>-<variation>` for built-ins (for example `harbor-dark-juicy`) and slugs for user themes. Retired v0.1 ids (`kyoto-night`, `midnight-grove`, `lavender-milk`, …) still resolve through `LEGACY_PRESET_IDS` / `resolvePresetId` in Mr. Themes' `src/presets.ts`, so old project files keep working. Keep that map when retiring more ids.
- Import with **Replace** keeps theme ids, which is what keeps project assignments alive when a family is re-imported from the kit.

## Deliberately duplicated code

- `src/helpTooltip.ts` is the same file in both repositories (rebuilds Nimbalyst's gutter help tooltip), apart from the fallback class prefix (`nte-` in Mr. Themes, `pt-` in Mr. Projects). Fix bugs in both.
- Both gutter icons are inlined as SVG paths with `fill="currentColor"`: Mr. Themes in `src/themeIcon.ts` (which also carries the Mr. Projects icon as `projectIconSvg`), Mr. Projects in `src/components/icons.tsx`. The sources are in `graphic-assets/` in both repositories.

## Ids that must never change

Extension ids, configuration keys and the settings route id (`project-theme`) stayed the same through the 2026-09-23 rename to Mr. Themes / Mr. Projects. Renaming them would orphan installs, saved themes, saved palettes, rail layouts, and every project's cached look. The Mr. Projects gutter button and poster gear also navigate to `settings-route-ext:com.fireworklabs.project-theme:project-theme`, which embeds the id.
