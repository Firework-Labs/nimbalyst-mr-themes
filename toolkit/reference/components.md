# Component inventory

Status tags: **OBSERVED** (seen in a probe report, `probe/reports/` in the Mr. Themes repository or read directly from extension source — cited) or **INFERRED** (reasonable guess from adjacent evidence, Tailwind/shadcn convention, or the existing `previews.tsx`; not confirmed against the live DOM). Treat INFERRED items as lower-confidence: build the preview page for them, but don't claim exact class names or pixel sizes.

All Nimbalyst-native classes below were captured on **Nimbalyst 0.77.5** with both Mr. Themes and Mr. Projects installed, so some DOM includes our own extension's elements (`pt-*`, `nte-*`) alongside native ones — noted per item. Report files are in `probe/reports/` in the Mr. Themes repository.

---

## 1. Window shell and layout row

**OBSERVED** — `report.json` (`topContentRow`, `ourRail`), memory note `nimbalyst-theme-and-rail-internals.md`.

- `div.window-top-bar` — `relative flex-none overflow-hidden text-nim bg-nim-secondary border-b border-nim [-webkit-app-region:drag]`. Uses `bg-secondary` fill, `border` bottom, `text` for `.window-top-bar__workspace-name`. Draggable title bar. Contains window control buttons (`window-top-bar__panel-button`, `__git`, `__create-primary`/`__create-caret`) all following the `nav-button`-like pattern: transparent bg, `text-nim-muted`/`text`, `focus-visible:outline` in `border-focus`.
- `[data-layout=workspace-row]` — flex row: project rail → navigation gutter → `[data-layout=main-column-container]` → `[data-layout=top-content-row]`.
- `[data-layout=top-content-row]` (`report.json`) — `flex-1 flex flex-row min-h-0`, holds `[data-layout=center-content-wrapper]` which switches between `files-mode-wrapper`, `agent-mode`, `tracker-mode`, `collab-mode`, `github-panel-shell` (pr-review) via `hidden`/`flex` toggling — only one mode's wrapper is visible at a time.

---

## 2. Project rail (Mr. Projects replacement; native hidden underneath)

**OBSERVED** — `report.json` (`ourRail`), Mr. Projects `src/styles.ts`.

The native `nav.project-rail` gets class `pt-native-hidden` (`display:none`) and Mr. Projects renders its own `pt-rail-host > nav.pt-rail[data-testid=project-theme-rail]`.

| Part | Selector | Size | Variables (state) |
|---|---|---|---|
| Rail container | `nav.pt-rail` (`.wide` modifier) | 56px normal / 88px wide | bg `bg-secondary`, border-right `border` |
| Project item | `.pt-item` | 48px / 80px wide, variable height | hover: `bg-hover`; `.active`: bg `bg-selected` + `box-shadow: inset 0 0 0 1px primary` |
| Tile (avatar) | `.pt-tile` | 40×40 / 56×56, radius 10/12 | bg `bg-tertiary`, text `text-muted`; inactive tiles sit at **opacity .4**, hover/focus → 1 (the "40% inactive tiles" feature) |
| Project name | `.pt-name` | 2-line clamp | `text-muted`; `.active` → `text`, bold |
| Close button | `.pt-close` | 18×18 circle, hidden until item hover | bg `bg-tertiary`, text `text-muted`, border `border`; hover → bg/border `error`, text white |
| Badge (session count) | `.pt-badge` | 16px pill | bg `primary`, text `on-primary`, border 2px `bg-secondary` (cutout ring) |
| Divider (hairline) | `.pt-rule` / `.pt-divider` | 1px line, 18px row | `border`; hover → `text-faint` |
| Divider label (heading) | `.pt-label` | pill, uppercase | bg `bg-tertiary`, text `text-muted`, border `border`; hover → text `text`, border `text-faint` |
| Divider/label delete "×" | `.pt-x` | 16px circle | same recipe as `.pt-close` |
| Add button | `.pt-add` | 40×40 / 56×44 | dashed border `border`, text `text-faint`; hover → text `text`, border `text-faint` |
| Drag-and-drop indicator | `.drop-before::before` / `.drop-after::after` | 2px bar | bg `primary` |
| Dragged item | `.is-dragging` | — | opacity .35 |
| Right-click/add menu | `.pt-menu` | 168px min-width popover | bg `bg`, border `border`, `box-shadow: 0 8px 24px rgba(0,0,0,.35)` (shadow is NOT a variable — hardcoded black, see edge-cases for dark-theme shadow visibility) |

