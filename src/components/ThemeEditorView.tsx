/**
 * The editing surface shared by the *.nimtheme custom editor and the Theme
 * Gallery. Fully controlled: the owner holds the ThemeFile.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { isValidColor, onColor, parseColor, toHex } from '../color';
import { auditTheme, fixContrast } from '../contrast';
import { CORE_KEYS, GROUPS, LABELS, resolveTheme, type ExtendedKey, type ThemeFile, type ThemeKey } from '../themeSpec';
import { PREVIEWS, PreviewFrame, renderPreview, type PreviewId } from './previews';
import { Button, Icon, Pill, Toggle } from './ui';

const CORE_SET = new Set<string>(CORE_KEYS);

export interface ThemeEditorViewProps {
  theme: ThemeFile;
  onChange?: (next: ThemeFile) => void;
  readOnly?: boolean;
  /** True when this theme is the global theme. */
  isEnabled: boolean;
  /** Use this theme globally. */
  onEnable: () => void;
  /** Stop using this theme globally (back to the native theme). */
  onDisable: () => void;
  tryLive: boolean;
  onTryLive: (on: boolean) => void;
  /** Labels of what currently uses this theme ("Global", project names). */
  assignedTo?: string[];
  /** Extra buttons for the header, right side. */
  actions?: ReactNode;
  /** Content above the title (breadcrumb, status). */
  lead?: ReactNode;
  subtitle?: string;
}

