/**
 * Three representative Nimbalyst screens, styled only with var(--nim-*) so
 * they render whatever theme is set on their wrapper.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedTheme } from '../themeSpec';

export type PreviewId = 'workspace' | 'code' | 'tracker';
export const PREVIEWS: { id: PreviewId; title: string }[] = [
  { id: 'workspace', title: 'Workspace' },
  { id: 'code', title: 'Code and terminal' },
  { id: 'tracker', title: 'Tracker and settings' },
];

const v = (k: string) => `var(--nim-${k})`;

export function PreviewFrame({ resolved, children }: { resolved: ResolvedTheme; children: ReactNode }) {
  return (
    <div className="nte-scene" style={resolved.vars as CSSProperties}>
      {children}
    </div>
  );
}

function Rail() {
  return (
    <div style={{ width: 44, background: v('bg-secondary'), borderRight: `1px solid ${v('border')}`, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 6, flex: 'none' }}>
      {['AT', 'FN', 'OR', 'LH'].map((t, i) => (
        <div key={t} style={{ height: 32, borderRadius: 8, background: i === 2 ? v('primary') : v('bg-tertiary'), color: i === 2 ? v('on-primary') : v('text-muted'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
          {t}
        </div>
      ))}
      <div style={{ height: 32, borderRadius: 8, border: `1px dashed ${v('border')}`, color: v('text-faint'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</div>
    </div>
  );
}

function Gutter() {
  return (
    <div style={{ width: 36, background: v('bg-secondary'), borderRight: `1px solid ${v('border')}`, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ height: 24, borderRadius: 6, background: i === 0 ? v('bg-selected') : v('bg-tertiary'), outline: i === 0 ? `1px solid ${v('primary')}` : 'none' }} />
      ))}
    </div>
  );
}

/**
 * Status pills the way Nimbalyst draws them: white text on the status fill.
 * This is exactly the pair the audit checks, so a weak status color shows
 * up here first.
 */
function Badge({ kind, children }: { kind: 'success' | 'warning' | 'error' | 'info'; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: v(kind), color: '#ffffff', marginRight: 4 }}>
      {children}
    </span>
  );
}

