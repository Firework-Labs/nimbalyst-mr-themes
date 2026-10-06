/**
 * The big hover tooltip Nimbalyst shows on its own gutter buttons, rebuilt for
 * ours. The host renders `div.help-tooltip` (fixed, to the right of the
 * button, vertically centered) with a title, an optional shortcut, and a body
 * paragraph; it does not offer this for extension buttons, so we append the
 * same markup ourselves. The host's class names are reused so the app's own
 * styles apply, and a prefixed class carries a fallback in our stylesheet.
 * Observed on Nimbalyst 0.77.5.
 */
export interface HelpTooltipContent {
  title: string;
  body: string;
  shortcut?: string;
}

const SHOW_DELAY_MS = 350;
const GAP = 8;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function helpTooltipHtml(content: HelpTooltipContent): string {
  const kbd = content.shortcut
    ? `<kbd class="help-tooltip-shortcut inline-flex items-center justify-center h-5 px-1.5 bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)] rounded text-[11px] font-medium text-[var(--nim-text-muted)] ml-auto shrink-0 font-sans">${esc(content.shortcut)}</kbd>`
    : '';
  return (
    `<div class="help-tooltip-header flex items-center gap-2 mb-1"><span class="help-tooltip-title text-[13px] font-semibold text-[var(--nim-text)]">${esc(content.title)}</span>${kbd}</div>` +
    `<div class="help-tooltip-body text-xs leading-normal text-[var(--nim-text-muted)]"><p class="help-tooltip-paragraph my-1.5 first:mt-0 last:mb-0">${esc(content.body)}</p></div>`
  );
}

/** Attach the tooltip to an element. Returns a function that detaches it. */
export function attachHelpTooltip(el: HTMLElement, content: HelpTooltipContent, ownClass = 'nte-help-tooltip'): () => void {
  let tip: HTMLDivElement | null = null;
  let timer = 0;

  const position = () => {
    if (!tip) return;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const top = Math.max(8, Math.min(window.innerHeight - t.height - 8, r.top + r.height / 2 - t.height / 2));
    tip.style.top = `${top}px`;
    tip.style.left = `${r.right + GAP}px`;
  };
  const show = () => {
    if (tip || !el.isConnected) return;
    tip = document.createElement('div');
    tip.className = `help-tooltip help-tooltip--right ${ownClass} fixed z-[10002] max-w-[280px] px-3 py-2.5 bg-[var(--nim-bg)] border border-[var(--nim-border)] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)] pointer-events-none nim-animate-slide-up`;
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = helpTooltipHtml(content);
    document.body.appendChild(tip);
    position();
  };
  const hide = () => {
    window.clearTimeout(timer);
    timer = 0;
    tip?.remove();
    tip = null;
  };
  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(show, SHOW_DELAY_MS);
  };

  el.addEventListener('pointerenter', arm);
  el.addEventListener('focus', arm);
  el.addEventListener('pointerleave', hide);
  el.addEventListener('pointerdown', hide);
  el.addEventListener('blur', hide);
  window.addEventListener('scroll', hide, true);
  return () => {
    hide();
    el.removeEventListener('pointerenter', arm);
    el.removeEventListener('focus', arm);
    el.removeEventListener('pointerleave', hide);
    el.removeEventListener('pointerdown', hide);
    el.removeEventListener('blur', hide);
    window.removeEventListener('scroll', hide, true);
  };
}
