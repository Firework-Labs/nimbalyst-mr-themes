/**
 * Extension stylesheet, injected once at runtime. Everything uses the app's
 * --nim-* variables so the editor follows whatever theme is active.
 */
const STYLE_ID = 'nte-styles';

export const CSS = `
/* --nte-card-w is shared by the assignment tray cards and the gallery grid
   columns so the two sections line up on the same vertical rhythm. */
/* Theme Gallery button in the navigation gutter, styled like Nimbalyst's own nav-buttons. */
.nte-gutter-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: transparent; color: var(--nim-text-muted); cursor: pointer; padding: 0; transition: background .15s, color .15s; }
.nte-gutter-btn:hover { background: var(--nim-bg-tertiary); color: var(--nim-text); }
.nte-gutter-btn:active { transform: scale(.95); }
.nte-gutter-btn.active { background: var(--nim-primary); color: var(--nim-on-primary, #111827); }
.nte-gutter-btn.active:hover { background: var(--nim-primary-hover, var(--nim-primary)); }
.nte-gutter-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
/* Fallback styling for the rebuilt help tooltip (the host's own classes normally apply). */
.nte-help-tooltip { position: fixed; z-index: 10002; max-width: 280px; padding: 10px 12px; background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.1); pointer-events: none; font-size: 12px; line-height: 1.5; color: var(--nim-text-muted); }
.nte-help-tooltip .help-tooltip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.nte-help-tooltip .help-tooltip-title { font-size: 13px; font-weight: 600; color: var(--nim-text); }
.nte-help-tooltip .help-tooltip-paragraph { margin: 0; }
.nte { --nte-card-w: 216px; color: var(--nim-text); background: var(--nim-bg); font-size: 13px; line-height: 1.45; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.nte * { box-sizing: border-box; }
.nte button { font: inherit; color: inherit; }
.nte .nte-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--nim-border); background: var(--nim-bg-tertiary); color: var(--nim-text); border-radius: 6px; padding: 5px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.nte .nte-btn:hover { background: var(--nim-bg-hover); }
.nte .nte-btn:disabled { opacity: .5; cursor: default; }
.nte .nte-btn.primary { background: var(--nim-primary); color: var(--nim-on-primary, #111827); border-color: var(--nim-primary); font-weight: 600; }
.nte .nte-btn.primary:hover { background: var(--nim-primary-hover); }
.nte .nte-btn.ghost { background: transparent; border-color: transparent; }
.nte .nte-btn.ghost:hover { background: var(--nim-bg-hover); }
.nte .nte-btn.danger { color: var(--nim-error); border-color: var(--nim-error); background: transparent; }
.nte .nte-btn.sm { padding: 3px 8px; font-size: 11.5px; }
.nte .nte-icon { font-family: 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Icons', sans-serif; font-weight: normal; font-style: normal; font-size: 18px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; direction: ltr; -webkit-font-feature-settings: 'liga'; font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }
.nte input.nte-input, .nte textarea.nte-input { background: var(--nim-bg-secondary) !important; border: 1px solid var(--nim-border) !important; border-radius: 6px; padding: 5px 8px; color: var(--nim-text) !important; font: inherit; outline: none; min-width: 0; box-shadow: none !important; }
.nte input.nte-input:focus, .nte textarea.nte-input:focus { border-color: var(--nim-border-focus) !important; }
.nte input.nte-input::placeholder { color: var(--nim-text-faint); }
.nte .nte-input.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; }
.nte .nte-toggle { width: 34px; height: 18px; border-radius: 9px; background: var(--nim-bg-active); position: relative; border: none; cursor: pointer; padding: 0; flex: none; }
.nte .nte-toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--nim-text-faint); transition: left .15s; }
.nte .nte-toggle.on { background: var(--nim-primary); }
.nte .nte-toggle.on::after { left: 18px; background: var(--nim-on-primary, #111827); }
.nte .nte-pill { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; border: 1px solid var(--nim-border); color: var(--nim-text-faint); font-size: 11.5px; cursor: pointer; background: transparent; }
.nte .nte-pill.on { border-color: var(--nim-primary); color: var(--nim-primary); background: var(--nim-bg-selected); }
.nte .nte-muted { color: var(--nim-text-muted); }
.nte .nte-faint { color: var(--nim-text-faint); }
.nte .nte-row { display: flex; align-items: center; gap: 8px; }
.nte .nte-grow { flex: 1; min-width: 0; }
.nte code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; background: var(--nim-code-bg); border: 1px solid var(--nim-code-border); border-radius: 4px; padding: 1px 5px; }

/* Editor layout */
.nte-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--nim-border); background: var(--nim-bg); flex: none; }
.nte-head input.nte-title { font-weight: 600; font-size: 14px; background: transparent !important; border: 1px solid transparent !important; border-radius: 6px; padding: 3px 6px; color: var(--nim-text) !important; min-width: 220px; font-family: inherit; box-shadow: none !important; }
.nte-head input.nte-title:hover, .nte-head input.nte-title:focus { border-color: var(--nim-border) !important; background: var(--nim-bg-secondary) !important; outline: none; }
.nte-head input.nte-desc { background: transparent !important; border-color: transparent !important; }
.nte-head input.nte-desc:hover, .nte-head input.nte-desc:focus { border-color: var(--nim-border) !important; background: var(--nim-bg-secondary) !important; }
.nte-body { display: flex; flex: 1; min-height: 0; }
.nte-controls { width: 380px; flex: none; border-right: 1px solid var(--nim-border); overflow: auto; padding: 8px 14px 24px; background: var(--nim-bg); }
.nte-group { margin: 8px 0 4px; }
.nte-group > summary { list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--nim-text-faint); padding: 6px 0; user-select: none; }
.nte-group > summary::-webkit-details-marker { display: none; }
.nte-group > summary .nte-count { font-weight: 400; text-transform: none; letter-spacing: 0; }
.nte-crow { display: grid; grid-template-columns: minmax(0, 1fr) 26px 150px 22px; align-items: center; gap: 8px; padding: 3px 0; }
.nte-crow label { color: var(--nim-text-muted); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte-crow label.derived { color: var(--nim-text-faint); }
.nte-swatch { width: 26px; height: 20px; border-radius: 5px; border: 1px solid rgba(127,127,127,.35); position: relative; overflow: hidden; background: repeating-conic-gradient(#8883 0 25%, transparent 0 50%) 0 0 / 8px 8px; }
.nte-swatch > i { position: absolute; inset: 0; display: block; }
.nte-swatch > input[type=color] { position: absolute; inset: -4px; width: 40px; height: 32px; opacity: 0; cursor: pointer; border: none; padding: 0; }
.nte-crow .nte-input { padding: 3px 6px; }
.nte-crow .nte-input.invalid { border-color: var(--nim-error); }
.nte-reset { border: none; background: transparent; color: var(--nim-text-faint); cursor: pointer; width: 22px; height: 22px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.nte-reset:hover { background: var(--nim-bg-hover); color: var(--nim-text); }
.nte-preview { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--nim-bg-secondary); }
.nte-pvbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 14px; border-bottom: 1px solid var(--nim-border); flex: none; flex-wrap: wrap; }
.nte-stage { flex: 1; min-height: 0; padding: 16px; overflow: auto; display: flex; align-items: flex-start; justify-content: center; }
.nte-stage.light { background: #e5e7eb; }
.nte-stage.dark { background: #0b0f19; }
.nte-scene { width: 100%; max-width: 980px; aspect-ratio: 16 / 10; min-height: 420px; border-radius: 8px; overflow: hidden; border: 1px solid var(--nim-border); display: flex; background: var(--nim-bg); color: var(--nim-text); font-size: 11.5px; line-height: 1.4; box-shadow: 0 10px 40px rgba(0,0,0,.25); }
.nte-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; border-top: 1px solid var(--nim-border); font-size: 11.5px; color: var(--nim-text-muted); flex: none; flex-wrap: wrap; }
.nte-grade { font-weight: 600; }
.nte-grade.AAA, .nte-grade.AA { color: var(--nim-success); }
.nte-grade.AA-large { color: var(--nim-warning); }
.nte-grade.fail { color: var(--nim-error); }

.nte select.nte-select { background: var(--nim-bg-secondary) !important; color: var(--nim-text) !important; border: 1px solid var(--nim-border) !important; border-radius: 6px; padding: 4px 8px; font: inherit; font-size: 12px; max-width: 100%; cursor: pointer; box-shadow: none !important; }
.nte select.nte-select.sm { padding: 2px 6px; font-size: 11.5px; }
.nte select.nte-select:focus { outline: none; border-color: var(--nim-border-focus) !important; }

/* Custom picker (replaces native selects, which the app's global form styles render illegible at rest).
   The popover is fixed-positioned from the button rect so the tray's horizontal
   scroller and the library scroller cannot clip it. */
.nte .nte-picker { position: relative; display: inline-flex; min-width: 0; max-width: 100%; }
.nte .nte-picker > button.nte-pickerbtn { display: inline-flex; align-items: center; gap: 4px; width: 100%; min-width: 0; background: var(--nim-bg-secondary) !important; color: var(--nim-text) !important; border: 1px solid var(--nim-border) !important; border-radius: 6px; padding: 4px 5px 4px 8px; font: inherit; font-size: 12px; line-height: 1.35; cursor: pointer; text-align: left; box-shadow: none !important; }
.nte .nte-picker > button.nte-pickerbtn:hover { background: var(--nim-bg-hover) !important; }
.nte .nte-picker.open > button.nte-pickerbtn, .nte .nte-picker > button.nte-pickerbtn:focus-visible { border-color: var(--nim-border-focus) !important; outline: none; }
.nte .nte-picker.sm > button.nte-pickerbtn { padding: 2px 4px 2px 7px; font-size: 11.5px; }
.nte .nte-picker .pk-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--nim-text); }
.nte .nte-picker .pk-label.placeholder { color: var(--nim-text-muted); }
.nte .nte-picker > button.nte-pickerbtn > .nte-icon { flex: none; color: var(--nim-text-muted); }
.nte .nte-pickerpop { position: fixed; z-index: 60; background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 8px; box-shadow: 0 12px 34px rgba(0,0,0,.38); overflow-y: auto; overflow-x: hidden; padding: 4px; scrollbar-width: thin; }
.nte .nte-pickerpop .pk-group + .pk-group { border-top: 1px solid var(--nim-border); margin-top: 4px; padding-top: 4px; }
.nte .nte-pickerpop .pk-grouphead { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--nim-text-faint); padding: 4px 8px 2px; }
.nte .nte-pickerpop button.pk-opt { display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; background: transparent !important; border: none !important; color: var(--nim-text) !important; font: inherit; font-size: 12px; padding: 5px 8px; border-radius: 5px; cursor: pointer; }
.nte .nte-pickerpop button.pk-opt .pk-optlabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte .nte-pickerpop button.pk-opt:hover, .nte .nte-pickerpop button.pk-opt.active { background: var(--nim-bg-hover) !important; }
.nte .nte-pickerpop button.pk-opt.sel { background: var(--nim-bg-selected) !important; font-weight: 600; }
.nte .nte-pickerpop button.pk-opt .nte-icon { color: var(--nim-primary); flex: none; }

/* Section dividers */
.nte-sectionhead { margin: 0 0 12px; }
.nte-sectionhead .sh-top { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.nte-sectionhead h3 { margin: 0; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--nim-text-muted); }
.nte-sectionhead .sh-hint { font-size: 11.5px; color: var(--nim-text-faint); }
.nte-sectionhead .sh-right { margin-left: auto; font-size: 11.5px; color: var(--nim-text-faint); }
.nte-sectionhead .sh-rule { height: 1px; background: var(--nim-border); margin-top: 7px; }

/* Library */
.nte-lib { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; }
/* Header: 72px Mr. Projects icon, then H1 / H2 / paragraph. Explicit sizes so the app's global heading styles cannot win. */
.nte-hero { display: flex; align-items: flex-start; gap: 18px; padding: 22px 24px 18px; flex: none; }
.nte-hero-icon { width: 72px; height: 72px; flex: none; color: var(--nim-text); line-height: 0; }
.nte-hero-icon svg { width: 72px; height: 72px; display: block; }
.nte-hero-text { min-width: 0; max-width: 720px; }
.nte .nte-hero h1 { margin: 0; font-size: 26px; line-height: 1.15; font-weight: 700; color: var(--nim-text); letter-spacing: -.01em; }
.nte .nte-hero h2 { margin: 4px 0 0; font-size: 15px; line-height: 1.35; font-weight: 600; color: var(--nim-text-muted); }
.nte .nte-hero p { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--nim-text-faint); }
.nte-libbody { padding: 18px 24px 24px; }
.nte-traysec { padding: 14px 24px 14px; border-top: 1px solid var(--nim-border); border-bottom: 1px solid var(--nim-border); background: var(--nim-bg-secondary); flex: none; }
.nte-tray { display: flex; gap: 14px; align-items: stretch; overflow-x: auto; overflow-y: hidden; padding-bottom: 4px; scrollbar-width: thin; }
.nte-traycard { flex: none; width: var(--nte-card-w); border: 1px solid var(--nim-border); border-radius: 10px; background: var(--nim-bg); overflow: hidden; display: flex; flex-direction: column; }
/* The global card sits on its own color: the selection tint laid over the tertiary surface. */
.nte-traycard.global { border-color: var(--nim-primary); box-shadow: 0 0 0 1px var(--nim-primary) inset; background: linear-gradient(var(--nim-bg-selected), var(--nim-bg-selected)), var(--nim-bg-tertiary); }
/* Collection toolbar (search, filters, capture, import, new) under the Theme Collection head. */
.nte-toolbar { display: flex; flex-direction: column; gap: 8px; margin: -2px 0 16px; }
.nte-toolbar-note { font-size: 12px; }
.nte-toolbar-sep { width: 1px; height: 18px; background: var(--nim-border); margin: 0 2px; }
/* Theme Families: an accordion of families, each an accordion of its themes. */
.nte-families { margin-top: 8px; border-top: 1px solid var(--nim-border); padding-top: 14px; }
.nte-families-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.nte .nte-acc-toggle { display: flex; align-items: center; gap: 8px; border: none; background: transparent; padding: 2px 4px 2px 0; cursor: pointer; text-align: left; min-width: 0; color: var(--nim-text); }
.nte .nte-acc-toggle > .nte-icon { color: var(--nim-text-faint); flex: none; }
.nte-families-head h3 { margin: 0; font-size: 18px; font-weight: 700; }
.nte-family { border: 1px solid var(--nim-border); border-radius: 12px; background: var(--nim-bg-secondary); margin: 0 0 12px; overflow: hidden; }
.nte-family.open { border-color: var(--nim-text-faint); }
.nte-family-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; flex-wrap: wrap; }
.nte-family-head .nte-acc-toggle { flex: 1 1 320px; }
.nte-family-head .sw { display: flex; gap: 4px; flex: none; }
.nte-family-head .sw i { width: 18px; height: 30px; border-radius: 5px; display: block; }
.nte-family-head .sw i:first-child { width: 40px; }
.nte-family-head .fh-text { display: flex; flex-direction: column; min-width: 0; }
.nte-family-head .fh-name { font-size: 16px; font-weight: 700; color: var(--nim-text); }
.nte-family-head .fh-desc { font-size: 11.5px; color: var(--nim-text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte-family-head .fh-actions { flex-wrap: wrap; gap: 6px; }
.nte-family-body { padding: 4px 14px 16px; border-top: 1px solid var(--nim-border); background: var(--nim-bg); padding-top: 14px; }
.nte-traycard.active { border-color: var(--nim-text-faint); }
.nte-traycard .nte-thumb { height: 64px; }
.nte-traycard .tc-body { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 5px; }
.nte-traycard .tc-title { font-weight: 600; font-size: 12.5px; display: flex; align-items: center; gap: 6px; min-width: 0; }
.nte-traycard .tc-sub { font-size: 11px; color: var(--nim-text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nte-traycard .tc-poster { width: 20px; height: 20px; border-radius: 5px; object-fit: cover; flex: none; background: var(--nim-bg-tertiary); }
.nte-trayhint { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px dashed var(--nim-border); border-radius: 10px; max-width: 460px; font-size: 12px; color: var(--nim-text-muted); }
.nte-famhead { display: flex; align-items: center; gap: 10px; margin: 22px 0 10px; flex-wrap: wrap; }
.nte-famhead h3 { margin: 0; font-size: 14px; }
.nte-famhead .sw { display: flex; gap: 3px; }
.nte-famhead .sw i { width: 14px; height: 14px; border-radius: 4px; display: block; }
.nte-famhead .sw i:first-child { width: 28px; }
.nte-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.nte-tag.proj { color: var(--nim-text); background: var(--nim-bg-tertiary); border-color: var(--nim-border); }
.nte-tag.global { color: var(--nim-on-primary, #111827); background: var(--nim-primary); border-color: var(--nim-primary); font-weight: 600; }
.nte-audit { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 4px 14px; padding: 8px 14px; border-top: 1px solid var(--nim-border); background: var(--nim-bg); font-size: 11.5px; max-height: 160px; overflow: auto; }
.nte-audit .ar { display: flex; align-items: center; gap: 6px; }
.nte-audit .ar .sw { width: 30px; height: 14px; border-radius: 3px; border: 1px solid var(--nim-border); display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex: none; }
.nte-audit .ar .l { flex: 1; color: var(--nim-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Column width matches the tray cards exactly; rows breathe more than columns. */
.nte-grid { display: grid; grid-template-columns: repeat(auto-fill, var(--nte-card-w)); column-gap: 14px; row-gap: 26px; justify-content: start; align-items: start; }
.nte-libbody > section { margin: 0 0 34px; }
.nte-libbody > section:last-of-type { margin-bottom: 12px; }
/* No transform on hover: a transformed ancestor would become the containing
   block for the picker's fixed-position popover. */
.nte-card { border: 1px solid var(--nim-border); border-radius: 10px; background: var(--nim-bg-secondary); overflow: hidden; position: relative; cursor: pointer; transition: box-shadow .12s, border-color .12s; }
.nte-card:hover { border-color: var(--nim-text-faint); box-shadow: 0 3px 12px rgba(0,0,0,.2); }
.nte-card.on { outline: 2px solid var(--nim-primary); }
.nte-thumb { height: 92px; display: grid; grid-template-columns: 26px 1fr; }
.nte-thumb .tr { display: flex; flex-direction: column; gap: 3px; padding: 7px 5px; }
.nte-thumb .tr i { display: block; height: 9px; border-radius: 2px; }
.nte-thumb .tm { padding: 9px 10px; display: flex; flex-direction: column; gap: 5px; }
.nte-thumb .tm i { display: block; height: 6px; border-radius: 2px; width: 70%; }
.nte-thumb .tm i.w { width: 45%; }
.nte-thumb .tm i.acc { width: 34%; height: 10px; border-radius: 3px; margin-top: 2px; }
.nte-thumb .tm .dots { display: flex; gap: 4px; margin-top: auto; }
.nte-thumb .tm .dots i { width: 9px; height: 9px; border-radius: 50%; }
.nte-cardmeta { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
.nte-cardmeta .n { font-weight: 600; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte-cardmeta .n small { display: block; font-weight: 400; color: var(--nim-text-faint); font-size: 10.5px; }
.nte-tag { font-size: 10px; color: var(--nim-text-faint); border: 1px solid var(--nim-border); border-radius: 99px; padding: 1px 7px; white-space: nowrap; }
/* Usage chips on gallery cards */
.nte-chips { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; min-height: 17px; }
.nte-chip { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; line-height: 1.5; color: var(--nim-text-faint); border: 1px solid var(--nim-border); border-radius: 99px; padding: 1px 7px; white-space: nowrap; }
.nte-chip.proj { color: var(--nim-text); background: var(--nim-bg-tertiary); border-color: var(--nim-border); }
.nte-chip.global { color: var(--nim-on-primary, #111827); background: var(--nim-primary); border-color: var(--nim-primary); font-weight: 600; }
.nte-chip .nte-icon { font-size: 11px; }
.nte-chip.fam { color: var(--nim-text-muted); }
.nte-chip.fam i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 1px; }
.nte-cardmeta .top { display: flex; align-items: flex-start; gap: 4px; min-width: 0; }
.nte-cardmeta .top .n { flex: 1; min-width: 0; }
/* "…" action menu (cards). Fixed-position popover, same reasoning as the picker. */
.nte .nte-menu { flex: none; }
.nte .nte-menubtn { width: 26px; height: 24px; margin: -2px -4px 0 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--nim-text-faint); cursor: pointer; padding: 0; }
.nte .nte-menubtn:hover, .nte .nte-menu.open .nte-menubtn { background: var(--nim-bg-hover); color: var(--nim-text); border-color: var(--nim-border); }
.nte .nte-menubtn:focus-visible { outline: 2px solid var(--nim-border-focus); outline-offset: 1px; }
.nte .nte-menupop { position: fixed; z-index: 60; background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 8px; box-shadow: 0 12px 34px rgba(0,0,0,.38); overflow-y: auto; padding: 4px; scrollbar-width: thin; cursor: default; }
.nte .nte-menupop .mn-group { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--nim-text-faint); padding: 8px 8px 2px; }
.nte .nte-menupop .mn-sep { height: 1px; background: var(--nim-border); margin: 4px 2px; }
.nte .nte-menupop button.mn-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent !important; border: none !important; color: var(--nim-text) !important; font: inherit; font-size: 12.5px; padding: 5px 8px; border-radius: 5px; cursor: pointer; }
.nte .nte-menupop button.mn-item .nte-icon { color: var(--nim-text-muted); flex: none; }
.nte .nte-menupop button.mn-item .mn-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte .nte-menupop button.mn-item:hover, .nte .nte-menupop button.mn-item:focus-visible { background: var(--nim-bg-hover) !important; outline: none; }
.nte .nte-menupop button.mn-item.danger, .nte .nte-menupop button.mn-item.danger .nte-icon { color: var(--nim-error) !important; }
.nte .nte-menupop button.mn-item:disabled { opacity: .5; cursor: default; }
.nte-modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 10; }
.nte-modal { background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 10px; padding: 16px; width: 560px; max-width: 92%; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
.nte-modal.wide { width: 720px; max-height: 88%; overflow: auto; }
.nte-modal h3 { margin: 0 0 8px; font-size: 14px; }
.nte-modal textarea { width: 100%; height: 160px; resize: vertical; margin-top: 10px; }
.nte-warnbox { display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--nim-warning); border-radius: 8px; padding: 10px 12px; margin: 6px 0 4px; color: var(--nim-text); background: var(--nim-bg-secondary); }
.nte-warnbox > .nte-icon { color: var(--nim-warning); flex: none; }
.nte-warnbox ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px; }
.nte-dropzone { display: flex; align-items: center; gap: 10px; border: 1px dashed var(--nim-border); border-radius: 8px; padding: 10px 12px; color: var(--nim-text-muted); }
.nte-dropzone.over { border-color: var(--nim-primary); background: var(--nim-bg-selected); }
.nte-importstatus { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; flex-wrap: wrap; }
.nte-importstatus.err { color: var(--nim-error); }
.nte-importstatus.ok > .nte-icon { color: var(--nim-success); }
.nte-importthumbs { display: flex; gap: 4px; margin-left: auto; }
.nte-importthumbs .nte-thumb { width: 54px; height: 34px; border-radius: 4px; overflow: hidden; border: 1px solid var(--nim-border); grid-template-columns: 10px 1fr; }
.nte-importthumbs .nte-thumb .tr, .nte-importthumbs .nte-thumb .tm { padding: 3px; gap: 2px; }
.nte-importthumbs .nte-thumb i { height: 3px !important; }
.nte-importthumbs .nte-thumb .dots { display: none; }
.nte-clash { margin-top: 10px; padding: 10px 12px; border-radius: 8px; background: var(--nim-bg-secondary); border: 1px solid var(--nim-border); font-size: 12px; }
.nte .nte-radio, .nte .nte-checkrow { display: flex; align-items: center; gap: 8px; padding: 3px 0; cursor: pointer; color: var(--nim-text); font-size: 12.5px; }
.nte-form { display: flex; flex-direction: column; gap: 8px; }
.nte-form > label:not(.nte-checkrow) { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: var(--nim-text-muted); }
.nte-formlabel { font-size: 11.5px; color: var(--nim-text-muted); margin-top: 4px; }
/* Family wizard: theme picker grid, header preview with five swatch slots, suggestions. */
.nte-pickgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; max-height: 260px; overflow-y: auto; padding: 2px; scrollbar-width: thin; }
.nte .nte-pickcard { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 0 0 6px; border: 1px solid var(--nim-border); border-radius: 8px; background: var(--nim-bg-secondary); cursor: pointer; text-align: left; overflow: hidden; color: var(--nim-text); }
.nte .nte-pickcard.on { border-color: var(--nim-primary); box-shadow: 0 0 0 1px var(--nim-primary); }
.nte .nte-pickcard .nte-thumb { height: 44px; grid-template-columns: 14px 1fr; }
.nte .nte-pickcard .nte-thumb .tr, .nte .nte-pickcard .nte-thumb .tm { padding: 4px; gap: 3px; }
.nte .nte-pickcard .nte-thumb .tr i { height: 5px; }
.nte .nte-pickcard .nte-thumb .dots { display: none; }
.nte .nte-pickcard .pc-name { font-size: 11.5px; font-weight: 600; padding: 0 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte .nte-pickcard .pc-sub { font-size: 10px; color: var(--nim-text-faint); padding: 0 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nte .nte-pickcard .pc-check { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: var(--nim-primary); color: var(--nim-on-primary, #111827); display: flex; align-items: center; justify-content: center; }
.nte-famprev { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--nim-border); border-radius: 12px; background: var(--nim-bg-secondary); }
.nte-famprev .sw { display: flex; gap: 4px; flex: none; }
.nte-famprev .fh-text { display: flex; flex-direction: column; min-width: 0; }
.nte-famprev .fh-name { font-size: 16px; font-weight: 700; }
.nte-famprev .fh-desc { font-size: 11.5px; color: var(--nim-text-faint); }
.nte .nte-swslot { position: relative; width: 18px; height: 30px; border-radius: 5px; border: 1px solid rgba(127,127,127,.35); padding: 0; cursor: pointer; overflow: hidden; }
.nte .nte-swslot:first-child { width: 40px; }
.nte .nte-swslot.on { outline: 2px solid var(--nim-border-focus); outline-offset: 2px; }
.nte .nte-anycolor { position: relative; display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--nim-text-muted); border: 1px solid var(--nim-border); border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.nte .nte-anycolor:hover { background: var(--nim-bg-hover); color: var(--nim-text); }
.nte .nte-anycolor input[type=color] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: none; padding: 0; }
.nte-suggest { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.nte .nte-suggest > button:not(.nte-btn) { width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgba(127,127,127,.35); cursor: pointer; padding: 0; }
.nte-empty { padding: 40px; text-align: center; color: var(--nim-text-faint); }
.nte-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--nim-text-faint); font-size: 12px; }
.nte-breadcrumb button { border: none; background: transparent; color: var(--nim-link); cursor: pointer; padding: 0; font: inherit; }
`;

export function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    // An in-place reinstall leaves the previous version's sheet in the page; replace it.
    if (existing.textContent !== CSS) existing.textContent = CSS;
    return;
  }
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