export function WorkspacePreview() {
  const tree = [
    ['📁', 'docs', 0, false], ['📄', 'README.md', 1, true], ['📄', 'plan.md', 1, false], ['📁', 'src', 0, false], ['📄', 'index.ts', 1, false], ['📄', 'theme.ts', 1, false], ['📄', 'package.json', 0, false],
  ] as const;
  return (
    <>
      <Rail />
      <Gutter />
      <div style={{ width: 170, background: v('bg-secondary'), borderRight: `1px solid ${v('border')}`, padding: 8, color: v('text-muted'), flex: 'none' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: v('text-faint'), padding: '2px 6px 6px' }}>Files</div>
        {tree.map(([ic, name, depth, on]) => (
          <div key={name} style={{ padding: '3px 6px', paddingLeft: 6 + depth * 12, borderRadius: 4, background: on ? v('bg-selected') : 'transparent', color: on ? v('text') : v('text-muted') }}>
            {ic} {name}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 30, background: v('toolbar-bg'), borderBottom: `1px solid ${v('toolbar-border')}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', color: v('text-muted'), fontSize: 11 }}>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: v('toolbar-active'), color: v('text') }}>README.md</span>
          <span style={{ padding: '2px 8px', borderRadius: 4 }}>plan.md</span>
          <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: v('toolbar-hover') }}>⋯</span>
        </div>
        <div style={{ padding: '18px 22px', overflow: 'hidden' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: v('text') }}>Approval flow</h2>
          <p style={{ margin: '0 0 8px', color: v('text-muted') }}>
            Requests move from <a href="#" style={{ color: v('link') }}>submitted</a> to approved. Muted text explains the details, and faint text{' '}
            <span style={{ color: v('text-faint') }}>marks metadata like dates</span>.
          </p>
          <blockquote style={{ margin: '8px 0', padding: '4px 10px', borderLeft: `3px solid ${v('quote-border')}`, color: v('quote-text') }}>
            Every approval needs two reviewers. <mark style={{ background: v('highlight-bg'), border: `1px solid ${v('highlight-border')}`, color: 'inherit', borderRadius: 3 }}>Highlighted</mark> for emphasis.
          </blockquote>
          <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0' }}>
            <thead><tr>{['Stage', 'Owner', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '4px 8px', border: `1px solid ${v('table-border')}`, background: v('table-header') }}>{h}</th>)}</tr></thead>
            <tbody>
              {[['Submitted', 'Ana', 'success'], ['Review', 'Kit', 'warning'], ['Blocked', 'Sam', 'error']].map(([a, b, c], i) => (
                <tr key={a}>
                  <td style={{ padding: '4px 8px', border: `1px solid ${v('table-border')}`, background: i % 2 ? v('table-stripe') : v('table-cell') }}>{a}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${v('table-border')}`, background: i % 2 ? v('table-stripe') : v('table-cell') }}>{b}</td>
                  <td style={{ padding: '4px 8px', border: `1px solid ${v('table-border')}`, background: i % 2 ? v('table-stripe') : v('table-cell') }}><Badge kind={c as 'success'}>{c}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <pre style={{ margin: '8px 0', padding: '8px 10px', borderRadius: 6, background: v('code-bg'), border: `1px solid ${v('code-border')}`, color: v('code-text'), fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>
            <span style={{ color: v('code-comment') }}>{'// derived code colors\n'}</span>
            <span style={{ color: v('code-selector') }}>const</span> <span style={{ color: v('code-variable') }}>theme</span> <span style={{ color: v('code-operator') }}>=</span> <span style={{ color: v('code-function') }}>load</span>
            <span style={{ color: v('code-punctuation') }}>(</span><span style={{ color: v('code-attr') }}>'harbor-fog'</span><span style={{ color: v('code-punctuation') }}>);</span>
          </pre>
          <div style={{ padding: '6px 10px', borderRadius: 6, background: v('diff-add-bg'), border: `1px solid ${v('diff-add-border')}`, marginBottom: 4 }}>+ Added by the agent</div>
          <div style={{ padding: '6px 10px', borderRadius: 6, background: v('diff-remove-bg'), border: `1px solid ${v('diff-remove-border')}` }}>- Removed by the agent</div>
        </div>
      </div>
      <div style={{ width: 230, borderLeft: `1px solid ${v('border')}`, background: v('bg-secondary'), padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
        <div style={{ background: v('bg-selected'), borderRadius: 8, padding: 8, color: v('text') }}>Make the sidebar a touch lighter</div>
        <div style={{ background: v('bg-tertiary'), borderRadius: 8, padding: 8, color: v('text-muted') }}>Bumping <b style={{ color: v('text') }}>bg-secondary</b> two steps toward the base background.</div>
        <div style={{ border: `1px solid ${v('border')}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10.5, color: v('text-faint') }}>▸ theme.apply {'{ "bg-secondary": "#0d1629" }'}</div>
        <div style={{ background: v('bg-tertiary'), borderRadius: 8, padding: 8, color: v('text-muted') }}>Done. Want the border to follow?</div>
        <div style={{ marginTop: 'auto', border: `1px solid ${v('border-focus')}`, borderRadius: 6, padding: '6px 8px', color: v('text-faint'), background: v('bg') }}>Message Claude…</div>
      </div>
    </>
  );
}

export function CodeTerminalPreview() {
  const ansi = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const lines = [
    [['code-comment', '// Nimbalyst theme loader']],
    [['code-selector', 'import'], ['code-punctuation', ' { '], ['code-variable', 'resolveTheme'], ['code-punctuation', ' } '], ['code-selector', 'from'], ['code-attr', " './themeSpec'"], ['code-punctuation', ';']],
    [['code-punctuation', '']],
    [['code-selector', 'export function'], ['code-function', ' apply'], ['code-punctuation', '('], ['code-variable', 'theme'], ['code-punctuation', ': '], ['code-property', 'ThemeFile'], ['code-punctuation', ') {']],
    [['code-punctuation', '  '], ['code-selector', 'const'], ['code-variable', ' vars'], ['code-operator', ' = '], ['code-function', 'resolveTheme'], ['code-punctuation', '('], ['code-variable', 'theme'], ['code-punctuation', ').'], ['code-property', 'vars'], ['code-punctuation', ';']],
    [['code-punctuation', '  '], ['code-selector', 'for'], ['code-punctuation', ' ('], ['code-selector', 'const'], ['code-punctuation', ' ['], ['code-variable', 'name'], ['code-punctuation', ', '], ['code-variable', 'value'], ['code-punctuation', '] '], ['code-selector', 'of'], ['code-punctuation', ' Object.'], ['code-function', 'entries'], ['code-punctuation', '('], ['code-variable', 'vars'], ['code-punctuation', ')) {']],
    [['code-punctuation', '    document.documentElement.'], ['code-property', 'style'], ['code-punctuation', '.'], ['code-function', 'setProperty'], ['code-punctuation', '('], ['code-variable', 'name'], ['code-punctuation', ', '], ['code-variable', 'value'], ['code-punctuation', ');']],
    [['code-punctuation', '  }']],
    [['code-punctuation', '}']],
  ];
  return (
    <>
      <Rail />
      <Gutter />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 30, background: v('toolbar-bg'), borderBottom: `1px solid ${v('toolbar-border')}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', color: v('text-muted'), fontSize: 11 }}>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: v('toolbar-active'), color: v('text') }}>applier.ts</span>
          <span style={{ padding: '2px 8px' }}>themeSpec.ts</span>
        </div>
        <div style={{ flex: 1, display: 'flex', background: v('code-bg'), color: v('code-text'), fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, lineHeight: '19px', overflow: 'hidden' }}>
          <div style={{ width: 38, background: v('code-gutter'), color: v('text-faint'), textAlign: 'right', padding: '10px 8px 0 0', flex: 'none' }}>
            {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <div style={{ padding: '10px 12px', whiteSpace: 'pre', overflow: 'hidden' }}>
            {lines.map((segs, i) => (
              <div key={i} style={{ background: i === 4 ? v('bg-selected') : 'transparent' }}>
                {segs.map(([k, t], j) => <span key={j} style={{ color: v(k) }}>{t}</span>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 150, borderTop: `2px solid ${v('border')}`, background: 'var(--terminal-bg)', color: 'var(--terminal-fg)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, padding: 10, flex: 'none' }}>
          <div style={{ color: v('text-faint'), marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Terminal</div>
          <div><span style={{ color: 'var(--terminal-ansi-green)' }}>➜</span> <span style={{ color: 'var(--terminal-ansi-cyan)' }}>atlas-api</span> <span style={{ color: 'var(--terminal-ansi-bright-black)' }}>git:(</span><span style={{ color: 'var(--terminal-ansi-red)' }}>main</span><span style={{ color: 'var(--terminal-ansi-bright-black)' }}>)</span> npm run build</div>
          <div><span style={{ color: 'var(--terminal-ansi-yellow)' }}>warn</span> 2 modules transformed · <span style={{ color: 'var(--terminal-ansi-green)' }}>✓ built in 36ms</span></div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {ansi.map((c) => <span key={c} style={{ width: 22, height: 12, background: `var(--terminal-ansi-${c})`, borderRadius: 2 }} />)}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {ansi.map((c) => <span key={c} style={{ width: 22, height: 12, background: `var(--terminal-ansi-bright-${c})`, borderRadius: 2 }} />)}
          </div>
          <div style={{ marginTop: 8 }}>$ <span style={{ display: 'inline-block', width: 7, height: 12, background: 'var(--terminal-cursor)', verticalAlign: 'middle' }} /><span style={{ background: 'var(--terminal-selection)' }}> selected text</span></div>
        </div>
      </div>
    </>
  );
}

export function TrackerSettingsPreview() {
  const cols: [string, [string, 'success' | 'warning' | 'error' | 'info'][]][] = [
    ['Backlog', [['Poster builder', 'info'], ['Wide rail spike', 'info']]],
    ['In progress', [['Theme applier', 'warning'], ['Preview screens', 'warning']]],
    ['Done', [['Preset library', 'success'], ['Color toolkit', 'success']]],
  ];
  return (
    <>
      <Rail />
      <Gutter />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        <div style={{ flex: 1, padding: 14, borderRight: `1px solid ${v('border')}`, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <b style={{ fontSize: 13 }}>Tracker</b>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: v('primary'), color: v('on-primary'), fontWeight: 600, fontSize: 11 }}>+ New item</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {cols.map(([title, items]) => (
              <div key={title} style={{ background: v('bg-secondary'), border: `1px solid ${v('border')}`, borderRadius: 8, padding: 8 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: v('text-faint'), marginBottom: 6 }}>{title}</div>
                {items.map(([name, kind]) => (
                  <div key={name} style={{ background: v('bg'), border: `1px solid ${v('border')}`, borderRadius: 6, padding: 7, marginBottom: 6 }}>
                    <div style={{ marginBottom: 4 }}>{name}</div>
                    <Badge kind={kind}>{kind}</Badge><span style={{ color: v('text-faint'), fontSize: 10 }}>SAN-12</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: v('bg-tertiary'), color: v('text-muted') }}>
            Hover state <span style={{ background: v('bg-hover'), padding: '2px 6px', borderRadius: 4 }}>hover</span> · selected <span style={{ background: v('bg-selected'), padding: '2px 6px', borderRadius: 4 }}>selected</span> · active <span style={{ background: v('bg-active'), padding: '2px 6px', borderRadius: 4, color: v('text') }}>active</span> · <span style={{ color: v('text-disabled') }}>disabled</span>
          </div>
        </div>
        <div style={{ width: 300, padding: 14, background: v('bg'), flex: 'none' }}>
          <b style={{ fontSize: 13 }}>Settings</b>
          <div style={{ color: v('text-faint'), fontSize: 10.5, marginBottom: 10 }}>Application › Appearance</div>
          {[['Theme', 'Harbor Fog'], ['Font size', '13']].map(([l, val]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${v('border')}` }}>
              <span style={{ color: v('text-muted') }}>{l}</span>
              <span style={{ background: v('bg-secondary'), border: `1px solid ${v('border')}`, borderRadius: 5, padding: '3px 8px', minWidth: 100 }}>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${v('border')}` }}>
            <span style={{ color: v('text-muted') }}>Focused input</span>
            <span style={{ background: v('bg-secondary'), border: `1px solid ${v('border-focus')}`, boxShadow: `0 0 0 2px ${v('bg-selected')}`, borderRadius: 5, padding: '3px 8px', minWidth: 100, color: v('text-faint') }}>typing…</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${v('border')}` }}>
            <span style={{ color: v('text-muted') }}>Completion sound</span>
            <span style={{ width: 30, height: 16, borderRadius: 8, background: v('primary'), position: 'relative', display: 'inline-block' }}><i style={{ position: 'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius: '50%', background: v('on-primary') }} /></span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, background: v('primary'), color: v('on-primary'), fontWeight: 600 }}>Save</span>
            <span style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${v('border')}`, background: v('bg-tertiary') }}>Cancel</span>
            <span style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${v('error')}`, color: v('error') }}>Reset</span>
          </div>
          <div style={{ marginTop: 12, color: v('text-muted') }}>Links: <a href="#" style={{ color: v('link') }}>docs</a> · <a href="#" style={{ color: v('link-hover') }}>hovered</a> · <span style={{ color: v('purple') }}>purple accent</span></div>
          <div style={{ marginTop: 8, padding: 6, borderRadius: 6, background: v('bg-secondary'), border: `1px solid ${v('border')}`, color: v('text-muted'), fontSize: 11 }}>
            <span style={{ background: v('comment-mark'), color: '#111', padding: '0 4px', borderRadius: 3 }}>comment</span> mark on reviewed text
          </div>
        </div>
      </div>
    </>
  );
}

export function renderPreview(id: PreviewId) {
  if (id === 'code') return <CodeTerminalPreview />;
  if (id === 'tracker') return <TrackerSettingsPreview />;
  return <WorkspacePreview />;
}
