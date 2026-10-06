/**
 * Dresses the host's default gutter button for the Theme Gallery panel as
 * Mr. Themes: swaps the Material "palette" symbol for the icon from
 * graphic-assets/Theme-v2.svg, replaces the native title attribute with
 * Nimbalyst's big help tooltip (title plus one sentence), and restores both on
 * unmount. The button itself stays the host's, so click and active state
 * behave exactly as before. If the host renders our custom gutter button
 * instead, there is no symbol to replace and this does nothing.
 */
import { useEffect } from 'react';
import { attachHelpTooltip } from '../helpTooltip';
import { themeIconSvg } from '../themeIcon';

const BUTTON = '.navigation-gutter [data-gutter-item="com.fireworklabs.theme-editor.theme-library"] button';
const SYMBOL = '.material-symbols-outlined';
const ICON_CLASS = 'nte-gutter-icon';

export const TOOLTIP = { title: 'Mr. Themes', body: 'Every project gets its own theme. Best buds with Mr. Projects.' };

export function GutterIcon() {
  useEffect(() => {
    let raf = 0;
    const originals = new Map<HTMLElement, HTMLElement>();
    const dressed = new Map<HTMLElement, { detach: () => void; title: string | null }>();

    const sync = () => {
      raf = 0;
      for (const btn of Array.from(document.querySelectorAll<HTMLElement>(BUTTON))) {
        if (!dressed.has(btn)) {
          const title = btn.getAttribute('title');
          btn.removeAttribute('title');
          dressed.set(btn, { detach: attachHelpTooltip(btn, TOOLTIP), title });
        }
        if (btn.querySelector(`.${ICON_CLASS}`)) continue;
        const symbol = btn.querySelector<HTMLElement>(SYMBOL);
        if (!symbol) continue;
        const icon = document.createElement('span');
        icon.className = ICON_CLASS;
        icon.innerHTML = themeIconSvg(22);
        originals.set(icon, symbol);
        symbol.replaceWith(icon);
      }
      // Buttons the host re-rendered are gone from the DOM; drop their bookkeeping.
      for (const [btn, d] of dressed) {
        if (!btn.isConnected) {
          d.detach();
          dressed.delete(btn);
        }
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      for (const [icon, symbol] of originals) if (icon.isConnected) icon.replaceWith(symbol);
      for (const [btn, d] of dressed) {
        d.detach();
        if (d.title !== null && btn.isConnected) btn.setAttribute('title', d.title);
      }
    };
  }, []);
  return null;
}
