# App shell geometry

Geometry observed on Nimbalyst 0.77.5 (`probe/reports/report.json`, `report3.json`, `report7.json`) with Mr. Projects and Mr. Themes installed — Mr. Projects' rail replaces the native 56px rail with its own 56/88px rail, so "native" widths are noted separately where they differ. All regions are full window height unless noted, and stack left-to-right in a single flex row (`[data-layout=workspace-row]`).

## Regions, left to right

| Order | Region | Width | Border | Background var | Notes |
|---|---|---|---|---|---|
| 0 | `window-top-bar` (spans full width, above everything else) | full width, **not measured in this capture** (0 height rect returned in one report; visually ~38–40px based on other rects starting at `y=38`) | `border-bottom: 1px solid border` | `bg-secondary` | Draggable title bar (`-webkit-app-region: drag`); holds workspace name, git branch button, panel toggle buttons, "+" create-workspace split button |
| 1 | Project rail | **56px** native (`nav.project-rail`) / **56px normal, 88px "wide"** for Mr. Projects' `pt-rail` (observed `w:88` in `report.json` with `.wide` applied) | `border-right: 1px solid border` | `bg-secondary` | Vertical list of project tiles; Mr. Projects hides the native rail (`display:none`) and mirrors it |
| 2 | Navigation gutter | **48px** (`w-12`, confirmed `report3.json` rect `w:48`) | `border-right: 1px solid border` | `bg-secondary` | Fixed-width icon column, never resizes |
| 3 | Left column (mode-dependent) | **variable / user-resizable** — observed default `w:170` in a `previews.tsx` mock (not a captured real value) but the real DOM uses a resize handle (`editor-mode-sidebar-resize-handle`, `resizable-panel-divider`) with no fixed width recorded live | `border-right: 1px solid border` | `bg-secondary` | One of: Files `.workspace-sidebar`, Agent `.resizable-panel-left > .session-history`, Tracker `.tracker-sidebar`. Mr. Projects' poster dock is always the first child inside whichever of these is visible. |
| 3a | (divider) | 2px hit-area, 0.5px visible line (`resizable-panel-divider`) | — | `border`, hover → accent | Sits between left column and main content; draggable |
| 4 | Main content column | **flex: 1** (fills remaining width; observed `w:1935` in a 2071px-wide capture with rail 88 + gutter 48 + left column ~0 in that particular snapshot) | — | `bg` | Contains, top to bottom: toolbar/tab bar (**30px**, per `previews.tsx`; not independently confirmed live) → editor/agent/tracker content → optional bottom terminal panel |
| 4a | Bottom terminal panel | full width of main content column, collapsible (0 height when closed) | `border-top: 2px solid border` (note: **2px**, thicker than the standard 1px dividers elsewhere) | `bg-secondary` (via `terminal-bg = bg-secondary`) | `.terminal-bottom-panel-container`, `shrink-0` |
| 5 | Right/agent panel (only in the `previews.tsx` workspace mock; not confirmed as a persistent region in live captures — it appears to be the same "Agent" mode content, not a simultaneous side panel) | **230px** (per `previews.tsx`, unconfirmed live) | `border-left: 1px solid border` | `bg-secondary` | Chat-style panel: transcript bubbles, tool-call display, input box pinned to bottom |

## Settings view (separate full-pane overlay, not part of the row above)

| Region | Width | Border | Background |
|---|---|---|---|
| `.settings-view` (whole pane) | fills window | — | `bg` |
| `.settings-view-header` | full width | `border-bottom: 1px solid border` | **52px tall**, `bg-secondary` |
| `.settings-sidebar` | **240px fixed** | `border-right: 1px solid border` | `bg` |
| `.settings-view-main` | flex: 1 | — | `bg`, `padding: 24px` (`p-6`) |
| `.settings-panel-container` (extension content) | **max-width: 800px**, centered within main | — | inherits `bg` |

## Fixed sizes worth reproducing exactly

- Navigation gutter buttons: **36×36px**, `border-radius: 6px`, icon **20px**.
- Gutter width: **48px**. Rail width: **56px** (native) / **56–88px** (Mr. Projects, narrow/wide).
- Settings sidebar: **240px**. Settings header: **52px** tall.
- Terminal top border: **2px** (everything else is 1px).
- Rail item avatar tile: **40×40px** (narrow) / **56×56px** (wide), `border-radius: 10px`/`12px`.
- Poster banner aspect ratio: **16:9** (docked, `.pt-poster-frame.banner`) vs **1:1** (settings-page preview thumbnail, `.pt-poster-frame` default).
- Help tooltip: **max-width 280px**, positioned `button-right + 8px`, vertically centered on the button, clamped 8px from window edges.
- Rail project tile badge: **16px** pill, 2px cutout border in `bg-secondary`.

## Border and divider inventory (which variable draws which line)

| Divider | Variable |
|---|---|
| Rail / gutter / left-column / settings-sidebar right borders | `border` |
| Top bar bottom border | `border` |
| Toolbar/tab-bar bottom border | `toolbar-border` (`= border` by default, independently overridable) |
| Terminal top border | `border` (2px) |
| Table cell/header borders | `table-border` (`= border` by default) |
| Code block border | `code-border` (`= border` by default) |
| Blockquote left border | `quote-border` (`= border` by default) |
| Input rest border | `border`; focused → `border-focus` |
| Settings sidebar item / row dividers | `border` |
| Resizable panel divider (draggable) | `border`, hover → an "accent" utility class (`hover:bg-nim-accent`) not one of the 75 keys — likely maps to `primary` internally but not confirmed |

## Notes on what is NOT fixed

- The left column and right/agent panel widths are user-resizable at runtime; do not hardcode them as pixel-perfect in preview pages — use the observed defaults as a *starting* proportion (left column ≈ 170–260px, agent/right panel ≈ 230–300px) and say so.
- The window top bar's exact height was not captured with a non-zero rect in any report; 38–40px is inferred from sibling rects that all begin at `y=38`. Treat it as approximate.
- No ASCII art is used per instructions; reproduce the shell as: top bar (full width) stacked above a row of [rail][gutter][left column][divider][main column][optional terminal below main][optional right panel], with settings as a full-pane overlay that replaces the whole row when open.
