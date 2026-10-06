/**
 * Marketplace screenshot harness.
 *
 * Mounts the REAL Mr. Themes extension code (src/, untouched) inside a
 * standalone browser page (harness.html) that replicates Nimbalyst's window
 * chrome with fake demo data. See screenshots/README.md for how to build,
 * open and capture it.
 *
 * Query params (read from harness.html's URL):
 *   ?shot=0   Theme Gallery, header + usage tray + top of the collection grid.
 *   ?shot=1   Theme Gallery, same mount, scrolled to Theme Families (caller
 *             expands a family by clicking its header via browser_evaluate).
 *   ?shot=2   The .nimtheme Theme Editor, open on a sample theme.
 *   ?theme=dark|light   Which global preset is applied (default dark).
 */
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { activate, components, panels, hostComponents } from '../../src/index';
import { PRESETS } from '../../src/presets';
import { parseThemeFile, resolveTheme, serializeThemeFile, type ThemeFile } from '../../src/themeSpec';
import harborFogSample from '../../design/samples/harbor-fog.nimtheme';
import { createFakeEditorHost, createFakeExtensionContext, createFakePanelHost, DEMO_WORKSPACE_PATH } from './fakeHost';
import { installFakeProjectBridge } from './demoData';

const DARK_THEME_ID = 'plum-dark-juicy';
const LIGHT_THEME_ID = 'lagoon-light-pigment';

function findPreset(id: string): ThemeFile {
  const t = PRESETS.find((p) => p.id === id);
  if (!t) throw new Error(`harness: unknown preset id ${id}`);
  return t;
}

async function main(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot') ?? '0';
  const variant = params.get('theme') === 'light' ? 'light' : 'dark';
  const globalThemeId = variant === 'light' ? LIGHT_THEME_ID : DARK_THEME_ID;
  const globalTheme = findPreset(globalThemeId);
  const dataThemeId = variant === 'light' ? 'crystal-light' : 'crystal-dark';

  // Paint the "native" baseline the same as the theme we are about to enable,
  // so there is no flash of an unrelated theme before activate() + apply()
  // run (mirrors how Nimbalyst's own engine has already painted by the time
  // any extension mounts).
  const html = document.documentElement;
  const nativeVars = resolveTheme(globalTheme).vars;
  for (const [name, value] of Object.entries(nativeVars)) html.style.setProperty(name, value);
  html.setAttribute('data-theme', dataThemeId);
  html.classList.toggle('dark-theme', variant === 'dark');
  html.classList.toggle('light-theme', variant === 'light');

  const context = createFakeExtensionContext();
  activate(context);
  installFakeProjectBridge();

  const bridge = (window as unknown as { __nimbalystThemeEditor?: { apply(id: string): Promise<void> } }).__nimbalystThemeEditor;
  await bridge?.apply(globalThemeId);

  // Host components: app-level, no visible output of their own.
  const hostSlot = document.createElement('div');
  hostSlot.id = 'mr-host-components';
  hostSlot.style.display = 'none';
  document.body.appendChild(hostSlot);
  const ThemeApplier = hostComponents.ThemeApplier;
  const GutterIcon = hostComponents.GutterIcon;
  createRoot(hostSlot).render(createElement('div', null, createElement(ThemeApplier), createElement(GutterIcon)));

  const mainSlot = document.getElementById('mr-main-slot');
  if (!mainSlot) throw new Error('harness.html must contain #mr-main-slot');
  const root = createRoot(mainSlot);

  if (shot === '2') {
    // The .nimtheme Theme Editor, open on a sample theme.
    const ThemeEditor = components.ThemeEditor;
    // Short file name: the real sample's own theme.name ("Harbor Fog (sample)") is
    // already long, and "<subtitle> · <fileName>" wraps badly in a 1024px viewport
    // if the file name is long too.
    const fileName = 'theme.nimtheme';
    const content = variant === 'dark' ? JSON.stringify(harborFogSample, null, 2) : serializeThemeFile(findPreset('harbor-light-pigment'));
    // Round-trip through the real parser so the editor gets a fully normalized ThemeFile either way.
    void parseThemeFile(content);
    const host = createFakeEditorHost({
      fileName,
      filePath: `${DEMO_WORKSPACE_PATH}/${fileName}`,
      content,
      theme: dataThemeId,
    });
    root.render(createElement(ThemeEditor, { host }));
  } else {
    // The Theme Gallery (shot 0: top of the page; shot 1: caller scrolls to
    // Theme Families and expands one, see screenshots/README.md).
    const ThemeLibraryPanel = panels['theme-library'].component;
    const host = createFakePanelHost(dataThemeId);
    root.render(createElement(ThemeLibraryPanel, { host }));
  }

  document.body.setAttribute('data-harness-ready', 'true');
}

void main();
