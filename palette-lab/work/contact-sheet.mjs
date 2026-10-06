// One-page comparison of every family: a row per family, a card per variant.
//   node work/contact-sheet.mjs reef nautical desert ...   (default: every work/v2/*.nimfamily)
// Writes work/v2/contact-sheet.html. Each card uses the theme's own resolved colors.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTheme } from '../lib/mr-themes-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(join(here, 'v2')).filter((f) => /^[a-z]+\.nimfamily$/.test(f)).map((f) => f.replace('.nimfamily', ''));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function card(t) {
  const r = resolveTheme(t);
  const c = { ...r.core, ...r.extended };
  const tok = (k, s) => `<span style="color:${c[k]}">${esc(s)}</span>`;
  const pill = (k, s) => `<span class="pill" style="background:${c[k]}">${s}</span>`;
  return `<div class="card" style="background:${c.bg};color:${c.text};border-color:${c.border}">
  <div class="side" style="background:${c['bg-secondary']};border-color:${c.border}">
    <div class="tile" style="background:${c.primary};color:${c['on-primary']}">D</div>
    <div class="tile" style="background:${c['bg-tertiary']}"></div>
    <div class="row sel" style="background:${c['bg-selected']}"></div>
    <div class="row" style="background:${c['bg-tertiary']}"></div>
  </div>
  <div class="main">
    <div class="name" style="color:${c['text-faint']}">${t.faction} ${t.variation}</div>
    <div class="h">Theme rollout</div>
    <div class="p">Body text with a <span style="color:${c.link};text-decoration:underline">link</span> and <span style="color:${c['text-muted']}">muted notes</span>.</div>
    <div class="pills">${pill('success', 'done')}${pill('warning', 'warn')}${pill('error', 'error')}${pill('info', 'info')}
      <span class="btn" style="background:${c.primary};color:${c['on-primary']}">Save</span></div>
    <pre style="background:${c['code-bg']};border-color:${c['code-border']};color:${c['code-text']}">${tok('code-comment', '// derive from core keys')}
${tok('code-selector', 'export function')} ${tok('code-function', 'resolve')}(${tok('code-variable', 'theme')}: ${tok('code-property', 'ThemeFile')}) {
  ${tok('code-selector', 'const')} ${tok('code-variable', 'v')} ${tok('code-operator', '=')} ${tok('code-function', 'derive')}(${tok('code-attr', '"core"')}${tok('code-punctuation', ',')} ${tok('purple', '42')});
}</pre>
  </div>
</div>`;
}

let body = '';
for (const id of ids) {
  const fam = JSON.parse(readFileSync(join(here, 'v2', `${id}.nimfamily`), 'utf8'));
  const sw = (fam.family.swatches ?? []).map((s) => `<i style="background:${s}"></i>`).join('');
  body += `<section><h2>${esc(fam.family.name)} <span class="sw">${sw}</span><small>${esc(fam.family.description ?? '')}</small></h2>
  <div class="cards">${fam.themes.map(card).join('')}</div></section>`;
}

writeFileSync(join(here, 'v2', 'contact-sheet.html'), `<!doctype html><meta charset="utf-8"><title>Mr. Themes families</title>
<style>
body{margin:0;padding:16px 20px;background:#202020;color:#eee;font:13px/1.35 -apple-system,system-ui,sans-serif}
h2{font-size:15px;margin:14px 0 8px;display:flex;align-items:center;gap:10px}
h2 small{font-weight:400;color:#aaa;font-size:12px}
.sw{display:inline-flex;gap:2px}.sw i{width:14px;height:14px;border-radius:3px;display:inline-block}.sw i:first-child{width:28px}
.cards{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.card{display:flex;border:1px solid;border-radius:8px;overflow:hidden;min-height:188px}
.side{width:34px;border-right:1px solid;padding:6px 4px;display:flex;flex-direction:column;gap:5px}
.tile{height:24px;border-radius:5px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.row{height:6px;border-radius:3px}
.main{flex:1;padding:7px 9px;min-width:0}
.name{font-size:10px;text-transform:uppercase;letter-spacing:.06em}
.h{font-weight:650;font-size:14px;margin:2px 0}
.p{font-size:11.5px;margin-bottom:6px}
.pills{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.pill{color:#fff;font-size:10px;font-weight:600;padding:1px 6px;border-radius:9px}
.btn{margin-left:auto;font-size:10.5px;font-weight:600;padding:2px 9px;border-radius:5px}
pre{margin:0;font:10.5px/1.45 ui-monospace,Menlo,monospace;padding:5px 6px;border:1px solid;border-radius:5px;white-space:pre;overflow:hidden}
</style>${body}`);
console.log('wrote work/v2/contact-sheet.html');