---

## 3. Poster dock (Mr. Projects, top of left column)

**OBSERVED** — `report8.json` (`dock`, `gutterButton`), `report9.json` (`dockImgNatural`, `dockTitle`), Mr. Projects `src/styles.ts`.

- `.pt-dock-host` — full-width host injected as first child of whichever left-column container is visible (`workspace-sidebar` for Files, `session-history` for Agent, `tracker-sidebar` for Tracker).
- `.pt-dock` — padding, `border-bottom: 1px solid border`.
- `.pt-poster-frame` (`.banner` modifier forces 16:9; default is 1:1) — `background: bg-tertiary` (visible while the image loads or if it fails), `box-shadow: 0 4px 14px rgba(0,0,0,.25)` (hardcoded shadow, not a variable).
- `.pt-chip-sandboxed` — top-right pill, **hardcoded** `background: #16a34a`, white text (NOT theme-driven — always green regardless of theme, worth flagging: it will clash with `error`-red or `warning`-amber dominant families).
- `.pt-dock-gear` — bottom-right circular button, shown on poster hover only; `background: rgba(0,0,0,.5)` (hardcoded translucent black, not a variable — will look identical in every theme).
- `.pt-dock-open` ("Open in Finder") — full-width row button: border `border`, bg `bg-tertiary`, text `text-muted`; hover → bg `bg-hover`, text `text`.
- `.workspace-color-accent` (native per-project color strip) is force-hidden (`display: none !important`) once Mr. Projects is active.

---

## 4. Navigation gutter

**OBSERVED** — `report3.json` (`gutter`, full HTML dump), `report4.json`, `report9.json`, memory note.

- `.navigation-gutter` — 48px wide, full height, `bg-nim-secondary`, `border-r border-nim`.
- Four `.nav-section` groups, top to bottom:
  1. `.nav-content-modes` — Files/Agent/Tracker (PR-review is mounted but not shown as a gutter button in this capture). Each `div[data-gutter-item=<mode>] > .nav-mode-button-wrapper > button.nav-button[data-mode]`, 36×36, `rounded-md`.
     - Rest: `bg-transparent text-nim-muted`, hover → `bg-nim-tertiary text-nim`.
     - **Active** (e.g. Agent mode in the capture): `active bg-nim-primary text-nim-on-primary hover:bg-nim-primary-hover` — i.e. active mode is a solid `primary` fill with `on-primary` icon, not just a tint.
     - Focus: `focus-visible:outline-2 outline-[var(--nim-primary)] outline-offset-2`.
     - Icon: `span.material-symbols-outlined` 20px, `font-variation-settings` toggles `FILL 1` when active vs `FILL 0` rest.
  2. `.nav-quick-access` — empty in this capture (flexes to fill space).
  3. `.nav-extension-panels` — our panels live here: `div[data-gutter-item=com.fireworklabs.theme-editor.theme-library]` (Theme Gallery, `palette` icon fallback) and the native `terminal` toggle. Same 36×36 `nav-button` recipe, `title` attribute instead of the big help tooltip (extension buttons don't get the host's `.help-tooltip`).
  4. `.nav-settings` — `voice-mode`, `claude-usage` / `codex-usage` (circular SVG progress rings: track `stroke-nim-tertiary`, active arc `stroke-green-500` hardcoded Tailwind green, not a theme var — inactive arc `stroke-nim-muted`), `extension-dev`, `trust-indicator`, `theme-toggle-button`, `feedback` (`nimbalyst-feedback-button`), `account-inspector-trigger`. All follow the same `nav-button` recipe; `trust-indicator-dot`/`extension-dev-indicator-dot` are small absolutely-positioned status dots with a hardcoded `bg-purple-500` or `bg-[var(--nim-text-muted)]`.