export function ThemeEditorView(props: ThemeEditorViewProps) {
  const { theme, onChange, isEnabled, onEnable, onDisable, tryLive, onTryLive, actions, lead, subtitle, assignedTo = [] } = props;
  const readOnly = props.readOnly || !onChange;
  const resolved = useMemo(() => resolveTheme(theme), [theme]);
  const audit = useMemo(() => auditTheme(theme), [theme]);
  const [preview, setPreview] = useState<PreviewId>('workspace');
  const [backdrop, setBackdrop] = useState<'auto' | 'dark' | 'light'>('auto');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showAudit, setShowAudit] = useState(false);

  const valueOf = (key: ThemeKey): string =>
    CORE_SET.has(key) ? resolved.core[key as keyof typeof resolved.core] : resolved.extended[key as ExtendedKey];

  const commit = (key: ThemeKey, value: string) => {
    if (!onChange || readOnly) return;
    const next: ThemeFile = { ...theme, colors: { ...theme.colors }, extended: { ...(theme.extended ?? {}) } };
    if (CORE_SET.has(key)) next.colors[key as keyof typeof next.colors] = value;
    else next.extended![key as ExtendedKey] = value;
    onChange(next);
  };

  const resetDerived = (key: ExtendedKey) => {
    if (!onChange || readOnly) return;
    const ext = { ...(theme.extended ?? {}) };
    delete ext[key];
    onChange({ ...theme, extended: ext });
    setDrafts((d) => ({ ...d, [key]: '' }));
  };

  const setMeta = (patch: Partial<ThemeFile>) => {
    if (!onChange || readOnly) return;
    onChange({ ...theme, ...patch });
  };

  const repair = () => {
    if (!onChange || readOnly) return;
    const { theme: fixed, changed } = fixContrast(theme);
    if (changed.length) onChange(fixed);
  };

  const stageClass = backdrop === 'auto' ? (theme.isDark ? 'dark' : 'light') : backdrop;
  const idx = PREVIEWS.findIndex((p) => p.id === preview);
  const go = (delta: number) => setPreview(PREVIEWS[(idx + delta + PREVIEWS.length) % PREVIEWS.length].id);

  const fails = audit.filter((a) => !a.pass);
  const worst = [...fails].sort((a, b) => a.ratio / a.target - b.ratio / b.target)[0];
  const others = assignedTo.filter((a) => a !== 'Global');

  return (
    <>
      <div className="nte-head">
        <div className="nte-grow">
          {lead}
          <div className="nte-row">
            <input
              className="nte-title"
              value={theme.name}
              readOnly={readOnly}
              onChange={(e) => setMeta({ name: e.target.value })}
              placeholder="Theme name"
              aria-label="Theme name"
            />
            <span className="nte-faint" style={{ fontSize: 12 }}>
              {subtitle ?? `${theme.isDark ? 'Dark' : 'Light'} theme`}
            </span>
            {assignedTo.length ? (
              <span className="nte-tags">
                {assignedTo.map((a) => <span key={a} className={`nte-tag ${a === 'Global' ? 'global' : 'proj'}`}>{a}</span>)}
              </span>
            ) : null}
          </div>
          <input
            className="nte-input nte-desc"
            style={{ marginTop: 4, width: '100%', maxWidth: 520, padding: '2px 6px', fontSize: 12 }}
            value={theme.description ?? ''}
            readOnly={readOnly}
            placeholder={readOnly ? '' : 'Add a one-line description'}
            onChange={(e) => setMeta({ description: e.target.value })}
            aria-label="Theme description"
          />
        </div>
        <div className="nte-row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="nte-muted" style={{ fontSize: 12 }}>Dark</span>
          <Toggle on={theme.isDark} onChange={(v) => setMeta({ isDark: v })} title="Dark theme (affects derived colors)" />
          <span style={{ width: 8 }} />
          <span className="nte-muted" style={{ fontSize: 12 }}>Try live</span>
          <Toggle on={tryLive} onChange={onTryLive} title="Apply this draft to the whole app while this view is open" />
          {actions}
          {isEnabled ? (
            <Button icon="check" onClick={onDisable} title="This is the global theme. Click to return to the native Nimbalyst theme.">Global theme</Button>
          ) : (
            <Button variant="primary" icon="public" onClick={onEnable} title="Apply to every project">Use globally</Button>
          )}
        </div>
      </div>

      <div className="nte-body">
        <div className="nte-controls">
          {GROUPS.map((g, gi) => {
            const explicit = g.keys.filter((k) => CORE_SET.has(k) || !resolved.derived.has(k as ExtendedKey)).length;
            return (
              <details key={g.id} className="nte-group" open={gi < 4}>
                <summary>
                  <span>{g.title}</span>
                  <span className="nte-count">{CORE_SET.has(g.keys[0]) ? `${g.keys.length} colors` : `${explicit} of ${g.keys.length} set`}</span>
                </summary>
                {g.hint ? <div className="nte-faint" style={{ fontSize: 11, margin: '0 0 6px' }}>{g.hint}</div> : null}
                {g.keys.map((key) => {
                  const value = valueOf(key);
                  const isDerived = !CORE_SET.has(key) && resolved.derived.has(key as ExtendedKey);
                  const draft = drafts[key] ?? '';
                  const shown = draft || value;
                  const valid = isValidColor(shown);
                  const parsed = parseColor(value);
                  return (
                    <div className="nte-crow" key={key}>
                      <label className={isDerived ? 'derived' : ''} title={isDerived ? 'Derived from the core colors. Edit to override.' : LABELS[key]}>
                        {LABELS[key]}
                      </label>
                      <span className="nte-swatch">
                        <i style={{ background: value }} />
                        {!readOnly ? (
                          <input
                            type="color"
                            value={parsed ? toHex(parsed) : '#000000'}
                            onChange={(e) => {
                              setDrafts((d) => ({ ...d, [key]: '' }));
                              commit(key, e.target.value);
                            }}
                            aria-label={`${LABELS[key]} color picker`}
                          />
                        ) : null}
                      </span>
                      <input
                        className={`nte-input mono${valid ? '' : ' invalid'}`}
                        value={shown}
                        readOnly={readOnly}
                        spellCheck={false}
                        onChange={(e) => {
                          const t = e.target.value;
                          setDrafts((d) => ({ ...d, [key]: t }));
                          if (isValidColor(t)) commit(key, t.trim());
                        }}
                        onBlur={() => setDrafts((d) => ({ ...d, [key]: '' }))}
                        aria-label={`${LABELS[key]} value`}
                      />
                      {!CORE_SET.has(key) && !isDerived && !readOnly ? (
                        <button type="button" className="nte-reset" title="Reset to derived value" onClick={() => resetDerived(key as ExtendedKey)}>
                          <Icon name="restart_alt" size={15} />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </details>
            );
          })}
        </div>

        <div className="nte-preview">
          <div className="nte-pvbar">
            <div className="nte-row">
              <Button variant="ghost" size="sm" icon="chevron_left" onClick={() => go(-1)} aria-label="Previous preview" />
              <span>
                {PREVIEWS.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 ? <span className="nte-faint"> · </span> : null}
                    <button
                      type="button"
                      onClick={() => setPreview(p.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: p.id === preview ? 'var(--nim-text)' : 'var(--nim-text-faint)', fontWeight: p.id === preview ? 600 : 400 }}
                    >
                      {p.title}
                    </button>
                  </span>
                ))}
              </span>
              <Button variant="ghost" size="sm" icon="chevron_right" onClick={() => go(1)} aria-label="Next preview" />
            </div>
            <div className="nte-row">
              <Pill on={backdrop === 'auto'} onClick={() => setBackdrop('auto')}>Auto backdrop</Pill>
              <Pill on={backdrop === 'dark'} onClick={() => setBackdrop('dark')}>Dark</Pill>
              <Pill on={backdrop === 'light'} onClick={() => setBackdrop('light')}>Light</Pill>
            </div>
          </div>
          <div className={`nte-stage ${stageClass}`}>
            <PreviewFrame resolved={resolved}>{renderPreview(preview)}</PreviewFrame>
          </div>
          {showAudit ? (
            <div className="nte-audit" data-testid="contrast-audit">
              {audit.map((a) => (
                <div key={a.id} className="ar" title={`${a.label}: ${a.ratio.toFixed(2)}:1, target ${a.target}:1`}>
                  <span className="sw" style={{ background: a.bg, color: a.fg }}>Aa</span>
                  <span className="l">{a.label}</span>
                  <span className={`nte-grade ${a.pass ? 'AA' : 'fail'}`}>{a.ratio.toFixed(1)}{a.pass ? '' : ` < ${a.target}`}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="nte-foot">
            <div className="nte-row" style={{ flexWrap: 'wrap', rowGap: 2 }}>
              <span className="nte-faint">Contrast</span>
              <span className={`nte-grade ${fails.length ? 'fail' : 'AA'}`}>{audit.length - fails.length}/{audit.length} pass</span>
              {worst ? <span className="nte-faint">· worst: {worst.label} {worst.ratio.toFixed(1)}:1 (needs {worst.target}:1)</span> : <span className="nte-faint">· text, links, accent, and status pills all read clearly</span>}
              <Button size="sm" variant="ghost" icon={showAudit ? 'expand_more' : 'expand_less'} onClick={() => setShowAudit((v) => !v)}>{showAudit ? 'Hide checks' : 'All checks'}</Button>
              {!readOnly && fails.length ? <Button size="sm" icon="auto_fix_high" onClick={repair} title="Nudge failing text colors away from their backgrounds until they pass">Fix contrast</Button> : null}
            </div>
            <span className="nte-faint">
              {others.length ? `Used by ${others.join(', ')}. ` : ''}Previews are isolated. Try live applies the draft to the whole app while this view is open.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Text color that reads on a given fill; used by tags drawn with theme colors. */
export function textOn(bg: string): string {
  return onColor(bg);
}
