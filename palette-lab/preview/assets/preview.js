/**
 * Mr. Themes Toolkit — shared preview page logic.
 *
 * Loaded after ../lib/mr-themes-core.js (global `MrThemes`) and
 * data/current.js (global `window.MR_THEMES_DATA`, written by
 * `node cli/mrthemes.mjs preview <file>`; may be absent, in which case the
 * page falls back to demo data). No modules, no fetch(), no CDN — plain
 * script tags so every page works opened directly from file://.
 *
 * Exposes a single global, `MRPreview`, that every page's own inline
 * <script> uses to read the current theme/state and to mount the shared
 * top bar. State (which theme is selected) lives in the URL (`?theme=<id>`)
 * so a link or a screenshot is reproducible.
 */
(function () {
  'use strict';

  if (typeof MrThemes === 'undefined') {
    console.error('MrThemes is not loaded — check the ../lib/mr-themes-core.js script tag.');
    return;
  }

  var PAGES = [
    { href: 'index.html', label: 'Hub' },
    { href: 'app.html', label: 'App shell' },
    { href: 'components.html', label: 'Specimens' },
    { href: 'contrast.html', label: 'Contrast' },
    { href: 'family.html', label: 'Family' },
    { href: 'tokens.html', label: 'Tokens' },
    { href: 'edge-cases.html', label: 'Edge cases' },
  ];

  // ------------------------------------------------------------------
  // Data loading + fallback demo data
  // ------------------------------------------------------------------

  function loadData() {
    var raw = window.MR_THEMES_DATA;
    if (raw && Array.isArray(raw.themes) && raw.themes.length) {
      return { source: raw.source || '(unknown file)', family: raw.family || null, themes: raw.themes, demo: false, generatedAt: raw.generatedAt || null };
    }
    // Fallback: demo data, clearly labeled.
    var demoFamily = MrThemes.BUILTIN_FAMILIES[0];
    var themes = MrThemes.generateFamilyThemes(demoFamily);
    return { source: null, family: demoFamily, themes: themes, demo: true, generatedAt: null };
  }

  var DATA = loadData();

  // ------------------------------------------------------------------
  // URL state
  // ------------------------------------------------------------------

  function themeIdFromUrl() {
    var m = /[?&]theme=([^&]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setUrlThemeId(id, replace) {
    var url = new URL(window.location.href);
    url.searchParams.set('theme', id);
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }

  var currentId = themeIdFromUrl();
  if (!currentId || !DATA.themes.some(function (t) { return t.id === currentId; })) {
    currentId = DATA.themes[0].id;
    setUrlThemeId(currentId, true);
  }

  // ------------------------------------------------------------------
  // Derived state for the current theme
  // ------------------------------------------------------------------

  function computeState() {
    var theme = DATA.themes.find(function (t) { return t.id === currentId; }) || DATA.themes[0];
    var resolved = MrThemes.resolveTheme(theme);
    var checks = MrThemes.fullAudit(theme);
    var summary = MrThemes.summarize(checks);
    return {
      source: DATA.source,
      family: DATA.family,
      demo: DATA.demo,
      themes: DATA.themes,
      themeId: theme.id,
      theme: theme,
      resolved: resolved,
      checks: checks,
      summary: summary,
    };
  }

  var STATE = computeState();
  var listeners = [];

  function notify() {
    STATE = computeState();
    for (var i = 0; i < listeners.length; i++) listeners[i](STATE);
  }

  function setTheme(id) {
    if (id === currentId) return;
    currentId = id;
    setUrlThemeId(id, false);
    notify();
    renderTopbar();
  }

  window.addEventListener('popstate', function () {
    var id = themeIdFromUrl();
    if (id && DATA.themes.some(function (t) { return t.id === id; })) {
      currentId = id;
      notify();
      renderTopbar();
    }
  });

  // ------------------------------------------------------------------
  // Apply a resolved theme's vars to a scope element
  // ------------------------------------------------------------------

  function applyTheme(el, theme) {
    var resolved = theme && theme.vars ? theme : MrThemes.resolveTheme(theme);
    var vars = resolved.vars || resolved;
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) el.style.setProperty(k, vars[k]);
    }
    el.classList.add('nim-scope');
  }

  // ------------------------------------------------------------------
  // Top bar
  // ------------------------------------------------------------------

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (children) children.forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function renderTopbar() {
    var host = document.getElementById('mr-topbar');
    if (!host) return;
    host.innerHTML = '';
    var pageName = document.body.getAttribute('data-page') || '';

    host.appendChild(el('span', { class: 'mr-topbar-title' }, ['Mr. Themes Toolkit']));
    if (STATE.demo) {
      host.appendChild(el('span', { class: 'mr-demo-flag' }, ['demo data — run mrthemes preview <file>']));
    } else {
      host.appendChild(el('span', { class: 'mr-topbar-source mr-mono', title: STATE.source }, [STATE.source]));
    }

    var switcherGroup = el('span', { class: 'mr-switcher-group' });
    var prev = el('button', { class: 'mr-navbtn', title: 'Previous theme (←)' }, ['←']);
    var select = el('select', { class: 'mr-switcher' });
    STATE.themes.forEach(function (t) {
      var opt = el('option', { value: t.id }, [t.name]);
      if (t.id === STATE.themeId) opt.setAttribute('selected', 'selected');
      select.appendChild(opt);
    });
    select.addEventListener('change', function () { setTheme(select.value); });
    var next = el('button', { class: 'mr-navbtn', title: 'Next theme (→)' }, ['→']);
    prev.addEventListener('click', function () { stepTheme(-1); });
    next.addEventListener('click', function () { stepTheme(1); });
    switcherGroup.appendChild(prev);
    switcherGroup.appendChild(select);
    switcherGroup.appendChild(next);
    host.appendChild(switcherGroup);

    var badge = el('span', { class: 'mr-audit-badge' }, [
      el('span', { class: 'mr-count mr-count-pass' }, [String(STATE.summary.pass) + ' pass']),
      el('span', { class: 'mr-count mr-count-warn' }, [String(STATE.summary.warn) + ' warn']),
      el('span', { class: 'mr-count mr-count-fail' }, [String(STATE.summary.fail) + ' fail']),
    ]);
    host.appendChild(badge);

    var nav = el('nav', { class: 'mr-nav' });
    PAGES.forEach(function (p) {
      var a = el('a', { href: p.href + (p.href === 'index.html' ? '' : '?theme=' + encodeURIComponent(STATE.themeId)) }, [p.label]);
      if (p.href === pageName) a.classList.add('is-current');
      nav.appendChild(a);
    });
    host.appendChild(nav);
  }

  function stepTheme(delta) {
    var idx = STATE.themes.findIndex(function (t) { return t.id === STATE.themeId; });
    var next = (idx + delta + STATE.themes.length) % STATE.themes.length;
    setTheme(STATE.themes[next].id);
  }

  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowLeft') stepTheme(-1);
    else if (e.key === 'ArrowRight') stepTheme(1);
  });

  // ------------------------------------------------------------------
  // Small formatting helpers shared by pages
  // ------------------------------------------------------------------

  function findCheck(checks, id) {
    for (var i = 0; i < checks.length; i++) if (checks[i].id === id) return checks[i];
    return null;
  }

  function severityBadge(sev) {
    var span = el('span', { class: 'mr-severity mr-severity-' + (sev || 'none') }, [sev ? sev : 'n/a']);
    return span;
  }

  function fmtRatio(n) {
    return typeof n === 'number' ? n.toFixed(2) : '—';
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  window.MRPreview = {
    PAGES: PAGES,
    getState: function () { return STATE; },
    setTheme: setTheme,
    stepTheme: stepTheme,
    onChange: function (fn) { listeners.push(fn); },
    applyTheme: applyTheme,
    el: el,
    findCheck: findCheck,
    severityBadge: severityBadge,
    fmtRatio: fmtRatio,
    mount: function () { renderTopbar(); },
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderTopbar();
  });
})();