- Mr. Projects/Mr. Themes gutter buttons: `.pt-gutter-btn` / `.nte-gutter-btn`, 36×36, styled to match `nav-button` (`bg-transparent`, `text-muted`; hover → `bg-tertiary`/`text`; `.nte-gutter-btn.active` → solid `primary` fill + `on-primary`, matching the native active-mode look).

---

## 5. Left column (mode-dependent sidebar)

**OBSERVED** — `report.json` (`topContentRow` full dump), memory note.

Only one of these three is visible at a time (others carry `hidden`/width-0):

- **Files**: `.workspace-sidebar` — `w-full bg-[var(--nim-bg-secondary)] border-r border-[var(--nim-border)]`. Children: `.workspace-color-accent` (3px strip, hidden by Mr. Projects), `.workspace-summary-header` (`bg-[var(--nim-bg)]`, `border-b border`, min-h 56px), `.workspace-section-label` ("Files" — `bg-secondary`, `text-faint`, uppercase 10px, `border-b`), `.workspace-file-tree.nim-scrollbar` (scrollable list).
- **Agent**: `.resizable-panel-left` (`flex flex-col overflow-hidden bg-nim border-r border-nim`) wrapping `.session-history` (`flex flex-col h-full bg-[var(--nim-bg)] overflow-hidden`).
- **Tracker**: `.tracker-sidebar` — `w-full h-full flex flex-col bg-nim-secondary overflow-hidden`.
- A vertical `.resizable-panel-divider` (`w-0.5 bg-nim-border`, hover → `bg-nim-accent`) sits between the left column and the main content; handle is `.resizable-panel-divider-handle`.
- `editor-mode-sidebar-resize-handle` (Files-specific resize handle) — same border/hover-accent recipe.

### File tree rows

**OBSERVED (structure) / INFERRED (state colors)** — class names `file-tree-container`, `file-tree-directory`, `file-tree-directory.special-directory`, `file-tree-chevron`, `file-tree-icon`, `file-tree-name` appear in `report.json`'s class dump but no per-state (hover/selected/git) computed styles were captured live. By analogy with every other list row in the app (settings sidebar item, project rail item) and Mr. Projects' own `previews.tsx` tree mock:
- Rest: transparent bg, `text-muted` (folders may use `text`).
- Hover: `bg-hover`.
- Selected/open file: `bg-selected`, text `text`.
- Git-modified (INFERRED, not observed anywhere): commonly a colored dot or filename tint — most likely `warning` (modified) / `success` (added, new) / `text-faint` strikethrough or `error` (deleted) / `text-disabled` (ignored/untracked-excluded). No direct evidence; flag as a gap for a live probe.

---

## 6. Tabs (editor tab bar)

**OBSERVED (container only)** — `report.json`: `.file-tabs-container > .tab-manager.flex.flex-col.h-full.w-full`. No individual `.tab` element or state class was captured.

