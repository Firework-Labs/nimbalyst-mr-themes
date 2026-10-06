# Palette design notes

The design direction the palette-lab families are tuned to, settled over seven review rounds on 2026-09-24/25 while building seven families from uicolors.app palettes (`palette-lab/`). Read it before designing or retuning a theme.

## What the variations mean

- **Subtle**: desaturated, lower contrast, but **not** washed out. Everforest-like.
- **Pigment**: gem tones, as if printed on matte paper stock. Rich, never sickly.
- **Juicy**: very saturated jewel tones, contrasty, Tokyo Night-like, but deep, not neon.

## Reference themes

Tokyo Night, Everforest, Gruvbox and Catppuccin. Accents sit around OKLCH chroma 0.10–0.18, each hue at its **own** lightness rather than one shared lightness.

## Rules that follow

- Move to a nearby hue freely to avoid a muddy color. Dark yellow reads olive whatever its chroma: use amber or topaz.
- Each family has its own flavor, including its status colors and code keywords (keywords take the family's primary; status colors stay near the family's seed hues).
- Keep tinted light backgrounds. Dark backgrounds: near-neutral, with a hint of warmth for warm families.
- Mixing in sRGB, as the Tailwind-ladder generator behind the built-in presets (`src/families.ts`) does, tends toward muddy mixes, heavily tinted dark backgrounds and families that look alike. The OKLCH generator below avoids all three.

## How to apply

Start from `palette-lab/work/oklch-family.mjs` (OKLCH, chroma as a share of the gamut maximum, per-hue lightness, the role-aware `planHues` planner), not the toolkit's `generate` command or `src/families.ts`. Iterate visually: `palette-lab/work/contact-sheet.mjs` puts every theme of every family on one page and is far faster to review than app-shell screenshots.

## Limits (and open questions)

- In light variants, teal and sky primaries (Reef, Nautical, Tealberry) top out at chroma 0.05–0.10 at text darkness. The alternative, moving light primaries toward sapphire, weakens family identity. Open question.
- In dark themes, status pills need white text at 3:1 and the fill must read at 4.5:1 on the background, which needs background lightness ≤ ~0.26. A lifted Everforest-style dark background is not reachable.
