/**
 * Theme families.
 *
 * Six families, each built on one dominant Tailwind hue with up to four pop
 * hues and a neutral ladder. Every family has two factions (light, dark) and
 * each faction three variations with a distinct character:
 *
 * - subtle:  verges on monochrome. Surfaces sit in the middle of the ladder
 *            (blacks are not very black, whites are not very white), the
 *            accent is desaturated, and pops appear only as low-saturation
 *            tints. Contrast stays at the lower end of what still passes.
 * - pigment: deeper, more saturated color, like ink on matte paper. Surfaces
 *            carry the hue, darks are darker and brights brighter than
 *            subtle, but nothing glows.
 * - juicy:   bright saturated accents and pops, deep blacks and color-tinted
 *            off-blacks, bright whites and color-tinted off-whites.
 *
 * Contrast is enforced, not hoped for. Each foreground role has a target ratio
 * and the generator walks the Tailwind ladder for that hue until the target is
 * met, so the color keeps its identity and the theme stays readable. Status
 * colors have a dual target: readable as text on the background and as a fill
 * under white text (pills and badges).
 */
import { contrastRatio, mix, onColor, withAlpha } from './color';
import { SHADES, tw, type Hue, type Shade } from './tailwind';
import type { CoreColors, ExtendedColors, ThemeFile } from './themeSpec';

export type Faction = 'light' | 'dark';
export type Variation = 'subtle' | 'pigment' | 'juicy';
export const FACTIONS: Faction[] = ['dark', 'light'];
export const VARIATIONS: Variation[] = ['subtle', 'pigment', 'juicy'];

export interface FamilySpec {
  id: string;
  name: string;
  description: string;
  dominant: Hue;
  /** Up to four pop hues, most important first. */
  pops: Hue[];
  neutral: Hue;
}

export const FAMILIES: FamilySpec[] = [
  { id: 'harbor', name: 'Harbor', description: 'Sea air and steel: sky blue over slate.', dominant: 'sky', pops: ['cyan', 'indigo', 'amber', 'rose'], neutral: 'slate' },
  { id: 'grove', name: 'Grove', description: 'Moss and bark: emerald over warm stone.', dominant: 'emerald', pops: ['lime', 'teal', 'amber', 'orange'], neutral: 'stone' },
  { id: 'plum', name: 'Plum', description: 'Late evening: violet over zinc.', dominant: 'violet', pops: ['fuchsia', 'pink', 'sky', 'amber'], neutral: 'zinc' },
  { id: 'ember', name: 'Ember', description: 'Banked fire: orange over stone.', dominant: 'orange', pops: ['amber', 'red', 'yellow', 'cyan'], neutral: 'stone' },
  { id: 'rosewater', name: 'Rosewater', description: 'Petals and paper: rose over neutral gray.', dominant: 'rose', pops: ['pink', 'fuchsia', 'orange', 'teal'], neutral: 'neutral' },
  { id: 'lagoon', name: 'Lagoon', description: 'Still water: teal over cool gray.', dominant: 'teal', pops: ['cyan', 'emerald', 'lime', 'violet'], neutral: 'gray' },
];

export const VARIATION_BLURB: Record<Variation, string> = {
  subtle: 'Near monochrome, soft contrast, tinted pops.',
  pigment: 'Deeper matte color, like ink on paper.',
  juicy: 'Bright saturated pops, deep blacks, bright whites.',
};

/** Contrast targets (WCAG ratios). */
const TARGET = {
  text: 7,
  muted: 4.5,
  faint: 4.5,
  disabled: 2.3,
  accent: 4.5,
  link: 4.5,
  status: 4.5,
  statusUnderWhite: 3,
  code: 4.5,
  comment: 3.5,
};

const PURPLISH: Hue[] = ['violet', 'purple', 'fuchsia', 'indigo', 'pink'];
const CYANISH: Hue[] = ['cyan', 'teal', 'sky'];
const WHITE = '#ffffff';
const BLACK = '#000000';

function idx(shade: Shade): number {
  return SHADES.indexOf(shade);
}

/**
 * Walk the ladder from `start` away from the background (lighter on dark
 * themes, darker on light) until the color reaches `min` contrast against
 * every background in `bgs`. Falls back to the end of the ladder.
 */
