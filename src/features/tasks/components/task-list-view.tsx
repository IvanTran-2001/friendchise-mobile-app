import { FlatList, Image, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { ListChecks } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { TaskItem } from "../task-api";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../../components/ui/state-views";
import { Text } from "../../../../components/ui/text";
import { colors, radius, spacing } from "../../../lib/theme";
import { type TaskViewMode } from "../task-ui";
import { TaskRichText } from "./task-rich-text";

type TaskListViewProps = {
  orgId?: string;
  tasks: TaskItem[];
  isLoading: boolean;
  error: unknown;
  search: string;
  viewMode: TaskViewMode;
  hasActiveFilters: boolean;
  header?: React.ReactElement | null;
  footer?: React.ReactElement | null;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onEndReached?: () => void;
};

export function TaskListView({
  orgId,
  tasks,
  isLoading,
  error,
  search,
  viewMode,
  hasActiveFilters,
  header,
  footer,
  onScroll,
  onEndReached,
}: TaskListViewProps) {
  const router = useRouter();

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={onScroll}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={header ?? null}
      ListFooterComponent={footer ?? null}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            if (!orgId) return;
            router.push(`/orgs/${orgId}/tasks/${item.id}`);
          }}
          style={({ pressed }) => [styles.cardPressable, pressed ? styles.cardPressed : null]}
        >
          <Card
            padding={viewMode === "feed" ? "lg" : "md"}
            style={viewMode === "feed" ? styles.feedCard : viewMode === "card" ? styles.cardModeCard : null}
          >
            {viewMode === "feed" ? (
              <View>
              <View style={styles.feedMediaWrap}>
                {item.imageSignedUrl ? (
                  <Image source={{ uri: item.imageSignedUrl }} style={styles.feedImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.feedImageFallback, { backgroundColor: `${item.color}18` }]}>
                    <View style={[styles.feedColorMark, { backgroundColor: item.color }]} accessibilityLabel="Task color tag" />
                  </View>
                )}

                <View style={styles.feedMediaOverlay} />
                <View style={styles.feedMediaHeader}>
                  <View style={styles.feedMediaTitleBlock}>
                    <Text variant="captionStrong" tone="inverse" style={styles.feedKicker}>
                      Task feed
                    </Text>
                    <Text variant="title3" tone="inverse" numberOfLines={2} style={styles.feedTitle}>
                      {item.name}
                    </Text>
                  </View>
                  <Badge
                    label={item._available ? "Shared" : "Mine"}
                    tone={item._available ? "accent" : "neutral"}
                    dotted
                  />
                </View>
              </View>

              <View style={styles.feedMetaRow}>
                <Badge label={`${item.durationMin} min`} tone="neutral" />
                <Badge label={`${item.minPeople}+ ppl`} tone="neutral" />
              </View>

              <View style={styles.feedDescription}>
                {item.description ? (
                  <TaskRichText source={item.description} orgId={item.orgId} />
                ) : (
                  <Text variant="body" tone="secondary">
                    {item.durationMin} min · {item.minPeople}+ people
                  </Text>
                )}
              </View>
              </View>
            ) : viewMode === "card" ? (
              <View style={styles.cardMode}>
                <View style={styles.cardModeHeader}>
                  <View style={[styles.colorTag, { backgroundColor: item.color }]} accessibilityLabel="Task color tag" />
                  <Badge label={item._available ? "Shared" : "My Tasks"} tone={item._available ? "accent" : "neutral"} />
                </View>
                <Text variant="bodyStrong" numberOfLines={2} style={styles.cardModeTitle}>
                  {item.name}
                </Text>
                {item.description ? (
                  <View style={styles.cardModeDescription}>
                    <TaskRichText source={item.description} orgId={item.orgId} />
                  </View>
                ) : null}
                <View style={styles.cardModeMetaRow}>
                  <Badge label={`${item.durationMin} min`} tone="neutral" />
                  <Badge label={`${item.minPeople}+ ppl`} tone="neutral" />
                </View>
              </View>
            ) : (
              <View style={styles.cardTopRow}>
                <View style={[styles.colorTag, { backgroundColor: item.color }]} accessibilityLabel="Task color tag" />
                <Text variant="bodyStrong" numberOfLines={2} style={styles.cardTitle}>
                  {item.name}
                </Text>
                <Badge label={item._available ? "Shared" : "My Tasks"} tone={item._available ? "accent" : "neutral"} />
              </View>
            )}
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        isLoading ? (
          <LoadingState message="Loading tasks..." />
        ) : error ? (
          <ErrorState title="Failed to load tasks" />
        ) : (
          <EmptyState
            icon={<ListChecks size={24} strokeWidth={2} color={colors.textTertiary} />}
            title={search.trim() || hasActiveFilters ? "No matching tasks" : "No tasks yet"}
            message={
              search.trim() || hasActiveFilters
                ? "Try clearing search, view, or color filters."
                : "Tasks created for this organization will show up here."
            }
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingTop: 72,
    paddingBottom: spacing.xl,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  feedCard: {
    paddingBottom: spacing.lg,
  },
  feedMediaWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.xl,
    minHeight: 180,
    backgroundColor: colors.surfaceMuted,
  },
  feedImage: {
    width: "100%",
    height: 220,
  },
  feedImageFallback: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  feedColorMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedMediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  feedMediaHeader: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  feedMediaTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  feedKicker: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  feedTitle: {
    marginTop: spacing.xs,
  },
  feedMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  feedDescription: {
    marginTop: spacing.md,
  },
  cardModeCard: {
    borderColor: colors.borderStrong,
  },
  cardMode: {
    gap: spacing.md,
  },
  cardModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardModeTitle: {
    lineHeight: 24,
  },
  cardModeDescription: {
    paddingTop: spacing.xs,
  },
  cardModeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cardPressable: {
    borderRadius: radius.lg,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  colorTag: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    flex: 1,
  },
});