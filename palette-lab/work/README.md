# Palette lab: working files

`palette-lab/` is a copy of the Family Builder Kit as Mr. Themes downloaded it on 2026-09-24 (so `../lib/`, `../cli/` and `../preview/` are a snapshot of the kit at that time), plus this `work/` folder and `../exports/`. It was used to build seven families from seven uicolors.app palettes on 2026-09-24/25. The taste they were tuned to is in `docs/palette-preferences.md`. Only the contact sheets from `work/screenshots/` and `work/v2/` are in the public repository; the per-round app screenshots are not.

## Files

- `oklch-family.mjs`: **the generator to use.** OKLCH, chroma as a share of the gamut maximum at each lightness, per-hue lightness, and `planHues`, which moves hues with role guardrails (status in semantic ranges, primary within ±12°, UI roles ≥30° apart, code roles ≥24°, warning/error ≥42°). It prints `!` when the planner had to fall back. Tuning surface: the `VARIANTS` table and the `FAMILIES` roles. Writes `v2/<id>.nimfamily`.
- `uicolors-palettes.json`: the user's seven palettes as data (read from a screenshot and cross-checked by sampling swatch pixels).
- `contact-sheet.mjs` → `v2/contact-sheet.html`: every theme of the named families on one page. Latest capture: `v2/contact-sheet-r7.png`.
- `hues.mjs`: chroma and hue per role for a family file.
- `grid.py`: stitches six app-shell screenshots (from `screenshots/`) into review grids in `v2/`. Needs Pillow.
- `screenshots/`: the browser screenshots from the review rounds (desert rounds r2–r4, old vs new desert, app shells, contact sheets).
- `v2/*-r<N>.nimfamily`, `v2/desert-compare.json`, `v2/*.png`: earlier review rounds, kept for comparison.
- `build-families.mjs`, `all-families.json`, `*.nimfamily` in this folder, `ref/harbor-ref.nimfamily`: the **first, superseded attempt** with the kit's own Tailwind-ladder generator and custom ramps.

## Finished output

`../exports/*.nimfamily`: Reef, Nautical, Desert, Meadow, Canyon, Nordic, Tealberry. 42 themes, every file 0 fail / 0 warn on `mrthemes audit` including the family checks. **Not yet imported into Mr. Themes or seen in the real app.**

## Rebuild and check

From `palette-lab/`:

```bash
node work/oklch-family.mjs
for f in work/v2/{reef,nautical,desert,meadow,canyon,nordic,tealberry}.nimfamily; do node cli/mrthemes.mjs audit $f; done
node work/contact-sheet.mjs reef nautical desert meadow canyon nordic tealberry
node cli/mrthemes.mjs export work/v2/<id>.nimfamily --out exports/<id>.nimfamily
```

To import: Mr. Themes → Theme Families → **Import family** → pick a file in `exports/`; choose **Replace** if the family id already exists (keeps project assignments).