**INFERRED** (from `previews.tsx`'s own tab mock, which the extension authors clearly modeled on the real UI, plus the toolbar variables that do exist for exactly this purpose):
- Tab bar container ≈ 30px tall, `background: toolbar-bg`, `border-bottom: 1px solid toolbar-border`.
- Active tab: `background: toolbar-active` (translucent link/primary tint — see variables.md), `color: text`.
- Inactive tab: transparent, `color: text-muted`.
- Hover (inferred): `background: toolbar-hover`.
- Dirty indicator (inferred, not observed): small dot, likely `text-faint` or `primary`; no variable is dedicated to "unsaved" state, so any preset should check this doesn't disappear against `toolbar-active`.
- Overflow "⋯" menu button: `toolbar-hover` on hover (seen in `previews.tsx`).

---

## 7. Markdown editor content

**OBSERVED (variables only, via `deriveExtended`/`families.ts`; layout INFERRED from `previews.tsx`)**:

| Element | Variables | Notes |
|---|---|---|
| H1–H4 | `text` | No separate heading-color variable; all headings and body share `text`. Size/weight only differentiates them — a theme cannot recolor headings independently. |
| Body paragraph | `text` | — |
| Muted/secondary copy | `text-muted` | e.g. explanatory sentences |
| Faint/metadata copy | `text-faint` | e.g. dates, byline |
| Links | `link` rest, `link-hover` on hover | |
| Inline code | `code-text` on `code-bg`, `code-border` | |
| Code block | `code-bg` fill, `code-border` border, `code-gutter` line-number column, tokens: `code-comment`, `code-punctuation`, `code-property`, `code-selector`, `code-operator`, `code-attr`, `code-variable`, `code-function` | See `previews.tsx` `CodeTerminalPreview` for a worked token example |
| Blockquote | `quote-text` (body), `quote-border` (left rule, 3px) | |
| Tables | header `table-header` bg, cells alternate `table-cell`/`table-stripe`, all borders `table-border` | |
| Lists / task lists | `text` body, checkbox likely `primary` when checked (INFERRED — no observed checkbox styling) | |
| Highlight (`<mark>`) | `highlight-bg` fill + `highlight-border` border, text inherits surrounding color | |
| Comment mark | `comment-mark` fill; sample UI hardcodes `color:#111` text on top (see variables.md — legibility risk if `comment-mark` itself goes dark) | |
| Horizontal rule | **No dedicated variable** (INFERRED to reuse `border`) | |

---

## 8. Diff view

**INFERRED — not observed in any probe report.** Based on `deriveExtended()` only:
- Added line: background `diff-add-bg`, left/side border `diff-add-border` (both translucent `success` tints).
- Removed line: background `diff-remove-bg`, border `diff-remove-border` (translucent `error` tints).
- The native app additionally ships **hardcoded, non-themeable** diff colors as `--diff-*` CSS variables from a separate stylesheet baseline (`report.json` `customProps.rootProps`, e.g. `--diff-code-insert-background-color: #eaffee`, `--diff-gutter-delete-background-color: #fadde0`) — these are a Monaco/diff-library default theme, **distinct from** the `--nim-diff-*` keys Mr. Themes controls. A theme built only from the 75 `--nim-*` vars will not repaint whatever surface still reads the `--diff-*` set; call this out as a gap requiring a live check.

---

## 9. Agent chat / transcript

**OBSERVED (fragments only)** — `report6.json` class dump:
- `.agent-mode` (`flex flex-row h-full w-full overflow-hidden`), `.agent-workstream-panel` grid.
- `.mode-tag.mode-tag-agent` — `bg-orange-100` (**hardcoded Tailwind orange, not a theme variable** — will not adapt to theme hue).
- `.model-selector-button`, `.session-dropdown-trigger`, `.action-prompts-dropdown-button` — all share the "pill" recipe: `bg-[var(--nim-bg-secondary)] text-[var(--nim-text-muted)] border border-[var(--nim-border)]`.
- `.bash-widget` — `bg-nim-tertiary border-nim border`, hover → `hover:bg-nim-hover`.
- `.rich-transcript-copy-button` — `bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)]`, hover `bg-[var(--nim-bg-hover)]`.
- `.rich-transcript-question-button` — solid `bg-[var(--nim-primary)] text-[var(--nim-on-primary)]`.
- `.rich-transcript-scroll-button` — solid `bg-[var(--nim-primary)]` circular FAB, hover `bg-[var(--nim-primary-hover)]`.
- `.chat-sidebar-maximize-button` — `text-nim-muted`, hover `bg-nim-bg-active text-nim`.
- Primary/secondary submit-style buttons seen loose in the dump: `bg-nim-primary text-nim-on-primary` (primary) and `bg-nim-tertiary text-nim-muted` (secondary), both with `disabled:opacity-50`.

**INFERRED (not observed)**: user-message bubble vs. assistant-message bubble styling, "thinking" block styling, and the chat input box's focused/unfocused border. By strong analogy with every other input in the app (`.pt-input`, settings inputs) the input box likely uses `bg-secondary` fill, `border` rest, `border-focus` focused, `text-faint` placeholder — `previews.tsx`'s own agent-panel mock uses exactly this pattern (`border: 1px solid border-focus` on the "Message Claude…" box). Model picker is presumed to be a `nte-picker`-style popover (INFERRED by convention, not observed for the native agent panel specifically — only the pill button was observed).

---

## 10. Tracker

**INFERRED — no probe ever captured a live Tracker board.** `previews.tsx`'s `TrackerSettingsPreview` is the only concrete reference and should be treated as a plausible but unverified approximation:
- Kanban column: `bg-secondary` fill, `border` outline, `border-radius: 8px`, `text-faint` uppercase column title.
- Card: `bg` fill (one step lighter than its column), `border` outline, `border-radius: 6px`.
- Status pill (`Badge` in `previews.tsx`): `background: <status-color>`, `color: #ffffff` hardcoded white — this is exactly the pair `auditTheme()` checks as `<status>-pill` (target 3:1). Do not substitute `on-<status>`; the app always uses literal white here per the source.
- "+ New item" primary action: solid `primary` fill, `on-primary` text.

---

## 11. Settings view

**OBSERVED — extensively.** `report7.json` (full settings DOM + classes), `report8.json` (scope tabs, our route entry), memory note.

| Part | Selector | Size | Variables (state) |
|---|---|---|---|
| Shell | `.settings-view` | full pane | `bg-[var(--nim-bg)]`, text `text` |
| Header | `header.settings-view-header` | 52px tall | `bg-[var(--nim-bg-secondary)]`, `border-b border-[var(--nim-border)]` |
| Header title | `.settings-view-title` | — | `text` |
| Scope tabs wrapper | `.settings-scope-tabs` | — | `bg-[var(--nim-bg-tertiary)]`, `padding:4px`, `border-radius:8px` (segmented control) |
| Scope tab, rest | `.settings-scope-tab` | `py-1.5 px-4 rounded-md` | transparent bg, `text-muted`, hover → `text` (no visible hover bg observed) |
| Scope tab, **active** | `.settings-scope-tab-account`/equivalent when selected | — | `bg-[var(--nim-primary)] text-white` (hardcoded white, not `on-primary` — potential mismatch if `primary` is light, see edge-cases) |
| Scope tab, disabled | — | — | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Body | `.settings-view-body` | flex row | — |
| Sidebar | `aside.settings-sidebar[data-testid=settings-sidebar]` | **240px** fixed, `border-r border-[var(--nim-border)]`, `bg-[var(--nim-bg)]` | |
| Sidebar group | `section.settings-sidebar-group` | margin-bottom 16px | |
| Sidebar group title | `.settings-sidebar-group-title` | uppercase 11px | `text-muted` |
| Sidebar item, rest | `button.settings-sidebar-item[data-testid=settings-route-*]` | full width, `px-2 py-1.5 rounded` | transparent bg, `text-muted`; hover → `bg-[var(--nim-bg-hover)]`, text→`text` |
| Sidebar item, **selected** | same selector | — | `bg-[var(--nim-bg-selected)] text-[var(--nim-text)]` — this is the exact "selected vs hover" pair to check for indistinguishability (see edge-cases) |
| Sidebar item icon | `.settings-sidebar-item-icon` | 20×20 | `text-muted` |
| Main content | `main.settings-view-main` | flex-1, `p-6` | `bg-[var(--nim-bg)]` |
| Extension route panel | `.settings-extension-route-panel` / `.settings-panel-container` (max-width 800px) | — | hosts the extension's own settings component (e.g. Mr. Projects' `.pt` block) |
| Save status | `.settings-save-status` | min-width 60px | `text-faint` |

