import { useCallback, useState } from "react";
import { DEFAULT_TASK_SEARCH, DEFAULT_TASK_UI_PREFERENCES, useTaskPersistenceStore } from "./task-persistence-store";
import type { TaskMode, TaskSortMode, TaskUiPreferences, TaskViewMode } from "./task-types";

export type { TaskMode, TaskSortMode, TaskUiPreferences, TaskViewMode } from "./task-types";

export const TASK_SORT_OPTIONS: { value: TaskSortMode; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "duration-asc", label: "Duration ↑" },
  { value: "duration-desc", label: "Duration ↓" },
  { value: "people-asc", label: "People ↑" },
  { value: "people-desc", label: "People ↓" },
];

export function useTaskUiPreferences(orgId?: string) {
  const [localPreferences, setLocalPreferences] = useState<TaskUiPreferences>(DEFAULT_TASK_UI_PREFERENCES);
  const hasHydrated = useTaskPersistenceStore((state) => state.hasHydrated);
  const persistedPreferences = useTaskPersistenceStore((state) => state.getPreferences(orgId));
  const preferences = orgId ? persistedPreferences : localPreferences;
  const isHydrated = orgId ? hasHydrated : true;

  const setMode = useCallback((mode: TaskMode) => {
    if (!orgId) {
      setLocalPreferences((current) => (current.mode === mode ? current : { ...current, mode }));
      return;
    }

    useTaskPersistenceStore.getState().setMode(orgId, mode);
  }, [orgId]);

  const setViewMode = useCallback((viewMode: TaskViewMode) => {
    if (!orgId) {
      setLocalPreferences((current) =>
        current.viewMode === viewMode ? current : { ...current, viewMode },
      );
      return;
    }

    useTaskPersistenceStore.getState().setViewMode(orgId, viewMode);
  }, [orgId]);

  const setSortMode = useCallback((sortMode: TaskSortMode) => {
    if (!orgId) {
      setLocalPreferences((current) =>
        current.sortMode === sortMode ? current : { ...current, sortMode },
      );
      return;
    }

    useTaskPersistenceStore.getState().setSortMode(orgId, sortMode);
  }, [orgId]);

  const resetPreferences = useCallback(() => {
    if (!orgId) {
      setLocalPreferences((current) =>
        current.mode === DEFAULT_TASK_UI_PREFERENCES.mode &&
        current.viewMode === DEFAULT_TASK_UI_PREFERENCES.viewMode &&
        current.sortMode === DEFAULT_TASK_UI_PREFERENCES.sortMode
          ? current
          : DEFAULT_TASK_UI_PREFERENCES,
      );
      return;
    }

    useTaskPersistenceStore.getState().resetPreferences(orgId);
  }, [orgId]);

  return {
    isHydrated,
    preferences,
    setMode,
    setViewMode,
    setSortMode,
    resetPreferences,
  };
}

export function useTaskSearch(orgId?: string) {
  const [localSearch, setLocalSearch] = useState(DEFAULT_TASK_SEARCH);
  const hasHydrated = useTaskPersistenceStore((state) => state.hasHydrated);
  const persistedSearch = useTaskPersistenceStore((state) => state.getSearch(orgId));
  const search = orgId ? persistedSearch : localSearch;
  const isHydrated = orgId ? hasHydrated : true;

  const clearSearch = useCallback(() => {
    if (!orgId) {
      setLocalSearch(DEFAULT_TASK_SEARCH);
      return;
    }

    useTaskPersistenceStore.getState().clearSearch(orgId);
  }, [orgId]);

  const setSearch = useCallback((value: string) => {
    if (!orgId) {
      setLocalSearch(value);
      return;
    }

    useTaskPersistenceStore.getState().setSearch(orgId, value);
  }, [orgId]);

  return {
    isHydrated,
    search,
    setSearch,
    clearSearch,
  };
}
