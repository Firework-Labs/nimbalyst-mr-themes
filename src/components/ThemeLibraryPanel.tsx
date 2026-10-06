/**
 * Theme Gallery: the fullscreen panel where themes are browsed, created,
 * duplicated, deleted, imported, exported, grouped into families, and
 * assigned.
 *
 * Sections, top to bottom: the Mr. Themes header; Theme usage (the global
 * theme, then every open project when Mr. Projects is installed); the Theme
 * Collection (every theme, family members included); Theme Families (an
 * accordion of families, each an accordion of its themes).
 *
 * Choosing a theme here applies it globally. When the Mr. Projects extension
 * is installed, its bridge lists the open projects (in rail order) and lets
 * the gallery assign a theme per project.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { copyToClipboard, type PanelHostProps } from '@nimbalyst/extension-sdk';
import { applier } from '../applier';
import {
  FAMILY_SWATCH_COUNT, deleteFamilyFrom, familyHeaderColors, importInto, missingBuiltins, parseFamilyImport, parseThemeImport, restoreBuiltinsInto,
  saveFamilyInto, serializeFamilyFile, setThemeFamily, suggestedSwatches, uniqueSlug,
  type FamilyForm, type ImportPayload, type ThemeFamily,
} from '../collection';
import { isValidColor, toHex, parseColor } from '../color';
import { KIT_DIR, KIT_FILES } from '../kit';
import { LEGACY_PRESET_IDS, isPresetId } from '../presets';
import { getProjectBridge, type ProjectInfo, type ProjectThemeBridge } from '../projectBridge';
import { getCollection, getExtensionContext, getFamilies, setCollection, toast } from '../store';
import { ensureStyles } from '../styles';
import { themeIconSvg } from '../themeIcon';
import {
  captureCurrentTheme, cloneTheme, emptyTheme, resolveTheme, serializeThemeFile, slugify, toThemeExtensionManifest,
  type ThemeFile,
} from '../themeSpec';
import { ThemeEditorView } from './ThemeEditorView';
import { Button, Icon, MenuButton, Pill, SectionHead, ThemePicker, type MenuItem, type PickerOption } from './ui';

type Filter = 'all' | 'dark' | 'light' | 'mine';
/** `isNew`: a new theme or a duplicate that is not in the collection until Save; Cancel drops it. */
type View = { kind: 'grid' } | { kind: 'edit'; theme: ThemeFile; dirty: boolean; isNew: boolean };
type Modal =
  | null
  | { kind: 'importTheme' }
  | { kind: 'importFamily' }
  | { kind: 'export'; theme: ThemeFile }
  | { kind: 'exportFamily'; family: ThemeFamily }
  | { kind: 'deleteTheme'; theme: ThemeFile }
  | { kind: 'deleteFamily'; family: ThemeFamily }
  | { kind: 'family'; family: ThemeFamily | null };

const GLOBAL_LABEL = 'Nimbalyst Global Theme';

export function ThemeThumb({ theme }: { theme: ThemeFile }) {
  const r = resolveTheme(theme);
  return (
    <div className="nte-thumb" style={{ background: r.core.bg }}>
      <div className="tr" style={{ background: r.core['bg-secondary'] }}>
        <i style={{ background: r.core.primary }} />
        <i style={{ background: r.core['bg-tertiary'] }} />
        <i style={{ background: r.core['bg-tertiary'] }} />
      </div>
      <div className="tm">
        <i style={{ background: r.core.text }} />
        <i className="w" style={{ background: r.core['text-muted'] }} />
        <i className="acc" style={{ background: r.core.primary }} />
        <div className="dots">
          <i style={{ background: r.core.success }} /><i style={{ background: r.core.warning }} /><i style={{ background: r.core.error }} /><i style={{ background: r.core.info }} />
        </div>
      </div>
    </div>
  );
}

/** Which projects (and whether Global) currently use a theme id. */
function useAssignments(enabledId: string | null, projects: ProjectInfo[]) {
  return useMemo(() => {
    const map = new Map<string, string[]>();
    if (enabledId) map.set(enabledId, ['Global']);
    for (const p of projects) {
      if (!p.themeId) continue;
      const list = map.get(p.themeId) ?? [];
      list.push(p.label);
      map.set(p.themeId, list);
    }
    return map;
  }, [enabledId, projects]);
}

/** "used globally and by Alpha, Beta" style phrase for a theme's assignments. */
function usagePhrase(labels: string[]): string {
  const global = labels[0] === 'Global';
  const projects = global ? labels.slice(1) : labels;
  const parts: string[] = [];
  if (global) parts.push('the global theme');
  if (projects.length) parts.push(`used by ${projects.join(', ')}`);
  return parts.join(' and ');
}

