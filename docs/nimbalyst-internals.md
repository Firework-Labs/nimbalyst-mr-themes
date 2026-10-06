# Nimbalyst internals these extensions rely on

Observed on **Nimbalyst 0.77.5** with a probe extension (kept in the private development repository, not published) between 2026-09-10 and 2026-09-28. The app bundle was off limits to read, so everything here comes from the documented SDK, from probe reports, or from calling a function and watching what happened. **Re-verify after a Nimbalyst upgrade**: rerun a probe round that dumps the selectors below before trusting them.

This file is shared, word for word except for paths, with the Mr. Projects repository (`docs/nimbalyst-internals.md` there).

## Theme engine

- Nimbalyst writes its theme as **75 inline CSS custom properties on `<html>`** (`--nim-*` plus `--terminal-*`), with `data-theme="<id>"` and classes such as `crystal-dark-theme dark-theme`.
- The manifest's `contributions.themes` accepts only the **20 core colors**; the app derives the other 55. That is why Mr. Themes applies themes at runtime from a host component, writing the same variables, and only when a value differs (loop-safe).
- Monaco (code editor) syntax colors do not follow a live theme; they only change through an exported theme extension.
- Open question: the diff view may use a separate `--diff-*` variable set that a `--nim-*` theme does not reach. Needs a probe of an open diff view.

## Extension runtime

- Third-party `hostComponents` mount at app level. `activate()` shares module scope with them but has **no usable DOM**: a probe that reads the DOM from `activate()` sees nothing. Read the DOM from a mounted host component's effect.
- Reinstalling an extension remounts its host components, which is also the easiest way to make it re-read project files after an external edit.
- The SDK exports no UI components beyond `MaterialSymbol`. Every control in both extensions is our own.
- The bundle has no `react-dom` portal. Popovers that must escape a clipping ancestor are `position: fixed`, placed from the trigger's bounding rect. A `transform` on any ancestor becomes the containing block for fixed elements and clips them again, so never add `transform` to a card hover or a picker ancestor.
- Nimbalyst's global input styles win over ours unless `color` and `background` carry `!important` on inputs and selects.
- `PanelExport.gutterButton` is in the SDK and exported by Mr. Themes, but 0.77.5 kept its default `palette` button after a dev reinstall. Whether it is honored after a full app restart is untested.

## Layout row

`[data-layout=workspace-row]`: `nav.project-rail[data-testid=project-rail]` (56px) → `.navigation-gutter` (48px) → `[data-layout=main-column-container] > [data-layout=top-content-row]`.

## Project rail

`.project-rail-item[data-project-path]` children, each with `button.project-rail-item-main[aria-label="Switch to project X"]`, optional `.project-rail-item-badge`, `.project-rail-item-close`. The active one has `.is-active`. Then `.project-rail-divider` and `.project-rail-add`. Only the active project is distinguishable ("open" projects are not marked separately).

## Navigation gutter

`.navigation-gutter` has four `.nav-section` groups:

- `.nav-content-modes`: files, agent, tracker, pr-review; each `div[data-gutter-item=<mode>] > .nav-mode-button-wrapper > button.nav-button[data-mode]`.
- `.nav-quick-access`.
- `.nav-extension-panels`: extension panels such as `com.fireworklabs.theme-editor.theme-library`, plus `terminal`; each `div[data-gutter-item=<id>] > button.nav-button` (36×36) with a `.material-symbols-outlined` span at 20px. Mr. Projects adds its gutter button by appending its own `div[data-gutter-item]` host here.
- `.nav-settings`: voice-mode, claude-usage, codex-usage, extension-dev, trust-indicator, theme-toggle, feedback, account-inspector-trigger. There is no Settings gear in the gutter.

## Help tooltip

Nimbalyst renders its big hover tooltip only for its **own** gutter buttons; extension panel buttons get a plain `title`. Markup: `div.help-tooltip.help-tooltip--right` appended to a body-level node, `position: fixed`, `left = gutter right + 2`, vertically centered on the button, 280px wide; inside `.help-tooltip-header` (`.help-tooltip-title` plus optional `kbd.help-tooltip-shortcut`) and `.help-tooltip-body > p.help-tooltip-paragraph`. These are Tailwind utility classes that style any element using them, so both extensions rebuild the tooltip with the same class strings in `src/helpTooltip.ts` (identical files, with a `pt-`/`nte-` fallback class). When snapshotting the DOM before and after a hover, include `document.body` itself: the tooltip is appended at body level.

## Left column

To the right of the gutter, depending on mode: Files `.workspace-sidebar`, Agent `.resizable-panel-left > .session-history`, Tracker `.tracker-sidebar`. Only the active mode's wrapper is visible. Each starts with `div.workspace-color-accent` (a 3px per-project color strip, hidden by Mr. Projects) and then `.workspace-summary-header`. Mr. Projects injects its poster host as the first child of the first visible one and re-checks on body mutations.

## Settings view

`.settings-view` > `header.settings-view-header` with `.settings-scope-tabs` buttons `[data-testid=settings-scope-application|account|project]`. The body has `aside.settings-sidebar[data-testid=settings-sidebar]` with `section.settings-sidebar-group[data-testid=settings-group-<id>]` and `button.settings-sidebar-item[data-testid=settings-route-<id>]`, and `main.settings-view-main`.

- Built-in Project routes: `settings-route-project-sharing|agent-permissions|trackers|ai-providers|mcp-servers|github|extensions`.
- **Extension routes are keyed `settings-route-ext:<extensionId>:<routeId>`**, for example `settings-route-ext:com.fireworklabs.project-theme:project-theme`, under `settings-group-extensions`. (Round 3 of Mr. Projects assumed `settings-route-<routeId>` and never reached its route.)

## `window.electronAPI` (preload bridge, not in the SDK)

About 575 functions. Verified by calling them from a probe:

- `openInDefaultApp(path)` returns `{success: true}` and opens a folder in the Finder. `showInFinder(path)` also exists.
- `openAccountSettings()` opens the Settings view at the Account scope (`{success: true}`). To reach an extension route, click the Project scope tab and then the route button by `data-testid`.
- `getWindowMenuBar()` lists the menu (Settings… is id `0.3`, ⌘,), but `invokeWindowMenuItem` returns `{invoked: false}` for every argument shape tried, and a synthetic ⌘, keydown does nothing.
- Also present: `openExternal`, `openFile`, `workspaceManager.*`, `extensions.*`.

`@nimbalyst/runtime` exports only editor and tracker helpers; there is no navigation or settings API. Anything built on `electronAPI` must degrade to a toast with the manual path if a function disappears.
