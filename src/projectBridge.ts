/**
 * Reverse bridge: what the Mr. Projects extension exposes to us.
 *
 * Mr. Projects installs `window.__nimbalystProjectTheme` when it activates.
 * With it, the Theme Gallery can list the open projects (in rail order), show
 * which theme each one uses, and set a project's theme directly.
 */
export interface ProjectInfo {
  /** Absolute project path; the key used everywhere. */
  path: string;
  /** Folder name. */
  name: string;
  /** Short name from the project's look, or the folder name. */
  label: string;
  active: boolean;
  /** Mr. Themes theme id, or null when the project follows the global theme. */
  themeId: string | null;
  /** Poster or tile image as a data/file URL, when the project has one. */
  posterUri: string | null;
}

export interface ProjectThemeBridge {
  version: 1;
  listProjects(): ProjectInfo[];
  setProjectTheme(path: string, themeId: string | null): Promise<void>;
  subscribe(fn: () => void): () => void;
}

export function getProjectBridge(): ProjectThemeBridge | null {
  const b = (window as unknown as { __nimbalystProjectTheme?: ProjectThemeBridge }).__nimbalystProjectTheme;
  return b && typeof b.listProjects === 'function' && typeof b.setProjectTheme === 'function' ? b : null;
}

export const PROJECT_THEME_EXTENSION_ID = 'com.fireworklabs.project-theme';