function walk(hue: Hue, start: Shade, bgs: string[], min: number, dark: boolean): string {
  const step = dark ? -1 : 1;
  for (let i = idx(start); i >= 0 && i < SHADES.length; i += step) {
    const c = tw(hue, SHADES[i]);
    if (bgs.every((bg) => contrastRatio(c, bg) >= min)) return c;
  }
  return tw(hue, dark ? 50 : 950);
}

/**
 * Like walk(), but for a color that has already been mixed or tinted: keep it
 * if it passes, otherwise nudge it away from the background in small steps
 * (keeping its tint) and only fall back to the pure ladder if that fails.
 */
function verified(mixed: string, hue: Hue, start: Shade, bgs: string[], min: number, dark: boolean): string {
  let c = mixed;
  for (let i = 0; i < 8; i++) {
    if (bgs.every((bg) => contrastRatio(c, bg) >= min)) return c;
    c = mix(c, dark ? WHITE : BLACK, 0.1);
  }
  return walk(hue, start, bgs, min, dark);
}

/**
 * A status color must read as text on the background and as a fill under
 * white text. Scan a fine ladder (Tailwind shades plus interpolations) for the
 * first shade that satisfies both; otherwise take the best compromise.
 */
function dual(hue: Hue, bg: string, dark: boolean): string {
  const fine: string[] = [];
  const from = idx(300);
  const to = idx(800);
  for (let i = from; i < to; i++) {
    const a = tw(hue, SHADES[i]);
    const b = tw(hue, SHADES[i + 1]);
    fine.push(a, mix(a, b, 0.25), mix(a, b, 0.5), mix(a, b, 0.75));
  }
  fine.push(tw(hue, SHADES[to]));
  const order = dark ? fine : [...fine].reverse();
  let best = tw(hue, dark ? 500 : 600);
  let bestScore = -1;
  for (const c of order) {
    const onBg = contrastRatio(c, bg) / TARGET.status;
    const under = contrastRatio(WHITE, c) / TARGET.statusUnderWhite;
    if (onBg >= 1.02 && under >= 1.02) return c;
    const score = Math.min(onBg, under);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/** Desaturate a status color toward the neutral without breaking its dual targets. */
function matte(c: string, neutral: string, amount: number, bg: string): string {
  // Try the requested amount first, then back off, so the finish stays as matte as the targets allow.
  for (let a = amount; a > 0.04; a -= 0.08) {
    const m = mix(c, neutral, a);
    if (contrastRatio(m, bg) >= TARGET.status && contrastRatio(WHITE, m) >= TARGET.statusUnderWhite) return m;
  }
  return c;
}

function nextShade(hue: Hue, from: string, dark: boolean): string {
  const i = SHADES.findIndex((s) => tw(hue, s) === from);
  if (i < 0) return mix(from, dark ? WHITE : BLACK, 0.15);
  const j = Math.max(0, Math.min(SHADES.length - 1, i + (dark ? -1 : 1)));
  return tw(hue, SHADES[j]);
}

interface Character {
  bg: string;
  bg2: string;
  bg3: string;
  border: string;
  active: string;
  hover: string;
  /** Explicit text colors (already tinted); each is verified against the surfaces. */
  text: string;
  muted: string;
  faint: string;
  disabled: string;
  /** How far pop colors are pulled toward the neutral. 0 = pure, 1 = gray. */
  popMix: number;
  /** Preferred accent shade and how much to desaturate it. */
  accentShade: Shade;
  accentMix: number;
  selectedAlpha: number;
  statusMatte: number;
}

/** The surfaces and text tone that give each variation its character. */
function character(f: FamilySpec, dark: boolean, v: Variation): Character {
  const n = f.neutral;
  const d = f.dominant;
  if (dark) {
    if (v === 'subtle') {
      // Not very black: the whole theme lives between neutral 800 and 300.
      return {
        // A third of the way from 800 toward 900: still soft, but dark enough for amber pills to keep both contrast targets.
        bg: mix(mix(tw(n, 800), tw(n, 900), 0.35), tw(d, 900), 0.12), bg2: mix(tw(n, 900), tw(d, 950), 0.12), bg3: mix(tw(n, 700), tw(d, 800), 0.12),
        border: mix(tw(n, 700), tw(n, 600), 0.4), active: mix(tw(n, 600), tw(d, 700), 0.12), hover: 'rgba(255, 255, 255, 0.05)',
        text: tw(n, 300), muted: tw(n, 400), faint: tw(n, 400), disabled: tw(n, 500),
        popMix: 0.55, accentShade: 400, accentMix: 0.45, selectedAlpha: 0.1, statusMatte: 0.35,
      };
    }
    if (v === 'pigment') {
      // Matte ink: deep, saturated surfaces, off-white text.
      return {
        bg: mix(tw(n, 900), tw(d, 950), 0.65), bg2: mix(tw(n, 950), tw(d, 950), 0.5), bg3: mix(tw(n, 800), tw(d, 900), 0.6),
        border: mix(mix(tw(n, 800), tw(d, 900), 0.6), tw(d, 700), 0.3), active: mix(tw(n, 700), tw(d, 800), 0.5), hover: 'rgba(255, 255, 255, 0.06)',
        text: mix(tw(n, 100), tw(d, 100), 0.2), muted: mix(tw(n, 300), tw(d, 300), 0.15), faint: tw(n, 400), disabled: tw(n, 600),
        popMix: 0.18, accentShade: 500, accentMix: 0.08, selectedAlpha: 0.16, statusMatte: 0.15,
      };
    }
    // Juicy: deep black, color-tinted off-black, bright tinted off-white.
    return {
      bg: mix(tw(n, 950), tw(d, 950), 0.5), bg2: mix(BLACK, tw(n, 950), 0.55), bg3: mix(tw(n, 900), tw(d, 900), 0.5),
      border: mix(mix(tw(n, 900), tw(d, 900), 0.5), tw(d, 600), 0.3), active: mix(tw(n, 800), tw(d, 800), 0.5), hover: 'rgba(255, 255, 255, 0.08)',
      text: mix(WHITE, tw(d, 100), 0.25), muted: mix(tw(n, 200), tw(d, 200), 0.3), faint: mix(tw(n, 400), tw(d, 300), 0.2), disabled: tw(n, 600),
      popMix: 0, accentShade: 400, accentMix: 0, selectedAlpha: 0.24, statusMatte: 0,
    };
  }
  if (v === 'subtle') {
    // Not very white: soft gray paper, charcoal text.
    return {
      bg: mix(tw(n, 100), tw(d, 50), 0.25), bg2: mix(tw(n, 200), tw(d, 100), 0.2), bg3: mix(tw(n, 300), tw(d, 100), 0.25),
      border: mix(tw(n, 300), tw(d, 200), 0.2), active: mix(tw(n, 300), tw(d, 200), 0.35), hover: 'rgba(0, 0, 0, 0.04)',
      text: tw(n, 700), muted: tw(n, 600), faint: tw(n, 600), disabled: tw(n, 400),
      popMix: 0.55, accentShade: 600, accentMix: 0.4, selectedAlpha: 0.1, statusMatte: 0.3,
    };
  }
  if (v === 'pigment') {
    // Ink on matte paper: tinted paper, deep saturated marks.
    return {
      bg: mix(tw(n, 50), tw(d, 50), 0.6), bg2: mix(tw(n, 100), tw(d, 100), 0.5), bg3: mix(tw(n, 200), tw(d, 100), 0.6),
      border: mix(tw(n, 300), tw(d, 200), 0.5), active: mix(tw(n, 300), tw(d, 200), 0.6), hover: 'rgba(0, 0, 0, 0.05)',
      text: mix(tw(n, 900), tw(d, 950), 0.3), muted: mix(tw(n, 600), tw(d, 800), 0.2), faint: tw(n, 500), disabled: tw(n, 400),
      popMix: 0.18, accentShade: 700, accentMix: 0.08, selectedAlpha: 0.16, statusMatte: 0.15,
    };
  }
  // Juicy: bright white, color-tinted off-white, deep tinted text.
  return {
    bg: WHITE, bg2: mix(WHITE, tw(d, 50), 0.6), bg3: mix(tw(n, 100), tw(d, 100), 0.6),
    border: mix(tw(n, 200), tw(d, 200), 0.5), active: mix(tw(n, 200), tw(d, 200), 0.7), hover: 'rgba(0, 0, 0, 0.05)',
    text: mix(tw(n, 950), tw(d, 950), 0.5), muted: mix(tw(n, 700), tw(d, 800), 0.3), faint: tw(n, 500), disabled: tw(n, 400),
    popMix: 0, accentShade: 600, accentMix: 0, selectedAlpha: 0.22, statusMatte: 0,
  };
}

export function buildTheme(f: FamilySpec, faction: Faction, variation: Variation): ThemeFile {
  const dark = faction === 'dark';
  const n = f.neutral;
  const d = f.dominant;
  const pop = (i: number): Hue => f.pops[i] ?? f.pops[f.pops.length - 1] ?? d;
  const ch = character(f, dark, variation);
  const surfaces = [ch.bg, ch.bg2, ch.bg3];

  /** A pop or dominant color at the variation's saturation, verified against the surfaces. */
  const tinted = (hue: Hue, shade: Shade, bgs: string[], min: number): string =>
    verified(mix(tw(hue, shade), tw(n, shade), ch.popMix), hue, shade, bgs, min, dark);

  // Text on every surface. Verified keeps the tint and only nudges when needed.
  const text = verified(ch.text, n, dark ? 100 : 900, surfaces, TARGET.text, dark);
  const muted = verified(ch.muted, n, dark ? 300 : 600, surfaces, TARGET.muted, dark);
  const faint = verified(ch.faint, n, dark ? 400 : 500, surfaces, TARGET.faint, dark);
  const disabled = verified(ch.disabled, n, dark ? 600 : 400, [ch.bg], TARGET.disabled, dark);

  // Accent
  let primary = verified(mix(tw(d, ch.accentShade), tw(n, ch.accentShade), ch.accentMix), d, ch.accentShade, surfaces, TARGET.accent, dark);
  let onPrimary = onColor(primary);
  for (let i = 0; i < 3 && contrastRatio(onPrimary, primary) < 4.5; i++) {
    primary = nextShade(d, primary, dark);
    onPrimary = onColor(primary);
  }
  const primaryHover = variation === 'subtle' ? mix(primary, text, 0.15) : nextShade(d, primary, dark);

  // Links and info: subtle keeps the dominant (monochrome), the others reach for pops.
  const linkHue = variation === 'subtle' ? d : pop(0);
  const linkShade: Shade = dark ? 300 : 600;
  const link = tinted(linkHue, linkShade, surfaces, TARGET.link);
  const linkHover = mix(link, dark ? WHITE : BLACK, 0.15);
  const infoHue = variation === 'subtle' ? d : pop(1);
  const info = matte(dual(infoHue, ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);

  // Status colors keep their meaning; the ladder finds the readable shade and
  // subtle/pigment pull them toward the neutral for a matte finish.
  const success = matte(dual(f.pops.includes('lime') && variation === 'juicy' ? 'lime' : 'emerald', ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
  const warning = matte(dual('amber', ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
  const error = matte(dual(d === 'rose' || d === 'red' ? 'orange' : 'red', ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);

  const colors: CoreColors = {
    bg: ch.bg, 'bg-secondary': ch.bg2, 'bg-tertiary': ch.bg3,
    'bg-hover': ch.hover, 'bg-selected': withAlpha(primary, ch.selectedAlpha), 'bg-active': ch.active,
    text, 'text-muted': muted, 'text-faint': faint, 'text-disabled': disabled,
    border: ch.border, 'border-focus': primary,
    primary, 'primary-hover': primaryHover, link, 'link-hover': linkHover,
    success, warning, error, info,
  };

  // Extended: pops in code, purple accent, and (juicy) terminal and highlights.
  const codeShade: Shade = dark ? 300 : 700;
  const codeBgs = [ch.bg2];
  const purpleHue = f.pops.find((p) => PURPLISH.includes(p)) ?? 'violet';
  const cyanHue = f.pops.find((p) => CYANISH.includes(p)) ?? 'cyan';
  const extended: Partial<ExtendedColors> = {
    'on-primary': onPrimary,
    purple: tinted(purpleHue, dark ? 400 : 600, surfaces, TARGET.accent),
    'code-selector': tinted(d, codeShade, codeBgs, TARGET.code),
    'code-function': tinted(pop(0), codeShade, codeBgs, TARGET.code),
    'code-attr': tinted(pop(1), codeShade, codeBgs, TARGET.code),
    'code-variable': tinted(pop(2), codeShade, codeBgs, TARGET.code),
    'code-property': tinted(pop(3), codeShade, codeBgs, TARGET.code),
    'code-comment': walk(n, 500, codeBgs, TARGET.comment, dark),
    'code-punctuation': walk(n, dark ? 400 : 600, codeBgs, TARGET.code, dark),
    'code-operator': muted,
    'code-text': text,
  };
  // Terminal magenta and cyan: deriveExtended's fixed defaults land just under
  // 4.5:1 on tinted subtle and pigment surfaces, so every variation sets them
  // (at its own saturation); juicy overrides with the pure ladder below.
  extended['terminal-ansi-magenta'] = tinted(purpleHue, dark ? 400 : 600, [ch.bg2], TARGET.code);
  extended['terminal-ansi-cyan'] = tinted(cyanHue, dark ? 400 : 600, [ch.bg2], TARGET.code);
  if (variation === 'subtle') {
    // Near monochrome: the dominant carries the syntax, one pop as a tint.
    extended['code-variable'] = tinted(d, codeShade, codeBgs, TARGET.code);
    extended['code-property'] = tinted(pop(0), codeShade, codeBgs, TARGET.code);
    extended['code-attr'] = verified(mix(tw(n, dark ? 300 : 700), tw(d, codeShade), 0.35), n, dark ? 300 : 700, codeBgs, TARGET.code, dark);
  }
  if (variation === 'juicy') {
    extended['terminal-ansi-magenta'] = walk(purpleHue, dark ? 400 : 600, [ch.bg2], TARGET.code, dark);
    extended['terminal-ansi-cyan'] = walk(cyanHue, dark ? 400 : 600, [ch.bg2], TARGET.code, dark);
    extended['terminal-ansi-blue'] = primary;
    extended['terminal-ansi-bright-magenta'] = walk(purpleHue, dark ? 300 : 700, [ch.bg2], TARGET.code, dark);
    extended['terminal-ansi-bright-cyan'] = walk(cyanHue, dark ? 300 : 700, [ch.bg2], TARGET.code, dark);
    extended['terminal-cursor'] = primary;
    const hl = pop(3);
    extended['highlight-bg'] = withAlpha(tw(hl, 400), 0.28);
    extended['highlight-border'] = withAlpha(tw(hl, 400), 0.55);
    extended['comment-mark'] = tw(hl, 300);
    extended['toolbar-active'] = withAlpha(primary, 0.25);
  }

  const vName = variation[0].toUpperCase() + variation.slice(1);
  const fName = faction[0].toUpperCase() + faction.slice(1);
  return {
    id: `${f.id}-${faction}-${variation}`,
    name: `${f.name} ${fName} ${vName}`,
    version: '2.1.0',
    author: 'Mr. Themes',
    description: `${f.description} ${VARIATION_BLURB[variation]}`,
    isDark: dark,
    tags: [faction, variation, f.id, f.dominant, ...f.pops],
    family: f.id,
    faction,
    variation,
    colors,
    extended,
    format: 1,
  };
}

export function buildAllThemes(): ThemeFile[] {
  const out: ThemeFile[] = [];
  for (const f of FAMILIES) for (const faction of FACTIONS) for (const v of VARIATIONS) out.push(buildTheme(f, faction, v));
  return out;
}

export function familyOf(id: string | undefined): FamilySpec | undefined {
  return FAMILIES.find((f) => f.id === id);
}

/** Swatches that summarize a family in the gallery header. */
export function familySwatches(f: FamilySpec, dark: boolean): string[] {
  const s: Shade = dark ? 400 : 600;
  return [tw(f.dominant, s), ...f.pops.map((p) => tw(p, s))];
}
