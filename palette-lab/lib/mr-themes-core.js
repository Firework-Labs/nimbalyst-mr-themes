var MrThemes = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/core.ts
  var core_exports = {};
  __export(core_exports, {
    ALL_KEYS: () => ALL_KEYS,
    BASE_DARK_CORE: () => BASE_DARK_CORE,
    BASE_LIGHT_CORE: () => BASE_LIGHT_CORE,
    BUILTIN_FAMILIES: () => BUILTIN_FAMILIES,
    COLOR_HUES: () => COLOR_HUES,
    CORE_KEYS: () => CORE_KEYS,
    EXTENDED_KEYS: () => EXTENDED_KEYS,
    FACTIONS: () => FACTIONS,
    FAMILIES: () => FAMILIES,
    FAMILY_FILE_KIND: () => FAMILY_FILE_KIND,
    FAMILY_FILE_VERSION: () => FAMILY_FILE_VERSION,
    GROUPS: () => GROUPS,
    HUES: () => HUES,
    LABELS: () => LABELS,
    NEUTRAL_HUES: () => NEUTRAL_HUES,
    SHADES: () => SHADES,
    TAILWIND: () => TAILWIND,
    THEME_FILE_VERSION: () => THEME_FILE_VERSION,
    VARIATIONS: () => VARIATIONS,
    VARIATION_BLURB: () => VARIATION_BLURB,
    adjust: () => adjust,
    auditSummary: () => auditSummary,
    auditTheme: () => auditTheme,
    buildAllThemes: () => buildAllThemes,
    buildTheme: () => buildTheme,
    cloneTheme: () => cloneTheme,
    composite: () => composite,
    compositeOver: () => compositeOver,
    contrastGrade: () => contrastGrade,
    contrastRatio: () => contrastRatio,
    cssVar: () => cssVar,
    deriveExtended: () => deriveExtended,
    emptyTheme: () => emptyTheme,
    familyAudit: () => familyAudit,
    familyOf: () => familyOf,
    familySwatches: () => familySwatches,
    fixContrast: () => fixContrast,
    formatColor: () => formatColor,
    fullAudit: () => fullAudit,
    generateFamilyThemes: () => generateFamilyThemes,
    isDarkColor: () => isDarkColor,
    isValidColor: () => isValidColor,
    ladder: () => ladder,
    luminance: () => luminance,
    mix: () => mix,
    normalizeFamily: () => normalizeFamily,
    normalizeTheme: () => normalizeTheme,
    onColor: () => onColor,
    parseColor: () => parseColor,
    parseImport: () => parseImport,
    parseThemeFile: () => parseThemeFile,
    resolveTheme: () => resolveTheme,
    serializeFamilyFile: () => serializeFamilyFile,
    serializeThemeFile: () => serializeThemeFile,
    shadeIndex: () => shadeIndex,
    slugify: () => slugify,
    summarize: () => summarize,
    themeFromVars: () => themeFromVars,
    toFamilySpec: () => toFamilySpec,
    toHex: () => toHex,
    toThemeExtensionManifest: () => toThemeExtensionManifest,
    tw: () => tw,
    uniqueSlug: () => uniqueSlug,
    withAlpha: () => withAlpha
  });

  // ../nimbalyst-theme-editor/src/color.ts
  var NAMED = {
    white: "#ffffff",
    black: "#000000",
    transparent: "rgba(0, 0, 0, 0)"
  };
  var clamp01 = (n) => Math.max(0, Math.min(1, n));
  var clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
  function parseColor(input) {
    if (!input) return null;
    let s = input.trim().toLowerCase();
    if (NAMED[s]) s = NAMED[s];
    if (s.startsWith("#")) {
      const h = s.slice(1);
      if (![3, 4, 6, 8].includes(h.length) || /[^0-9a-f]/.test(h)) return null;
      const full = h.length <= 4 ? h.split("").map((c) => c + c).join("") : h;
      const n = parseInt(full.slice(0, 6), 16);
      const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
      return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a };
    }
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
    if (m) {
      let a = 1;
      if (m[4] !== void 0) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: clamp255(+m[1]), g: clamp255(+m[2]), b: clamp255(+m[3]), a: clamp01(a) };
    }
    return null;
  }
  function isValidColor(input) {
    return parseColor(input) !== null;
  }
  var hex2 = (n) => clamp255(n).toString(16).padStart(2, "0");
  function toHex(c) {
    return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  }
  function formatColor(c) {
    if (c.a >= 1) return toHex(c);
    const a = Math.round(c.a * 1e3) / 1e3;
    return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${a})`;
  }
  function withAlpha(color, a) {
    const c = parseColor(color) ?? { r: 0, g: 0, b: 0, a: 1 };
    return formatColor({ ...c, a: clamp01(a) });
  }
  function mix(a, b, t) {
    const ca = parseColor(a) ?? { r: 0, g: 0, b: 0, a: 1 };
    const cb = parseColor(b) ?? { r: 0, g: 0, b: 0, a: 1 };
    const k = clamp01(t);
    return formatColor({
      r: ca.r + (cb.r - ca.r) * k,
      g: ca.g + (cb.g - ca.g) * k,
      b: ca.b + (cb.b - ca.b) * k,
      a: ca.a + (cb.a - ca.a) * k
    });
  }
  function adjust(color, amount) {
    return amount >= 0 ? mix(color, "#ffffff", amount) : mix(color, "#000000", -amount);
  }
  function channel(v) {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(c) {
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }
  function composite(fg, bg) {
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1
    };
  }
  function contrastRatio(fg, bg) {
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
  function isDarkColor(color) {
    const c = parseColor(color);
    if (!c) return true;
    return luminance(c) < 0.35;
  }
  function onColor(bg, dark = "#111827", light = "#f8fafc") {
    return contrastRatio(dark, bg) >= contrastRatio(light, bg) ? dark : light;
  }
  function contrastGrade(ratio) {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    if (ratio >= 3) return "AA-large";
    return "fail";
  }

  // ../nimbalyst-theme-editor/src/themeSpec.ts
  var CORE_KEYS = [
    "bg",
    "bg-secondary",
    "bg-tertiary",
    "bg-hover",
    "bg-selected",
    "bg-active",
    "text",
    "text-muted",
    "text-faint",
    "text-disabled",
    "border",
    "border-focus",
    "primary",
    "primary-hover",
    "link",
    "link-hover",
    "success",
    "warning",
    "error",
    "info"
  ];
  var EXTENDED_KEYS = [
    "on-primary",
    "purple",
    "code-bg",
    "code-text",
    "code-border",
    "code-gutter",
    "code-comment",
    "code-punctuation",
    "code-property",
    "code-selector",
    "code-operator",
    "code-attr",
    "code-variable",
    "code-function",
    "table-border",
    "table-header",
    "table-cell",
    "table-stripe",
    "toolbar-bg",
    "toolbar-border",
    "toolbar-hover",
    "toolbar-active",
    "highlight-bg",
    "highlight-border",
    "comment-mark",
    "quote-text",
    "quote-border",
    "scrollbar-thumb",
    "scrollbar-thumb-hover",
    "scrollbar-track",
    "diff-add-bg",
    "diff-add-border",
    "diff-remove-bg",
    "diff-remove-border",
    "terminal-bg",
    "terminal-fg",
    "terminal-cursor",
    "terminal-cursor-accent",
    "terminal-selection",
    "terminal-ansi-black",
    "terminal-ansi-red",
    "terminal-ansi-green",
    "terminal-ansi-yellow",
    "terminal-ansi-blue",
    "terminal-ansi-magenta",
    "terminal-ansi-cyan",
    "terminal-ansi-white",
    "terminal-ansi-bright-black",
    "terminal-ansi-bright-red",
    "terminal-ansi-bright-green",
    "terminal-ansi-bright-yellow",
    "terminal-ansi-bright-blue",
    "terminal-ansi-bright-magenta",
    "terminal-ansi-bright-cyan",
    "terminal-ansi-bright-white"
  ];
  var ALL_KEYS = [...CORE_KEYS, ...EXTENDED_KEYS];
  function cssVar(key) {
    return key.startsWith("terminal-") ? `--${key}` : `--nim-${key}`;
  }
  var THEME_FILE_VERSION = 1;
  var LABELS = {
    bg: "Background",
    "bg-secondary": "Background, secondary",
    "bg-tertiary": "Background, tertiary",
    "bg-hover": "Hover",
    "bg-selected": "Selected",
    "bg-active": "Active",
    text: "Text",
    "text-muted": "Muted text",
    "text-faint": "Faint text",
    "text-disabled": "Disabled text",
    border: "Border",
    "border-focus": "Focus ring",
    primary: "Primary",
    "primary-hover": "Primary hover",
    link: "Link",
    "link-hover": "Link hover",
    success: "Success",
    warning: "Warning",
    error: "Error",
    info: "Info",
    "on-primary": "Text on primary",
    purple: "Purple accent",
    "code-bg": "Code background",
    "code-text": "Code text",
    "code-border": "Code border",
    "code-gutter": "Code gutter",
    "code-comment": "Comment",
    "code-punctuation": "Punctuation",
    "code-property": "Property",
    "code-selector": "Keyword / selector",
    "code-operator": "Operator",
    "code-attr": "String / attribute",
    "code-variable": "Variable",
    "code-function": "Function",
    "table-border": "Table border",
    "table-header": "Table header",
    "table-cell": "Table cell",
    "table-stripe": "Table stripe",
    "toolbar-bg": "Toolbar background",
    "toolbar-border": "Toolbar border",
    "toolbar-hover": "Toolbar hover",
    "toolbar-active": "Toolbar active",
    "highlight-bg": "Highlight",
    "highlight-border": "Highlight border",
    "comment-mark": "Comment mark",
    "quote-text": "Quote text",
    "quote-border": "Quote border",
    "scrollbar-thumb": "Scrollbar thumb",
    "scrollbar-thumb-hover": "Scrollbar thumb hover",
    "scrollbar-track": "Scrollbar track",
    "diff-add-bg": "Diff added",
    "diff-add-border": "Diff added border",
    "diff-remove-bg": "Diff removed",
    "diff-remove-border": "Diff removed border",
    "terminal-bg": "Terminal background",
    "terminal-fg": "Terminal text",
    "terminal-cursor": "Cursor",
    "terminal-cursor-accent": "Cursor accent",
    "terminal-selection": "Terminal selection",
    "terminal-ansi-black": "Black",
    "terminal-ansi-red": "Red",
    "terminal-ansi-green": "Green",
    "terminal-ansi-yellow": "Yellow",
    "terminal-ansi-blue": "Blue",
    "terminal-ansi-magenta": "Magenta",
    "terminal-ansi-cyan": "Cyan",
    "terminal-ansi-white": "White",
    "terminal-ansi-bright-black": "Bright black",
    "terminal-ansi-bright-red": "Bright red",
    "terminal-ansi-bright-green": "Bright green",
    "terminal-ansi-bright-yellow": "Bright yellow",
    "terminal-ansi-bright-blue": "Bright blue",
    "terminal-ansi-bright-magenta": "Bright magenta",
    "terminal-ansi-bright-cyan": "Bright cyan",
    "terminal-ansi-bright-white": "Bright white"
  };
  var GROUPS = [
    { id: "surfaces", title: "Surfaces", keys: ["bg", "bg-secondary", "bg-tertiary", "bg-hover", "bg-selected", "bg-active", "border", "border-focus"] },
    { id: "text", title: "Text", keys: ["text", "text-muted", "text-faint", "text-disabled"] },
    { id: "accents", title: "Accents", keys: ["primary", "primary-hover", "on-primary", "link", "link-hover", "purple"] },
    { id: "status", title: "Status", keys: ["success", "warning", "error", "info"] },
    { id: "code", title: "Code blocks", hint: "Markdown code blocks and syntax colors", keys: ["code-bg", "code-text", "code-border", "code-gutter", "code-comment", "code-punctuation", "code-property", "code-selector", "code-operator", "code-attr", "code-variable", "code-function"] },
    { id: "tables", title: "Tables and toolbars", keys: ["table-border", "table-header", "table-cell", "table-stripe", "toolbar-bg", "toolbar-border", "toolbar-hover", "toolbar-active"] },
    { id: "marks", title: "Highlights, quotes, diffs, scrollbars", keys: ["highlight-bg", "highlight-border", "comment-mark", "quote-text", "quote-border", "diff-add-bg", "diff-add-border", "diff-remove-bg", "diff-remove-border", "scrollbar-thumb", "scrollbar-thumb-hover", "scrollbar-track"] },
    { id: "terminal", title: "Terminal", hint: "Colors for the integrated terminal, including the 16 ANSI colors", keys: ["terminal-bg", "terminal-fg", "terminal-cursor", "terminal-cursor-accent", "terminal-selection", "terminal-ansi-black", "terminal-ansi-red", "terminal-ansi-green", "terminal-ansi-yellow", "terminal-ansi-blue", "terminal-ansi-magenta", "terminal-ansi-cyan", "terminal-ansi-white", "terminal-ansi-bright-black", "terminal-ansi-bright-red", "terminal-ansi-bright-green", "terminal-ansi-bright-yellow", "terminal-ansi-bright-blue", "terminal-ansi-bright-magenta", "terminal-ansi-bright-cyan", "terminal-ansi-bright-white"] }
  ];
  var BASE_DARK_CORE = {
    bg: "#0f172a",
    "bg-secondary": "#020617",
    "bg-tertiary": "#1e293b",
    "bg-hover": "rgba(255, 255, 255, 0.05)",
    "bg-selected": "rgba(56, 189, 248, 0.15)",
    "bg-active": "#4B5563",
    text: "#f8fafc",
    "text-muted": "#cbd5e1",
    "text-faint": "#94a3b8",
    "text-disabled": "#64748b",
    border: "#1e293b",
    "border-focus": "#3B82F6",
    primary: "#38bdf8",
    "primary-hover": "#7dd3fc",
    link: "#60A5FA",
    "link-hover": "#93C5FD",
    success: "#10B981",
    warning: "#EAB308",
    error: "#EF4444",
    info: "#38bdf8"
  };
  var BASE_LIGHT_CORE = {
    bg: "#ffffff",
    "bg-secondary": "#f8fafc",
    "bg-tertiary": "#f1f5f9",
    "bg-hover": "rgba(0, 0, 0, 0.04)",
    "bg-selected": "rgba(37, 99, 235, 0.12)",
    "bg-active": "#e2e8f0",
    text: "#0f172a",
    "text-muted": "#475569",
    "text-faint": "#64748b",
    "text-disabled": "#94a3b8",
    border: "#e2e8f0",
    "border-focus": "#3b82f6",
    primary: "#2563eb",
    "primary-hover": "#1d4ed8",
    link: "#2563eb",
    "link-hover": "#1d4ed8",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626",
    info: "#0284c7"
  };
  var CODE_TOKENS_DARK = {
    "code-comment": "#6a9955",
    "code-punctuation": "#cccccc",
    "code-property": "#9cdcfe",
    "code-selector": "#d7ba7d",
    "code-operator": "#d4d4d4",
    "code-attr": "#92c5f8",
    "code-variable": "#4fc1ff",
    "code-function": "#dcdcaa"
  };
  var CODE_TOKENS_LIGHT = {
    "code-comment": "#008000",
    "code-punctuation": "#393a34",
    "code-property": "#001080",
    "code-selector": "#a31515",
    "code-operator": "#000000",
    "code-attr": "#0451a5",
    "code-variable": "#0070c1",
    "code-function": "#795e26"
  };
  function deriveExtended(core, isDark) {
    const tokens = isDark ? CODE_TOKENS_DARK : CODE_TOKENS_LIGHT;
    const magenta = isDark ? "#a855f7" : "#7e22ce";
    const cyan = isDark ? "#06b6d4" : "#0e7490";
    return {
      "on-primary": onColor(core.primary),
      purple: isDark ? "#a78bfa" : "#7c3aed",
      "code-bg": core["bg-secondary"],
      "code-text": core.text,
      "code-border": core.border,
      "code-gutter": core.border,
      ...tokens,
      "table-border": core.border,
      "table-header": core["bg-secondary"],
      "table-cell": core.bg,
      "table-stripe": core["bg-tertiary"],
      "toolbar-bg": core.bg,
      "toolbar-border": core.border,
      "toolbar-hover": core["bg-hover"],
      "toolbar-active": withAlpha(core.link, 0.2),
      "highlight-bg": withAlpha(core.warning, 0.2),
      "highlight-border": withAlpha(core.warning, 0.4),
      "comment-mark": mix(core.warning, "#ffffff", isDark ? 0.45 : 0.1),
      "quote-text": core["text-muted"],
      "quote-border": core.border,
      "scrollbar-thumb": core["text-faint"],
      "scrollbar-thumb-hover": core["text-muted"],
      "scrollbar-track": "transparent",
      "diff-add-bg": withAlpha(core.success, 0.15),
      "diff-add-border": withAlpha(core.success, 0.4),
      "diff-remove-bg": withAlpha(core.error, 0.15),
      "diff-remove-border": withAlpha(core.error, 0.4),
      "terminal-bg": core["bg-secondary"],
      "terminal-fg": core.text,
      "terminal-cursor": core.primary,
      "terminal-cursor-accent": core["bg-secondary"],
      "terminal-selection": core["bg-selected"],
      "terminal-ansi-black": isDark ? "#000000" : "#1f2937",
      "terminal-ansi-red": core.error,
      "terminal-ansi-green": core.success,
      "terminal-ansi-yellow": core.warning,
      "terminal-ansi-blue": core.primary,
      "terminal-ansi-magenta": magenta,
      "terminal-ansi-cyan": cyan,
      "terminal-ansi-white": isDark ? "#ffffff" : "#e5e7eb",
      "terminal-ansi-bright-black": isDark ? "#6b7280" : "#4b5563",
      "terminal-ansi-bright-red": adjust(core.error, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-green": adjust(core.success, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-yellow": adjust(core.warning, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-blue": adjust(core.primary, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-magenta": adjust(magenta, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-cyan": adjust(cyan, isDark ? 0.25 : -0.15),
      "terminal-ansi-bright-white": isDark ? "#ffffff" : "#f9fafb"
    };
  }
  function resolveTheme(theme) {
    const base = theme.isDark ? BASE_DARK_CORE : BASE_LIGHT_CORE;
    const core = { ...base };
    for (const k of CORE_KEYS) {
      const v = theme.colors[k];
      if (v && isValidColor(v)) core[k] = v;
    }
    const derivedAll = deriveExtended(core, theme.isDark);
    const extended = { ...derivedAll };
    const derived = new Set(EXTENDED_KEYS);
    for (const k of EXTENDED_KEYS) {
      const v = theme.extended?.[k];
      if (v && isValidColor(v)) {
        extended[k] = v;
        derived.delete(k);
      }
    }
    const vars = {};
    for (const k of CORE_KEYS) vars[cssVar(k)] = core[k];
    for (const k of EXTENDED_KEYS) vars[cssVar(k)] = extended[k];
    return { core, extended, vars, derived };
  }
  function slugify(name) {
    const s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return s || "theme";
  }
  function normalizeTheme(input) {
    if (!input || typeof input !== "object") throw new Error("Theme must be a JSON object");
    const o = input;
    const colorsIn = o.colors && typeof o.colors === "object" ? o.colors : {};
    const extIn = o.extended && typeof o.extended === "object" ? o.extended : {};
    const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Untitled theme";
    const colors = {};
    for (const k of CORE_KEYS) {
      const v = colorsIn[k];
      if (typeof v === "string" && isValidColor(v)) colors[k] = v;
    }
    const extended = {};
    for (const k of EXTENDED_KEYS) {
      const v = extIn[k];
      if (typeof v === "string" && isValidColor(v)) extended[k] = v;
    }
    const isDark = typeof o.isDark === "boolean" ? o.isDark : true;
    const out = {
      id: typeof o.id === "string" && o.id.trim() ? slugify(o.id) : slugify(name),
      name,
      version: typeof o.version === "string" ? o.version : "1.0.0",
      isDark,
      colors,
      format: THEME_FILE_VERSION
    };
    if (typeof o.author === "string") out.author = o.author;
    if (typeof o.description === "string") out.description = o.description;
    if (Array.isArray(o.tags)) out.tags = o.tags.filter((t) => typeof t === "string");
    if (Object.keys(extended).length) out.extended = extended;
    if (o.monaco && typeof o.monaco === "object") out.monaco = o.monaco;
    if (typeof o.family === "string") out.family = o.family;
    if (o.faction === "light" || o.faction === "dark") out.faction = o.faction;
    if (o.variation === "subtle" || o.variation === "pigment" || o.variation === "juicy") out.variation = o.variation;
    return out;
  }
  function parseThemeFile(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return normalizeTheme({ name: "Untitled theme", isDark: true, colors: {} });
    return normalizeTheme(JSON.parse(trimmed));
  }
  function serializeThemeFile(theme) {
    const ordered = {
      id: theme.id,
      name: theme.name,
      version: theme.version,
      ...theme.author ? { author: theme.author } : {},
      ...theme.description ? { description: theme.description } : {},
      isDark: theme.isDark,
      ...theme.tags && theme.tags.length ? { tags: theme.tags } : {},
      colors: theme.colors,
      ...theme.extended && Object.keys(theme.extended).length ? { extended: theme.extended } : {},
      ...theme.monaco ? { monaco: theme.monaco } : {},
      ...theme.family ? { family: theme.family, faction: theme.faction, variation: theme.variation } : {},
      format: THEME_FILE_VERSION
    };
    return JSON.stringify(ordered, null, 2) + "\n";
  }
  function themeFromVars(vars, name, id, isDark) {
    const colors = {};
    const extended = {};
    for (const k of CORE_KEYS) {
      const v = vars[cssVar(k)];
      if (v && isValidColor(v)) colors[k] = v;
    }
    for (const k of EXTENDED_KEYS) {
      const v = vars[cssVar(k)];
      if (v && isValidColor(v)) extended[k] = v;
    }
    const t = normalizeTheme({ name, id, isDark, colors, extended, description: "Nimbalyst native theme" });
    t.id = id;
    return t;
  }
  function cloneTheme(theme, name, id) {
    return {
      ...theme,
      id: id ?? slugify(name),
      name,
      colors: { ...theme.colors },
      extended: theme.extended ? { ...theme.extended } : void 0,
      tags: theme.tags ? [...theme.tags] : void 0
    };
  }
  function emptyTheme(name = "Untitled theme", isDark = true) {
    const base = isDark ? BASE_DARK_CORE : BASE_LIGHT_CORE;
    return { id: slugify(name), name, version: "1.0.0", isDark, colors: { ...base }, format: THEME_FILE_VERSION };
  }
  function toThemeExtensionManifest(theme, extensionId) {
    const manifest = {
      id: extensionId,
      name: `${theme.name} Theme`,
      version: theme.version,
      description: theme.description ?? `The ${theme.name} theme for Nimbalyst, made with Mr. Themes.`,
      ...theme.author ? { author: theme.author } : {},
      apiVersion: "1.0.0",
      contributions: {
        themes: [
          {
            id: theme.id,
            name: theme.name,
            isDark: theme.isDark,
            colors: resolveTheme(theme).core,
            ...theme.monaco ? { monaco: theme.monaco } : {}
          }
        ]
      }
    };
    return JSON.stringify(manifest, null, 2) + "\n";
  }

  // ../nimbalyst-theme-editor/src/contrast.ts
  function auditTheme(theme) {
    const r = resolveTheme(theme);
    const c = r.core;
    const on = r.extended["on-primary"];
    const rows = [
      ["text-bg", "Text on background", c.text, c.bg, 7, "text"],
      ["text-bg2", "Text on secondary", c.text, c["bg-secondary"], 7, "text"],
      ["muted-bg", "Muted on background", c["text-muted"], c.bg, 4.5, "text-muted"],
      ["muted-bg3", "Muted on tertiary", c["text-muted"], c["bg-tertiary"], 4.5, "text-muted"],
      ["faint-bg", "Faint on background", c["text-faint"], c.bg, 4.5, "text-faint"],
      ["text-active", "Text on active", c.text, c["bg-active"], 4.5, void 0],
      ["primary-bg", "Primary on background", c.primary, c.bg, 4.5, "primary"],
      ["on-primary", "Text on primary", on, c.primary, 4.5, void 0],
      ["link-bg", "Link on background", c.link, c.bg, 4.5, "link"],
      ["success-bg", "Success as text", c.success, c.bg, 4.5, "success"],
      ["warning-bg", "Warning as text", c.warning, c.bg, 4.5, "warning"],
      ["error-bg", "Error as text", c.error, c.bg, 4.5, "error"],
      ["info-bg", "Info as text", c.info, c.bg, 4.5, "info"],
      ["success-pill", "White on success pill", "#ffffff", c.success, 3, void 0],
      ["warning-pill", "White on warning pill", "#ffffff", c.warning, 3, void 0],
      ["error-pill", "White on error pill", "#ffffff", c.error, 3, void 0],
      ["info-pill", "White on info pill", "#ffffff", c.info, 3, void 0]
    ];
    return rows.map(([id, label, fg, bg, target, fixKey]) => {
      const ratio = contrastRatio(fg, bg);
      return { id, label, fg, bg, ratio, target, grade: contrastGrade(ratio), pass: ratio >= target, fixKey };
    });
  }
  function fixContrast(theme) {
    const next = { ...theme, colors: { ...theme.colors } };
    const changed = [];
    let guard = 0;
    while (guard++ < 12) {
      const failing = auditTheme(next).filter((x) => !x.pass && !!x.fixKey);
      if (!failing.length) break;
      const r = resolveTheme(next);
      for (const f of failing) {
        const key = f.fixKey;
        const cur = r.core[key];
        const bgIsDark = contrastRatio("#ffffff", f.bg) > contrastRatio("#000000", f.bg);
        next.colors[key] = adjust(cur, bgIsDark ? 0.12 : -0.12);
        if (!changed.includes(key)) changed.push(key);
      }
    }
    if (changed.includes("primary")) {
      const r = resolveTheme(next);
      next.extended = { ...next.extended ?? {}, "on-primary": onColor(r.core.primary) };
    }
    return { theme: next, changed };
  }
  function auditSummary(theme) {
    const rows = auditTheme(theme);
    const fails = rows.filter((x) => !x.pass).sort((a, b) => a.ratio / a.target - b.ratio / b.target);
    return { pass: rows.length - fails.length, total: rows.length, worst: fails[0] ?? null };
  }

  // ../nimbalyst-theme-editor/src/tailwind.ts
  var SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var TAILWIND = {
    slate: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"],
    gray: ["#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"],
    zinc: ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
    neutral: ["#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"],
    stone: ["#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"],
    red: ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"],
    orange: ["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"],
    amber: ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#451a03"],
    yellow: ["#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#854d0e", "#713f12", "#422006"],
    lime: ["#f7fee7", "#ecfccb", "#d9f99d", "#bef264", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212", "#365314", "#1a2e05"],
    green: ["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
    emerald: ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b", "#022c22"],
    teal: ["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"],
    cyan: ["#ecfeff", "#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63", "#083344"],
    sky: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"],
    blue: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
    indigo: ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"],
    violet: ["#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#2e1065"],
    purple: ["#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#3b0764"],
    fuchsia: ["#fdf4ff", "#fae8ff", "#f5d0fe", "#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f", "#701a75", "#4a044e"],
    pink: ["#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843", "#500724"],
    rose: ["#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337", "#4c0519"]
  };
  var HUES = Object.keys(TAILWIND);
  function tw(hue, shade) {
    return TAILWIND[hue][SHADES.indexOf(shade)];
  }
  function shadeIndex(shade) {
    return SHADES.indexOf(shade);
  }
  function ladder(hue) {
    return TAILWIND[hue];
  }

  // ../nimbalyst-theme-editor/src/families.ts
  var FACTIONS = ["dark", "light"];
  var VARIATIONS = ["subtle", "pigment", "juicy"];
  var FAMILIES = [
    { id: "harbor", name: "Harbor", description: "Sea air and steel: sky blue over slate.", dominant: "sky", pops: ["cyan", "indigo", "amber", "rose"], neutral: "slate" },
    { id: "grove", name: "Grove", description: "Moss and bark: emerald over warm stone.", dominant: "emerald", pops: ["lime", "teal", "amber", "orange"], neutral: "stone" },
    { id: "plum", name: "Plum", description: "Late evening: violet over zinc.", dominant: "violet", pops: ["fuchsia", "pink", "sky", "amber"], neutral: "zinc" },
    { id: "ember", name: "Ember", description: "Banked fire: orange over stone.", dominant: "orange", pops: ["amber", "red", "yellow", "cyan"], neutral: "stone" },
    { id: "rosewater", name: "Rosewater", description: "Petals and paper: rose over neutral gray.", dominant: "rose", pops: ["pink", "fuchsia", "orange", "teal"], neutral: "neutral" },
    { id: "lagoon", name: "Lagoon", description: "Still water: teal over cool gray.", dominant: "teal", pops: ["cyan", "emerald", "lime", "violet"], neutral: "gray" }
  ];
  var VARIATION_BLURB = {
    subtle: "Near monochrome, soft contrast, tinted pops.",
    pigment: "Deeper matte color, like ink on paper.",
    juicy: "Bright saturated pops, deep blacks, bright whites."
  };
  var TARGET = {
    text: 7,
    muted: 4.5,
    faint: 4.5,
    disabled: 2.3,
    accent: 4.5,
    link: 4.5,
    status: 4.5,
    statusUnderWhite: 3,
    code: 4.5,
    comment: 3.5
  };
  var PURPLISH = ["violet", "purple", "fuchsia", "indigo", "pink"];
  var CYANISH = ["cyan", "teal", "sky"];
  var WHITE = "#ffffff";
  var BLACK = "#000000";
  function idx(shade) {
    return SHADES.indexOf(shade);
  }
  function walk(hue, start, bgs, min, dark) {
    const step = dark ? -1 : 1;
    for (let i = idx(start); i >= 0 && i < SHADES.length; i += step) {
      const c = tw(hue, SHADES[i]);
      if (bgs.every((bg) => contrastRatio(c, bg) >= min)) return c;
    }
    return tw(hue, dark ? 50 : 950);
  }
  function verified(mixed, hue, start, bgs, min, dark) {
    let c = mixed;
    for (let i = 0; i < 8; i++) {
      if (bgs.every((bg) => contrastRatio(c, bg) >= min)) return c;
      c = mix(c, dark ? WHITE : BLACK, 0.1);
    }
    return walk(hue, start, bgs, min, dark);
  }
  function dual(hue, bg, dark) {
    const fine = [];
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
  function matte(c, neutral, amount, bg) {
    for (let a = amount; a > 0.04; a -= 0.08) {
      const m = mix(c, neutral, a);
      if (contrastRatio(m, bg) >= TARGET.status && contrastRatio(WHITE, m) >= TARGET.statusUnderWhite) return m;
    }
    return c;
  }
  function nextShade(hue, from, dark) {
    const i = SHADES.findIndex((s) => tw(hue, s) === from);
    if (i < 0) return mix(from, dark ? WHITE : BLACK, 0.15);
    const j = Math.max(0, Math.min(SHADES.length - 1, i + (dark ? -1 : 1)));
    return tw(hue, SHADES[j]);
  }
  function character(f, dark, v) {
    const n = f.neutral;
    const d = f.dominant;
    if (dark) {
      if (v === "subtle") {
        return {
          // A third of the way from 800 toward 900: still soft, but dark enough for amber pills to keep both contrast targets.
          bg: mix(mix(tw(n, 800), tw(n, 900), 0.35), tw(d, 900), 0.12),
          bg2: mix(tw(n, 900), tw(d, 950), 0.12),
          bg3: mix(tw(n, 700), tw(d, 800), 0.12),
          border: mix(tw(n, 700), tw(n, 600), 0.4),
          active: mix(tw(n, 600), tw(d, 700), 0.12),
          hover: "rgba(255, 255, 255, 0.05)",
          text: tw(n, 300),
          muted: tw(n, 400),
          faint: tw(n, 400),
          disabled: tw(n, 500),
          popMix: 0.55,
          accentShade: 400,
          accentMix: 0.45,
          selectedAlpha: 0.1,
          statusMatte: 0.35
        };
      }
      if (v === "pigment") {
        return {
          bg: mix(tw(n, 900), tw(d, 950), 0.65),
          bg2: mix(tw(n, 950), tw(d, 950), 0.5),
          bg3: mix(tw(n, 800), tw(d, 900), 0.6),
          border: mix(mix(tw(n, 800), tw(d, 900), 0.6), tw(d, 700), 0.3),
          active: mix(tw(n, 700), tw(d, 800), 0.5),
          hover: "rgba(255, 255, 255, 0.06)",
          text: mix(tw(n, 100), tw(d, 100), 0.2),
          muted: mix(tw(n, 300), tw(d, 300), 0.15),
          faint: tw(n, 400),
          disabled: tw(n, 600),
          popMix: 0.18,
          accentShade: 500,
          accentMix: 0.08,
          selectedAlpha: 0.16,
          statusMatte: 0.15
        };
      }
      return {
        bg: mix(tw(n, 950), tw(d, 950), 0.5),
        bg2: mix(BLACK, tw(n, 950), 0.55),
        bg3: mix(tw(n, 900), tw(d, 900), 0.5),
        border: mix(mix(tw(n, 900), tw(d, 900), 0.5), tw(d, 600), 0.3),
        active: mix(tw(n, 800), tw(d, 800), 0.5),
        hover: "rgba(255, 255, 255, 0.08)",
        text: mix(WHITE, tw(d, 100), 0.25),
        muted: mix(tw(n, 200), tw(d, 200), 0.3),
        faint: mix(tw(n, 400), tw(d, 300), 0.2),
        disabled: tw(n, 600),
        popMix: 0,
        accentShade: 400,
        accentMix: 0,
        selectedAlpha: 0.24,
        statusMatte: 0
      };
    }
    if (v === "subtle") {
      return {
        bg: mix(tw(n, 100), tw(d, 50), 0.25),
        bg2: mix(tw(n, 200), tw(d, 100), 0.2),
        bg3: mix(tw(n, 300), tw(d, 100), 0.25),
        border: mix(tw(n, 300), tw(d, 200), 0.2),
        active: mix(tw(n, 300), tw(d, 200), 0.35),
        hover: "rgba(0, 0, 0, 0.04)",
        text: tw(n, 700),
        muted: tw(n, 600),
        faint: tw(n, 600),
        disabled: tw(n, 400),
        popMix: 0.55,
        accentShade: 600,
        accentMix: 0.4,
        selectedAlpha: 0.1,
        statusMatte: 0.3
      };
    }
    if (v === "pigment") {
      return {
        bg: mix(tw(n, 50), tw(d, 50), 0.6),
        bg2: mix(tw(n, 100), tw(d, 100), 0.5),
        bg3: mix(tw(n, 200), tw(d, 100), 0.6),
        border: mix(tw(n, 300), tw(d, 200), 0.5),
        active: mix(tw(n, 300), tw(d, 200), 0.6),
        hover: "rgba(0, 0, 0, 0.05)",
        text: mix(tw(n, 900), tw(d, 950), 0.3),
        muted: mix(tw(n, 600), tw(d, 800), 0.2),
        faint: tw(n, 500),
        disabled: tw(n, 400),
        popMix: 0.18,
        accentShade: 700,
        accentMix: 0.08,
        selectedAlpha: 0.16,
        statusMatte: 0.15
      };
    }
    return {
      bg: WHITE,
      bg2: mix(WHITE, tw(d, 50), 0.6),
      bg3: mix(tw(n, 100), tw(d, 100), 0.6),
      border: mix(tw(n, 200), tw(d, 200), 0.5),
      active: mix(tw(n, 200), tw(d, 200), 0.7),
      hover: "rgba(0, 0, 0, 0.05)",
      text: mix(tw(n, 950), tw(d, 950), 0.5),
      muted: mix(tw(n, 700), tw(d, 800), 0.3),
      faint: tw(n, 500),
      disabled: tw(n, 400),
      popMix: 0,
      accentShade: 600,
      accentMix: 0,
      selectedAlpha: 0.22,
      statusMatte: 0
    };
  }
  function buildTheme(f, faction, variation) {
    const dark = faction === "dark";
    const n = f.neutral;
    const d = f.dominant;
    const pop = (i) => f.pops[i] ?? f.pops[f.pops.length - 1] ?? d;
    const ch = character(f, dark, variation);
    const surfaces = [ch.bg, ch.bg2, ch.bg3];
    const tinted = (hue, shade, bgs, min) => verified(mix(tw(hue, shade), tw(n, shade), ch.popMix), hue, shade, bgs, min, dark);
    const text = verified(ch.text, n, dark ? 100 : 900, surfaces, TARGET.text, dark);
    const muted = verified(ch.muted, n, dark ? 300 : 600, surfaces, TARGET.muted, dark);
    const faint = verified(ch.faint, n, dark ? 400 : 500, surfaces, TARGET.faint, dark);
    const disabled = verified(ch.disabled, n, dark ? 600 : 400, [ch.bg], TARGET.disabled, dark);
    let primary = verified(mix(tw(d, ch.accentShade), tw(n, ch.accentShade), ch.accentMix), d, ch.accentShade, surfaces, TARGET.accent, dark);
    let onPrimary = onColor(primary);
    for (let i = 0; i < 3 && contrastRatio(onPrimary, primary) < 4.5; i++) {
      primary = nextShade(d, primary, dark);
      onPrimary = onColor(primary);
    }
    const primaryHover = variation === "subtle" ? mix(primary, text, 0.15) : nextShade(d, primary, dark);
    const linkHue = variation === "subtle" ? d : pop(0);
    const linkShade = dark ? 300 : 600;
    const link = tinted(linkHue, linkShade, surfaces, TARGET.link);
    const linkHover = mix(link, dark ? WHITE : BLACK, 0.15);
    const infoHue = variation === "subtle" ? d : pop(1);
    const info = matte(dual(infoHue, ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
    const success = matte(dual(f.pops.includes("lime") && variation === "juicy" ? "lime" : "emerald", ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
    const warning = matte(dual("amber", ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
    const error = matte(dual(d === "rose" || d === "red" ? "orange" : "red", ch.bg, dark), tw(n, 500), ch.statusMatte, ch.bg);
    const colors = {
      bg: ch.bg,
      "bg-secondary": ch.bg2,
      "bg-tertiary": ch.bg3,
      "bg-hover": ch.hover,
      "bg-selected": withAlpha(primary, ch.selectedAlpha),
      "bg-active": ch.active,
      text,
      "text-muted": muted,
      "text-faint": faint,
      "text-disabled": disabled,
      border: ch.border,
      "border-focus": primary,
      primary,
      "primary-hover": primaryHover,
      link,
      "link-hover": linkHover,
      success,
      warning,
      error,
      info
    };
    const codeShade = dark ? 300 : 700;
    const codeBgs = [ch.bg2];
    const purpleHue = f.pops.find((p) => PURPLISH.includes(p)) ?? "violet";
    const cyanHue = f.pops.find((p) => CYANISH.includes(p)) ?? "cyan";
    const extended = {
      "on-primary": onPrimary,
      purple: tinted(purpleHue, dark ? 400 : 600, surfaces, TARGET.accent),
      "code-selector": tinted(d, codeShade, codeBgs, TARGET.code),
      "code-function": tinted(pop(0), codeShade, codeBgs, TARGET.code),
      "code-attr": tinted(pop(1), codeShade, codeBgs, TARGET.code),
      "code-variable": tinted(pop(2), codeShade, codeBgs, TARGET.code),
      "code-property": tinted(pop(3), codeShade, codeBgs, TARGET.code),
      "code-comment": walk(n, 500, codeBgs, TARGET.comment, dark),
      "code-punctuation": walk(n, dark ? 400 : 600, codeBgs, TARGET.code, dark),
      "code-operator": muted,
      "code-text": text
    };
    extended["terminal-ansi-magenta"] = tinted(purpleHue, dark ? 400 : 600, [ch.bg2], TARGET.code);
    extended["terminal-ansi-cyan"] = tinted(cyanHue, dark ? 400 : 600, [ch.bg2], TARGET.code);
    if (variation === "subtle") {
      extended["code-variable"] = tinted(d, codeShade, codeBgs, TARGET.code);
      extended["code-property"] = tinted(pop(0), codeShade, codeBgs, TARGET.code);
      extended["code-attr"] = verified(mix(tw(n, dark ? 300 : 700), tw(d, codeShade), 0.35), n, dark ? 300 : 700, codeBgs, TARGET.code, dark);
    }
    if (variation === "juicy") {
      extended["terminal-ansi-magenta"] = walk(purpleHue, dark ? 400 : 600, [ch.bg2], TARGET.code, dark);
      extended["terminal-ansi-cyan"] = walk(cyanHue, dark ? 400 : 600, [ch.bg2], TARGET.code, dark);
      extended["terminal-ansi-blue"] = primary;
      extended["terminal-ansi-bright-magenta"] = walk(purpleHue, dark ? 300 : 700, [ch.bg2], TARGET.code, dark);
      extended["terminal-ansi-bright-cyan"] = walk(cyanHue, dark ? 300 : 700, [ch.bg2], TARGET.code, dark);
      extended["terminal-cursor"] = primary;
      const hl = pop(3);
      extended["highlight-bg"] = withAlpha(tw(hl, 400), 0.28);
      extended["highlight-border"] = withAlpha(tw(hl, 400), 0.55);
      extended["comment-mark"] = tw(hl, 300);
      extended["toolbar-active"] = withAlpha(primary, 0.25);
    }
    const vName = variation[0].toUpperCase() + variation.slice(1);
    const fName = faction[0].toUpperCase() + faction.slice(1);
    return {
      id: `${f.id}-${faction}-${variation}`,
      name: `${f.name} ${fName} ${vName}`,
      version: "2.1.0",
      author: "Mr. Themes",
      description: `${f.description} ${VARIATION_BLURB[variation]}`,
      isDark: dark,
      tags: [faction, variation, f.id, f.dominant, ...f.pops],
      family: f.id,
      faction,
      variation,
      colors,
      extended,
      format: 1
    };
  }
  function buildAllThemes() {
    const out = [];
    for (const f of FAMILIES) for (const faction of FACTIONS) for (const v of VARIATIONS) out.push(buildTheme(f, faction, v));
    return out;
  }
  function familyOf(id) {
    return FAMILIES.find((f) => f.id === id);
  }
  function familySwatches(f, dark) {
    const s = dark ? 400 : 600;
    return [tw(f.dominant, s), ...f.pops.map((p) => tw(p, s))];
  }

  // ../nimbalyst-theme-editor/src/presets.ts
  var PRESETS = buildAllThemes();
  var PRESET_IDS = new Set(PRESETS.map((p) => p.id));

  // ../nimbalyst-theme-editor/src/collection.ts
  var FAMILY_FILE_KIND = "mr-themes/family";
  var FAMILY_FILE_VERSION = 1;
  var FAMILY_SWATCH_COUNT = 5;
  var NEUTRAL_HUES = ["slate", "gray", "zinc", "neutral", "stone"];
  var COLOR_HUES = HUES.filter((h) => !NEUTRAL_HUES.includes(h));
  var BUILTIN_FAMILIES = FAMILIES.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    generator: { dominant: f.dominant, pops: [...f.pops], neutral: f.neutral }
  }));
  function toFamilySpec(f) {
    if (!f.generator) return null;
    return { id: f.id, name: f.name, description: f.description ?? "", ...f.generator };
  }
  function generateFamilyThemes(f) {
    const spec = toFamilySpec(f);
    if (!spec) return [];
    const out = [];
    for (const faction of FACTIONS) for (const v of VARIATIONS) out.push(buildTheme(spec, faction, v));
    return out;
  }
  function isHue(v) {
    return typeof v === "string" && HUES.includes(v);
  }
  function normalizeFamily(input) {
    if (!input || typeof input !== "object") throw new Error("Family must be a JSON object");
    const o = input;
    const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Untitled family";
    const out = { id: typeof o.id === "string" && o.id.trim() ? slugify(o.id) : slugify(name), name };
    if (typeof o.description === "string" && o.description.trim()) out.description = o.description.trim();
    if (Array.isArray(o.swatches)) {
      const sw = o.swatches.filter((c) => typeof c === "string" && isValidColor(c)).slice(0, FAMILY_SWATCH_COUNT);
      if (sw.length) out.swatches = sw;
    }
    const g = o.generator;
    if (g && typeof g === "object" && isHue(g.dominant) && isHue(g.neutral)) {
      const pops = Array.isArray(g.pops) ? g.pops.filter(isHue).slice(0, 4) : [];
      out.generator = { dominant: g.dominant, pops, neutral: g.neutral };
    }
    return out;
  }
  function parseImport(raw) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch (e) {
      throw new Error(`Not valid JSON (${e.message})`);
    }
    if (Array.isArray(data)) {
      const themes = data.map((t) => normalizeTheme(t));
      if (!themes.length) throw new Error("The file has no themes");
      return { family: null, themes };
    }
    if (!data || typeof data !== "object") throw new Error("Expected a theme, a theme family, or a list of themes");
    const o = data;
    if (Array.isArray(o.themes)) {
      const family = o.family && typeof o.family === "object" ? normalizeFamily(o.family) : null;
      const themes = o.themes.map((t) => normalizeTheme(t));
      if (!themes.length && !family) throw new Error("The file has no themes");
      if (family) for (const t of themes) t.family = family.id;
      return { family, themes };
    }
    if (o.colors && typeof o.colors === "object") return { family: null, themes: [normalizeTheme(o)] };
    throw new Error('Expected a theme (with "colors"), a theme family (with "family" and "themes"), or a list of themes');
  }
  function serializeFamilyFile(family, themes) {
    const out = {
      kind: FAMILY_FILE_KIND,
      format: FAMILY_FILE_VERSION,
      family: {
        id: family.id,
        name: family.name,
        ...family.description ? { description: family.description } : {},
        ...family.swatches?.length ? { swatches: family.swatches } : {},
        ...family.generator ? { generator: family.generator } : {}
      },
      // Reuse the single-theme serializer so key order matches `.nimtheme` files.
      themes: themes.map((t) => JSON.parse(serializeThemeFile({ ...t, family: family.id })))
    };
    return JSON.stringify(out, null, 2) + "\n";
  }
  function uniqueSlug(base, taken) {
    const root = slugify(base);
    let id = root;
    let n = 2;
    while (taken.has(id)) id = `${root}-${n++}`;
    return id;
  }

  // src/audit.ts
  function compositeOver(overlay, surface) {
    const ov = parseColor(overlay);
    const su = parseColor(surface);
    if (!ov) return surface;
    if (!su) return overlay;
    const surfaceOpaque = su.a < 1 ? composite(su, { r: 255, g: 255, b: 255, a: 1 }) : su;
    if (ov.a >= 1) return formatColor(ov);
    return formatColor(composite(ov, surfaceOpaque));
  }
  function rgbToHsl(c) {
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
    return { h, s, l };
  }
  function hueOf(color) {
    const c = parseColor(color);
    if (!c) return null;
    const { h, s } = rgbToHsl(c);
    if (s < 0.08) return null;
    return h;
  }
  function hueDiff(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }
  function mk(id, group, label, fg, bg, target, opts = {}) {
    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= target;
    return {
      id,
      group,
      label,
      fg,
      bg,
      ratio,
      target,
      severity: pass ? "pass" : opts.warnOnly ? "warn" : "fail"
    };
  }
  var CHROMATIC_ANSI = [
    "terminal-ansi-red",
    "terminal-ansi-green",
    "terminal-ansi-yellow",
    "terminal-ansi-blue",
    "terminal-ansi-magenta",
    "terminal-ansi-cyan",
    "terminal-ansi-bright-red",
    "terminal-ansi-bright-green",
    "terminal-ansi-bright-yellow",
    "terminal-ansi-bright-blue",
    "terminal-ansi-bright-magenta",
    "terminal-ansi-bright-cyan"
  ];
  var WARN_ONLY_ANSI = ["terminal-ansi-black", "terminal-ansi-white", "terminal-ansi-bright-black"];
  var CODE_TOKENS = [
    { key: "code-comment", target: 3.5 },
    { key: "code-punctuation", target: 4.5 },
    { key: "code-property", target: 4.5 },
    { key: "code-selector", target: 4.5 },
    { key: "code-operator", target: 4.5 },
    { key: "code-attr", target: 4.5 },
    { key: "code-variable", target: 4.5 },
    { key: "code-function", target: 4.5 },
    { key: "code-text", target: 7 }
  ];
  function fullAudit(theme) {
    const checks = [];
    const r = resolveTheme(theme);
    const core = r.core;
    const ext = r.extended;
    for (const c of auditTheme(theme)) {
      const group = c.id.includes("primary") || c.id === "link-bg" ? "accent" : /success|warning|error|info/.test(c.id) ? "status" : c.id === "text-active" ? "states" : "text";
      checks.push({
        id: c.id,
        group,
        label: c.label,
        fg: c.fg,
        bg: c.bg,
        ratio: c.ratio,
        target: c.target,
        severity: c.pass ? "pass" : "fail"
      });
    }
    checks.push(mk("text-bg3", "text", "Text on tertiary", core.text, core["bg-tertiary"], 7));
    checks.push(mk("muted-bg2", "text", "Muted on secondary", core["text-muted"], core["bg-secondary"], 4.5));
    checks.push(mk("faint-bg2", "text", "Faint on secondary", core["text-faint"], core["bg-secondary"], 4.5));
    checks.push(mk("faint-bg3", "text", "Faint on tertiary", core["text-faint"], core["bg-tertiary"], 4.5));
    checks.push(mk("link-bg2", "accent", "Link on secondary", core.link, core["bg-secondary"], 4.5));
    for (const { key, target } of CODE_TOKENS) {
      checks.push(mk(`code-${key}`, "code", `${key} on code background`, ext[key], ext["code-bg"], target));
    }
    checks.push(mk("terminal-fg", "terminal", "Terminal text", ext["terminal-fg"], ext["terminal-bg"], 7));
    for (const key of CHROMATIC_ANSI) {
      checks.push(mk(key, "terminal", `${key} on terminal background`, ext[key], ext["terminal-bg"], 4.5));
    }
    for (const key of WARN_ONLY_ANSI) {
      checks.push(mk(key, "terminal", `${key} on terminal background`, ext[key], ext["terminal-bg"], 3, { warnOnly: true }));
    }
    const stateLayers = [
      { id: "state-selected", label: "Text on selected (over bg)", overlayKey: "bg-selected", surface: core.bg, fg: core.text },
      { id: "state-hover", label: "Text on hover (over bg-secondary)", overlayKey: "bg-hover", surface: core["bg-secondary"], fg: core.text },
      { id: "state-diff-add-code", label: "Code text on diff-add (over code-bg)", overlayKey: "diff-add-bg", surface: ext["code-bg"], fg: ext["code-text"] },
      { id: "state-diff-add", label: "Text on diff-add (over bg)", overlayKey: "diff-add-bg", surface: core.bg, fg: core.text },
      { id: "state-diff-remove-code", label: "Code text on diff-remove (over code-bg)", overlayKey: "diff-remove-bg", surface: ext["code-bg"], fg: ext["code-text"] },
      { id: "state-diff-remove", label: "Text on diff-remove (over bg)", overlayKey: "diff-remove-bg", surface: core.bg, fg: core.text },
      { id: "state-highlight", label: "Text on highlight (over bg)", overlayKey: "highlight-bg", surface: core.bg, fg: core.text },
      { id: "state-toolbar-active", label: "Text on toolbar-active (over toolbar-bg)", overlayKey: "toolbar-active", surface: ext["toolbar-bg"], fg: core.text },
      { id: "state-terminal-selection", label: "Terminal text on terminal-selection", overlayKey: "terminal-selection", surface: ext["terminal-bg"], fg: ext["terminal-fg"] }
    ];
    for (const s of stateLayers) {
      const overlay = core[s.overlayKey] ?? ext[s.overlayKey];
      const effectiveBg = compositeOver(overlay, s.surface);
      checks.push(mk(s.id, "states", s.label, s.fg, effectiveBg, 4.5));
    }
    checks.push(mk("quote-text", "text", "Quote text on background", ext["quote-text"], core.bg, 4.5));
    checks.push(mk("table-header-text", "text", "Table header text", core.text, ext["table-header"], 4.5));
    checks.push(mk("border-focus-bg", "surfaces", "Focus ring vs background", core["border-focus"], core.bg, 3, { warnOnly: true }));
    checks.push(mk("primary-fill-bg", "surfaces", "Primary fill vs background", core.primary, core.bg, 3, { warnOnly: true }));
    checks.push(mk("scrollbar-thumb-bg", "surfaces", "Scrollbar thumb vs background", ext["scrollbar-thumb"], core.bg, 3, { warnOnly: true }));
    const textRatio = contrastRatio(core.text, core.bg);
    const mutedRatio = contrastRatio(core["text-muted"], core.bg);
    const faintRatio = contrastRatio(core["text-faint"], core.bg);
    const disabledRatio = contrastRatio(core["text-disabled"], core.bg);
    const orderPairs = [
      ["text", "muted", textRatio, mutedRatio],
      ["muted", "faint", mutedRatio, faintRatio],
      ["faint", "disabled", faintRatio, disabledRatio]
    ];
    for (const [a, b, ra, rb] of orderPairs) {
      checks.push({
        id: `hierarchy-order-${a}-${b}`,
        group: "hierarchy",
        label: `${a} contrast (${ra.toFixed(2)}) > ${b} contrast (${rb.toFixed(2)})`,
        ratio: Number(ra.toFixed(3)),
        target: Number(rb.toFixed(3)),
        severity: ra > rb ? "pass" : "warn",
        note: ra > rb ? void 0 : `${a} on bg is not strictly greater than ${b} on bg`
      });
    }
    checks.push({
      id: "hierarchy-disabled-reads-disabled",
      group: "hierarchy",
      label: `Disabled text stays below 4.5 (${disabledRatio.toFixed(2)})`,
      ratio: disabledRatio,
      target: 4.5,
      severity: disabledRatio < 4.5 ? "pass" : "warn",
      note: disabledRatio < 4.5 ? void 0 : "disabled text is as readable as normal text and will not look disabled"
    });
    const surfacePairs = [
      ["bg", "bg-secondary", core.bg, core["bg-secondary"]],
      ["bg", "bg-tertiary", core.bg, core["bg-tertiary"]],
      ["bg-secondary", "bg-tertiary", core["bg-secondary"], core["bg-tertiary"]]
    ];
    for (const [an, bn, a, b] of surfacePairs) {
      const ratio = contrastRatio(a, b);
      checks.push({
        id: `hierarchy-surfaces-${an}-${bn}`,
        group: "hierarchy",
        label: `${an} vs ${bn}`,
        fg: a,
        bg: b,
        ratio,
        target: 1.05,
        severity: ratio >= 1.05 ? "pass" : "warn",
        note: ratio >= 1.05 ? void 0 : "surfaces indistinguishable"
      });
    }
    const borderRatio = contrastRatio(core.border, core.bg);
    checks.push(mk("hierarchy-border-bg", "hierarchy", "Border vs background", core.border, core.bg, 1.2, { warnOnly: true }));
    const statusKeys = ["success", "warning", "error", "info"];
    for (let i = 0; i < statusKeys.length; i++) {
      for (let j = i + 1; j < statusKeys.length; j++) {
        const ka = statusKeys[i];
        const kb = statusKeys[j];
        const ha = hueOf(core[ka]);
        const hb = hueOf(core[kb]);
        const diff = ha === null || hb === null ? null : hueDiff(ha, hb);
        const distinguishable = diff === null ? true : diff >= 25;
        checks.push({
          id: `hierarchy-hue-${ka}-${kb}`,
          group: "hierarchy",
          label: `${ka} vs ${kb} hue${diff === null ? "" : ` (\u0394=${diff.toFixed(0)}\xB0)`}`,
          severity: distinguishable ? "pass" : "warn",
          note: distinguishable ? void 0 : `${ka} and ${kb} are too close in hue to distinguish by color alone`
        });
      }
    }
    checks.push({
      id: "hierarchy-primary-link",
      group: "hierarchy",
      label: "Primary vs link",
      severity: "pass",
      note: core.primary.toLowerCase() === core.link.toLowerCase() ? "primary and link use the same color" : void 0
    });
    return checks;
  }
  var EXPECTED_FACTIONS = ["dark", "light"];
  var EXPECTED_VARIATIONS = ["subtle", "pigment", "juicy"];
  function familyAudit(themes) {
    const checks = [];
    if (!themes.length) return checks;
    const families = /* @__PURE__ */ new Map();
    for (const t of themes) {
      const fam = t.family ?? "(none)";
      if (!families.has(fam)) families.set(fam, []);
      families.get(fam).push(t);
    }
    for (const [famId, famThemes] of families) {
      const withFactionVariation = famThemes.filter((t) => t.faction && t.variation);
      if (withFactionVariation.length) {
        for (const faction of EXPECTED_FACTIONS) {
          for (const variation of EXPECTED_VARIATIONS) {
            const found = withFactionVariation.some((t) => t.faction === faction && t.variation === variation);
            checks.push({
              id: `family-${famId}-${faction}-${variation}`,
              group: "family",
              label: `${famId}: ${faction} ${variation} present`,
              severity: found ? "pass" : "warn",
              note: found ? void 0 : `missing ${faction} ${variation} variant`
            });
          }
        }
        const hues = withFactionVariation.map((t) => ({ id: t.id, hue: hueOf(resolveTheme(t).core.primary) })).filter((x) => x.hue !== null);
        if (hues.length > 1) {
          const ref = hues[0].hue;
          for (const h of hues.slice(1)) {
            const diff = hueDiff(ref, h.hue);
            checks.push({
              id: `family-${famId}-hue-${h.id}`,
              group: "family",
              label: `${h.id}: primary hue within 30\xB0 of ${hues[0].id}`,
              ratio: diff,
              target: 30,
              severity: diff <= 30 ? "pass" : "warn",
              note: diff <= 30 ? void 0 : `primary hue drifted ${diff.toFixed(0)}\xB0 from the family's reference variant`
            });
          }
        }
        for (const faction of EXPECTED_FACTIONS) {
          const inFaction = withFactionVariation.filter((t) => t.faction === faction);
          for (const t of inFaction) {
            const ratio = contrastRatio(resolveTheme(t).core.text, resolveTheme(t).core.bg);
            const inBand = ratio >= 7 && ratio <= 19;
            checks.push({
              id: `family-${famId}-band-${t.id}`,
              group: "family",
              label: `${t.id}: text contrast in a sensible band (${ratio.toFixed(2)})`,
              ratio,
              target: 7,
              severity: inBand ? "pass" : "warn",
              note: inBand ? void 0 : ratio < 7 ? "below the enforced text target" : "unusually high \u2014 check it is not pure black/white by accident"
            });
          }
        }
      }
    }
    const seen = /* @__PURE__ */ new Map();
    for (const t of themes) seen.set(t.id, (seen.get(t.id) ?? 0) + 1);
    for (const [id, count] of seen) {
      if (count > 1) {
        checks.push({
          id: `family-duplicate-${id}`,
          group: "family",
          label: `id "${id}" used ${count} times`,
          severity: "fail",
          note: "duplicate theme ids will collide on import"
        });
      }
    }
    for (const t of themes) {
      const fails = fullAudit(t).filter((c) => c.severity === "fail").length;
      checks.push({
        id: `family-fails-${t.id}`,
        group: "family",
        label: `${t.id}: ${fails} failing check(s)`,
        severity: fails > 0 ? "fail" : "pass"
      });
    }
    return checks;
  }
  function summarize(checks) {
    const out = { pass: 0, warn: 0, fail: 0 };
    for (const c of checks) out[c.severity]++;
    return out;
  }
  return __toCommonJS(core_exports);
})();
