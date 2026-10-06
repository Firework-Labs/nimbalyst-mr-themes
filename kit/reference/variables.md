# Theme variable reference (75 keys)

Source of truth: Mr. Themes `src/themeSpec.ts` (`CORE_KEYS`, `EXTENDED_KEYS`, `LABELS`, `GROUPS`, `deriveExtended`). Contrast targets from Mr. Themes `src/families.ts` (`TARGET`) and the audited pairs in `contrast.ts` (`auditTheme`). Component references point at names defined in `components.md`.

**How derivation works:** a `.nimtheme` file supplies 20 core colors (manifest themes can *only* supply these). Every extended key is either explicit in the file's `extended` block, or computed by `deriveExtended(core, isDark)` from the core palette. `resolveTheme()` marks each extended key `derived` unless the theme file set it explicitly. When you design a theme, assume extended keys are derived unless you say otherwise — the preview pages should show the derived value so an agent can see what "unset" looks like.

**Translucency and compositing note:** `contrastRatio()` in `color.ts` composites a translucent *background* onto **white**, not onto its real parent surface, before measuring. This means the audited ratios for anything drawn on `bg-selected`, `bg-hover`, `terminal-selection`, `highlight-bg`, `diff-*-bg`, or `toolbar-active` do not reflect how the color actually looks once composited over a dark `bg`. Treat those rows as approximate; the preview pages must render the real composite (see `edge-cases.md`).

## Legend

- **C/E** — Core (supplied in `.nimtheme` `colors`) or Extended (in `extended`, or derived).
- **Target** — contrast target from `TARGET` in `families.ts`: text 7, muted/faint/link/accent/status/code 4.5, comment 3.5, disabled ≈2.3 (deliberately low — see edge-cases), status-under-white (pill) 3, non-text UI 3 (not numerically enforced by the audit script, but the WCAG non-text convention Mr. Themes should still honor for borders/focus rings).
- **Translucent** — value is `rgba(...)` or built with `withAlpha()`; flagged with the surface(s) it composites over in practice.

## Surfaces (core)

