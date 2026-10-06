/**
 * The preset library: six theme families, each with a light and a dark
 * faction and three variations (subtle, pigment, juicy). 36 themes, all
 * generated from the Tailwind palette with enforced contrast. See families.ts.
 */
import { buildAllThemes } from './families';
import type { ThemeFile } from './themeSpec';

export const PRESETS: ThemeFile[] = buildAllThemes();

export const PRESET_IDS = new Set(PRESETS.map((p) => p.id));
export function isPresetId(id: string): boolean {
  return PRESET_IDS.has(id);
}

/**
 * The v0.1 presets by id, mapped to their closest family theme so project
 * files and saved settings that still name them keep working.
 */
export const LEGACY_PRESET_IDS: Record<string, string> = {
  'harbor-fog': 'harbor-dark-pigment',
  'obsidian-ember': 'ember-dark-juicy',
  'midnight-grove': 'grove-dark-pigment',
  nordlys: 'harbor-dark-subtle',
  'velvet-plum': 'plum-dark-juicy',
  'deep-sea': 'lagoon-dark-pigment',
  'graphite-signal': 'ember-dark-subtle',
  'cinder-rose': 'rosewater-dark-subtle',
  'kyoto-night': 'plum-dark-pigment',
  copperplate: 'ember-dark-pigment',
  'paper-birch': 'grove-light-subtle',
  'sea-glass': 'lagoon-light-pigment',
  'linen-sun': 'ember-light-pigment',
  'alpine-snow': 'harbor-light-pigment',
  rosewater: 'rosewater-light-pigment',
  'sage-meadow': 'grove-light-pigment',
  'lavender-milk': 'plum-light-pigment',
  'solar-cream': 'ember-light-subtle',
  'slate-day': 'harbor-light-subtle',
  'ink-and-chalk': 'harbor-dark-juicy',
  'chalk-and-ink': 'harbor-light-juicy',
};

/** Resolve a theme id, following the legacy map when the id is retired. */
export function resolvePresetId(id: string): string {
  return PRESET_IDS.has(id) ? id : LEGACY_PRESET_IDS[id] ?? id;
}
