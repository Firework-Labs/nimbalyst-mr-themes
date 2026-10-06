# Mr. Themes Toolkit (Family Builder Kit for Agents)

Lets an AI agent design a Nimbalyst color theme (or a six-theme family) from
a user's request, check it for internal consistency, contrast/legibility and
information hierarchy, preview it for the user **without** loading it into
Nimbalyst, and produce a file the user imports into Mr. Themes (Theme
Families → Import family, or Theme Collection → Import theme). The previews
exist because the extension's own theme previews don't show every component
or enough specificity to troubleshoot edge cases — these do.

**Downloaded kit vs. source.** Mr. Themes writes this kit into a project as
`mr-themes-family-builder-kit/` (Theme Families → Download Family Builder Kit
for Agents). That copy ships the prebuilt `lib/` but not `src/` or
`build.mjs`, which only exist in the Mr. Themes repository (`toolkit/`);
everything an agent needs (`AGENT.md`, `reference/`, `templates/`, `cli/`,
`preview/`) works without them. Needs Node 18 or later for the CLI.

## Folder map

- `AGENT.md` — **start here if you're the agent designing a theme.** The
  step-by-step guide: file schemas, the generator vs. hand-authoring, the
  iteration loop, the assessment checklist, and how to hand off the result.
- `reference/` — the component inventory, app-shell geometry, all 75
  variables, and the edge-case checklist that the preview pages are built
  from (`components.md`, `layout.md`, `variables.md`, `edge-cases.md`).
- `templates/` — starting points for hand-authored themes
  (`theme-dark.nimtheme`, `theme-light.nimtheme`), all 20 core keys
  pre-filled from Nimbalyst's own base themes.
- `preview/` — seven `file://`-safe HTML pages (hub, full app shell,
  component specimen sheet, contrast audit, family comparison, all-75-tokens,
  edge cases) that render whatever `mrthemes preview <file>` last loaded into
  `preview/data/current.js`. See `preview/assets/preview.js` for how data
  loading and theme switching work.
- `src/`, `lib/`, `build.mjs` (source workspace only; a downloaded kit has just `lib/`) — the library: `src/` re-exports the Mr.
  Themes extension's own theme model, generator, and contrast tooling, plus
  this toolkit's own larger audit (`src/audit.ts`); `build.mjs` bundles it
  into the committed `lib/mr-themes-core.js` (browser) and `.mjs` (Node)
  artifacts everything else imports.
- `cli/mrthemes.mjs` — the command-line tool (`generate`, `audit`, `fix`,
  `validate`, `preview`, `export`).
- `work/` — scratch output for generated/exported files; not meant to be
  handed to a user directly (use `mrthemes export` for that).

## Quick start

```bash
node cli/mrthemes.mjs generate --name "Tidepool" --dominant sky --pops cyan,indigo,amber,rose --neutral slate --out work/tidepool.nimfamily
node cli/mrthemes.mjs audit work/tidepool.nimfamily
node cli/mrthemes.mjs preview work/tidepool.nimfamily
open preview/index.html   # or hand the user the path
```

## Library and CLI

This toolkit is a thin, tested layer over the Mr. Themes extension's own
theme model, generator and contrast tooling (`../src/`, the root of the Mr. Themes repository).
It never modifies that project — it only imports from it — so the extension
can keep evolving in its own repo while this toolkit tracks it.

### Layout

- `src/core.ts` — single entry point, re-exports the theme model
  (`themeSpec.ts`), the family generator (`families.ts`), the legacy 17-check
  audit and repair (`contrast.ts`), color helpers (`color.ts`), the Tailwind
  palette (`tailwind.ts`), the import/export format (`collection.ts`), and
  this toolkit's own `src/audit.ts`.
- `src/audit.ts` — `fullAudit`, `familyAudit`, `summarize`: a much larger
  check set than the extension's built-in 17, covering every surface pairing
  the app actually renders, translucent state layers composited over their
  real backdrop, code/terminal tokens, and a "hierarchy" pass for things WCAG
  pairs alone don't catch (indistinct surfaces, status colors sharing a hue,
  a "disabled" color that's actually readable).
- `build.mjs` — bundles `src/core.ts` with esbuild (resolved from
  the extension's `node_modules` at the repository root; nothing is
  npm-installed in this toolkit) into two **committed** artifacts:
  - `lib/mr-themes-core.js` — browser IIFE, global `MrThemes`, for pages
    opened straight from `file://`.
  - `lib/mr-themes-core.mjs` — platform-neutral ESM, for Node and the CLI.

  Run `node build.mjs` after changing `src/`, or after the Theme Editor's
  source changes underneath this toolkit. The `lib/` files are checked in so
  the toolkit works standalone even without the extension sources present.
- `cli/mrthemes.mjs` — the command-line tool, pure Node ESM with no
  dependencies, importing only `lib/mr-themes-core.mjs`.

### Build

```bash
cd toolkit    # inside the Mr. Themes repository
node build.mjs
```

### Commands

```
mrthemes hues
```
Lists color hues and neutral hues from the Tailwind palette this toolkit
generates from.

```
mrthemes generate --name "Tidepool" [--id tidepool] --dominant sky \
  --pops cyan,indigo,amber,rose --neutral slate [--description "..."] \
  [--out work/<id>.nimfamily]
```
Builds the six variants (light/dark × subtle/pigment/juicy) via
`generateFamilyThemes` and writes a `.nimfamily` file. Defaults to
`work/<id>.nimfamily`.

```
mrthemes audit <file> [--json] [--all]
```
Accepts `.nimtheme` or `.nimfamily` (anything `parseImport` accepts). Prints
per-theme pass/warn/fail counts and every non-pass check as an aligned table
(id, label, ratio/target, severity); `--all` also prints passing checks.
Families additionally get a `familyAudit` pass (expected variants present,
unique ids, primary hue consistency, faction contrast bands, per-theme fail
rollup). Exits 1 if any check is a `fail`.

```
mrthemes fix <file> [--out <path>]
```
Applies `fixContrast` (from the extension's `contrast.ts`) to every theme in
the file and writes the result back (or to `--out`), reporting which core
color keys changed per theme. Note: `fixContrast` only repairs the 17 legacy
checks that map to a core color key — it does not touch extended/derived
colors (e.g. a marginal terminal ANSI contrast miss), so `audit` can still
show failures after a `fix`.

```
mrthemes validate <file>
```
Parses and normalizes the file, reports theme count, family/generator info,
and — per theme — how many core/extended keys were set explicitly vs.
derived. Exits 1 on a parse error.

```
mrthemes preview <file>
```
Writes `preview/data/current.js` (`window.MR_THEMES_DATA = { source, family,
themes, generatedAt }`); resolution and auditing happen in the preview page
itself via the browser IIFE lib. Prints the absolute path to
`preview/index.html` (the page itself is built separately).

```
mrthemes export <file> --out <path>
```
Canonical re-serialization: a single theme goes through `serializeThemeFile`
to `.nimtheme`; a family goes through `serializeFamilyFile` to `.nimfamily`.
This re-orders keys to the canonical `EXTENDED_KEYS` order (verified
order-independent-equal to the source in testing) — it is the file to hand a
human for Mr. Themes (Import family for a `.nimfamily`, Import theme for a
`.nimtheme`).

```
mrthemes help
```
Usage summary (also shown with no arguments).