| Key | CSS var | Label | C/E | Derivation when unset | Appears in | Drawn against | Target |
|---|---|---|---|---|---|---|---|
| `bg` | `--nim-bg` | Background | C | — | App base background: `settings-view-main`, `settings-view`, editor content area, `workspace-welcome`, tracker card fill (`.tracker card` bg), Theme Editor `.nte-head`/`.nte-scene`, table-cell (derived) | itself is the base; everything else is measured against it | — |
| `bg-secondary` | `--nim-bg-secondary` | Background, secondary | C | — | `navigation-gutter`, `nav.project-rail`/`pt-rail`, `workspace-sidebar`, `tracker-sidebar`, `session-history`, `window-top-bar`, `settings-view-header`, `settings-sidebar-item` hover fallback, tracker column background, feeds `code-bg`, `table-header`, `terminal-bg`, `terminal-cursor-accent` | — | — |
| `bg-tertiary` | `--nim-bg-tertiary` | Background, tertiary | C | — | rail tile fill (`.pt-tile`), `.pt-close`/`.pt-divider-add` chip fill, secondary/ghost buttons (`.pt-btn`, `.nte-btn`), settings value chips, feeds `table-stripe` | — | — |
| `bg-hover` | `--nim-bg-hover` | Hover | C | — (native default is translucent `rgba(0,0,0,.05)`/`rgba(255,255,255,.05)`) | Hover state for file-tree rows, `settings-sidebar-item`, gutter `nav-button`, `.pt-item`, `.nte-btn`, `.pt-add`, agent bash-widget hover, toolbar hover (`toolbar-hover` derives from this) | **Translucent.** Composites over whichever surface it sits on — `bg`, `bg-secondary`, or `bg-tertiary` — so it must stay visible on all three | non-text UI (should read ≥3:1 against its surface once composited) |
| `bg-selected` | `--nim-bg-selected` | Selected | C | — (native default `rgba(primary, .1–.15)`) | Selected file-tree row, selected `settings-sidebar-item`, selected code editor line, `.nte-pickerpop .sel`, feeds `terminal-selection` | **Translucent**, built as `withAlpha(primary, selectedAlpha)` (0.1–0.24 depending on variation) in generated presets. Composites over `bg`/`bg-secondary`/`code-bg` | non-text UI |
| `bg-active` | `--nim-bg-active` | Active | C | — | Pressed/active rows, `.pt-toggle`/`.nte-toggle` track (off state), "active" demo swatch in previews | Usually opaque in generated presets, but native default is `rgba(59,130,246,.2)` (light) — can be translucent | non-text UI |
| `border` | `--nim-border` | Border | C | — | Nearly every 1px divider: rail, gutter, tabs, settings sidebar, tables, cards; feeds `code-border`, `code-gutter`, `table-border`, `quote-border`, `toolbar-border` | measured against whichever surface the border sits on (`bg`, `bg-secondary`, `bg-tertiary`) | non-text UI (~3:1 recommended; not numerically audited) |
| `border-focus` | `--nim-border-focus` | Focus ring | C | — | Focused input outline (`.pt-input:focus`, `.nte-input:focus`), project-rail active tile `box-shadow: inset 0 0 0 1px`, `focus-visible:outline` rings on gutter buttons (those actually use `primary`, see edge-cases) | against `bg`/`bg-secondary` | non-text UI |
| `primary` | `--nim-primary` | Primary | C | — | Active gutter/mode button fill, primary buttons, badges, project-rail active ring, `border-focus` fallback in generated presets (`'border-focus': primary`), terminal cursor & ansi-blue | on `bg` (text/icon use) | accent 4.5 (`primary-bg` row) |
| `primary-hover` | `--nim-primary-hover` | Primary hover | C | — | Hover state of primary buttons and the active nav-button (`hover:bg-nim-primary-hover`) | — | — |
| `link` | `--nim-link` | Link | C | — | Markdown links, Settings "docs" link, breadcrumb buttons (`.nte-breadcrumb button`) | on `bg` | link 4.5 |
| `link-hover` | `--nim-link-hover` | Link hover | C | — | Hover/visited state of links | — | — |
| `success` | `--nim-success` | Success | C | — | Status pills/badges, contrast-grade "AAA/AA" text in Theme Editor footer, tracker "Done" column badges; feeds `diff-add-bg/border`, `terminal-ansi-green` | text-on-bg AND white-on-fill (dual) | status 4.5 (text) / statusUnderWhite 3 (pill) |
| `warning` | `--nim-warning` | Warning | C | — | Status pills, Theme Editor "AA-large" grade text; feeds `highlight-bg/border`, `comment-mark`, `terminal-ansi-yellow` | dual | 4.5 / 3 |
| `error` | `--nim-error` | Error | C | — | Status pills, danger buttons (`.pt-btn` border/text, Reset button), Theme Editor "fail" grade; feeds `diff-remove-bg/border`, `terminal-ansi-red` | dual | 4.5 / 3 |
| `info` | `--nim-info` | Info | C | — | Info badges/pills (tracker "Backlog" in the sample), link-adjacent status use | dual | 4.5 / 3 |

## Text (core)

| Key | CSS var | Label | C/E | Derivation | Appears in | Drawn against | Target |
|---|---|---|---|---|---|---|---|
| `text` | `--nim-text` | Text | C | — | Primary body text everywhere; feeds `code-text`, `terminal-fg` | `bg`, `bg-secondary` | 7 (rows `text-bg`, `text-bg2`) |
| `text-muted` | `--nim-text-muted` | Muted text | C | — | Secondary text, gutter icon rest color (`text-nim-muted`), settings row labels; feeds `quote-text` | `bg`, `bg-tertiary` | 4.5 (`muted-bg`, `muted-bg3`) |
| `text-faint` | `--nim-text-faint` | Faint text | C | — | Metadata, section labels (`.workspace-section-label`), placeholders, empty-state hints; feeds `scrollbar-thumb` | `bg` | 4.5 (`faint-bg`) |
| `text-disabled` | `--nim-text-disabled` | Disabled text | C | — | Disabled buttons/inputs, disabled tracker items | `bg` | ≈2.3 (deliberately low — must look disabled, not just muted; see edge-cases) |

