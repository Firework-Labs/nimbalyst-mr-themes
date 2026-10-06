/**
 * The Family Builder Kit for Agents, bundled as text so the Theme Gallery can
 * write it into a project. Source of truth is ../toolkit; `npm run
 * sync-kit` copies its distributable files into ../kit (see scripts/sync-kit.mjs).
 */
/// <reference types="vite/client" />

/** Folder the kit is written to, inside the current project. */
export const KIT_DIR = 'mr-themes-family-builder-kit';

const raw = import.meta.glob('../kit/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Kit files keyed by their path inside the kit folder, e.g. `AGENT.md`, `preview/app.html`. */
export const KIT_FILES: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace(/^\.\.\/kit\//, ''), text]),
);
