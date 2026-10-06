# AGENT.md — designing a Nimbalyst theme with Mr. Themes Toolkit

You are an AI agent that has been asked to design a Nimbalyst color theme (or
a six-theme family) from a user's request. This is the guide you follow. It
is deliberately short — the mechanics of variables, components and known
failure modes live in `reference/*.md` and are linked from here, not
repeated.

## Purpose and outputs

Your job ends when you hand the user one file:

- **`<name>.nimtheme`** — a single theme, or
- **`<name>.nimfamily`** — a family: six variants (dark/light ×
  subtle/pigment/juicy) sharing one hue identity.

Along the way you check the theme for internal consistency, contrast /
legibility, and information hierarchy, and you preview it for the user
**without** installing anything into Nimbalyst. The user imports the
finished file themselves (last section below).

## The files

### `*.nimtheme` — one theme

```jsonc
{
  "id": "harbor-fog",              // slug, unique
  "name": "Harbor Fog",            // display name
  "version": "1.0.0",
  "author": "Mr. Themes",          // optional
  "description": "...",            // optional, shown in the gallery
  "isDark": true,                  // which BASE_*_CORE derivation uses
  "tags": ["dark", "subtle"],       // optional, free-form
  "colors": { /* 20 core keys, see below */ },
  "extended": { /* 0-55 extended keys; unset ones are derived */ },
  "monaco": null,                  // reserved, leave unset
  "family": "harbor",              // optional: family id this belongs to
  "faction": "dark",                // optional: "dark" | "light"
  "variation": "subtle",            // optional: "subtle" | "pigment" | "juicy"
  "format": 1
}
```

The 20 `colors` (core) keys and all 55 `extended` keys, what each draws, its
derivation when unset, and its contrast target are the whole of
**`reference/variables.md`** — read it before setting a single color. Core
keys are the only ones a bare theme-extension manifest can carry; everything
else is either explicit in `extended` or derived by `deriveExtended()`.

### `*.nimfamily` — a family

```jsonc
{
  "kind": "mr-themes/family",
  "format": 1,
  "family": {
    "id": "tidepool",
    "name": "Tidepool",
    "description": "...",                 // optional; shown as the sub text under the name
    "swatches": ["#38bdf8", "#22d3ee", "#818cf8", "#fbbf24", "#fb7185"],  // optional; the 5 header colors (first one is drawn wide)
    "generator": {                          // omit for a hand-authored family
      "dominant": "sky",                    // Tailwind hue
      "pops": ["cyan", "indigo", "amber", "rose"],  // up to 4, most important first
      "neutral": "slate"                    // Tailwind neutral hue
    }
  },
  "themes": [ /* 6 ThemeFile objects, ids `<family>-<faction>-<variation>` */ ]
}
```

## Path A — generator (default; use unless the user wants hand-tuned colors)

```bash
node cli/mrthemes.mjs hues                                    # list valid hue names
node cli/mrthemes.mjs generate --name "Tidepool" \
  --dominant sky --pops cyan,indigo,amber,rose --neutral slate \
  --out work/tidepool.nimfamily
```

What each parameter drives (full mechanics in `families.ts`'s header comment
and `character()`, summarized in the brainstorming brief you were given):

- **`dominant`** — the primary/accent/border-focus hue. Pick it to match the
  user's request (e.g. "ocean" → `sky` or `teal`; "forest" → `emerald`).
- **`pops`** (≤4, ordered) — accent hues used for, in order: `pops[0]` links
  + `code-function`; `pops[1]` info + `code-attr`; `pops[2]` `code-variable`;
  `pops[3]` `code-property` and juicy-only highlights. Fewer than 4 is fine;
  missing slots reuse the last pop or the dominant hue.
- **`neutral`** — the gray ladder backing every surface and text color
  (`slate`, `gray`, `zinc`, `neutral`, or `stone`).
- **Variations** (all three are always generated, no parameter): `subtle`
  (near-monochrome, lower contrast band), `pigment` (deep matte, ink-on-paper),
  `juicy` (saturated pops, true blacks/whites). Status colors (success/
  warning/error/info) are walked to a dual contrast target (text-on-bg 4.5:1
  **and** white-on-fill 3:1) independent of the hue parameters, so they stay
  legible regardless of family.

