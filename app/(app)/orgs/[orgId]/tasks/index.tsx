import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  View,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../../src/features/tasks/task-api";
import { colors, radius, shadows, spacing } from "../../../../../src/lib/theme";
import { useNavbarSetters } from "../../../../../components/layout/navbar-context";
import { TaskNavbarActions } from "../../../../../src/features/tasks/components/task-navbar-actions";
import { TaskListView } from "../../../../../src/features/tasks/components/task-list-view";
import { SearchField } from "../../../../../components/ui/search-field";
import { DEFAULT_TASK_UI_PREFERENCES } from "../../../../../src/features/tasks/task-persistence-store";
import {
  type TaskUiPreferences,
  useTaskSearch,
  useTaskUiPreferences,
} from "../../../../../src/features/tasks/task-ui";

function TaskNavContent() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;
  const [searchTranslateY] = useState(() => new Animated.Value(0));
  const [searchOpacity] = useState(() => new Animated.Value(1));
  const lastScrollY = useRef(0);
  const searchVisible = useRef(true);
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", resolvedOrgId ?? "current", effectivePreferences.mode, effectivePreferences.sortMode],
    queryFn: () =>
      getTasks(resolvedOrgId, {
        mode: effectivePreferences.mode,
        sort: effectivePreferences.sortMode,
      }),
  });

  const filteredTasks = useMemo(
    () => (data ?? []).filter((task) => {
      const query = effectiveSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        task.name.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false)
      );
    }),
    [data, effectiveSearch],
  );

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

  const hasActiveFilters =
    effectiveSearch.trim().length > 0 ||
    effectivePreferences.mode !== "shared" ||
    effectivePreferences.viewMode !== "feed" ||
    effectivePreferences.sortMode !== "name-asc";

  const showSearchBar = () => {
    if (searchVisible.current) {
      return;
    }

    searchVisible.current = true;
    Animated.parallel([
      Animated.timing(searchTranslateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSearchBar = () => {
    if (!searchVisible.current) {
      return;
    }

    searchVisible.current = false;
    Animated.parallel([
      Animated.timing(searchTranslateY, {
        toValue: -64,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(searchOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const deltaY = currentY - lastScrollY.current;

    if (currentY <= 8) {
      showSearchBar();
    } else if (deltaY > 8) {
      hideSearchBar();
    } else if (deltaY < -8) {
      showSearchBar();
    }

    lastScrollY.current = currentY;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchDock} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.searchShell,
            {
              transform: [{ translateY: searchTranslateY }],
              opacity: searchOpacity,
            },
          ]}
        >
          <SearchField
            value={effectiveSearch}
            onChangeText={setSearch}
            placeholder="Search tasks"
            disabled={!isSearchHydrated}
          />
        </Animated.View>
      </View>

      <TaskListView
        orgId={resolvedOrgId}
        tasks={filteredTasks}
        isLoading={isLoading}
        error={error}
        search={effectiveSearch}
        viewMode={effectivePreferences.viewMode}
        hasActiveFilters={hasActiveFilters}
        onScroll={handleScroll}
      />
    </View>
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