## Accents (core + extended)

| Key | CSS var | Label | C/E | Derivation | Appears in | Drawn against | Target |
|---|---|---|---|---|---|---|---|
| `primary` / `primary-hover` / `link` / `link-hover` | — | (listed above) | C | — | — | — | — |
| `on-primary` | `--nim-on-primary` | Text on primary | E | `onColor(primary)` — picks `#111827` (dark) or `#f8fafc` (light), whichever contrasts more with `primary` | Text/icon on primary-filled buttons, badges (`.pt-badge`), toggle knob "on" state, active gutter icon | on `primary` | 4.5 (`on-primary` row, re-verified up to 3 shade-steps in `buildTheme`) |
| `purple` | `--nim-purple` | Purple accent | E | Fixed per faction if unset (`#a78bfa` dark / `#7c3aed` light); generated presets tint a purple-ish pop hue | "purple accent" text sample in Settings preview, available as a 5th accent for extension UI | on surfaces | accent 4.5 |

## Status (core, see Surfaces table for the 4 base colors)

Each status color has a **dual target**: readable as text on `bg` (4.5) and readable as white text on itself as a fill (3, "pill"). `dual()` in `families.ts` walks a fine-grained ladder to satisfy both; `matte()` then desaturates toward neutral for `subtle`/`pigment` variations without breaking either target.

## Code blocks (extended)

| Key | CSS var | Label | Derivation when unset | Appears in | Drawn against | Target |
|---|---|---|---|---|---|---|
| `code-bg` | `--nim-code-bg` | Code background | `= bg-secondary` | `<pre>` fill, Monaco-style editor background, inline `<code>` bg | — | — |
| `code-text` | `--nim-code-text` | Code text | `= text` | Default code token color, punctuation fallback | `code-bg` | code 4.5 |
| `code-border` | `--nim-code-border` | Code border | `= border` | `<pre>` border, inline `<code>` border | `code-bg` | non-text |
| `code-gutter` | `--nim-code-gutter` | Code gutter | `= border` | Line-number column background in code editor | — | — |
| `code-comment` | `--nim-code-comment` | Comment | Fixed VS-Code-like default (`#6a9955` dark / `#008000` light) unless generated; presets compute via `walk(neutral, 500, [code-bg], 3.5, dark)` | `// comment` tokens | `code-bg` | **comment 3.5 — lowest of all code targets; flag as fragile** |
| `code-punctuation` | `--nim-code-punctuation` | Punctuation | Fixed default; presets: `walk(neutral, …, code, dark)` | Brackets, semicolons, operators-adjacent punctuation | `code-bg` | 4.5 |
| `code-property` | `--nim-code-property` | Property | Fixed default; presets: tint of pop hue #3 | Object properties / type annotations | `code-bg` | 4.5 |
| `code-selector` | `--nim-code-selector` | Keyword / selector | Fixed default; presets: tint of the family's dominant hue | Keywords (`const`, `import`, `export function`) | `code-bg` | 4.5 |
| `code-operator` | `--nim-code-operator` | Operator | Fixed default; presets: `= muted` (text-muted) | `=`, `.`, generic punctuation glue | `code-bg` | 4.5 |
| `code-attr` | `--nim-code-attr` | String / attribute | Fixed default; presets: tint of pop hue #1 | String literals, JSX attributes | `code-bg` | 4.5 |
| `code-variable` | `--nim-code-variable` | Variable | Fixed default; presets: tint of pop hue #2 | Identifiers/variables | `code-bg` | 4.5 |
| `code-function` | `--nim-code-function` | Function | Fixed default; presets: tint of pop hue #0 | Function names/calls | `code-bg` | 4.5 |

