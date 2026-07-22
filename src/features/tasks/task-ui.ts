import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type TaskMode = "shared" | "list" | "available";
export type TaskViewMode = "list" | "feed" | "card";
export type TaskSortMode =
  | "name-asc"
  | "name-desc"
  | "duration-asc"
  | "duration-desc"
  | "people-asc"
  | "people-desc";

export type TaskUiPreferences = {
  mode: TaskMode;
  viewMode: TaskViewMode;
  sortMode: TaskSortMode;
};

export const TASK_SORT_OPTIONS: { value: TaskSortMode; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "duration-asc", label: "Duration ↑" },
  { value: "duration-desc", label: "Duration ↓" },
  { value: "people-asc", label: "People ↑" },
  { value: "people-desc", label: "People ↓" },
];

const TASK_UI_STORAGE_PREFIX = "friendchise.tasks.ui";
const DEFAULT_PREFERENCES: TaskUiPreferences = {
  mode: "shared",
  viewMode: "feed",
  sortMode: "name-asc",
};

function normalizePreferences(value: unknown): TaskUiPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const candidate = value as Partial<TaskUiPreferences>;

  return {
    mode: candidate.mode === "list" || candidate.mode === "available" ? candidate.mode : "shared",
    viewMode: candidate.viewMode === "list" || candidate.viewMode === "card" ? candidate.viewMode : "feed",
    sortMode:
      candidate.sortMode === "name-desc" ||
      candidate.sortMode === "duration-asc" ||
      candidate.sortMode === "duration-desc" ||
      candidate.sortMode === "people-asc" ||
      candidate.sortMode === "people-desc"
        ? candidate.sortMode
        : "name-asc",
  };
}

export function useTaskUiPreferences(orgId?: string) {
  const storageKey = orgId ? `${TASK_UI_STORAGE_PREFIX}.${orgId}` : null;
  const [preferences, setPreferences] = useState<TaskUiPreferences>(DEFAULT_PREFERENCES);
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
      .then((raw) => {
        if (cancelled) {
          return;
        }

        setPreferences(raw ? normalizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES);
        setHydratedStorageKey(storageKey);
      })
      .catch(() => {
        if (!cancelled) {
          setPreferences(DEFAULT_PREFERENCES);
          setHydratedStorageKey(storageKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !isHydrated) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(preferences)).catch(() => {
      // Ignore persistence failures. The screen should still work.
    });
  }, [isHydrated, preferences, storageKey]);

  const setMode = useCallback((mode: TaskMode) => {
    setPreferences((current) => (current.mode === mode ? current : { ...current, mode }));
  }, []);

  const setViewMode = useCallback((viewMode: TaskViewMode) => {
    setPreferences((current) =>
      current.viewMode === viewMode ? current : { ...current, viewMode },
    );
  }, []);

  const setSortMode = useCallback((sortMode: TaskSortMode) => {
    setPreferences((current) =>
      current.sortMode === sortMode ? current : { ...current, sortMode },
    );
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences((current) =>
      current.mode === DEFAULT_PREFERENCES.mode &&
      current.viewMode === DEFAULT_PREFERENCES.viewMode &&
      current.sortMode === DEFAULT_PREFERENCES.sortMode
        ? current
        : DEFAULT_PREFERENCES,
    );
  }, []);

  return {
    isHydrated,
    preferences,
    setMode,
    setViewMode,
    setSortMode,
    resetPreferences,
  };
}