A generated theme passes contrast by construction (each color is walked
along its Tailwind ladder until it clears its target), but always run the
audit anyway — the ANSI terminal colors and several hierarchy checks are not
part of the ladder walk (see `reference/edge-cases.md` #9, #17).

## Path B — hand-authored

1. Copy `templates/theme-dark.nimtheme` or `templates/theme-light.nimtheme`
   (Nimbalyst's own base colors, all 20 core keys set, `extended` empty).
2. Set the 20 core keys role by role. Use `reference/variables.md`'s
   "Surfaces" and "Text" tables for what each one draws and its target;
   don't guess a value's job from its name alone (e.g. `border-focus` is the
   *input* focus color, not the native button focus ring — that one is
   `primary`, see `reference/edge-cases.md` #12 and #20).
3. Decide whether to set `extended`. Leaving it empty is valid but has a real
   cost: `deriveExtended()`'s fallback for the 8 `code-*` syntax tokens,
   `terminal-ansi-magenta`/`cyan`, and `purple` is a **fixed VS-Code-like
   palette unrelated to your hues** (`reference/variables.md`, `edge-cases.md`
   #19). If the theme has a strong hue identity, set at least the code tokens
   explicitly so syntax highlighting matches. Everything else (tables,
   toolbar, scrollbar, quote, diff, terminal base) has a sensible 1:1 or
   `withAlpha()` derivation from core colors and rarely needs overriding.
4. For a family of hand-authored themes, write six `ThemeFile`s yourself and
   wrap them in a `.nimfamily` with no `generator` key (or omit the family
   file entirely and hand over six independent `.nimtheme` files — both are
   valid imports).

## Iteration loop

Repeat until "done" (next section):

```bash
node cli/mrthemes.mjs audit <file>              # fast textual pass/warn/fail
node cli/mrthemes.mjs preview <file>            # writes preview/data/current.js
```

Then open the preview pages and look — they exist because the built-in
extension previews "do not show every component, or enough specificity to
troubleshoot edge cases":

| Page | What it's for |
|---|---|
| `preview/index.html` | What's loaded, at a glance, with a pass/warn/fail tile per theme |
| `preview/app.html` | The full window shell for one theme — does it read right in context? |
| `preview/components.html` | Every component in every state, side by side, with the variables each one uses |
| `preview/contrast.html` | `fullAudit()` made visual: live composited samples, ratios, a hierarchy panel |
| `preview/family.html` | All six variants side by side, plus a role matrix — use for family consistency |
| `preview/tokens.html` | All 75 resolved variables, flagging which extended keys are derived vs explicit |
| `preview/edge-cases.html` | Every known failure mode (`reference/edge-cases.md`), rendered live with its audit badge |

In Nimbalyst, open a page with the browser tool (e.g.
`browser_open_local_preview`) and take a screenshot to show the user inline;
if that tool is unavailable, just give the user the absolute file path to
open themselves. Pages are plain `file://`-safe HTML — no server needed.

## Assessment checklist

Before calling a theme done, walk this list. Each item names the page that
shows it:

1. **Consistency** — `family.html`'s mini-shells and role matrix: do all six
   variants share a hue identity? Does `primary`'s hue stay close across
   variants (the generator enforces ≤30°; a hand-authored family should
   too)?
2. **Contrast / legibility** — `contrast.html`, checked against the targets
   in `reference/variables.md` (text 7, muted/faint/link/accent/status/code
   4.5, comment 3.5, disabled ≈ 2.3, status-under-white 3). `tokens.html` to
   see what's derived vs explicit.
3. **Information hierarchy** — `contrast.html`'s hierarchy panel: text >
   muted > faint > disabled must stay strictly ordered; surface steps
   (bg → bg-secondary → bg-tertiary) must stay visually distinct; status
   hues must be distinguishable from each other and from the dominant hue.
4. **Edge cases** — `edge-cases.html`, all 20 tiles. Anything still `fail`
   or an un-audited item that looks wrong by eye needs a fix or a note to
   the user.
5. **Every component** — `components.html` and `app.html`: scan for
   anything that reads wrong in context, not just in isolation (e.g. a pill
   that passes its own check but clashes sitting next to a primary button).

## What "done" means

- **0 `fail`** in `mrthemes audit <file>` and in `contrast.html`'s per-theme
  and family audits.
- **Every `warn` is either fixed or explained to the user** — several warns
  are inherent to a variation's character (e.g. `subtle` intentionally pins
  muted/faint close together, edge case #5) and are fine to ship with a
  one-line note; others (a scrollbar thumb that's genuinely hard to see, a
  status hue too close to the dominant) should be fixed if the user cares
  about that surface.
- Run `node cli/mrthemes.mjs fix <file>` first for quick wins — it only
  repairs the 17 legacy core-color checks, so re-audit afterward; it will
  not touch extended/derived colors or the newer hierarchy/terminal checks.

## Export and handoff

```bash
node cli/mrthemes.mjs export <file> --out <name>.nimtheme   # or .nimfamily
```

This is the canonical, key-ordered file to hand the user — always export,
don't hand over a `work/` scratch file directly.

**Import (tell the user exactly this):** open Mr. Themes (the Theme Gallery)
and

- for a **`.nimfamily`**: under **Theme Families**, click **Import family**
  and pick the exported file;
- for a **`.nimtheme`**: under **Theme Collection**, click **Import theme**
  and pick the exported file.

Each button refuses the other kind of file and says which button to use. If
the user is re-importing an updated version of a theme or family they already
have, they should choose **Replace** rather than adding a copy, so existing
per-project assignments are kept.

Before exporting a family, set `family.swatches` to five colors that sum the
family up (for example the dark juicy variant's primary, link, info, purple
and warning). The family header in the gallery shows them; without them it
falls back to the generator's hues or the members' accents.
