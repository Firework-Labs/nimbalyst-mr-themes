/**
 * Small color toolkit: parsing, formatting, mixing, and WCAG contrast.
 * Supports hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba(), and a few names.
 */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'rgba(0, 0, 0, 0)',
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function parseColor(input: string | undefined | null): RGBA | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  if (s.startsWith('#')) {
    const h = s.slice(1);
    if (![3, 4, 6, 8].includes(h.length) || /[^0-9a-f]/.test(h)) return null;
    const full = h.length <= 4 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full.slice(0, 6), 16);
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    let a = 1;
    if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: clamp255(+m[1]), g: clamp255(+m[2]), b: clamp255(+m[3]), a: clamp01(a) };
  }
  return null;
}

export function isValidColor(input: string): boolean {
  return parseColor(input) !== null;
}

const hex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0');

/** Opaque hex for <input type="color">. Alpha is dropped. */
export function toHex(c: RGBA): string {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
}

export function formatColor(c: RGBA): string {
  if (c.a >= 1) return toHex(c);
  const a = Math.round(c.a * 1000) / 1000;
  return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${a})`;
}

export function withAlpha(color: string, a: number): string {
  const c = parseColor(color) ?? { r: 0, g: 0, b: 0, a: 1 };
  return formatColor({ ...c, a: clamp01(a) });
}

/** Linear mix of two colors, t=0 gives a, t=1 gives b. Alpha is mixed too. */
export function mix(a: string, b: string, t: number): string {
  const ca = parseColor(a) ?? { r: 0, g: 0, b: 0, a: 1 };
  const cb = parseColor(b) ?? { r: 0, g: 0, b: 0, a: 1 };
  const k = clamp01(t);
  return formatColor({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
    a: ca.a + (cb.a - ca.a) * k,
  });
}

/** Positive amount lightens toward white, negative darkens toward black. */
export function adjust(color: string, amount: number): string {
  return amount >= 0 ? mix(color, '#ffffff', amount) : mix(color, '#000000', -amount);
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(c: RGBA): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** Composite a translucent foreground over an opaque background. */
export function composite(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.x contrast ratio, 1 to 21. Translucent colors are composited onto bg. */
export function contrastRatio(fg: string, bg: string): number {
  const cb = parseColor(bg);
  const cf = parseColor(fg);
  if (!cb || !cf) return 1;
  const bgo = cb.a < 1 ? composite(cb, { r: 255, g: 255, b: 255, a: 1 }) : cb;
  const fgo = cf.a < 1 ? composite(cf, bgo) : cf;
  const l1 = luminance(fgo);
  const l2 = luminance(bgo);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function isDarkColor(color: string): boolean {
  const c = parseColor(color);
  if (!c) return true;
  return luminance(c) < 0.35;
}

/** A text color that reads on the given background. */
export function onColor(bg: string, dark = '#111827', light = '#f8fafc'): string {
  return contrastRatio(dark, bg) >= contrastRatio(light, bg) ? dark : light;
}

export function contrastGrade(ratio: number): 'AAA' | 'AA' | 'AA-large' | 'fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}
