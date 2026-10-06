# Theme edge cases the preview must make visible

Each item names the exact variables involved, why it breaks, and where in the preview to surface it. Ordered roughly by how often a generated or hand-authored theme will actually hit it. Cross-reference `variables.md` for derivation and `components.md` for where each part renders.

## 1. Translucent `bg-selected` composited on the wrong surface
**Variables:** `bg-selected` (translucent, `withAlpha(primary, .1–.24)`), `bg`, `bg-secondary`, `bg-tertiary`.
Nimbalyst draws the same `bg-selected` value over at least three different opaque surfaces (file tree over `bg-secondary`, code editor line over `code-bg` = `bg-secondary`, settings sidebar item over `bg`). A value tuned to look right over one surface can be nearly invisible or overly saturated over another. **The contrast-audit code itself composites translucent backgrounds onto white before measuring** (`contrastRatio()` in `color.ts`), so the audited numbers do not reflect this. The preview page must render `bg-selected` as an actual translucent overlay on top of every real surface it appears on, not as a flattened swatch.

## 2. `on-primary` when `primary` is light (yellow/lime/amber families)
**Variables:** `primary`, `on-primary` (`= onColor(primary)`).
`onColor()` picks between a fixed dark (`#111827`) and fixed light (`#f8fafc`), whichever contrasts more — but several call sites in the native app **hardcode white** instead of using `on-primary` (e.g. the settings scope tab's active state uses literal `text-white`, not `var(--nim-on-primary)` — see `components.md` §11). A theme whose `primary` lands on a light/yellow shade will produce correct `on-primary` (dark text) in Mr. Themes' own UI, but the native chrome that hardcodes white will show low-contrast white-on-yellow. Preview must include both the themed button (uses `on-primary`) and the native-style hardcoded-white tab to expose the mismatch.

## 3. Status pill white text on a light `warning`/amber fill
**Variables:** `warning`, hardcoded `#ffffff` (not `on-primary` — status pills always use literal white per `previews.tsx`'s `Badge` component and `contrast.ts`'s `warning-pill` check, target 3:1).
Amber/yellow ambers frequently fail 3:1 white-on-fill even after the `dual()` search, especially in `subtle` variation where `matte()` desaturates toward neutral. Show all four status pills (success/warning/error/info) side by side with literal white text, and flag any ratio under 3.

## 4. `link` visually indistinguishable from `primary`
**Variables:** `link`, `primary`.
Both are core keys with independent values, but `families.ts`'s `subtle` variation intentionally sets `link = dominant hue` (the same hue family as `primary`), and even in other variations both are drawn from the same "dominant + pop" hue set. When a link sits next to a primary button or an active nav icon, they can read as the same color, making it unclear which is clickable. Preview: place a link inline with a primary button and an active-mode gutter icon in the same view.

## 5. `text-muted` vs `text-faint` collapsing
**Variables:** `text-muted`, `text-faint`.
Both target 4.5:1 against `bg`, and `subtle`/`pigment` variations pin them close together on the neutral ladder to keep the "near-monochrome" character (see `character()` in `families.ts` — `subtle` dark sets `muted: tw(n,400), faint: tw(n,400)`, i.e. **the same value**). This is by design in `subtle`, but a preview must show muted and faint text stacked directly on top of each other so an agent can see whether they're actually distinguishable or accidentally identical.

## 6. `text-disabled` too readable (looks enabled) or too invisible
**Variables:** `text-disabled` (target ≈2.3, deliberately the lowest of the text targets).
2.3:1 is a narrow band: push it higher and disabled controls read as enabled; push it lower (some hand-authored or buggy themes might not respect the floor) and disabled text vanishes entirely, which is also wrong — a disabled control should be legible-but-clearly-inactive, not gone. Preview a disabled button, disabled input, and disabled tracker card side by side against `bg`.

## 7. Borders vanishing on `bg-tertiary`
**Variables:** `border`, `bg-tertiary`.
`border` is only checked against `bg`/`bg-secondary` implicitly (no explicit audit row exists for `border` at all — it's not contrast-checked anywhere in `contrast.ts`). Many surfaces that use `bg-tertiary` (rail tiles, secondary buttons, settings value chips) also draw a `border`-colored outline directly on top of `bg-tertiary`; in `pigment`/`juicy` variations where `bg-tertiary` and `border` are both mixed from the same dominant hue, they can converge. Preview: render a bordered chip/card on each of `bg`, `bg-secondary`, and `bg-tertiary`.

## 8. `code-comment` too faint on `code-bg`
**Variables:** `code-comment` (target 3.5 — the lowest code target), `code-bg` (`= bg-secondary`).
3.5 is intentionally below the 4.5 used for every other code token, so comments read as de-emphasized — but it's also the easiest token to slip under WCAG AA-large (3:1) if a hand-edited theme nudges it. Preview a code block with a comment line as the very first line (comments are often the first thing scanned).

## 9. Terminal ANSI colors are not contrast-audited at all
**Variables:** all 16 `terminal-ansi-*` keys, `terminal-bg`, `terminal-fg`.
`auditTheme()` never checks any ANSI color against `terminal-bg`. Two concrete failure modes: `terminal-ansi-black` defaults to literal `#000000` on dark themes — invisible on a `terminal-bg` that is *also* near-black (common in `juicy` dark, whose `bg-secondary` can be true black-mixed). `terminal-ansi-white` defaults to literal `#ffffff` on dark / `#e5e7eb` on light — invisible on a light `terminal-bg` in a `juicy` light theme (near-white `bg-secondary`). Preview must render all 16 ANSI swatches directly on the actual `terminal-bg`, not on a neutral canvas.

## 10. `diff-add`/`diff-remove` colliding with a near-hue dominant color
**Variables:** `diff-add-bg`/`border` (`success` tint), `diff-remove-bg`/`border` (`error` tint), family `dominant` hue.
Families whose dominant hue sits near `success` or `error` on the color wheel make diff highlighting ambiguous with the theme's own accent color. Concretely: **Grove** (dominant `emerald`) vs `success` (also frequently emerald/lime per `families.ts`'s `success` computation, which literally uses `'lime'`/`'emerald'` — same hue family as Grove's dominant), and **Rosewater**/**Ember** (dominant `rose`/`orange`) vs `error` (computed as `orange` when dominant is `rose`/`red` — same hue). Preview: show a diff block and a primary-colored UI element (rail active tile, primary button) together for every family, not just in isolation.

## 11. `highlight-bg` over an already-selected line
**Variables:** `highlight-bg`/`highlight-border` (translucent `warning` tint), `bg-selected` (translucent `primary` tint).
Both are translucent overlays that can legally stack (a highlighted span inside a selected line, or a selected row that's also within a highlighted block). Two translucent tints of different hues compositing on top of each other can produce a muddy or unexpectedly saturated third color. Preview must render a `<mark>` highlight *inside* a selected/active row, not just each in isolation.

## 12. Focus ring not visible against primary-filled buttons
**Variables:** `border-focus` (used for input borders) vs literal `primary` (used for `focus-visible` outlines on native buttons — see `components.md` §20).
Native buttons use `outline-[var(--nim-primary)]` for focus, not `border-focus`. When focusing a button that is *itself* filled with `primary` (e.g. tabbing to a primary CTA), the outline color equals the fill color and the ring disappears. Preview: tab-focus a primary button and check the ring is visible against the button's own fill, not just against the page background.

## 13. Scrollbar thumb invisible on its track
**Variables:** `scrollbar-thumb` (`= text-faint`), `scrollbar-track` (`transparent` by default), and the actual surface behind the track (`bg`, `bg-secondary`, or `code-bg` depending on which scroller).
Because the track is transparent, the thumb's effective contrast is against whatever surface sits behind it — and `text-faint` is tuned for 4.5:1 *text* contrast on `bg`, which is a much lower bar than what's comfortable for a thin scrollbar affordance. On `subtle` variation (faint and muted collapse, item 5) the thumb can be barely perceptible. Preview a tall scrollable list with a partially-scrolled thumb visible.

## 14. Hover indistinguishable from selected
**Variables:** `bg-hover` (translucent, ~4–8% white/black) vs `bg-selected` (translucent, 10–24% `primary`).
In `subtle` dark (`selectedAlpha: 0.1`, close to `bg-hover`'s ~5% white overlay) a hovered-but-unselected row and a selected-but-unhovered row can look nearly the same, especially since `bg-hover` has no hue and `bg-selected` does — but at low alpha the hue read is weak. Preview must show hover and selected as adjacent rows in the same list (not stacked, since hover+selected can also co-occur — see the settings sidebar item, which supports both simultaneously).

## 15. Dark-theme shadows
**Variables:** none — every `box-shadow` found in the sources is a **hardcoded black** (`rgba(0,0,0,.25)`–`rgba(0,0,0,.45)`), never a theme variable: `.pt-menu` (`rgba(0,0,0,.35)`), `.pt-poster-frame` (`rgba(0,0,0,.25)`), `.nte-modal-backdrop` (`rgba(0,0,0,.45)`), `.nte-modal` (`rgba(0,0,0,.4)`), `.help-tooltip`/`.nte-help-tooltip` (`rgba(0,0,0,.15)`/`.1`). On an already-near-black `bg` (juicy dark), these shadows lose almost all definition since there's no luminance step to read as "elevated." Preview should show a popover/modal/poster on the darkest generated `bg` to confirm elevation still reads.

## 16. Comment-mark text legibility
**Variables:** `comment-mark` (`= mix(warning, white/black, .45 dark / .1 light)` — usually a light warm tint), but the sample UI (`previews.tsx`) paints text on top of it with a **hardcoded dark color (`#111`)**, not `on-primary` or any derived "on-comment-mark" value.
If a hand-edited theme or a future preset pushes `comment-mark` dark (e.g. by mixing toward black instead of white on a light theme, or if `warning` itself is dark), the hardcoded dark text becomes unreadable with no code path to fix it. Preview the comment-mark exactly as `previews.tsx` does — hardcoded dark text — so this failure mode is visible rather than hidden by a smarter (but inaccurate) preview implementation.

## 17. Dominant hue colliding with a status hue (family-level check)
**Variables:** family `dominant` (from `families.ts` `FAMILIES`) vs `success`/`warning`/`error`.
Beyond diff colors (item 10), the *rail active-tile ring*, *primary buttons*, and *status pills* are often the very next elements to each other in the UI (e.g. tracker card: primary "+ New item" button next to a success-colored badge). Grove (`emerald` dominant) is the sharpest case — its `primary` and `success` can be the same Tailwind hue at adjacent shades. Preview every family's tracker board (item 10 already covers diff; this item is specifically the tracker board and settings "Save" button next to a status pill).

## 18. `bg-active` translucency inconsistency
**Variables:** `bg-active`.
Generated presets (`families.ts`) always produce an **opaque** `bg-active` (mixed from neutral+dominant shades), but the native app's own light-theme default (`report.json` `customProps.rootProps`) is `rgba(59,130,246,.2)` — **translucent**. A theme file that only sets `bg-active` sparingly, or a hand-authored one copying the native default, can end up translucent where generated ones are opaque, changing how toggle-track-off and pressed states composite. Preview should test `bg-active` both as a toggle track and note whether it was authored as translucent or opaque.

## 19. Manifest-only themes get generic syntax-highlighting colors
**Variables:** all 8 `code-*` token keys, `on-primary`, `terminal-ansi-magenta`/`cyan`, `purple`.
Per `variables.md`, `deriveExtended()`'s fallback for syntax tokens is a **fixed VS-Code palette unrelated to the core hue** (`CODE_TOKENS_DARK`/`LIGHT`). Any theme built by hand (or by an agent that only fills in the 20 manifest-contributable core keys and skips `extended`) will get generic blue/green/orange syntax highlighting regardless of its hue family — this can clash badly with a strongly-hued `primary`/`link`. Preview should include one "core-only" theme (no `extended` block) next to one from `buildTheme()` to show the difference starkly.

## 20. `border-focus` doubles as `primary` in generated presets
**Variables:** `border-focus` (set to `= primary` in `buildTheme()`'s `colors` object), `primary`.
Because generated presets literally reuse `primary` for `border-focus`, any theme that also uses `primary` heavily for icons/buttons near an input will make the focused-input ring blend into surrounding primary-colored chrome instead of standing out as "this input is different." Preview a focused input next to a primary button/icon of the same hue.
