import assert from 'node:assert/strict';
import * as C from '../src/collection';
import { PRESETS } from '../src/presets';
import { auditTheme } from '../src/contrast';
import { serializeThemeFile } from '../src/themeSpec';
import * as store from '../src/store';
const mem = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) } };
let n = 0; const ok = (m: string) => { n++; console.log('PASS', m); };

// parseImport
const one = C.parseImport(serializeThemeFile(PRESETS[0]));
assert.equal(one.family, null); assert.equal(one.themes.length, 1); assert.equal(one.themes[0].id, PRESETS[0].id); ok('single .nimtheme');
const harbor = C.BUILTIN_FAMILIES[0];
const famText = C.serializeFamilyFile({ ...harbor, id: 'tide', name: 'Tide' }, PRESETS.filter((p: any) => p.family === 'harbor'));
const fam = C.parseImport(famText);
assert.equal(fam.family.id, 'tide'); assert.equal(fam.themes.length, 6); assert.ok(fam.themes.every((t: any) => t.family === 'tide')); assert.deepEqual(fam.family.generator, harbor.generator); ok('family bundle round trip, members re-filed under bundle family');
assert.equal(C.parseImport(JSON.stringify(PRESETS.slice(0, 3))).themes.length, 3); ok('bare array');
assert.equal(C.parseImport(JSON.stringify({ themes: PRESETS.slice(0, 2) })).family, null); ok('{themes} without family');
assert.throws(() => C.parseImport('{nope'), /Not valid JSON/); assert.throws(() => C.parseImport('{"a":1}'), /Expected a theme/); ok('errors are readable');

// generated family (the kit's path): 6 themes, all pass the audit
const tide = C.generateFamilyThemes({ id: 'tidepool', name: 'Tidepool', generator: { dominant: 'teal', pops: ['sky', 'lime'], neutral: 'slate' } });
assert.equal(tide.length, 6); assert.equal(tide.flatMap((t: any) => auditTheme(t).filter((r: any) => !r.pass)).length, 0); ok('generated family: 6 themes, 0 audit failures');

