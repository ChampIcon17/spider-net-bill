import * as React from "react";

export type Unsubscribe = () => void;

export type Store<T> = {
  getSnapshot: () => T;
  setState: (updater: (prev: T) => T) => void;
  subscribe: (listener: () => void) => Unsubscribe;
};

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    setState: (updater) => {
      const next = updater(state);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  isEqual: (a: S, b: S) => boolean = Object.is,
): S {
  const getSelectedSnapshot = React.useCallback(() => selector(store.getSnapshot()), [selector, store]);

  const selected = React.useSyncExternalStore(store.subscribe, getSelectedSnapshot, getSelectedSnapshot);
  const lastRef = React.useRef<S>(selected);

  if (!isEqual(lastRef.current, selected)) {
    lastRef.current = selected;
  }
  return lastRef.current;
}

