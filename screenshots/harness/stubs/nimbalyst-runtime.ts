/**
 * Stand-in for the `@nimbalyst/runtime` package, aliased in build.mjs only so
 * @nimbalyst/extension-sdk's barrel module (dist/index.js) resolves outside
 * the real app. Mr. Themes imports `useEditorLifecycle` from the SDK's root,
 * which pulls in this whole module graph even though Mr. Themes never uses
 * Monaco, tracker references, or the host's MaterialSymbol component. None of
 * these are ever called in this harness; they only need to exist so the
 * static imports resolve.
 */
import type { ReactNode } from 'react';

export function MaterialSymbol(): ReactNode {
  return null;
}
export function useDocumentPath(): null {
  return null;
}
export function TrackerReferenceChip(): ReactNode {
  return null;
}
export function TrackerReferencePicker(): ReactNode {
  return null;
}
export function navigateToTrackerReference(): void {}
export function useResolvedTrackerReference(): null {
  return null;
}
