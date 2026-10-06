/**
 * Custom gutter button for the Theme Gallery panel (the SDK's PanelExport
 * gutterButton), presented as Mr. Themes with the icon from
 * graphic-assets/Theme-v2.svg and the big help tooltip. Mirrors the native
 * nav-button: 36x36, muted until hover, primary when active.
 *
 * Nimbalyst 0.77.5 did not pick this export up on a dev reinstall, so
 * GutterIcon.tsx also dresses the host's default button.
 */
import { useEffect, useState } from 'react';
import type { PanelGutterButtonProps } from '@nimbalyst/extension-sdk';
import { attachHelpTooltip } from '../helpTooltip';
import { ensureStyles } from '../styles';
import { themeIconSvg } from '../themeIcon';
import { TOOLTIP } from './GutterIcon';

export function ThemeGutterButton({ isActive, onActivate }: PanelGutterButtonProps) {
  ensureStyles();
  const [btn, setBtn] = useState<HTMLButtonElement | null>(null);
  useEffect(() => (btn ? attachHelpTooltip(btn, TOOLTIP) : undefined), [btn]);
  return (
    <button
      ref={setBtn}
      type="button"
      className={`nte-gutter-btn${isActive ? ' active' : ''}`}
      aria-label="Mr. Themes"
      aria-pressed={isActive}
      data-testid="theme-gallery-gutter-button"
      onClick={onActivate}
      dangerouslySetInnerHTML={{ __html: themeIconSvg(22) }}
    />
  );
}
