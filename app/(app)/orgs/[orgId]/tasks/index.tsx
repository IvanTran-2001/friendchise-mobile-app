import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../../src/features/tasks/task-api";
import { colors, radius, shadows, spacing } from "../../../../../src/lib/theme";
import { useNavbarSetters } from "../../../../../components/layout/navbar-context";
import { TaskNavbarActions } from "../../../../../src/features/tasks/components/task-navbar-actions";
import { TaskListView } from "../../../../../src/features/tasks/components/task-list-view";
import { CollapsibleSearchDock } from "../../../../../components/ui/collapsible-search-dock";
import { DEFAULT_TASK_UI_PREFERENCES } from "../../../../../src/features/tasks/task-persistence-store";
import { useTaskSearch, useTaskUiPreferences } from "../../../../../src/features/tasks/task-ui";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../../../hooks/use-dismiss-keyboard-on-idle";

function TaskNavContent() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;
  const router = useRouter();
  const {
    isHydrated,
    preferences,
    setMode,
    setViewMode,
    setSortMode,
    resetPreferences,
  } = useTaskUiPreferences(resolvedOrgId);
  const {
    isHydrated: isSearchHydrated,
    search,
    setSearch,
  } = useTaskSearch(resolvedOrgId);
  const { setActions } = useNavbarSetters();

  const effectivePreferences = isHydrated ? preferences : DEFAULT_TASK_UI_PREFERENCES;
  const effectiveSearch = search;
  const debouncedSearch = useDebouncedValue(effectiveSearch, 150);
  const previousSearchRef = useRef(effectiveSearch);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "tasks",
      resolvedOrgId ?? "current",
      effectivePreferences.mode,
      effectivePreferences.sortMode,
      debouncedSearch,
    ],
    queryFn: () =>
      getTasks(resolvedOrgId, {
        mode: effectivePreferences.mode,
        sort: effectivePreferences.sortMode,
        search: debouncedSearch,
      }),
  });

  const navbarActions = useMemo(
    () =>
      resolvedOrgId ? (
        <TaskNavbarActions
          orgId={resolvedOrgId}
          mode={effectivePreferences.mode}
          viewMode={effectivePreferences.viewMode}
          sortMode={effectivePreferences.sortMode}
          onModeChange={setMode}
          onViewModeChange={setViewMode}
          onSortModeChange={setSortMode}
          onResetPreferences={resetPreferences}
          onAddTaskPress={() => router.push(`/(app)/orgs/${resolvedOrgId}/tasks/new`)}
        />
      ) : null,
    [
      effectivePreferences.mode,
      effectivePreferences.sortMode,
      effectivePreferences.viewMode,
      resetPreferences,
      resolvedOrgId,
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
    effectivePreferences.viewMode !== "feed" ||
    effectivePreferences.sortMode !== "name-asc";

  return (
    <CollapsibleSearchDock
      search={effectiveSearch}
      onChangeSearch={setSearch}
      placeholder="Search tasks"
      disabled={!isSearchHydrated}
      containerStyle={styles.container}
      searchDockStyle={styles.searchDock}
      searchShellStyle={styles.searchShell}
    >
      {({ onScroll }) => (
        <TaskListView
          orgId={resolvedOrgId}
          tasks={data ?? []}
          isLoading={isLoading}
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

export default function OrgTasksScreen() {
  return <TaskNavContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  searchDock: {
    position: "absolute",
    top: spacing.sm + 2,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    elevation: 3,
  },
  searchShell: {
    borderRadius: radius.lg,
    ...shadows.xs,
  },
});