export function ThemeLibraryPanel({ host }: PanelHostProps) {
  ensureStyles();
  const [data, setData] = useState<{ themes: ThemeFile[]; families: ThemeFamily[] }>(() => ({ themes: getCollection(), families: getFamilies() }));
  const [applierState, setApplierState] = useState(applier.getState());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFamilyThemes, setShowFamilyThemes] = useState(true);
  const [view, setView] = useState<View>({ kind: 'grid' });
  const [modal, setModal] = useState<Modal>(null);
  const [familiesOpen, setFamiliesOpen] = useState(true);
  const [openFamilies, setOpenFamilies] = useState<Set<string>>(() => new Set());
  const [tryLive, setTryLive] = useState(false);
  const [bridge, setBridge] = useState<ProjectThemeBridge | null>(() => getProjectBridge());
  const [projects, setProjects] = useState<ProjectInfo[]>(() => getProjectBridge()?.listProjects() ?? []);

  useEffect(() => applier.subscribe(setApplierState), []);
  useEffect(() => () => applier.setPreview(null), []);
  // The project bridge may arrive after we mount (extension load order), so poll briefly and subscribe once found.
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let tries = 0;
    const attach = () => {
      const b = getProjectBridge();
      if (b) {
        setBridge(b);
        setProjects(b.listProjects());
        unsub = b.subscribe(() => setProjects(b.listProjects()));
        return true;
      }
      return false;
    };
    if (!attach()) {
      const t = setInterval(() => {
        if (attach() || ++tries > 20) clearInterval(t);
      }, 500);
      return () => {
        clearInterval(t);
        unsub?.();
      };
    }
    return () => unsub?.();
  }, []);

  const { themes, families } = data;
  const enabledId = applierState.enabled?.id ?? null;
  const takenIds = useMemo(() => new Set(themes.map((t) => t.id)), [themes]);
  const familyById = useMemo(() => new Map(families.map((f) => [f.id, f])), [families]);
  const familyOfTheme = (t: ThemeFile) => (t.family ? familyById.get(t.family) ?? null : null);
  const membersOf = (id: string) => themes.filter((t) => t.family === id);
  const byId = useMemo(() => {
    const m = new Map(themes.map((t) => [t.id, t]));
    // Retired v0.1 preset ids still stored in project files resolve to their family successor.
    for (const [legacy, next] of Object.entries(LEGACY_PRESET_IDS)) if (!m.has(legacy) && m.has(next)) m.set(legacy, m.get(next)!);
    return m;
  }, [themes]);
  const resolvedProjects = useMemo(
    () => projects.map((p) => (p.themeId && !takenIds.has(p.themeId) ? { ...p, themeId: byId.get(p.themeId)?.id ?? p.themeId } : p)),
    [projects, takenIds, byId],
  );
  const assignments = useAssignments(enabledId, resolvedProjects);
  /** Every theme as a picker option, filed under its family, then the rest. */
  const themeOptions = useMemo<PickerOption[]>(() => {
    const out: PickerOption[] = [];
    for (const f of families) for (const t of themes) if (t.family === f.id) out.push({ value: t.id, label: t.name, group: f.name });
    for (const t of themes) if (!t.family || !familyById.has(t.family)) out.push({ value: t.id, label: t.name, group: 'Not in a family' });
    return out;
  }, [themes, families, familyById]);
  const nativeTheme = useMemo(() => applier.getNativeTheme(), [applierState.nativeThemeId, applierState.enabled]);
  const globalTheme = applierState.enabled ?? nativeTheme;
  const darkApp = document.documentElement.classList.contains('dark-theme');

  const missing = useMemo(() => missingBuiltins(data), [data]);

  const matches = (t: ThemeFile) => {
    if (filter === 'dark' && !t.isDark) return false;
    if (filter === 'light' && t.isDark) return false;
    if (filter === 'mine' && isPresetId(t.id)) return false;
    if (!showFamilyThemes && familyOfTheme(t)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const fam = familyOfTheme(t);
    return t.name.toLowerCase().includes(q) || (t.tags ?? []).some((x) => x.toLowerCase().includes(q)) ||
      (t.description ?? '').toLowerCase().includes(q) || (fam?.name.toLowerCase().includes(q) ?? false);
  };
  const visible = themes.filter(matches);

  const save = async (nextThemes: ThemeFile[], nextFamilies: ThemeFamily[] = families) => {
    setData({ themes: nextThemes, families: nextFamilies });
    await setCollection(nextThemes, nextFamilies);
  };

  const upsert = async (t: ThemeFile) => {
    const list = [...themes];
    const i = list.findIndex((x) => x.id === t.id);
    if (i >= 0) list[i] = t;
    else list.unshift(t);
    await save(list);
    if (enabledId === t.id) await applier.enable(t);
  };

  const openEdit = (theme: ThemeFile) => setView({ kind: 'edit', theme, dirty: false, isNew: false });

  /** New themes and duplicates open in the editor unsaved; Save adds them, Cancel drops them. */
  const createNew = () => {
    const isDark = applierState.enabled?.isDark ?? darkApp;
    const base = emptyTheme('New theme', isDark);
    base.id = uniqueSlug('new-theme', takenIds);
    base.author = 'You';
    setView({ kind: 'edit', theme: base, dirty: true, isNew: true });
  };

  const duplicate = (t: ThemeFile) => {
    const name = `${t.name} copy`;
    const copy = cloneTheme(t, name, uniqueSlug(name, takenIds));
    copy.author = 'You';
    delete copy.family;
    delete copy.faction;
    delete copy.variation;
    setView({ kind: 'edit', theme: copy, dirty: true, isNew: true });
  };

  const backToGallery = () => {
    applier.setPreview(null);
    setTryLive(false);
    setView({ kind: 'grid' });
  };

  /** Remove themes and lift any global or project assignment that used them. */
  const removeThemes = async (ids: Set<string>, nextFamilies: ThemeFamily[] = families) => {
    await save(themes.filter((x) => !ids.has(x.id)), nextFamilies);
    if (enabledId && ids.has(enabledId)) await applier.enable(null);
    for (const p of resolvedProjects) if (p.themeId && ids.has(p.themeId)) await bridge?.setProjectTheme(p.path, null);
  };

  const deleteTheme = async (t: ThemeFile) => {
    await removeThemes(new Set([t.id]));
    setModal(null);
    toast('info', `Deleted "${t.name}".`);
  };

  const deleteFamily = async (f: ThemeFamily, withThemes: boolean) => {
    const members = membersOf(f.id);
    const { state } = deleteFamilyFrom(data, f.id, withThemes);
    if (withThemes) await removeThemes(new Set(members.map((t) => t.id)), state.families);
    else await save(state.themes, state.families);
    setModal(null);
    toast('info', withThemes
      ? `Deleted the ${f.name} family and its ${members.length} theme${members.length === 1 ? '' : 's'}.`
      : `Deleted the ${f.name} family. Its ${members.length} theme${members.length === 1 ? ' stays' : 's stay'} in the collection.`);
  };

  const assignFamily = async (t: ThemeFile, familyId: string | null) => {
    const { themes: next } = setThemeFamily(data, t.id, familyId);
    await save(next);
    const f = familyId ? familyById.get(familyId) : null;
    toast('info', f ? `"${t.name}" is now in the ${f.name} family.` : `"${t.name}" is no longer in a family.`);
  };

  const saveFamily = async (form: FamilyForm, existing: ThemeFamily | null) => {
    const { state, family, moved } = saveFamilyInto(data, form, existing?.id ?? null);
    await save(state.themes, state.families);
    setOpenFamilies((s) => new Set(s).add(family.id));
    setFamiliesOpen(true);
    setModal(null);
    const n = form.themeIds.length;
    toast('info', `${existing ? 'Saved' : 'Created'} the ${family.name} family with ${n} theme${n === 1 ? '' : 's'}${moved ? ` (${moved} moved from another family)` : ''}.`);
  };

  const restoreBuiltins = async () => {
    const r = restoreBuiltinsInto(data);
    await save(r.state.themes, r.state.families);
    toast('info', `Restored ${r.themes} built-in theme${r.themes === 1 ? '' : 's'} and ${r.families} famil${r.families === 1 ? 'y' : 'ies'}.`);
  };

  const importPayload = async (payload: ImportPayload, mode: 'replace' | 'copy') => {
    const { state, familyId } = importInto(data, payload, mode);
    await save(state.themes, state.families);
    // A replace may have recolored the global theme; re-apply it.
    const refreshed = enabledId ? state.themes.find((t) => t.id === enabledId) : null;
    if (refreshed && mode === 'replace') await applier.enable(refreshed);
    if (familyId) {
      setOpenFamilies((s) => new Set(s).add(familyId));
      setFamiliesOpen(true);
    }
    setModal(null);
    const n = payload.themes.length;
    toast('info', payload.family
      ? `Imported the ${state.families.find((f) => f.id === familyId)?.name} family with ${n} theme${n === 1 ? '' : 's'}.`
      : `Imported ${n === 1 ? `"${payload.themes[0].name}"` : `${n} themes`}.`);
  };

  const capture = async () => {
    const native = document.documentElement.getAttribute('data-theme') ?? 'current';
    const t = captureCurrentTheme(`Captured ${native}`);
    t.id = uniqueSlug(t.id, takenIds);
    t.author = 'You';
    await upsert(t);
    toast('info', `Captured the current look as "${t.name}".`);
  };

  const exportCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    toast('info', `Copied ${label} as JSON.`);
    setModal(null);
  };

  const writeToProject = async (fileName: string, text: string) => {
    const fs = getExtensionContext()?.services.filesystem;
    if (!fs) {
      toast('error', 'File system access is not available.');
      return;
    }
    const path = `${host.workspacePath.replace(/\/+$/, '')}/${fileName}`;
    try {
      await fs.writeFile(path, text);
      toast('info', `Saved ${fileName} in this project.`);
      host.openFile(path);
      setModal(null);
    } catch (e) {
      toast('error', `Export failed: ${(e as Error).message}`);
    }
  };

  /**
   * "Download" the Family Builder Kit: the extension has no save dialog, so the
   * kit is written into this project's folder, where an agent working in the
   * project can use it straight away. Existing kit files are overwritten; the
   * agent's own `work/` folder is left alone.
   */
  const downloadKit = async () => {
    const fs = getExtensionContext()?.services.filesystem;
    if (!fs) {
      toast('error', 'File system access is not available.');
      return;
    }
    const dir = `${host.workspacePath.replace(/\/+$/, '')}/${KIT_DIR}`;
    try {
      for (const [rel, text] of Object.entries(KIT_FILES)) await fs.writeFile(`${dir}/${rel}`, text);
      toast('info', `Wrote the Family Builder Kit to ${KIT_DIR}/ in this project. Point your agent at ${KIT_DIR}/AGENT.md.`);
      host.openFile(`${dir}/AGENT.md`);
    } catch (e) {
      toast('error', `Could not write the kit: ${(e as Error).message}`);
    }
  };

  const exportExtension = async (t: ThemeFile) => {
    const fs = getExtensionContext()?.services.filesystem;
    if (!fs) {
      toast('error', 'File system access is not available.');
      return;
    }
    const base = host.workspacePath.replace(/\/+$/, '');
    try {
      const extId = `com.${slugify(t.author && t.author !== 'You' ? t.author : 'user')}.theme-${t.id}`;
      const dir = `${base}/${t.id}-theme-extension`;
      await fs.writeFile(`${dir}/manifest.json`, toThemeExtensionManifest(t, extId));
      await fs.writeFile(`${dir}/README.md`, `# ${t.name} Theme\n\nA Nimbalyst theme extension made with Mr. Themes.\n\nInstall: Settings › Extensions › Install from folder (or push this folder to GitHub and install from the repository URL).\n`);
      toast('info', `Wrote theme extension to ${t.id}-theme-extension/ in this project.`);
      host.openFile(`${dir}/manifest.json`);
      setModal(null);
    } catch (e) {
      toast('error', `Export failed: ${(e as Error).message}`);
    }
  };

  const useGlobally = async (t: ThemeFile | null) => {
    await applier.enable(t);
    toast('info', t ? `"${t.name}" is now the global theme.` : 'Back to the native Nimbalyst theme.');
  };

  const useForProject = async (p: ProjectInfo, t: ThemeFile | null) => {
    if (!bridge) return;
    await bridge.setProjectTheme(p.path, t?.id ?? null);
    toast('info', t ? `${p.label} now uses "${t.name}".` : `${p.label} now follows the global theme.`);
  };

  const onTryLive = (on: boolean) => {
    setTryLive(on);
    applier.setPreview(on && view.kind === 'edit' ? view.theme : null);
  };

  const exportModal = modal?.kind === 'export' ? (
    <ExportModal
      title={`Export "${modal.theme.name}"`}
      fileName={`${modal.theme.id}.nimtheme`}
      onClose={() => setModal(null)}
      onCopy={() => void exportCopy(serializeThemeFile(modal.theme), `"${modal.theme.name}"`)}
      onSave={() => void writeToProject(`${modal.theme.id}.nimtheme`, serializeThemeFile(modal.theme))}
      onExtension={() => void exportExtension(modal.theme)}
    />
  ) : modal?.kind === 'exportFamily' ? (
    <ExportModal
      title={`Export the ${modal.family.name} family`}
      fileName={`${modal.family.id}.nimfamily`}
      onClose={() => setModal(null)}
      onCopy={() => void exportCopy(serializeFamilyFile(modal.family, membersOf(modal.family.id)), `the ${modal.family.name} family`)}
      onSave={() => void writeToProject(`${modal.family.id}.nimfamily`, serializeFamilyFile(modal.family, membersOf(modal.family.id)))}
    />
  ) : null;

  if (view.kind === 'edit') {
    const t = view.theme;
    const fam = familyOfTheme(t);
    return (
      <div className="nte" data-testid="theme-library-edit">
        <ThemeEditorView
          theme={t}
          readOnly={false}
          onChange={(next) => {
            setView({ ...view, theme: next, dirty: true });
            if (tryLive) applier.setPreview(next);
          }}
          isEnabled={enabledId === t.id}
          onEnable={() => void useGlobally(t)}
          onDisable={() => void useGlobally(null)}
          tryLive={tryLive}
          onTryLive={onTryLive}
          assignedTo={assignments.get(t.id) ?? []}
          subtitle={`${t.isDark ? 'Dark' : 'Light'} theme · ${fam ? `${fam.name} family` : 'no family'}${view.isNew ? ' · new, not saved yet' : view.dirty ? ' · unsaved' : ''}`}
          lead={
            <div className="nte-breadcrumb">
              <button type="button" onClick={backToGallery}>Theme Gallery</button>
              <span>›</span>
              <span>{t.name}</span>
            </div>
          }
          actions={
            <>
              {bridge && projects.length && !view.isNew ? <UseForPicker projects={projects} theme={t} onPick={useForProject} /> : null}
              {!view.isNew ? <Button icon="content_copy" onClick={() => duplicate(t)}>Duplicate</Button> : null}
              <Button icon="ios_share" onClick={() => setModal({ kind: 'export', theme: t })}>Export</Button>
              <Button
                variant="ghost"
                icon="close"
                onClick={backToGallery}
                title={view.isNew ? 'Discard this new theme and go back to the gallery' : view.dirty ? 'Discard unsaved changes and go back to the gallery' : 'Back to the gallery'}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon="save"
                disabled={!view.dirty}
                onClick={() => void upsert(t).then(() => {
                  if (view.isNew) toast('info', `Added "${t.name}" to the Theme Collection.`);
                  setView({ ...view, dirty: false, isNew: false });
                })}
              >
                Save
              </Button>
            </>
          }
        />
        {exportModal}
      </div>
    );
  }

  const renderCard = (t: ThemeFile) => {
    const tags = assignments.get(t.id) ?? [];
    const isGlobal = enabledId === t.id;
    // useAssignments puts 'Global' first when this theme is the global one; the rest are project labels.
    const projectLabels = isGlobal ? tags.slice(1) : tags;
    const fam = familyOfTheme(t);
    const menu: MenuItem[] = [
      isGlobal
        ? { label: 'Stop using globally', icon: 'undo', onSelect: () => void useGlobally(null) }
        : { label: 'Use globally', icon: 'public', onSelect: () => void useGlobally(t) },
    ];
    if (bridge && resolvedProjects.length) {
      menu.push({ kind: 'group', label: 'Use for project' });
      for (const p of resolvedProjects) {
        const on = p.themeId === t.id;
        menu.push({ label: p.label, icon: 'folder', checked: on, onSelect: () => void useForProject(p, on ? null : t) });
      }
    }
    if (families.length) {
      menu.push({ kind: 'group', label: fam ? 'Family (pick another to move it)' : 'Add to family' });
      for (const f of families) menu.push({ label: f.name, icon: 'category', checked: fam?.id === f.id, onSelect: () => void assignFamily(t, f.id) });
      if (fam) menu.push({ label: 'Remove from family', icon: 'remove_circle_outline', onSelect: () => void assignFamily(t, null) });
    }
    menu.push(
      { kind: 'sep' },
      { label: 'Edit', icon: 'edit', onSelect: () => openEdit(t) },
      { label: 'Duplicate', icon: 'content_copy', onSelect: () => duplicate(t) },
      { label: 'Export…', icon: 'ios_share', onSelect: () => setModal({ kind: 'export', theme: t }) },
      { kind: 'sep' },
      { label: 'Delete…', icon: 'delete', danger: true, onSelect: () => setModal({ kind: 'deleteTheme', theme: t }) },
    );
    return (
      <div key={t.id} className={`nte-card${isGlobal ? ' on' : ''}`} onClick={() => openEdit(t)} role="button" tabIndex={0} data-theme-id={t.id}>
        <ThemeThumb theme={t} />
        <div className="nte-cardmeta">
          <div className="top">
            <div className="n">
              {t.name}
              <small>{t.faction && t.variation ? `${t.faction} · ${t.variation}` : `${t.isDark ? 'dark' : 'light'}${isPresetId(t.id) ? '' : ' · yours'}`}</small>
            </div>
            <MenuButton items={menu} ariaLabel={`Actions for ${t.name}`} title="Use, add to a family, duplicate, export, delete" />
          </div>
          <div className="nte-chips">
            {isGlobal ? (
              <span className="nte-chip global" title="The global theme: used everywhere a project has no theme of its own">
                <Icon name="public" size={11} />Global
              </span>
            ) : null}
            {projectLabels.length ? (
              <span className="nte-chip proj" title={`Used by ${projectLabels.join(', ')}`}>
                {projectLabels.length} project{projectLabels.length === 1 ? '' : 's'}
              </span>
            ) : null}
            {fam ? (
              <span className="nte-chip fam" title={`In the ${fam.name} theme family`}>
                <i style={{ background: familyHeaderColors(fam, membersOf(fam.id), darkApp)[0] }} />{fam.name}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const familyCount = families.length;

  return (
    <div className="nte" data-testid="theme-library" style={{ position: 'relative' }}>
      <div className="nte-lib">
        <header className="nte-hero">
          <span className="nte-hero-icon" aria-hidden dangerouslySetInnerHTML={{ __html: themeIconSvg(72) }} />
          <div className="nte-hero-text">
            <h1>Mr. Themes</h1>
            <h2>Every project gets its own theme. Best buds with Mr. Projects.</h2>
            <p>Visually orient between projects, each with a chosen look. Built for multitasking, visual thinking, flaregremlins. For more goodness, enable Mr. Projects.</p>
          </div>
        </header>

        <div className="nte-traysec">
          <SectionHead
            title="Theme usage"
            hint={bridge ? 'The global theme, then every open project in rail order. Set each one’s theme here.' : 'The global theme, used everywhere until a project gets one of its own.'}
          />
          <div className="nte-tray" data-testid="theme-assignment-tray">
            <TrayCard
              kind="global"
              title={GLOBAL_LABEL}
              theme={globalTheme}
              value={enabledId ?? 'native'}
              options={[{ value: 'native', label: `Native (${applierState.nativeThemeId ?? 'Nimbalyst'})` }, ...themeOptions]}
              onChange={(v) => void useGlobally(v === 'native' ? null : byId.get(v) ?? null)}
            />
            {bridge ? resolvedProjects.map((p) => {
              const own = p.themeId ? byId.get(p.themeId) ?? null : null;
              return (
                <TrayCard
                  key={p.path}
                  kind={p.active ? 'active' : 'project'}
                  title={p.label}
                  theme={own ?? globalTheme}
                  posterUri={p.posterUri}
                  value={p.themeId && own ? p.themeId : 'global'}
                  options={[{ value: 'global', label: 'Global theme' }, ...themeOptions]}
                  onChange={(v) => void useForProject(p, v === 'global' ? null : byId.get(v) ?? null)}
                />
              );
            }) : (
              <div className="nte-trayhint">
                <Icon name="extension" size={20} />
                <div>
                  <b>Per-project themes</b>
                  <div className="nte-faint">Install and enable Mr. Projects (<code>com.fireworklabs.project-theme</code>) to list your open projects here and give each one its own theme.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="nte-libbody">
          <section data-section="collection">
            <SectionHead
              title="Theme Collection"
              hint="Every theme, including the ones in a family. Click a card to inspect or edit it."
              right={`${visible.length} of ${themes.length} theme${themes.length === 1 ? '' : 's'}`}
            />
            <div className="nte-toolbar">
              <div className="nte-faint nte-toolbar-note">
                Choosing a theme here uses it <b style={{ color: 'var(--nim-text)' }}>globally</b>, in every project.
                {bridge ? ' Each project can also have its own theme; set it under Theme usage or from any card.' : ' Enable Mr. Projects to give individual projects their own theme.'}
              </div>
              <div className="nte-row" style={{ flexWrap: 'wrap' }}>
                <input className="nte-input" placeholder="Search themes…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
                {(['all', 'dark', 'light', 'mine'] as Filter[]).map((f) => (
                  <Pill key={f} on={filter === f} onClick={() => setFilter(f)}>{f === 'mine' ? 'Mine' : f[0].toUpperCase() + f.slice(1)}</Pill>
                ))}
                <span className="nte-toolbar-sep" />
                <Pill on={showFamilyThemes} onClick={() => setShowFamilyThemes((v) => !v)}>
                  <Icon name={showFamilyThemes ? 'visibility' : 'visibility_off'} size={13} style={{ marginRight: 4 }} />
                  Family themes
                </Pill>
                <span className="nte-grow" />
                <Button icon="photo_camera" onClick={() => void capture()} title="Snapshot the app's current colors into a new theme">Capture current to Mr. Themes</Button>
                <Button icon="download" onClick={() => setModal({ kind: 'importTheme' })} title="Import one theme from a .nimtheme file (families import under Theme Families)">Import theme</Button>
                <Button variant="primary" icon="add" onClick={createNew}>New theme</Button>
              </div>
            </div>
            {visible.length ? <div className="nte-grid">{visible.map(renderCard)}</div> : <div className="nte-empty">No themes match.</div>}
          </section>

          <section data-section="families" className={`nte-families${familiesOpen ? ' open' : ''}`}>
            <div className="nte-families-head">
              <button type="button" className="nte-acc-toggle" aria-expanded={familiesOpen} onClick={() => setFamiliesOpen((v) => !v)}>
                <Icon name="chevron_right" size={20} style={{ transform: familiesOpen ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
                <h3>Theme Families</h3>
                <span className="nte-faint">{familyCount} famil{familyCount === 1 ? 'y' : 'ies'}</span>
              </button>
              <span className="nte-grow" />
              {missing.families.length || missing.themes.length ? (
                <Button icon="restore" onClick={() => void restoreBuiltins()} title={`Bring back ${missing.themes.length} deleted built-in theme(s) and ${missing.families.length} famil(ies)`}>Restore built-ins</Button>
              ) : null}
              <Button icon="smart_toy" onClick={() => void downloadKit()} title={`Write the kit an agent uses to design a theme family (guide, previews, checks) into ${KIT_DIR}/ in this project`}>Download Family Builder Kit for Agents</Button>
              <Button icon="download" onClick={() => setModal({ kind: 'importFamily' })} title="Import a theme family and its themes from a .nimfamily file">Import family</Button>
              <Button variant="primary" icon="add" onClick={() => setModal({ kind: 'family', family: null })} title="Group themes from the collection into a new family">New family</Button>
            </div>
            {familiesOpen ? (
              <div className="nte-families-body">
                <div className="nte-faint" style={{ fontSize: 11.5, margin: '0 0 12px' }}>
                  A family groups related themes from the collection. To design a new set of themes, download the Family Builder Kit, have an agent build the family with you, then import the file it produces.
                </div>
                {families.length === 0 ? <div className="nte-empty">No families yet. Group themes with New family, or import a <code>.nimfamily</code> file.</div> : null}
                {families.map((f) => {
                  const members = membersOf(f.id);
                  const open = openFamilies.has(f.id);
                  return (
                    <div key={f.id} className={`nte-family${open ? ' open' : ''}`} data-family={f.id}>
                      <div className="nte-family-head">
                        <button
                          type="button"
                          className="nte-acc-toggle"
                          aria-expanded={open}
                          onClick={() => setOpenFamilies((s) => {
                            const n = new Set(s);
                            if (n.has(f.id)) n.delete(f.id);
                            else n.add(f.id);
                            return n;
                          })}
                        >
                          <Icon name="chevron_right" size={20} style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
                          <span className="sw" aria-hidden>{familyHeaderColors(f, members, darkApp).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                          <span className="fh-text">
                            <span className="fh-name">{f.name}</span>
                            <span className="fh-desc">
                              {f.description ? `${f.description} · ` : ''}{members.length} theme{members.length === 1 ? '' : 's'}
                            </span>
                          </span>
                        </button>
                        <div className="nte-row fh-actions">
                          <Button size="sm" icon="edit" onClick={() => setModal({ kind: 'family', family: f })} title="Change the name, sub text, header colors, or which themes are in it">Edit</Button>
                          <Button size="sm" icon="ios_share" onClick={() => setModal({ kind: 'exportFamily', family: f })} disabled={!members.length}>Export</Button>
                          <Button size="sm" variant="ghost" icon="delete" onClick={() => setModal({ kind: 'deleteFamily', family: f })}>Delete</Button>
                        </div>
                      </div>
                      {open ? (
                        <div className="nte-family-body">
                          {members.length ? <div className="nte-grid">{members.map(renderCard)}</div> : <div className="nte-faint" style={{ padding: '4px 2px 8px' }}>No themes in this family yet. Use Edit above, or “Add to family” in any card’s … menu.</div>}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {modal?.kind === 'importTheme' || modal?.kind === 'importFamily' ? (
        <ImportModal
          what={modal.kind === 'importTheme' ? 'theme' : 'family'}
          themeIds={takenIds}
          familyIds={new Set(families.map((f) => f.id))}
          onClose={() => setModal(null)}
          onImport={(p, m) => void importPayload(p, m)}
        />
      ) : null}
      {modal?.kind === 'deleteTheme' ? (() => {
        const t = modal.theme;
        const fam = familyOfTheme(t);
        const labels = assignments.get(t.id) ?? [];
        const warnings: ReactNode[] = [];
        if (fam) warnings.push(<>It is in the <b>{fam.name}</b> family, which will keep its other {membersOf(fam.id).length - 1} theme{membersOf(fam.id).length - 1 === 1 ? '' : 's'}.</>);
        if (labels.length) {
          const isGlobal = labels[0] === 'Global';
          const hasProjects = labels.length > (isGlobal ? 1 : 0);
          const consequences = [isGlobal ? 'Nimbalyst returns to its native theme.' : '', hasProjects ? 'Those projects will follow the global theme.' : ''].filter(Boolean).join(' ');
          warnings.push(<>It is {usagePhrase(labels)}. {consequences}</>);
        }
        if (isPresetId(t.id)) warnings.push(<>It is a built-in theme. “Restore built-ins” under Theme Families brings it back.</>);
        return (
          <ConfirmModal
            title={`Delete "${t.name}"?`}
            warnings={warnings}
            note="Closed projects that use this theme will fall back to the global theme when you next open them."
            onClose={() => setModal(null)}
            actions={<Button variant="danger" icon="delete" onClick={() => void deleteTheme(t)}>Delete theme</Button>}
          />
        );
      })() : null}
      {modal?.kind === 'deleteFamily' ? (() => {
        const f = modal.family;
        const members = membersOf(f.id);
        const inUse = members.filter((t) => (assignments.get(t.id) ?? []).length);
        const warnings: ReactNode[] = [];
        if (inUse.length) warnings.push(<>In use: {inUse.map((t, i) => <span key={t.id}>{i ? '; ' : ''}<b>{t.name}</b> is {usagePhrase(assignments.get(t.id)!)}</span>)}. Deleting the themes lifts those assignments.</>);
        return (
          <ConfirmModal
            title={`Delete the ${f.name} family?`}
            warnings={warnings}
            note={members.length ? `It has ${members.length} theme${members.length === 1 ? '' : 's'}. Keep them in the collection (without a family), or delete them too.` : 'It has no themes.'}
            onClose={() => setModal(null)}
            actions={
              <>
                <Button onClick={() => void deleteFamily(f, false)}>{members.length ? `Delete family, keep ${members.length} theme${members.length === 1 ? '' : 's'}` : 'Delete family'}</Button>
                {members.length ? <Button variant="danger" icon="delete" onClick={() => void deleteFamily(f, true)}>Delete family and its themes</Button> : null}
              </>
            }
          />
        );
      })() : null}
      {modal?.kind === 'family' ? (
        <FamilyModal family={modal.family} themes={themes} families={families} onClose={() => setModal(null)} onSave={(form) => void saveFamily(form, modal.family)} />
      ) : null}
      {exportModal}
    </div>
  );
}

function TrayCard({ kind, title, theme, posterUri, value, options, onChange }: {
  kind: 'global' | 'project' | 'active';
  title: string;
  theme: ThemeFile;
  posterUri?: string | null;
  value: string;
  options: PickerOption[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={`nte-traycard ${kind}`} data-testid={`tray-${kind}`}>
      <ThemeThumb theme={theme} />
      <div className="tc-body">
        <div className="tc-title">
          {kind === 'global' ? <Icon name="public" size={16} /> : posterUri ? <img className="tc-poster" src={posterUri} alt="" /> : <Icon name="folder" size={16} />}
          <span className="nte-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={title}>{title}</span>
          {kind === 'active' ? <span className="nte-tag" title="The active project">active</span> : null}
        </div>
        <ThemePicker value={value} options={options} onChange={onChange} ariaLabel={`Theme for ${title}`} />
      </div>
    </div>
  );
}

function UseForPicker({ projects, theme, onPick, size }: { projects: ProjectInfo[]; theme: ThemeFile; onPick: (p: ProjectInfo, t: ThemeFile) => Promise<void>; size?: 'sm' }) {
  return (
    <ThemePicker
      value=""
      placeholder="Use for project…"
      size={size === 'sm' ? 'sm' : 'md'}
      options={projects.map((p) => ({ value: p.path, label: `${p.label}${p.themeId === theme.id ? ' ✓' : ''}` }))}
      onChange={(v) => {
        const p = projects.find((x) => x.path === v);
        if (p) void onPick(p, theme);
      }}
      ariaLabel={`Use ${theme.name} for a project`}
      title="Use this theme for one project"
    />
  );
}

function ModalShell({ onClose, children, wide }: { onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="nte-modal-backdrop" onClick={onClose}>
      <div className={`nte-modal${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ConfirmModal({ title, warnings, note, actions, onClose }: { title: string; warnings: ReactNode[]; note?: string; actions: ReactNode; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <h3>{title}</h3>
      {warnings.length ? (
        <div className="nte-warnbox">
          <Icon name="warning" size={18} />
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      ) : null}
      {note ? <p className="nte-muted" style={{ margin: '8px 0 0' }}>{note}</p> : null}
      <div className="nte-row" style={{ justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {actions}
      </div>
    </ModalShell>
  );
}

function ExportModal({ title, fileName, onClose, onCopy, onSave, onExtension }: {
  title: string;
  fileName: string;
  onClose: () => void;
  onCopy: () => void;
  onSave: () => void;
  onExtension?: () => void;
}) {
  const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--nim-border)' };
  return (
    <ModalShell onClose={onClose}>
      <h3>{title}</h3>
      <div style={row}>
        <Icon name="content_paste" />
        <div className="nte-grow"><b>Copy as JSON</b><div className="nte-faint">Paste into chat, a gist, or another Nimbalyst's Import themes dialog.</div></div>
        <Button onClick={onCopy}>Copy</Button>
      </div>
      <div style={row}>
        <Icon name="description" />
        <div className="nte-grow"><b>Save <code>{fileName}</code> to this project</b><div className="nte-faint">Travels with the repo; import it into Mr. Themes on any machine.</div></div>
        <Button onClick={onSave}>Save</Button>
      </div>
      {onExtension ? (
        <div style={row}>
          <Icon name="extension" />
          <div className="nte-grow"><b>Save as a theme extension</b><div className="nte-faint">A manifest-only extension folder others can install from GitHub or a local folder. Appears in Nimbalyst's native theme picker.</div></div>
          <Button onClick={onExtension}>Save</Button>
        </div>
      ) : null}
      <div className="nte-row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </ModalShell>
  );
}

/**
 * Import one theme ("Import theme", Theme Collection) or one theme family
 * ("Import family", Theme Families) from a file (picker or drop) or pasted
 * JSON. A file of the other kind is refused with a pointer to the right
 * button. When ids collide with the collection, the user chooses between
 * replacing them (the loop when iterating with the Family Builder Kit) and
 * importing copies.
 */
function ImportModal({ what, themeIds, familyIds, onClose, onImport }: {
  what: 'theme' | 'family';
  themeIds: Set<string>;
  familyIds: Set<string>;
  onClose: () => void;
  onImport: (p: ImportPayload, mode: 'replace' | 'copy') => void;
}) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<'replace' | 'copy'>('replace');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const ext = what === 'theme' ? '.nimtheme' : '.nimfamily';

  const parsed = useMemo<{ payload: ImportPayload | null; error: string | null }>(() => {
    if (!text.trim()) return { payload: null, error: null };
    try {
      return { payload: what === 'theme' ? { family: null, themes: [parseThemeImport(text)] } : parseFamilyImport(text), error: null };
    } catch (e) {
      return { payload: null, error: (e as Error).message };
    }
  }, [text, what]);
  const payload = parsed.payload;
  const clashes = payload ? {
    family: payload.family && familyIds.has(payload.family.id) ? payload.family : null,
    themes: payload.themes.filter((t) => themeIds.has(t.id)),
  } : null;
  const hasClash = !!clashes && (!!clashes.family || clashes.themes.length > 0);

  const readFile = async (f: File | undefined | null) => {
    if (!f) return;
    try {
      setText(await f.text());
      setFileName(f.name);
    } catch (e) {
      toast('error', `Could not read ${f.name}: ${(e as Error).message}`);
    }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <h3>{what === 'theme' ? 'Import theme' : 'Import family'}</h3>
      <p className="nte-muted" style={{ marginTop: 0 }}>
        {what === 'theme'
          ? <>Add one theme from a <code>.nimtheme</code> file. Choose the file, drop it here, or paste its JSON.</>
          : <>Add a theme family and all of its themes from a <code>.nimfamily</code> file, such as one an agent built with the Family Builder Kit. Choose the file, drop it here, or paste its JSON.</>}
      </p>
      <div
        className={`nte-dropzone${dragging ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void readFile(e.dataTransfer.files?.[0]); }}
      >
        <Icon name="upload_file" size={22} />
        <span className="nte-grow">{fileName ? <b>{fileName}</b> : `Drop a ${ext} file`}</span>
        <Button onClick={() => fileRef.current?.click()}>Choose file…</Button>
        <input ref={fileRef} type="file" accept={`${ext},.json,application/json`} style={{ display: 'none' }} onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <textarea
        className="nte-input mono"
        value={text}
        onChange={(e) => { setText(e.target.value); setFileName(null); }}
        placeholder={what === 'theme' ? '{ "name": "…", "isDark": true, "colors": { "bg": "#…" } }' : '{ "kind": "mr-themes/family", "family": { "id": "…", "name": "…" }, "themes": [ … ] }'}
      />
      {parsed.error ? <div className="nte-importstatus err"><Icon name="error" size={16} />{parsed.error}</div> : null}
      {payload ? (
        <div className="nte-importstatus ok">
          <Icon name="check_circle" size={16} />
          <span>
            {payload.family
              ? <>Theme family <b>{payload.family.name}</b> with {payload.themes.length} theme{payload.themes.length === 1 ? '' : 's'}</>
              : <>Theme <b>{payload.themes[0].name}</b> ({payload.themes[0].isDark ? 'dark' : 'light'})</>}
          </span>
          <span className="nte-importthumbs">{payload.themes.slice(0, 6).map((t, i) => <ThemeThumb key={i} theme={t} />)}</span>
        </div>
      ) : null}
      {hasClash && clashes ? (
        <div className="nte-clash">
          <div className="nte-muted" style={{ marginBottom: 6 }}>
            Already in your collection: {[clashes.family ? `the ${clashes.family.name} family` : null, clashes.themes.length ? `${clashes.themes.length === 1 && !payload?.family ? 'a theme' : `${clashes.themes.length} theme${clashes.themes.length === 1 ? '' : 's'}`} with the same id` : null].filter(Boolean).join(' and ')}.
          </div>
          <label className="nte-radio"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace {what === 'theme' ? 'it' : 'them'} (keeps project assignments)</label>
          <label className="nte-radio"><input type="radio" checked={mode === 'copy'} onChange={() => setMode('copy')} /> Import as {what === 'theme' ? 'a copy' : 'copies'} with new ids</label>
        </div>
      ) : null}
      <div className="nte-row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="download" disabled={!payload} onClick={() => payload && onImport(payload, hasClash ? mode : 'copy')}>Import</Button>
      </div>
    </ModalShell>
  );
}

function normalizeHex(c: string): string {
  const p = parseColor(c);
  return p ? toHex({ ...p, a: 1 }) : '#888888';
}

/**
 * New/Edit family wizard. A family groups themes that are already in the
 * collection: pick the themes, name it, write its sub text, and choose the
 * five colors its header shows (suggested from the chosen themes, or any
 * color). It never creates themes; new ones come from the Family Builder Kit.
 */
function FamilyModal({ family, themes, families, onClose, onSave }: {
  family: ThemeFamily | null;
  themes: ThemeFile[];
  families: ThemeFamily[];
  onClose: () => void;
  onSave: (form: FamilyForm) => void;
}) {
  const dark = document.documentElement.classList.contains('dark-theme');
  const [name, setName] = useState(family?.name ?? '');
  const [description, setDescription] = useState(family?.description ?? '');
  const [chosen, setChosen] = useState<string[]>(() => (family ? themes.filter((t) => t.family === family.id).map((t) => t.id) : []));
  const [query, setQuery] = useState('');
  const initialSwatches = family ? familyHeaderColors(family, themes.filter((t) => t.family === family.id), dark) : [];
  const [swatches, setSwatches] = useState<string[]>(() => initialSwatches.map(normalizeHex));
  // Until the user touches a swatch, the header colors follow the chosen themes.
  const [customSwatches, setCustomSwatches] = useState(!!family);
  const [slot, setSlot] = useState(0);

  const familyName = new Map(families.map((f) => [f.id, f.name]));
  const chosenThemes = themes.filter((t) => chosen.includes(t.id));
  const suggestions = useMemo(() => suggestedSwatches(chosenThemes).map(normalizeHex).filter((c, i, a) => a.indexOf(c) === i).slice(0, 24), [chosen.join(',')]);
  const shown = customSwatches ? swatches : suggestions.slice(0, FAMILY_SWATCH_COUNT);
  const q = query.trim().toLowerCase();
  const listed = themes.filter((t) => !q || t.name.toLowerCase().includes(q) || (familyName.get(t.family ?? '') ?? '').toLowerCase().includes(q));
  const moving = chosenThemes.filter((t) => t.family && t.family !== family?.id && familyName.has(t.family));

  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const setSwatch = (i: number, color: string) => {
    const base = customSwatches ? [...swatches] : [...shown];
    while (base.length < FAMILY_SWATCH_COUNT) base.push(base[base.length - 1] ?? '#888888');
    base[i] = color;
    setSwatches(base);
    setCustomSwatches(true);
    setSlot((i + 1) % FAMILY_SWATCH_COUNT);
  };

  return (
    <ModalShell onClose={onClose} wide>
      <h3>{family ? `Edit the ${family.name} family` : 'New theme family'}</h3>
      <p className="nte-muted" style={{ marginTop: 0 }}>A family groups themes already in your collection. To design new themes for a family, use the Family Builder Kit.</p>
      <div className="nte-form">
        <div className="nte-formlabel">1. Themes <span className="nte-faint">{chosen.length} chosen{moving.length ? ` · ${moving.length} will move from another family` : ''}</span></div>
        <input className="nte-input" placeholder="Filter themes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="nte-pickgrid" role="group" aria-label="Themes in this family">
          {listed.map((t) => {
            const on = chosen.includes(t.id);
            const other = t.family && t.family !== family?.id ? familyName.get(t.family) : undefined;
            return (
              <button key={t.id} type="button" className={`nte-pickcard${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(t.id)} title={other ? `${t.name} (now in ${other})` : t.name}>
                <ThemeThumb theme={t} />
                <span className="pc-name">{t.name}</span>
                <span className="pc-sub">{other ? `in ${other}` : t.isDark ? 'dark' : 'light'}</span>
                {on ? <span className="pc-check"><Icon name="check" size={14} /></span> : null}
              </button>
            );
          })}
          {listed.length === 0 ? <div className="nte-faint" style={{ padding: 8 }}>No themes match.</div> : null}
        </div>

        <label>2. Name<input className="nte-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tidepool" /></label>
        <label>3. Sub text<input className="nte-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kelp and cold water: teal over slate." /></label>

        <div className="nte-formlabel">4. Header colors <span className="nte-faint">the five swatches beside the family name. Pick a slot, then a suggestion from the chosen themes, or any color.</span></div>
        <div className="nte-famprev">
          <span className="sw">{Array.from({ length: FAMILY_SWATCH_COUNT }, (_, i) => (
            <button key={i} type="button" className={`nte-swslot${slot === i ? ' on' : ''}`} onClick={() => setSlot(i)} title={`Slot ${i + 1}: ${shown[i] ?? 'empty'}`} aria-label={`Header color ${i + 1}`} aria-pressed={slot === i} style={{ background: shown[i] ?? 'transparent' }} />
          ))}</span>
          <span className="fh-text">
            <span className="fh-name">{name || 'Family name'}</span>
            <span className="fh-desc">{description || 'Sub text'} · {chosen.length} theme{chosen.length === 1 ? '' : 's'}</span>
          </span>
        </div>
        <div className="nte-suggest">
          {suggestions.map((c) => <button key={c} type="button" title={`Use ${c} for slot ${slot + 1}`} style={{ background: c }} onClick={() => setSwatch(slot, c)} />)}
          {!suggestions.length ? <span className="nte-faint" style={{ fontSize: 11.5 }}>Choose themes to get suggestions.</span> : null}
          <label className="nte-anycolor" title={`Pick any color for slot ${slot + 1}`}>
            <Icon name="colorize" size={15} />Any color…
            <input type="color" value={shown[slot] ?? '#888888'} onChange={(e) => setSwatch(slot, e.target.value)} />
          </label>
          {customSwatches && !family ? <Button size="sm" variant="ghost" onClick={() => setCustomSwatches(false)}>Follow the themes again</Button> : null}
        </div>
      </div>
      <div className="nte-row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          icon={family ? 'save' : 'add'}
          disabled={!name.trim()}
          title={name.trim() ? undefined : 'Give the family a name'}
          onClick={() => onSave({ name, description, swatches: shown.filter((c) => isValidColor(c)), themeIds: chosen })}
        >
          {family ? 'Save family' : 'Create family'}
        </Button>
      </div>
    </ModalShell>
  );
}
