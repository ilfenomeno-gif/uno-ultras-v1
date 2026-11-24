// ============================================================
// UNO ULTRA Client — Bootstrap Helper Utilities
// ============================================================

import { loadFromStorage } from '../state/profile-store.js';
import { attachLifecycleHooks } from './lifecycle.js';

export function initClientEnvironment(): () => void {
  loadFromStorage();
  return attachLifecycleHooks();
}
