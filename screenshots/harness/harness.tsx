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
 *   ?app=<preset id>    Shot 2 only: the preset the replica window wears
 *                       (default grove-dark-juicy).
 *   ?edit=<preset id>   Shot 2 only: the preset opened in the editor
 *                       (default ember-light-juicy).
 */
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { activate, components, panels, hostComponents } from '../../src/index';
import { PRESETS } from '../../src/presets';
import { parseThemeFile, resolveTheme, serializeThemeFile, type ThemeFile } from '../../src/themeSpec';
import harborFogSample from '../../design/samples/harbor-fog.nimtheme';
import { createFakeEditorHost, createFakeExtensionContext, createFakePanelHost, DEMO_WORKSPACE_PATH } from './fakeHost';
import { installFakeProjectBridge } from './demoData';
import { getFamilies, setCollection } from '../../src/store';

const DARK_THEME_ID = 'plum-dark-juicy';
const LIGHT_THEME_ID = 'lagoon-light-pigment';
const SHOT2_APP_THEME_ID = 'grove-dark-juicy';
const SHOT2_EDIT_THEME_ID = 'ember-light-juicy';

/**
 * The collection in an interleaved order (hue and light/dark change from one
 * card to the next) instead of the built-in family-by-family order, so the
 * first visible rows show variety. Stored the way the real extension stores
 * it: through setCollection(), which also sets collectionSeeded = 1.
 */
async function seedVariedCollection(): Promise<void> {
  const families = ['rosewater', 'harbor', 'lagoon', 'ember', 'grove', 'plum'];
  const variationShift = [0, 0, 1, 2, 0, 1];
  const variations = ['juicy', 'pigment', 'subtle'];
  const factions = ['dark', 'light'];
  const ordered: ThemeFile[] = [];
  for (let row = 0; row < 6; row++) {
    families.forEach((family, f) => {
      const faction = factions[(row + f + 1) % 2];
      const variation = variations[(Math.floor(row / 2) + variationShift[f]) % 3];
      ordered.push(findPreset(`${family}-${faction}-${variation}`));
    });
  }
  if (new Set(ordered.map((t) => t.id)).size !== PRESETS.length) throw new Error('harness: collection order is not a permutation');
  await setCollection(ordered, getFamilies());
}

function findPreset(id: string): ThemeFile {
  const t = PRESETS.find((p) => p.id === id);
  if (!t) throw new Error(`harness: unknown preset id ${id}`);
  return t;
}

async function main(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot') ?? '0';
  const variant = params.get('theme') === 'light' ? 'light' : 'dark';
  // Shot 2 puts the app in one theme and opens a different one in the editor.
  const globalThemeId =
    shot === '2' ? params.get('app') ?? SHOT2_APP_THEME_ID : variant === 'light' ? LIGHT_THEME_ID : DARK_THEME_ID;
  const globalTheme = findPreset(globalThemeId);
  const isDarkApp = globalTheme.faction === 'dark';
  const dataThemeId = isDarkApp ? 'crystal-dark' : 'crystal-light';

  // Paint the "native" baseline the same as the theme we are about to enable,
  // so there is no flash of an unrelated theme before activate() + apply()
  // run (mirrors how Nimbalyst's own engine has already painted by the time
  // any extension mounts).
  const html = document.documentElement;
  const nativeVars = resolveTheme(globalTheme).vars;
  for (const [name, value] of Object.entries(nativeVars)) html.style.setProperty(name, value);
  html.setAttribute('data-theme', dataThemeId);
  html.classList.toggle('dark-theme', isDarkApp);
  html.classList.toggle('light-theme', !isDarkApp);

  const context = createFakeExtensionContext();
  activate(context);
  installFakeProjectBridge(variant);
  await seedVariedCollection();

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
    const editId = params.get('edit') ?? SHOT2_EDIT_THEME_ID;
    const content = editId === 'harbor-fog-sample' ? JSON.stringify(harborFogSample, null, 2) : serializeThemeFile(findPreset(editId));
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
