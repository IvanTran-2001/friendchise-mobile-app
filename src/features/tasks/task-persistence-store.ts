import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type TaskMode,
  type TaskSortMode,
  type TaskUiPreferences,
  type TaskViewMode,
} from "./task-types";

export const DEFAULT_TASK_SEARCH = "";
export const DEFAULT_TASK_UI_PREFERENCES: TaskUiPreferences = {
  mode: "shared",
  viewMode: "feed",
  sortMode: "name-asc",
};

const TASK_PERSISTENCE_STORAGE_KEY = "friendchise.tasks.persistence";
const LEGACY_TASK_UI_STORAGE_PREFIX = "friendchise.tasks.ui";
const LEGACY_TASK_SEARCH_STORAGE_PREFIX = "friendchise.tasks.search";

type TaskPersistenceSnapshot = {
  preferencesByOrg: Record<string, TaskUiPreferences>;
  searchByOrg: Record<string, string>;
};

type LegacySnapshot = {
  snapshot: TaskPersistenceSnapshot;
  legacyKeys: string[];
};

type TaskPersistenceState = TaskPersistenceSnapshot & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (orgId: string, mode: TaskMode) => void;
  setViewMode: (orgId: string, viewMode: TaskViewMode) => void;
  setSortMode: (orgId: string, sortMode: TaskSortMode) => void;
  resetPreferences: (orgId: string) => void;
  setSearch: (orgId: string, search: string) => void;
  clearSearch: (orgId: string) => void;
};

export const selectPreferences = (orgId?: string) => (state: TaskPersistenceState) =>
  orgId ? state.preferencesByOrg[orgId] ?? DEFAULT_TASK_UI_PREFERENCES : DEFAULT_TASK_UI_PREFERENCES;

export const selectSearch = (orgId?: string) => (state: TaskPersistenceState) =>
  orgId ? state.searchByOrg[orgId] ?? DEFAULT_TASK_SEARCH : DEFAULT_TASK_SEARCH;

function normalizePreferences(value: unknown): TaskUiPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_TASK_UI_PREFERENCES;
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

function updatePreferences(
  current: Record<string, TaskUiPreferences>,
  orgId: string,
  update: (value: TaskUiPreferences) => TaskUiPreferences,
) {
  const nextValue = update(current[orgId] ?? DEFAULT_TASK_UI_PREFERENCES);

  if (current[orgId] === nextValue) {
    return current;
  }

  return {
    ...current,
    [orgId]: nextValue,
  };
}

let pendingLegacyKeysToRemove: string[] | null = null;

function readLegacySnapshot(): Promise<LegacySnapshot | null> {
  return AsyncStorage.getAllKeys()
    .then((keys) => {
      const legacyKeys = keys.filter(
        (key) =>
          key.startsWith(`${LEGACY_TASK_UI_STORAGE_PREFIX}.`) ||
          key.startsWith(`${LEGACY_TASK_SEARCH_STORAGE_PREFIX}.`),
      );

      if (legacyKeys.length === 0) {
        return null;
      }

      return AsyncStorage.multiGet(legacyKeys).then((entries) => {
        const preferencesByOrg: Record<string, TaskUiPreferences> = {};
        const searchByOrg: Record<string, string> = {};

        for (const [key, rawValue] of entries) {
          if (!rawValue) {
            continue;
          }

          if (key?.startsWith(`${LEGACY_TASK_UI_STORAGE_PREFIX}.`)) {
            const orgId = key.slice(LEGACY_TASK_UI_STORAGE_PREFIX.length + 1);

            try {
              preferencesByOrg[orgId] = normalizePreferences(JSON.parse(rawValue));
            } catch {
              preferencesByOrg[orgId] = DEFAULT_TASK_UI_PREFERENCES;
            }

            continue;
          }

          if (key?.startsWith(`${LEGACY_TASK_SEARCH_STORAGE_PREFIX}.`)) {
            const orgId = key.slice(LEGACY_TASK_SEARCH_STORAGE_PREFIX.length + 1);
            searchByOrg[orgId] = rawValue;
          }
        }

        if (Object.keys(preferencesByOrg).length === 0 && Object.keys(searchByOrg).length === 0) {
          return null;
        }

        return {
          legacyKeys,
          snapshot: {
            preferencesByOrg,
            searchByOrg,
          },
        };
      });
    })
    .catch(() => null);
}

const taskPersistenceStorage = {
  getItem: async (name: string) => {
    const storedValue = await AsyncStorage.getItem(name);

    if (storedValue != null) {
      return storedValue;
    }

    if (name !== TASK_PERSISTENCE_STORAGE_KEY) {
      return null;
    }

    const legacySnapshot = await readLegacySnapshot();

    if (!legacySnapshot) {
      return null;
    }

    pendingLegacyKeysToRemove = legacySnapshot.legacyKeys;

    return JSON.stringify({
      state: legacySnapshot.snapshot,
      version: 0,
    });
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);

    if (name !== TASK_PERSISTENCE_STORAGE_KEY || !pendingLegacyKeysToRemove?.length) {
      return;
    }

    const legacyKeysToRemove = pendingLegacyKeysToRemove;
    pendingLegacyKeysToRemove = null;

    await AsyncStorage.multiRemove(legacyKeysToRemove).catch(() => {
      // Ignore cleanup failures. The new storage key is already written.
    });
  },
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const useTaskPersistenceStore = create<TaskPersistenceState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      preferencesByOrg: {},
      searchByOrg: {},
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (orgId, mode) =>
        set((state) => ({
          preferencesByOrg: updatePreferences(state.preferencesByOrg, orgId, (current) =>
            current.mode === mode ? current : { ...current, mode },
          ),
        })),
      setViewMode: (orgId, viewMode) =>
        set((state) => ({
          preferencesByOrg: updatePreferences(state.preferencesByOrg, orgId, (current) =>
            current.viewMode === viewMode ? current : { ...current, viewMode },
          ),
        })),
      setSortMode: (orgId, sortMode) =>
        set((state) => ({
          preferencesByOrg: updatePreferences(state.preferencesByOrg, orgId, (current) =>
            current.sortMode === sortMode ? current : { ...current, sortMode },
          ),
        })),
      resetPreferences: (orgId) =>
        set((state) => ({
          preferencesByOrg: updatePreferences(state.preferencesByOrg, orgId, () => DEFAULT_TASK_UI_PREFERENCES),
        })),
      setSearch: (orgId, search) =>
        set((state) => ({
          searchByOrg: {
            ...state.searchByOrg,
            [orgId]: search,
          },
        })),
      clearSearch: (orgId) =>
        set((state) => ({
          searchByOrg: {
            ...state.searchByOrg,
            [orgId]: DEFAULT_TASK_SEARCH,
          },
        })),
    }),
    {
      name: TASK_PERSISTENCE_STORAGE_KEY,
      storage: createJSONStorage(() => taskPersistenceStorage),
      partialize: (state) => ({
        preferencesByOrg: state.preferencesByOrg,
        searchByOrg: state.searchByOrg,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.setHasHydrated(true);
        }

        if (!state || error) {
          useTaskPersistenceStore.setState({ hasHydrated: true });
        }
      },
    },
  ),
);