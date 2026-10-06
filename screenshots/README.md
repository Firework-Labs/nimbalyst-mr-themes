# Marketplace screenshots

`com.fireworklabs.theme-editor-0-{dark,light}.png`, `-1-{dark,light}.png` and
`-2-{dark,light}.png`, 2048×1480 PNG (Nimbalyst's own marketplace size).

| Shot | What it shows |
| --- | --- |
| 0 | The Theme Gallery: header, the "Theme usage" tray with the demo projects, and the top of the Theme Collection grid. |
| 1 | The Theme Gallery scrolled down to "Theme Families", with the Harbor family expanded to show its themes. |
| 2 | The `.nimtheme` Theme Editor open on a sample theme: color controls on the left, the live isolated preview and the contrast audit on the right. |

## What these are, honestly

The window chrome (title bar, project rail slot, navigation gutter, file
column, tab bar) is a **hand-built replica**: plain HTML/CSS in
`harness/harness.html`, using Nimbalyst's real class names and geometry (see
`../docs/nimbalyst-internals.md`) so it reads as the real app, but it is not
the real app's code. Every color in it is a `var(--nim-*)` variable, the same
variables Nimbalyst writes onto `<html>`, so the extension's own applier
recolors it exactly as it recolors the real app.

Everything Mr. Themes itself draws is the **genuine extension code** from
`../src`, imported and run unmodified by `harness/harness.tsx`: the Theme
Gallery panel (shots 0 and 1), the `.nimtheme` editor with its preview and
contrast audit (shot 2), the applier that sets the theme variables, and the
gutter icon. It runs against a fake `ExtensionContext`, fake panel and editor
hosts (`harness/fakeHost.ts`: in-memory configuration, storage and
filesystem), and a stub of the Mr. Projects companion bridge
(`window.__nimbalystProjectTheme`, `harness/demoData.ts`) so the usage tray
has projects to show. The presets, the Harbor family and the sample theme are
the real built-in data from `../src/presets.ts` and
`../design/samples/harbor-fog.nimtheme`.

No real project names or paths appear anywhere. The demo projects are Atlas
API (the open one), Field Notes, Orchard and Lighthouse, under
`/Users/demo/Projects/...`. The rail initials in the replica are AA, FN, OR
and LH; the editor's own preview draws its mini rail as AT, FN, OR and LH,
which is the extension's built-in preview content.

## Rebuilding

```bash
npm run screenshots:build   # esbuild bundles harness.tsx -> harness/dist/harness.js
```

Re-run this after any change to `harness.tsx` or to `../src`: the bundle
inlines the real extension source at build time, so it goes stale otherwise.
`harness/build.mjs` aliases three SDK dependencies the extension never uses
(`@nimbalyst/runtime`, `yjs`, `y-protocols/awareness`) and `src/kit.ts` to
small stubs in `harness/stubs/`, so the bundle resolves in a plain browser.

## Recapturing

Open `screenshots/harness/harness.html` with the Nimbalyst browser MCP tools
(`browser_open_local_preview` returns the `nim-preview://...` URL to use;
append the query string to it). Open the session at a viewport of **2048×1480
CSS px**, then set a 2x page zoom before each screenshot so the 1024×740
replica renders crisp at the full marketplace size:

```
browser_open_session({ url: "<nim-preview URL>/harness.html?shot=2&theme=dark", width: 2048, height: 1480 })
browser_evaluate({ script: "document.documentElement.style.zoom = '2'" })
browser_screenshot(...)
```

Check the result with `sips -g pixelWidth -g pixelHeight`; expect 2048×1480.
A plain 1024×740 viewport yields a 1x image of 1024×740, which is too small.

Navigate between shots in one session with `browser_navigate` (same URL,
different query string). The zoom is per page load, so set it again after
each navigation.

Query params (read in `harness/harness.tsx`):

- `shot=0` (default): the Theme Gallery at the top of the page.
- `shot=1`: the same gallery mount, scrolled to "Theme Families" with a
  family expanded. The harness does not do the scroll or the expansion
  itself: after load, run `browser_evaluate` to scroll the gallery's scroll
  container to the "Theme Families" section head and click the Harbor family
  header to expand it, then capture.
- `shot=2`: the `.nimtheme` Theme Editor on a sample theme. Dark opens the
  real `harbor-fog.nimtheme` sample file; light opens the built-in Harbor
  Light Pigment preset serialized through the real file serializer. The file
  name is kept short (`theme.nimtheme`) so the header line
  "Dark theme · theme.nimtheme" fits.
- `theme=dark|light`: which built-in preset is applied globally (Plum Dark
  Juicy or Lagoon Light Pigment), which recolors the whole replica window
  through the real applier. Default is dark.

For shot 2 the replica's file column is hidden (CSS keyed on
`html[data-shot="2"]` in `harness.html`). With it shown, the editor gets only
about 700 CSS px and its header collides: the "Dark theme · file name" line
overlaps the Dark toggle and the description is cut off. Hiding the column
gives the editor the width it has in the real app with the file tree
collapsed.

## Known deviations from the real app

- **Window chrome is fabricated**: the title bar, rail, gutter icons, file
  column and tab bar are plausible placeholders, not DOM from a running
  Nimbalyst. Everything inside the Gallery panel and the editor is real.
- **The Theme Gallery is a fullscreen panel in the real app**, and the
  harness mounts it inside the replica's main column instead, so shots 0 and
  1 show it beside the rail and gutter. It is the same component.
- **Material Symbols font.** The extension's icon glyphs are ligature names
  rendered with Google's Material Symbols Outlined (Apache-2.0). The harness
  loads a local copy from `harness/assets/MaterialSymbolsOutlined-Regular.ttf`
  rather than fetching one, so icons render as they do in the app. The font is
  not in this repository (about 10 MB): download it from
  [google/material-design-icons](https://github.com/google/material-design-icons/tree/master/variablefont)
  and save it under that name before recapturing.
- **"Download Family Builder Kit for Agents" does nothing here**: the kit's
  files are embedded by a Vite-only `import.meta.glob`, which the harness
  bundler cannot evaluate, so `harness/stubs/kit.ts` exports an empty file
  list. The button renders normally; clicking it would write nothing.
- **Editor fields that are narrower than their content.** The editor's color
  list has fixed column widths in the extension itself, so in shot 2 the label
  "Background, secondary" shows as "Background, secon…" and the longest value
  inputs ("rgba(255, 255, 255, 0.08)" and similar) are cut off at the right.
  That is the extension's real layout at this width, not a harness effect.
- **The editor's scene preview is cramped at this width.** The mini window in
  the preview pane keeps its own minimum size, so in its middle column only a
  sliver of the editor mock is visible next to the chat panel. Also the real
  layout.
