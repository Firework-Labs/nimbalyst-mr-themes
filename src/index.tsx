/**
 * Mr. Themes - extension entry point.
 */
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import { applier, installBridge, uninstallBridge } from './applier';
import { ThemeApplier } from './components/ThemeApplier';
import { GutterIcon } from './components/GutterIcon';
import { ThemeEditor } from './components/ThemeEditor';
import { ThemeGutterButton } from './components/ThemeGutterButton';
import { ThemeLibraryPanel } from './components/ThemeLibraryPanel';
import { ensureSeeded, setExtensionContext } from './store';
import { ensureStyles } from './styles';

export const components = {
  ThemeEditor,
};

export const panels = {
  'theme-library': {
    component: ThemeLibraryPanel,
    gutterButton: ThemeGutterButton,
  },
};

export const hostComponents = {
  ThemeApplier,
  GutterIcon,
};

export function activate(context: ExtensionContext): void {
  setExtensionContext(context);
  void ensureSeeded();
  ensureStyles();
  installBridge();
  applier.start();
}

export function deactivate(): void {
  applier.suspend();
  uninstallBridge();
  setExtensionContext(null);
}