Note: `deriveExtended()`'s built-in fallback for the 8 syntax-token colors is a **fixed VS Code palette** unrelated to the core theme (`CODE_TOKENS_DARK`/`CODE_TOKENS_LIGHT`), so a hand-authored theme that only sets core colors can get syntax colors that clash with its hue family. The preset generator (`families.ts`) always overrides these with hue-matched, contrast-verified values — call this out to whoever builds themes without going through `buildTheme()`.

## Tables and toolbars (extended)

| Key | CSS var | Derivation when unset | Appears in | Drawn against | Target |
|---|---|---|---|---|---|
| `table-border` | `--nim-table-border` | `= border` | Markdown table cell/header borders | surfaces | non-text |
| `table-header` | `--nim-table-header` | `= bg-secondary` | `<th>` fill | — | — |
| `table-cell` | `--nim-table-cell` | `= bg` | Even row fill | — | — |
| `table-stripe` | `--nim-table-stripe` | `= bg-tertiary` | Odd row fill (zebra striping) | — | — |
| `toolbar-bg` | `--nim-toolbar-bg` | `= bg` | Tab bar / toolbar background | — | — |
| `toolbar-border` | `--nim-toolbar-border` | `= border` | Toolbar bottom border | — | — |
| `toolbar-hover` | `--nim-toolbar-hover` | `= bg-hover` | Toolbar button hover (e.g. the "⋯" menu) | **Translucent** (inherits bg-hover's translucency) | non-text |
| `toolbar-active` | `--nim-toolbar-active` | `withAlpha(link, 0.2)` (juicy variation overrides to `withAlpha(primary, 0.25)`) | Active tab pill background (`README.md` tab in `previews.tsx`) | **Translucent**, composites over `toolbar-bg` | non-text |

## Highlights, quotes, diffs, scrollbars (extended)

| Key | CSS var | Derivation when unset | Appears in | Drawn against | Target |
|---|---|---|---|---|---|
| `highlight-bg` | `--nim-highlight-bg` | `withAlpha(warning, 0.2)` | Markdown `<mark>` highlight fill | **Translucent**, over `bg`/`bg-secondary`/`bg-selected` (see edge-cases: "highlight over selected") | non-text |
| `highlight-border` | `--nim-highlight-border` | `withAlpha(warning, 0.4)` | `<mark>` border | **Translucent** | non-text |
| `comment-mark` | `--nim-comment-mark` | `mix(warning, white/black, 0.45 dark / 0.1 light)` | Reviewer "comment" mark on text (rendered with fixed dark text `#111` in the sample UI, not `on-color`) | text drawn on it is hardcoded dark — **flag as edge case if `comment-mark` ends up dark itself** | none audited |
| `quote-text` | `--nim-quote-text` | `= text-muted` | Blockquote text | `bg`/`bg-secondary` | 4.5 (inherited from muted, not separately audited) |
| `quote-border` | `--nim-quote-border` | `= border` | Blockquote left border | — | — |
| `scrollbar-thumb` | `--nim-scrollbar-thumb` | `= text-faint` | Scrollbar thumb (`.nim-scrollbar`) | `bg`/`bg-secondary` | non-text; not separately audited — can be as low-contrast as `text-faint` allows |
| `scrollbar-thumb-hover` | `--nim-scrollbar-thumb-hover` | `= text-muted` | Scrollbar thumb hover | — | — |
| `scrollbar-track` | `--nim-scrollbar-track` | `'transparent'` (always, in generated presets) | Scrollbar track | — | — |
| `diff-add-bg` | `--nim-diff-add-bg` | `withAlpha(success, 0.15)` | Added-line background in diff view | **Translucent**, over `bg` (native app default has `diff-add-bg === diff-add-border`, i.e. no visible border — see edge-cases) | non-text |
| `diff-add-border` | `--nim-diff-add-border` | `withAlpha(success, 0.4)` | Added-line border | **Translucent** | non-text |
| `diff-remove-bg` | `--nim-diff-remove-bg` | `withAlpha(error, 0.15)` | Removed-line background | **Translucent** | non-text |
| `diff-remove-border` | `--nim-diff-remove-border` | `withAlpha(error, 0.4)` | Removed-line border | **Translucent** | non-text |

## Terminal (extended, 20 keys)

| Key | CSS var (no `--nim-` prefix) | Derivation when unset | Appears in | Target |
|---|---|---|---|---|
| `terminal-bg` | `--terminal-bg` | `= bg-secondary` | Bottom terminal panel background | — |
| `terminal-fg` | `--terminal-fg` | `= text` | Default terminal text | on `terminal-bg`, ~7 by inheritance |
| `terminal-cursor` | `--terminal-cursor` | `= primary` | Block cursor fill | non-text |
| `terminal-cursor-accent` | `--terminal-cursor-accent` | `= bg-secondary` | Text color drawn *inside* the cursor block | on `terminal-cursor` |
| `terminal-selection` | `--terminal-selection` | `= bg-selected` | Selected-text highlight in terminal | **Translucent** (inherits `bg-selected`), over `terminal-bg` |
| `terminal-ansi-black` | `--terminal-ansi-black` | Fixed: `#000000` dark / `#1f2937` light (NOT derived from core) | ANSI color 0 | **Not contrast-audited — can vanish on a dark `terminal-bg`; flag in edge-cases** |
| `terminal-ansi-red` | `--terminal-ansi-red` | `= error` | ANSI 1 | not audited against `terminal-bg` |
| `terminal-ansi-green` | `--terminal-ansi-green` | `= success` | ANSI 2, prompt arrow `➜` in sample | not audited |
| `terminal-ansi-yellow` | `--terminal-ansi-yellow` | `= warning` | ANSI 3, `warn` label in sample | not audited |
| `terminal-ansi-blue` | `--terminal-ansi-blue` | `= primary` | ANSI 4 | not audited |
| `terminal-ansi-magenta` | `--terminal-ansi-magenta` | Computed per faction (`#a855f7`/`#7e22ce`) unless `juicy` override picks a pop hue | ANSI 5 | not audited |
| `terminal-ansi-cyan` | `--terminal-ansi-cyan` | Computed per faction (`#06b6d4`/`#0e7490`) unless `juicy` override | ANSI 6, prompt project-name color in sample | not audited |
| `terminal-ansi-white` | `--terminal-ansi-white` | Fixed: `#ffffff` dark / `#e5e7eb` light | ANSI 7 | **Not audited — can vanish on a light `terminal-bg`** |
| `terminal-ansi-bright-black` … `bright-white` (8 keys) | `--terminal-ansi-bright-*` | `adjust(base, +0.25 dark / -0.15 light)` of the matching non-bright color (bright-black and bright-white are fixed, same pattern as their non-bright counterparts) | ANSI 8–15 | not audited |

**None of the 16 ANSI colors are covered by `auditTheme()`.** This is the single largest audit gap and should be a headline item in `edge-cases.md`.

## Summary counts

- 20 core keys, all directly authorable in a `.nimtheme` / manifest theme.
- 55 extended keys: 8 have simple 1:1 derivations from a core key (`code-text`, `code-border`, `code-gutter`, `table-border`, `table-header`, `table-cell`, `table-stripe`, `toolbar-bg`, `toolbar-border`, `toolbar-hover`, `quote-text`, `quote-border`, `scrollbar-thumb`, `scrollbar-thumb-hover`, `terminal-bg`, `terminal-fg`, `terminal-cursor`, `terminal-cursor-accent`, `terminal-selection`, `terminal-ansi-red/green/yellow/blue` — 21 total 1:1 copies), 9 are `withAlpha()`/`mix()` composites of a core color (translucent or blended), and the remaining ~25 (8 code-syntax tokens, `on-primary`, `purple`, terminal ansi-black/white/magenta/cyan and their 8 bright variants) have their own fixed or hue-computed defaults independent of a simple copy.
- 9 keys are translucent by default or in generated presets: `bg-hover`, `bg-selected`, `toolbar-hover`, `toolbar-active`, `highlight-bg`, `highlight-border`, `diff-add-bg`, `diff-add-border`, `diff-remove-bg`, `diff-remove-border`, `terminal-selection` (11, not 9 — see table above for the exact list and what each composites over).
