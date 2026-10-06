# Mr. Themes

Create, preview, save, share, and apply Nimbalyst color themes, globally or per project. Ships with six theme families: 36 contrast-checked presets built on the Tailwind palette.

Extension id: `com.fireworklabs.theme-editor` (unchanged from the "Nimbalyst Theme Editor" days, so installs and saved themes carry over) · version 0.5.0
Companion: [Mr. Projects](https://github.com/Firework-Labs/nimbalyst-mr-projects) uses this extension's engine to switch themes per project, and this extension uses its bridge to assign themes to projects from the gallery.

> **Heads-up: Mr. Themes relies on Nimbalyst behavior that is not part of the extension SDK.** It applies themes by writing all 75 of Nimbalyst's color variables onto the app window and watching Nimbalyst's `data-theme` attribute, and it restyles its own gutter button. A Nimbalyst update can make themes apply only partly, or bring back the default gutter icon, until Mr. Themes is updated. Disabling or uninstalling it returns Nimbalyst to its own theme. Details in [Host hooks outside the SDK](#host-hooks-outside-the-sdk). Last verified on Nimbalyst 0.77.5.

## Install

1. Download `nimbalyst-mr-themes-<version>.zip` from the [latest release](https://github.com/Firework-Labs/nimbalyst-mr-themes/releases/latest) and unzip it somewhere permanent. Nimbalyst links to the folder rather than copying it, so do not delete or move it afterwards.
2. In Nimbalyst, open Settings › Extensions › Install from folder and choose the unzipped folder.
3. Optional: install [Mr. Projects](https://github.com/Firework-Labs/nimbalyst-mr-projects) the same way to give each project its own theme.

To build from source instead, see [Development](#development).

## What you get

- **Theme Gallery layout**, top to bottom: a header (72px Mr. Themes icon, "Mr. Themes", tagline, blurb); **Theme usage** (the global theme on its own tinted card, then each open project; each card is a thumbnail, a title and a picker); **Theme Collection** (every theme, family members included, each with a family chip and a **…** menu: use globally, use for a project, add to or move between families, edit, duplicate, export, delete; toolbar with search, All/Dark/Light/Mine, a Family themes show/hide chip, Capture current to Mr. Themes, Import theme, New theme); **Theme Families** (an accordion with Download Family Builder Kit for Agents, Import family, New family; each family header shows its five swatches, name, sub text and actions, and opens to its themes).
- **Collection and families.** The built-in presets are copied into your collection on first run (0.4.0), so every theme can be edited and deleted. Deleting a theme warns when it is in a family or in use (global or by a project). A theme belongs to at most one family (`family` field). Since 0.5.0 **New family** only groups existing themes: pick themes from the collection, give it a name and sub text, and choose its five header colors (suggested from the chosen themes, or any color). Edit changes the same things; delete keeps or deletes its themes. New themes for a family come from the Family Builder Kit, by import. **Restore built-ins** brings back deleted built-in themes and families without touching edited ones. **New theme** and **Duplicate** open unsaved; Save adds them, Cancel drops them. Model and pure operations: `src/collection.ts`.
- **Import theme** (Theme Collection) takes one `.nimtheme`; **Import family** (Theme Families) takes one `.nimfamily` (below). Each refuses the other kind with a pointer to the right button. File picker, drop, or paste. When ids already exist it offers Replace (keeps project assignments; the loop when iterating with the kit) or Import as copies. Families export as `.nimfamily`.
- **Download Family Builder Kit for Agents** writes `mr-themes-family-builder-kit/` into the current project (no save dialog in the extension API): the agent guide, reference inventory, templates, prebuilt library, CLI and preview pages from `toolkit/`. The kit is bundled as text (`src/kit.ts`, from `kit/`, refreshed by `npm run sync-kit`, which `npm run build` runs first); it adds about 330 KB to `dist/index.js`.
- **Theme Gallery** (fullscreen; the gutter button reads as Mr. Themes: icon from `graphic-assets/Theme-v2.svg` inlined in `src/themeIcon.ts`, and on hover Nimbalyst's big help tooltip with the one-line description, rebuilt in `src/helpTooltip.ts` because the host only offers it to its own buttons. The panel exports the SDK's `gutterButton`, and because Nimbalyst 0.77.5 kept its default button on a dev reinstall, the `GutterIcon` host component also dresses the host's button: swaps the symbol, drops the native title, attaches the tooltip). Choosing a theme here uses it **globally**, in every project. Under the header, a full-width **assignment tray** lists the Nimbalyst Global Theme first, then every open project in rail order (when Mr. Projects is installed), each with its theme thumbnail. A project that follows the global theme says so and shows the global thumbnail. Each tray card has a picker to set that scope's theme; every gallery card has "Use globally" and "Use for project…". Cards are tagged with what uses them: `Global` and/or the project names.
- **Six theme families**, each a dominant Tailwind hue with up to four pop hues and a neutral ladder. Every family has two factions (light, dark) and each faction three variations:
  - **Subtle** verges on monochrome. Surfaces sit mid-ladder (blacks are not very black, whites not very white), the accent is desaturated, pops appear only as low-saturation tints, and contrast stays at the lower end of what passes.
  - **Pigment** is deeper and more saturated, like ink on matte paper: tinted surfaces, darker darks and brighter brights than subtle, status colors pulled slightly toward the neutral.
  - **Juicy** uses bright saturated accents and pops, deep blacks and color-tinted off-blacks, bright whites and color-tinted off-whites, with pops in links, info, purple, code, terminal, highlights, and selection.
  - The Tailwind samples are a starting point, not a constraint: the generator mixes toward the neutral or toward black/white to reach each character, then verifies contrast.
- **Contrast audit** in every editor footer: 17 checks covering text on each surface, links, accent, status colors as text and as pill fills under white text. "All checks" lists them; "Fix contrast" nudges failing colors until they pass. All 36 presets pass every check.
- **Theme Editor** for `*.nimtheme` files: all 75 theme colors grouped, derived colors that follow the core palette, three preview screens, Try live, and Add to library.
- **Capture current**, **Import** from JSON, **Export** as JSON, as a `.nimtheme` file, or as a manifest-only theme extension.

## Families

| Family | Dominant | Pops | Neutral |
|---|---|---|---|
| Harbor | sky | cyan, indigo, amber, rose | slate |
| Grove | emerald | lime, teal, amber, orange | stone |
| Plum | violet | fuchsia, pink, sky, amber | zinc |
| Ember | orange | amber, red, yellow, cyan | stone |
| Rosewater | rose | pink, fuchsia, orange, teal | neutral |
| Lagoon | teal | cyan, emerald, lime, violet | gray |

Theme ids follow `<family>-<faction>-<variation>`, for example `harbor-dark-juicy`.

## How contrast is enforced

Colors come from the Tailwind v3 palette (`src/tailwind.ts`), whose 11-step ladders act as a lightness dial. For each role the generator (`src/families.ts`) starts at a preferred shade and walks the ladder away from the background until the role's target ratio is met: 7:1 for body text, 4.5:1 for muted, faint, links, accent, and code tokens, 3.5:1 for comments. Status colors have a dual target because Nimbalyst draws them both as text on the background and as pill fills under white text; the generator interpolates between shades to find a color that satisfies both (4.5:1 and 3:1). On-primary is chosen per theme and the accent is pushed a step if it cannot hold 4.5:1 under it.

The palette-building method follows the spirit of watermint's note on perceptual lightness steps: keep roles at fixed lightness levels so every family reads the same, and make light and dark factions symmetric.

## How it works

Nimbalyst's theme engine writes 75 CSS custom properties as an inline style on `<html>`. The extension manifest only lets an extension contribute 20 of them, so this extension applies a theme at runtime: an app-level host component writes the same variables and re-applies them whenever Nimbalyst repaints, writing only when a value differs (loop-safe). If you pick a native theme in Settings › Appearance while a custom theme is active, the extension steps aside with a toast.

### File format (`*.nimtheme`)

```json
{
  "id": "harbor-dark-juicy",
  "name": "Harbor Dark Juicy",
  "version": "2.0.0",
  "isDark": true,
  "tags": ["dark", "juicy", "harbor", "sky", "cyan", "indigo", "amber", "rose"],
  "colors": { "bg": "#0d1e33", "primary": "#38bdf8", "...": "the 20 core keys" },
  "extended": { "code-selector": "#7dd3fc", "terminal-ansi-magenta": "#818cf8" },
  "family": "harbor", "faction": "dark", "variation": "juicy",
  "format": 1
}
```

### Family file format (`*.nimfamily`)

```json
{
  "kind": "mr-themes/family",
  "format": 1,
  "family": { "id": "tidepool", "name": "Tidepool", "description": "…", "swatches": ["#2dd4bf", "#38bdf8", "#a3e635", "#fbbf24", "#fb7185"], "generator": { "dominant": "teal", "pops": ["sky", "lime"], "neutral": "slate" } },
  "themes": [ { "id": "tidepool-dark-subtle", "name": "…", "isDark": true, "colors": { "…": "…" } } ]
}
```

`swatches` (the five header colors) and `generator` are optional. Every theme in the file is filed under the file's family on import. Import family needs the `family` entry; Import theme takes a file with exactly one theme (`parseFamilyImport` / `parseThemeImport` in `src/collection.ts`). The [Mr. Themes Toolkit](toolkit/README.md) in this repository produces these files.

### Storage

Your collection (`userThemes`, all themes once `collectionSeeded` is 1), your families (`themeFamilies`), and the global theme are stored in the extension's user-scope configuration (with a localStorage mirror for zero-flash startup). Any `.nimtheme` file inside a project opens in the same editor.

### Bridges

- Provided: `window.__nimbalystThemeEditor` with `listThemes()`, `getTheme(id)`, `getEnabled()`, `getNativeTheme()`, `getActiveTheme()`, `apply(themeOrId, persist)`, `setOverride(themeOrId)`, `preview(theme)`, `getState()`, `subscribe(fn)`.
- Consumed: `window.__nimbalystProjectTheme` (from Mr. Projects) with `listProjects()`, `setProjectTheme(path, themeId)`, `subscribe(fn)`. The gallery polls briefly for it after mount, so extension load order does not matter.

## Host hooks outside the SDK

The extension SDK covers custom editors, panels, settings and file access, but not theming the whole app or restyling the gutter. Mr. Themes depends on these undocumented host behaviors (observed on Nimbalyst 0.77.5 with a probe extension; see `docs/nimbalyst-internals.md`):

- **Theme variables on `<html>`.** Nimbalyst writes its theme as 75 inline CSS custom properties (`--nim-*`, `--terminal-*`) on the root element; the manifest's `contributions.themes` accepts only 20 of them. Mr. Themes writes the same 75 properties from a host component, only when a value differs, and re-applies them when Nimbalyst repaints. If Nimbalyst renames or adds variables, a theme applies only partly until the key list in `src/themeSpec.ts` is updated.
- **`data-theme` on `<html>`.** A `MutationObserver` watches it to notice a native theme change (Settings › Appearance) and step aside with a toast.
- **The gutter button's markup.** The SDK's `gutterButton` panel option was not honored on 0.77.5, so `GutterIcon.tsx` finds the host-rendered button for the Theme Gallery panel (`div[data-gutter-item="com.fireworklabs.theme-editor.theme-library"]`), swaps its Material symbol for the Mr. Themes icon, removes its native `title`, and attaches a hover tooltip built with Nimbalyst's own `help-tooltip` class names (`src/helpTooltip.ts`). If the markup changes, the default icon and title come back; nothing else breaks.
- **`window.__nimbalystProjectTheme`.** Not a host hook but also outside the SDK: the bridge to Mr. Projects is a global object (`docs/bridge-contract.md`).

Mr. Themes does not use Nimbalyst's internal `window.electronAPI`. Disabling or uninstalling it restores Nimbalyst's own theme.

## Development

```bash
npm install
npm run build        # dist/index.js
```

Install with the Extension Developer Kit's `extension_install` tool or Settings › Extensions › Install from folder.

Source layout: `src/tailwind.ts` (palette), `src/families.ts` (family specs and the generator), `src/collection.ts` (families, import/export formats, pure collection operations), `src/contrast.ts` (audit and repair), `src/presets.ts` (the 36 generated presets), `src/themeSpec.ts` (the 75 keys, derivation, file format), `src/color.ts`, `src/applier.ts` (runtime engine and bridge), `src/projectBridge.ts`, `src/store.ts`, `src/components/*`.

Offline checks, no app needed:

```bash
npm test             # tests/collection.test.ts: import formats, family wizard, delete, restore, seeding
npm run audit        # scripts/audit-presets.ts: 17-check contrast audit of all 36 presets
```

## Repository layout

- `src/`, `tests/`, `scripts/`, `manifest.json`: the extension.
- `kit/`: generated copy of the toolkit's distributable files, bundled by `src/kit.ts`. Do not edit; edit `toolkit/` and build.
- `toolkit/`: the Mr. Themes Toolkit (Family Builder Kit for Agents) source. Its `src/` imports this extension's `src/`; `node toolkit/build.mjs` refreshes `toolkit/lib/`.
- `palette-lab/`: a downloaded kit plus the 2026-09-24/25 palette work: the OKLCH generator (`work/oklch-family.mjs`), the uicolors palettes it started from, review rounds, and seven finished families in `exports/`. Contact sheets are included; the per-round app screenshots are not.
- `docs/`: Nimbalyst internals, the dev workflow, the bridge contract with Mr. Projects, the palette taste the families were tuned to, and the marketplace listing draft.
- `screenshots/`: listing screenshots and the harness that renders them from the real extension code with demo data.

## Known limitations

- Monaco (code editor) syntax colors are not changed by a live theme; they only take effect through the exported theme extension route.
- Export writes into the current project folder (no native save dialog in the extension API).
- The high-contrast presets from v0.1 (Ink and Chalk, Chalk and Ink) were retired with the move to families; the juicy variations and the audit cover the readability goal, and any theme can be captured or imported.

## License

MIT, see `LICENSE`. The built-in palettes use the Tailwind CSS color palette (MIT, Tailwind Labs); see `THIRD-PARTY-NOTICES.md`.
