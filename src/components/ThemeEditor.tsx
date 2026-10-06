/**
 * Custom editor for *.nimtheme files.
 */
import { useEffect, useReducer, useRef, useState } from 'react';
import { useEditorLifecycle, type EditorHostProps } from '@nimbalyst/extension-sdk';
import { applier } from '../applier';
import { getCollection, setCollection, toast } from '../store';
import { ensureStyles } from '../styles';
import { emptyTheme, parseThemeFile, serializeThemeFile, type ThemeFile } from '../themeSpec';
import { ThemeEditorView } from './ThemeEditorView';
import { Button } from './ui';

export function ThemeEditor({ host }: EditorHostProps) {
  ensureStyles();
  const themeRef = useRef<ThemeFile>(emptyTheme());
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [tryLive, setTryLive] = useState(false);
  const tryLiveRef = useRef(false);
  const [applierState, setApplierState] = useState(applier.getState());

  const { isLoading, error, markDirty } = useEditorLifecycle<ThemeFile>(host, {
    applyContent: (t) => {
      themeRef.current = t;
      rerender();
      if (tryLiveRef.current) applier.setPreview(t);
    },
    getCurrentContent: () => themeRef.current,
    parse: parseThemeFile,
    serialize: serializeThemeFile,
  });

  useEffect(() => applier.subscribe(setApplierState), []);
  useEffect(() => () => {
    if (tryLiveRef.current) applier.setPreview(null);
  }, []);

  useEffect(() => {
    host.registerMenuItems([
      { label: 'Add to Theme Library', icon: 'library_add', onClick: () => void addToLibrary() },
      { label: 'Use this theme globally', icon: 'public', onClick: () => void applier.enable(themeRef.current) },
    ]);
    return () => host.registerMenuItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  const addToLibrary = async () => {
    const t = themeRef.current;
    const list = getCollection();
    const idx = list.findIndex((x) => x.id === t.id);
    if (idx >= 0) list[idx] = t;
    else list.unshift(t);
    await setCollection(list);
    toast('info', `"${t.name}" ${idx >= 0 ? 'updated in' : 'added to'} the Theme Collection.`);
  };

  const onChange = (next: ThemeFile) => {
    themeRef.current = next;
    rerender();
    markDirty();
    if (tryLiveRef.current) applier.setPreview(next);
  };

  const onTryLive = (on: boolean) => {
    tryLiveRef.current = on;
    setTryLive(on);
    applier.setPreview(on ? themeRef.current : null);
  };

  if (isLoading) return <div className="nte nte-empty">Loading theme…</div>;
  if (error) return <div className="nte nte-empty">Could not read this theme: {error.message}</div>;

  const theme = themeRef.current;
  return (
    <div className="nte" data-testid="theme-editor">
      <ThemeEditorView
        theme={theme}
        onChange={host.readOnly ? undefined : onChange}
        readOnly={host.readOnly}
        isEnabled={applierState.enabled?.id === theme.id}
        onEnable={() => void applier.enable(theme)}
        onDisable={() => void applier.enable(null)}
        tryLive={tryLive}
        onTryLive={onTryLive}
        subtitle={`${theme.isDark ? 'Dark' : 'Light'} theme · ${host.fileName}`}
        actions={<Button icon="library_add" onClick={() => void addToLibrary()} title="Save a copy into your Theme Library">Add to library</Button>}
      />
    </div>
  );
}
