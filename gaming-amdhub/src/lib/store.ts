import { useSyncExternalStore } from 'react';

/** Minimal shared state for cross-section UI (no persistence). */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return {
    get: () => value,
    set: (v: T) => {
      if (Object.is(v, value)) return;
      value = v;
      listeners.forEach((l) => l());
    },
    use: () => useSyncExternalStore(subscribe, () => value, () => initial),
  };
}
