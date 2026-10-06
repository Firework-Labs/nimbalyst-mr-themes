// Print OKLCH chroma/hue of each accent role, per theme, for one or more families.
//   node work/hues.mjs work/v2/desert-r3.nimfamily work/v2/desert.nimfamily
import { readFileSync } from 'node:fs';

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function ok(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787745 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return `${Math.hypot(A, B).toFixed(2)}/${Math.round(((Math.atan2(B, A) * 180) / Math.PI + 360) % 360)}`;
}
const KEYS = ['primary', 'link', 'success', 'warning', 'error', 'info', 'code-selector', 'code-function', 'code-attr', 'code-variable', 'code-property', 'purple'];
console.log('chroma/hue'.padEnd(26) + KEYS.map((k) => k.replace('code-', '').slice(0, 8).padEnd(9)).join(''));
for (const file of process.argv.slice(2)) {
  const tag = file.split('/').pop().replace('.nimfamily', '');
  for (const t of JSON.parse(readFileSync(file, 'utf8')).themes) {
    const c = { ...t.colors, ...t.extended };
    console.log(`${tag} ${t.faction}-${t.variation}`.padEnd(26) + KEYS.map((k) => ok(c[k]).padEnd(9)).join(''));
  }
}
