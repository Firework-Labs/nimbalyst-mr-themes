/**
 * Offline contrast audit of every built-in preset with the extension's own
 * 17-check audit (src/contrast.ts). Run with `npm run audit`; no app needed.
 * The toolkit's larger audit (~75 checks) is `node toolkit/cli/mrthemes.mjs audit <file>`.
 */
import { PRESETS } from '../src/presets';
import { auditTheme } from '../src/contrast';

let fails = 0;
for (const t of PRESETS) {
  const f = auditTheme(t).filter((r) => !r.pass);
  fails += f.length;
  if (f.length) console.log(t.id, f.map((x) => `${x.id}=${x.ratio.toFixed(1)}/${x.target}`).join(' '));
}
console.log('presets', PRESETS.length, 'failing checks', fails);
