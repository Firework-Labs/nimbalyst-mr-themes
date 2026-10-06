/**
 * Mr. Themes Toolkit — core library entry point.
 *
 * Re-exports the theme model, generator, and contrast tooling from the Mr.
 * Themes extension sources (`../src/`, the repository root) plus this
 * toolkit's own `fullAudit`/`familyAudit`. Nothing here reimplements logic
 * that already exists in the extension — see the module docstrings in that
 * project for how the model, generator and audit actually work.
 *
 * This is the single module `build.mjs` bundles into `lib/mr-themes-core.js`
 * (browser IIFE, global `MrThemes`) and `lib/mr-themes-core.mjs` (Node ESM).
 * Both are committed artifacts: the CLI and any preview page import the
 * built `lib/` files, not this source, so the toolkit works even when the
 * extension sources it was built from are not present.
 */

// --- Theme model (themeSpec.ts) --------------------------------------------
export {
  CORE_KEYS,
  EXTENDED_KEYS,
  ALL_KEYS,
  LABELS,
  GROUPS,
  cssVar,
  resolveTheme,
  normalizeTheme,
  serializeThemeFile,
  parseThemeFile,
  deriveExtended,
  slugify,
  cloneTheme,
  emptyTheme,
  themeFromVars,
  toThemeExtensionManifest,
  BASE_DARK_CORE,
  BASE_LIGHT_CORE,
  THEME_FILE_VERSION,
  type ThemeFile,
  type ResolvedTheme,
  type CoreKey,
  type ExtendedKey,
  type ThemeKey,
  type CoreColors,
  type ExtendedColors,
  type ThemeGroup,
} from '../../src/themeSpec';

// --- Contrast audit and repair (contrast.ts) --------------------------------
export {
  auditTheme,
  fixContrast,
  auditSummary,
  type ContrastCheck,
} from '../../src/contrast';

// --- Color helpers (color.ts) -----------------------------------------------
export {
  parseColor,
  isValidColor,
  toHex,
  formatColor,
  withAlpha,
  mix,
  adjust,
  luminance,
  composite,
  contrastRatio,
  isDarkColor,
  onColor,
  contrastGrade,
  type RGBA,
} from '../../src/color';

// --- Tailwind palette (tailwind.ts) -----------------------------------------
export {
  SHADES,
  TAILWIND,
  HUES,
  tw,
  shadeIndex,
  ladder,
  type Shade,
  type Hue,
} from '../../src/tailwind';

// --- Family generator (families.ts) -----------------------------------------
export {
  FACTIONS,
  VARIATIONS,
  FAMILIES,
  VARIATION_BLURB,
  buildTheme,
  buildAllThemes,
  familyOf,
  familySwatches,
  type Faction,
  type Variation,
  type FamilySpec,
} from '../../src/families';

// --- Collection / import-export format (collection.ts) ----------------------
export {
  FAMILY_FILE_KIND,
  FAMILY_FILE_VERSION,
  NEUTRAL_HUES,
  COLOR_HUES,
  BUILTIN_FAMILIES,
  toFamilySpec,
  generateFamilyThemes,
  normalizeFamily,
  parseImport,
  serializeFamilyFile,
  uniqueSlug,
  type FamilyGenerator,
  type ThemeFamily,
  type ImportPayload,
} from '../../src/collection';

// --- This toolkit's own audit ------------------------------------------------
export { fullAudit, familyAudit, summarize, compositeOver, type Check, type CheckGroup } from './audit';
