/**
 * Stand-in for src/kit.ts, aliased in build.mjs only. The real module's
 * `KIT_FILES` comes from Vite's `import.meta.glob(...)` (src/kit.ts:11),
 * which esbuild cannot evaluate (empty `import.meta` in an iife bundle; see
 * the "import.meta is not available" warning) -- calling it would throw at
 * module load and crash the whole gallery panel. The Theme Gallery's
 * "Download Family Builder Kit for Agents" button (ThemeLibraryPanel.tsx)
 * is not exercised by any of the screenshots, so an empty KIT_FILES is
 * enough for the real gallery code to render; only that one button's click
 * handler would no-op (it writes nothing) if clicked in this harness.
 */
export const KIT_DIR = 'mr-themes-family-builder-kit';
export const KIT_FILES: Record<string, string> = {};