// wizard: a family groups existing themes
const base = { themes: [...PRESETS], families: C.BUILTIN_FAMILIES.map((f: any) => ({ ...f })) };
const picks = ['harbor-dark-juicy', 'grove-light-subtle', 'plum-dark-pigment'];
const sw = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'];
const made = C.saveFamilyInto(base, { name: 'Faves', description: 'Mine.', swatches: [...sw, '#123456', 'nope'], themeIds: picks }, null);
assert.equal(made.family.id, 'faves'); assert.equal(made.state.families[0].id, 'faves'); assert.equal(made.state.themes.length, 36);
assert.deepEqual(made.family.swatches, sw); assert.equal(made.moved, 3);
assert.deepEqual(made.state.themes.filter((t: any) => t.family === 'faves').map((t: any) => t.id).sort(), [...picks].sort());
assert.equal(made.state.themes.filter((t: any) => t.family === 'harbor').length, 5); ok('new family groups existing themes, moves them, keeps 5 valid swatches, creates none');
const edited = C.saveFamilyInto(made.state, { name: 'Faves', description: '', swatches: [], themeIds: ['grove-light-subtle'] }, 'faves');
assert.equal(edited.state.themes.filter((t: any) => t.family === 'faves').length, 1); assert.equal(edited.state.themes.find((t: any) => t.id === 'harbor-dark-juicy').family, undefined);
assert.equal(edited.family.swatches, undefined); assert.equal(edited.state.themes.length, 36); ok('edit: unselected members leave the family and stay in the collection');
const harborEdit = C.saveFamilyInto(base, { name: 'Harbor', description: 'x', swatches: sw, themeIds: base.themes.filter((t: any) => t.family === 'harbor').map((t: any) => t.id) }, 'harbor');
assert.deepEqual(harborEdit.family.generator, C.BUILTIN_FAMILIES[0].generator); ok('edit keeps a built-in family\'s generator as provenance');
assert.deepEqual(C.familyHeaderColors({ ...made.family }, [], true), sw); assert.equal(C.familyHeaderColors(C.BUILTIN_FAMILIES[0], [], true).length, 5);
assert.equal(C.familyHeaderColors({ id: 'x', name: 'X' }, PRESETS.slice(0, 2), true).length, 5); ok('header colors: own swatches, else generator, else members');
assert.ok(C.suggestedSwatches(PRESETS.slice(0, 3)).every((c: string) => /^#[0-9a-f]{6}$/.test(c))); ok('suggestions are opaque hex colors');

// swatches round-trip through the family file
const fileWithSw = C.serializeFamilyFile(made.family, made.state.themes.filter((t: any) => t.family === 'faves'));
assert.deepEqual(C.parseImport(fileWithSw).family.swatches, sw); ok('swatches survive .nimfamily export and import');

// Import theme vs Import family refuse each other's files
assert.equal(C.parseThemeImport(serializeThemeFile(PRESETS[0])).id, PRESETS[0].id);
assert.throws(() => C.parseThemeImport(fileWithSw), /Import family/); assert.throws(() => C.parseThemeImport(JSON.stringify(PRESETS.slice(0, 2))), /takes one/);
assert.equal(C.parseFamilyImport(fileWithSw).family.id, 'faves');
assert.throws(() => C.parseFamilyImport(serializeThemeFile(PRESETS[0])), /Import theme/); assert.throws(() => C.parseFamilyImport(JSON.stringify({ themes: PRESETS.slice(0, 2) })), /no "family"/);
ok('Import theme and Import family each refuse the other kind, with a pointer');

// import replace vs copy
const rep = C.importInto(base, C.parseImport(C.serializeFamilyFile(harbor, PRESETS.filter((p: any) => p.family === 'harbor'))), 'replace');
assert.equal(rep.state.themes.length, base.themes.length); assert.equal(rep.state.families.length, base.families.length); assert.equal(rep.familyId, 'harbor'); ok('import family, replace: no duplicates');
const cp = C.importInto(base, C.parseImport(C.serializeFamilyFile(harbor, PRESETS.filter((p: any) => p.family === 'harbor'))), 'copy');
assert.equal(cp.state.themes.length, base.themes.length + 6); assert.equal(cp.familyId, 'harbor-2'); assert.ok(cp.state.themes.slice(0, 6).every((t: any) => t.family === 'harbor-2' && t.id.endsWith('-2'))); ok('import family, copy: new family + new ids');
const loose = C.importInto({ themes: [], families: [] }, C.parseImport(serializeThemeFile(PRESETS[0])), 'copy');
assert.equal(loose.state.themes[0].family, undefined); ok('loose theme drops a family that does not exist here');

// delete family
const keep = C.deleteFamilyFrom(base, 'harbor', false);
assert.equal(keep.state.themes.length, 36); assert.equal(keep.state.themes.filter((t: any) => t.family === 'harbor').length, 0); assert.deepEqual(keep.removedThemeIds, []); ok('delete family, keep themes');
const drop = C.deleteFamilyFrom(base, 'harbor', true);
assert.equal(drop.state.themes.length, 30); assert.equal(drop.removedThemeIds.length, 6); ok('delete family and themes');

// restore
const r1 = C.restoreBuiltinsInto(keep.state);
assert.equal(r1.families, 1); assert.equal(r1.themes, 0); assert.equal(r1.state.themes.filter((t: any) => t.family === 'harbor').length, 6); ok('restore: kept themes rejoin restored family');
const r2 = C.restoreBuiltinsInto(drop.state);
assert.equal(r2.themes, 6); assert.equal(r2.state.themes.length, 36); ok('restore: deleted themes come back');
assert.deepEqual(C.missingBuiltins(base), { families: [], themes: [] }); ok('nothing missing on a fresh collection');

// store seeding
mem.set('com.fireworklabs.theme-editor/userThemes', JSON.stringify([{ id: 'mine', name: 'Mine', isDark: true, colors: { bg: '#000000' } }]));
assert.equal(store.getCollection().length, 37); assert.equal(store.getCollection()[0].id, 'mine'); assert.equal(store.getFamilies().length, 6); ok('pre-seed view: user themes then presets, builtin families');
await store.ensureSeeded();
assert.equal(JSON.parse(mem.get('com.fireworklabs.theme-editor/userThemes')!).length, 37); assert.equal(mem.get('com.fireworklabs.theme-editor/collectionSeeded'), '1'); ok('seed persisted');
await store.setCollection([], []);
assert.equal(store.getCollection().length, 0); assert.equal(store.getFamilies().length, 0); ok('after seeding, an empty collection stays empty (no re-seed)');
console.log(`\n${n} passed`);
