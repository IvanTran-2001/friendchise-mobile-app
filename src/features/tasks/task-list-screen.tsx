import { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
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
import { Text } from "../../../components/ui/text";

type TaskListScreenProps = {
  orgId?: string;
};

const TASK_PAGE_SIZE = 100;

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
  const isFocused = useIsFocused();

  const effectivePreferences = isHydrated ? preferences : DEFAULT_TASK_UI_PREFERENCES;
  const effectiveSearch = search;
  const debouncedSearch = useDebouncedValue(effectiveSearch, 150);
  const isSearchSettled = debouncedSearch === effectiveSearch;
  const isSearching = debouncedSearch.trim().length > 0;
  const tasksQuery = useInfiniteQuery({
    queryKey: [
      "tasks",
      orgId ?? "current",
      effectivePreferences.mode,
      effectivePreferences.sortMode,
      debouncedSearch,
    ],
    queryFn: ({ pageParam = null }) =>
      getTasks(orgId, {
        mode: effectivePreferences.mode,
        sort: effectivePreferences.sortMode,
        search: debouncedSearch,
        limit: TASK_PAGE_SIZE,
        cursor: pageParam,
      }),
    enabled: isHydrated && isSearchHydrated && isSearchSettled,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (isSearching ? undefined : lastPage.nextCursor),
  });

  const tasks = useMemo(() => tasksQuery.data?.pages.flatMap((page) => page.tasks) ?? [], [tasksQuery.data]);
  const isTasksLoading = tasksQuery.isLoading || !isHydrated || !isSearchHydrated || (!isSearchSettled && !tasksQuery.data);

  const hasMoreMatches = isSearching && !!tasksQuery.data?.pages[0]?.nextCursor;
  const hasMoreTasks = !isSearching && tasksQuery.hasNextPage;
  const footer = hasMoreMatches ? (
    <TaskListFooter message={`Showing the first ${TASK_PAGE_SIZE} matches. Narrow your search to see more results.`} />
  ) : null;
  const handleEndReached = useCallback(() => {
    if (!hasMoreTasks || tasksQuery.isFetchingNextPage) {
      return;
    }

    void tasksQuery.fetchNextPage();
  }, [hasMoreTasks, tasksQuery]);

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

  useDismissKeyboardOnIdle(effectiveSearch, 1000, { enabled: isSearchHydrated && isFocused });

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
          tasks={tasks}
          isLoading={isTasksLoading}
          error={tasksQuery.error}
          search={effectiveSearch}
          viewMode={effectivePreferences.viewMode}
          hasActiveFilters={hasActiveFilters}
          footer={footer}
          onScroll={onScroll}
          onEndReached={handleEndReached}
        />
      )}
    </CollapsibleSearchDock>
  );
}

function TaskListFooter({ message }: { message: string }) {
  return (
    <Text variant="caption" tone="secondary" style={styles.footer}>
      {message}
    </Text>
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
  footer: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    textAlign: "center",
  },
});