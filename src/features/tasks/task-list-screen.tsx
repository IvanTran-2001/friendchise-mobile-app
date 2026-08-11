import { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTasks } from "./task-api";
import { colors, radius, shadows, spacing } from "../../lib/theme";
import { useNavbarSetters } from "../../../components/layout/navbar-context";
import { TaskNavbarActions } from "./components/task-navbar-actions";
import { TaskListView } from "./components/task-list-view";
import { CollapsibleSearchDock } from "../../../components/ui/collapsible-search-dock";
import { DEFAULT_TASK_UI_PREFERENCES } from "./task-persistence-store";
import { useTaskSearch, useTaskUiPreferences } from "./task-ui";
import { useDebouncedValue } from "../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../hooks/use-dismiss-keyboard-on-idle";

type TaskListScreenProps = {
  orgId?: string;
};

export function TaskListScreen({ orgId }: TaskListScreenProps) {
  const router = useRouter();
  const {
    isHydrated,
    preferences,
    setMode,
    setViewMode,
    setSortMode,
    resetPreferences,
  } = useTaskUiPreferences(orgId);
  const {
    isHydrated: isSearchHydrated,
    search,
    setSearch,
  } = useTaskSearch(orgId);
  const { setActions } = useNavbarSetters();

  const effectivePreferences = isHydrated ? preferences : DEFAULT_TASK_UI_PREFERENCES;
  const effectiveSearch = search;
  const debouncedSearch = useDebouncedValue(effectiveSearch, 150);
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "tasks",
      orgId ?? "current",
      effectivePreferences.mode,
      effectivePreferences.sortMode,
      debouncedSearch,
    ],
    queryFn: () =>
      getTasks(orgId, {
        mode: effectivePreferences.mode,
        sort: effectivePreferences.sortMode,
        search: debouncedSearch,
        limit: debouncedSearch.trim() ? 100 : undefined,
      }),
    enabled: isHydrated && isSearchHydrated,
    placeholderData: keepPreviousData,
  });

  const navbarActions = useMemo(
    () =>
      orgId ? (
        <TaskNavbarActions
          orgId={orgId}
          mode={effectivePreferences.mode}
          viewMode={effectivePreferences.viewMode}
          sortMode={effectivePreferences.sortMode}
          onModeChange={setMode}
          onViewModeChange={setViewMode}
          onSortModeChange={setSortMode}
          onResetPreferences={resetPreferences}
          onAddTaskPress={() => router.push({ pathname: "/(app)/orgs/[orgId]/tasks/new", params: { orgId } })}
        />
      ) : null,
    [
      effectivePreferences.mode,
      effectivePreferences.sortMode,
      effectivePreferences.viewMode,
      resetPreferences,
      orgId,
      setMode,
      setSortMode,
      setViewMode,
      router,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      setActions?.(navbarActions);

      return () => {
        setActions?.(null);
      };
    }, [navbarActions, setActions]),
  );

  useDismissKeyboardOnIdle(effectiveSearch, 1000, { enabled: isSearchHydrated });

  const hasActiveFilters =
    effectiveSearch.trim().length > 0 ||
    effectivePreferences.mode !== "shared" ||
    effectivePreferences.sortMode !== "name-asc";

  return (
    <CollapsibleSearchDock
      search={effectiveSearch}
      onChangeSearch={setSearch}
      placeholder="Search tasks"
      disabled={!isSearchHydrated}
      containerStyle={styles.container}
      searchShellStyle={styles.searchShell}
    >
      {({ onScroll }) => (
        <TaskListView
          orgId={orgId}
          tasks={data ?? []}
            isLoading={isLoading || !isHydrated || !isSearchHydrated}
          error={error}
          search={effectiveSearch}
          viewMode={effectivePreferences.viewMode}
          hasActiveFilters={hasActiveFilters}
          onScroll={onScroll}
        />
      )}
    </CollapsibleSearchDock>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  searchShell: {
    borderRadius: radius.lg,
    ...shadows.xs,
  },
});