/**
 * Fake companion-bridge data for the screenshot harness.
 *
 * Mimics window.__nimbalystProjectTheme (provided by Mr. Projects, see
 * ../../docs/bridge-contract.md) with four demo projects so the Theme Gallery's
 * "Theme usage" tray has something to show. No real project names or paths.
 */
import type { ProjectInfo, ProjectThemeBridge } from '../../src/projectBridge';

function posterSvg(bg: string, fg: string, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
    `<rect width="320" height="180" fill="${bg}"/>` +
    `<circle cx="256" cy="34" r="60" fill="${fg}" opacity="0.18"/>` +
    `<circle cx="40" cy="150" r="46" fill="${fg}" opacity="0.14"/>` +
    `<text x="20" y="104" font-family="ui-sans-serif,system-ui,sans-serif" font-size="30" font-weight="700" fill="${fg}">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Demo projects: every one carries its own theme, from different families and
 * both factions, so the "Theme usage" tray shows variety next to the global
 * theme. The assignments differ slightly per global theme so no tray card
 * repeats the global theme's hue.
 */
function demoProjects(variant: 'dark' | 'light'): ProjectInfo[] {
  return [
    {
      path: '/Users/demo/Projects/atlas-api',
      name: 'atlas-api',
      label: 'Atlas API',
      active: true,
      themeId: 'ember-dark-juicy',
      posterUri: posterSvg('#1c1410', '#fb923c', 'Atlas API'),
    },
    {
      path: '/Users/demo/Projects/field-notes',
      name: 'field-notes',
      label: 'Field Notes',
      active: false,
      themeId: variant === 'dark' ? 'grove-light-pigment' : 'plum-light-juicy',
      posterUri: variant === 'dark' ? posterSvg('#ecfdf5', '#047857', 'Field Notes') : posterSvg('#f5f3ff', '#7c3aed', 'Field Notes'),
    },
    {
      path: '/Users/demo/Projects/orchard',
      name: 'orchard',
      label: 'Orchard',
      active: false,
      themeId: variant === 'dark' ? 'harbor-light-juicy' : 'grove-light-pigment',
      posterUri: variant === 'dark' ? posterSvg('#f0f9ff', '#0284c7', 'Orchard') : posterSvg('#ecfdf5', '#047857', 'Orchard'),
    },
    {
      path: '/Users/demo/Projects/lighthouse',
      name: 'lighthouse',
      label: 'Lighthouse',
      active: false,
      themeId: 'rosewater-dark-pigment',
      posterUri: posterSvg('#2a1420', '#fb7185', 'Lighthouse'),
    },
  ];
}

/** Installs window.__nimbalystProjectTheme so the gallery's tray and project chips populate. */
export function installFakeProjectBridge(variant: 'dark' | 'light' = 'dark'): void {
  const projects = demoProjects(variant).map((p) => ({ ...p }));
  const listeners = new Set<() => void>();
  const bridge: ProjectThemeBridge = {
    version: 1,
    listProjects: () => projects.map((p) => ({ ...p })),
    setProjectTheme: async (path, themeId) => {
      const p = projects.find((x) => x.path === path);
      if (p) p.themeId = themeId;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  (window as unknown as { __nimbalystProjectTheme?: ProjectThemeBridge }).__nimbalystProjectTheme = bridge;
}
