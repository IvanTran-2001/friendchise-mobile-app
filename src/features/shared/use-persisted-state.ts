import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

type PersistedStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

const identity = (value: string) => value;

/**
 * Persist a piece of local state in AsyncStorage.
 *
 * The hook hydrates once per storage key and keeps the in-memory state in sync
 * with the stored value after hydration.
 */
export function usePersistedState<T>(
  storageKey: string | null,
  initialValue: T,
  { serialize = JSON.stringify, deserialize = JSON.parse }: PersistedStateOptions<T> = {},
) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const isHydrated = storageKey ? hydratedStorageKey === storageKey : true;

  useEffect(() => {
    let cancelled = false;

    if (!storageKey) {
      return () => {
        cancelled = true;
      };
    }

    AsyncStorage.getItem(storageKey)
      .then((storedValue) => {
        if (cancelled) {
          return;
        }

        setValue(storedValue == null ? initialValue : deserialize(storedValue));
        setHydratedStorageKey(storageKey);
      })
      .catch(() => {
        if (!cancelled) {
          setValue(initialValue);
          setHydratedStorageKey(storageKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deserialize, initialValue, storageKey]);

  useEffect(() => {
    if (!storageKey || !isHydrated) {
      return;
    }

    AsyncStorage.setItem(storageKey, serialize(value)).catch(() => {
      // Ignore persistence failures. The screen should still work.
    });
  }, [isHydrated, serialize, storageKey, value]);

  return [value, setValue, isHydrated] as const;
}

export const persistString = {
  serialize: identity,
  deserialize: identity,
};