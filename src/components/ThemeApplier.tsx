/**
 * App-level host component. Mounts once and keeps the enabled theme applied.
 */
import { useEffect } from 'react';
import { applier } from '../applier';

export function ThemeApplier() {
  useEffect(() => {
    applier.start();
  }, []);
  return null;
}