### Mr. Projects settings page (`.pt` block, its own CSS — observed directly in source, rendered inside `.settings-extension-route-panel`)

Rows (`.pt-frow`), section cards (`.pt-sec`: `border border-[var(--nim-border)] rounded-[10px] bg-[var(--nim-bg-secondary)]`), buttons (`.pt-btn`, `.primary`, `.ghost`), inputs (`.pt-input`: `bg` fill, `border` rest, `border-focus` on `:focus`, all with `!important` to beat the app's global input styles), **toggle switch** `.pt-toggle` (track `bg-active` off / `primary` on; knob `text-faint` off / `on-primary` on — the on/off toggle pair is fully theme-driven here, unlike the native Settings which was not observed to have a toggle in this capture), segmented control `.pt-seg` (selected segment `bg-selected`), color swatches `.pt-swatch`/`.pt-pal` (`outline: 2px solid primary` when selected), danger button = plain `error`-colored border+text (not a filled button).

---

## 12. Buttons (cross-cutting)

**OBSERVED**, consistent across both extensions and the native chat panel:

| Variant | Rest | Hover | Disabled |
|---|---|---|---|
| Primary | `background: primary`, `color: on-primary` | `background: primary-hover` | `opacity: .5` |
| Secondary/tertiary | `background: bg-tertiary`, `color: text`/`text-muted`, `border: border` | `background: bg-hover` | `opacity: .5` |
| Ghost | transparent, `color: text-muted` | `background: bg-hover` | `opacity: .5` |
| Danger | transparent or outline, `color: error`, `border-color: error` | not observed — likely `withAlpha(error)` tint (INFERRED) | `opacity: .5` |

---

## 13. Menus / popovers

**OBSERVED (ours only)** — `.pt-menu` (rail context menu): `bg`, `border border`, `box-shadow: 0 8px 24px rgba(0,0,0,.35)` (hardcoded shadow color, not a var). `.nte-pickerpop` (Theme Editor's custom select popover): `bg`, `border border`, options hover/active `bg-hover`, selected `bg-selected` + bold. Native app menus (File menu, right-click context menus) were **not observed** — `menuBar`/`submenu` keys were present in `report4.json` only as Electron menu templates (labels/roles), not rendered DOM/CSS.

---

## 14. Modals and backdrops

**OBSERVED (ours only)** — `.nte-modal-backdrop`: `position:absolute; inset:0; background: rgba(0,0,0,.45)` (hardcoded, not theme-driven — same backdrop darkness regardless of theme, which can look wrong on already-dark themes). `.nte-modal`: `bg`, `border border`, `box-shadow: 0 20px 60px rgba(0,0,0,.4)` (hardcoded). Native modals: **not observed**, INFERRED to follow the same recipe by convention.

---

## 15. Toasts

**INFERRED — not observed in any probe.** No toast DOM, class name, or variable reference exists anywhere in the sources read. Presumed by convention: `bg` or `bg-secondary` fill, `border`, left accent bar or icon in `success`/`warning`/`error`/`info`. This is a genuine gap — flag for a live probe if toast styling matters.

---

## 16. Help tooltips (`div.help-tooltip`)

**OBSERVED** — `report11.json` (`help-tooltip help-tooltip--right nte-help-tooltip` / `pt-help-tooltip`), Mr. Themes `src/helpTooltip.ts`.

`position: fixed`, `right of the button + 8px gap`, vertically centered, `max-width: 280px`, `padding: 10px 12px`, `background: bg`, `border: 1px solid border`, `border-radius: 8px`, `box-shadow: 0 4px 16px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.1)` (hardcoded, not themed). Title `text` 13px semibold; optional `kbd.help-tooltip-shortcut` (`bg-secondary` fill, `border`, `text-muted`); body paragraph `text-muted` 12px. Only rendered by the host for its own gutter buttons; extension panel buttons get a plain HTML `title` unless the extension rebuilds this markup itself (both of ours do).

---

## 17. Scrollbars

**OBSERVED (variables) / INFERRED (rendering)** — `.nim-scrollbar` / `.workspace-file-tree.nim-scrollbar` class seen in `report.json`; actual thumb/track paint not captured (scrollbars are notoriously hard to probe via computed style). Variables: thumb `scrollbar-thumb` (`=text-faint` by default), thumb hover `scrollbar-thumb-hover` (`=text-muted`), track `scrollbar-track` (`transparent` by default). `.nte-tray`, `.nte-pickerpop` use `scrollbar-width: thin` (Firefox-style) — actual WebKit thumb color for those relies on this same variable set via a global rule (INFERRED, not directly observed for our own scrollers either).

---

## 18. Terminal (bottom panel)

**OBSERVED (gutter toggle button only) / INFERRED (panel rendering, from `previews.tsx`)** — `report3.json`/`report4.json` confirm `[data-testid=terminal-panel-button]` in `.nav-extension-panels`, 36×36, `aria-label="Terminal (Ctrl+\`)"`. The panel itself (`.terminal-bottom-panel-container`, `report.json`: `relative shrink-0 flex flex-col border-t-2 border-[var(--nim-border)]`) was seen as a container only, collapsed height 0 in the capture. Fill/text/cursor/selection/ANSI-16 rendering is INFERRED from `previews.tsx`'s `CodeTerminalPreview`, which uses exactly the var names in variables.md (`--terminal-bg`, `--terminal-fg`, `--terminal-cursor`, `--terminal-selection`, `--terminal-ansi-*`).

---

## 19. Toolbar (tab bar / top bar of editor content)

**OBSERVED** — `previews.tsx` + variable derivations only (no live capture of the real toolbar's computed styles, only its container `.file-tabs-container`). `toolbar-bg` (=bg), `toolbar-border` (=border), `toolbar-hover`, `toolbar-active` (see variables.md, Tables and toolbars section).

---

## 20. Focus rings

**OBSERVED** — pervasive Tailwind pattern across every native interactive element: `focus-visible:outline-2 outline-[var(--nim-primary)] outline-offset-2`. Note this uses **`primary`**, not `border-focus`, for the native gutter/top-bar buttons — `border-focus` is used instead for **input border color** on focus (`.pt-input:focus`, `.nte-input:focus`). Two different "focus" variables serve two different roles; a theme that makes `primary` and `bg` too close in luminance will make every native focus-visible ring hard to see (see edge-cases).

---

## 21. Mr. Projects rail tiles (40% inactive) and Mr. Themes-specific UI

Covered above (section 2, rail tiles) and in variables.md/`styles.ts` excerpts. Mr. Themes' own UI (`.nte-*` classes) is OBSERVED directly from Mr. Themes `src/styles.ts` and includes: custom `ThemePicker` popover (`.nte-picker`/`.nte-pickerpop`, fixed-positioned, no `transform` on ancestors), gallery cards (`.nte-card`, hover `border-color: text-faint` + drop shadow, `.on` → `outline: 2px solid primary`), usage chips (`.nte-chip.proj` vs `.nte-chip.global`, the latter solid `primary`/`on-primary`), and a contrast-grade legend (`.nte-grade.AAA/.AA` → `success`, `.AA-large` → `warning`, `.fail` → `error`).
