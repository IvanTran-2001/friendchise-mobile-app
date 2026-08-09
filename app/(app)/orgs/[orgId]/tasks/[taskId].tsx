import { useMemo, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { ArrowLeft, CalendarDays, Clock3, MapPinned, Users } from "lucide-react-native";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { LoadingState, ErrorState } from "../../../../../components/ui/state-views";
import { Text } from "../../../../../components/ui/text";
import { colors, radius, spacing } from "../../../../../src/lib/theme";
import { getTaskById, type TaskDetailItem } from "../../../../../src/features/tasks/task-api";
import { TaskRichText } from "../../../../../src/features/tasks/components/task-rich-text";

function formatDuration(min: number): string {
  if (min < 60) {
    return `${min} min`;
  }

  const hours = Math.floor(min / 60);
  const remaining = min % 60;
  return remaining > 0 ? `${hours} h ${remaining} min` : `${hours} h`;
}

function formatStartTime(min: number | null | undefined) {
  if (min == null) return null;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  const period = hours < 12 ? "am" : "pm";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function TaskOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orgId?: string | string[]; taskId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;

  const query = useQuery({
    queryKey: ["task", orgId, taskId],
    queryFn: () => getTaskById(orgId ?? "", taskId ?? ""),
    enabled: !!orgId && !!taskId,
  });

  const task = query.data as TaskDetailItem | undefined;
  const startTime = useMemo(() => formatStartTime(task?.preferredStartTimeMin), [task?.preferredStartTimeMin]);

  if (query.isLoading) {
    return <LoadingState message="Loading task overview..." />;
  }

  if (query.error || !task) {
    return <ErrorState title="Failed to load task" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} leftIcon={<ArrowLeft size={16} color={colors.textPrimary} />} />
        <Badge label={task._available ? "Shared" : "Mine"} tone={task._available ? "accent" : "neutral"} dotted />
      </View>

      <Card padding="none" style={styles.heroCard}>
        {task.imageSignedUrl ? (
          <View style={styles.heroImageWrap}>
            <Image source={{ uri: task.imageSignedUrl }} accessibilityLabel={task.name} style={styles.heroImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.heroFallback, { backgroundColor: `${task.color}18` }]}>
            <View style={[styles.heroMark, { backgroundColor: task.color }]} />
          </View>
        )}

        <View style={styles.heroBody}>
          <Text variant="title1" style={styles.title}>
            {task.name}
          </Text>
          <View style={styles.metaRow}>
            <Badge label={formatDuration(task.durationMin)} tone="neutral" />
            <Badge label={`${task.minPeople}+ ppl`} tone="neutral" />
            {startTime ? <Badge label={startTime} tone="neutral" /> : null}
          </View>
          <View style={styles.infoGrid}>
            <InfoRow icon={<Clock3 size={16} color={colors.textSecondary} />} label="Duration" value={formatDuration(task.durationMin)} />
            <InfoRow icon={<Users size={16} color={colors.textSecondary} />} label="People" value={`${task.minPeople}+`} />
            <InfoRow icon={<CalendarDays size={16} color={colors.textSecondary} />} label="Created" value={new Date(task.createdAt).toLocaleDateString()} />
            {task.organization ? (
              <InfoRow icon={<MapPinned size={16} color={colors.textSecondary} />} label="Organization" value={task.organization.name} />
            ) : null}
          </View>
        </View>
      </Card>

      {task.description ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="captionStrong" tone="secondary" style={styles.sectionLabel}>
            Description
          </Text>
          <TaskRichText source={task.description} orgId={orgId} />
        </Card>
      ) : null}

      {task.eligibility.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="captionStrong" tone="secondary" style={styles.sectionLabel}>
            Roles
          </Text>
          <View style={styles.tagRow}>
            {task.eligibility.map((entry) => (
              <Badge
                key={entry.role.id}
                label={entry.role.name}
                tone="neutral"
                dotColor={entry.role.color ?? colors.textSecondary}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {task.tags.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="captionStrong" tone="secondary" style={styles.sectionLabel}>
            Tags
          </Text>
          <View style={styles.tagRow}>
            {task.tags.map((entry) => (
              <Badge key={entry.tag.id} label={entry.tag.name} tone="neutral" dotColor={entry.tag.color} />
            ))}
          </View>
        </Card>
      ) : null}

      {task.comments.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="captionStrong" tone="secondary" style={styles.sectionLabel}>
            Pinned notes
          </Text>
          <View style={styles.commentStack}>
            {task.comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Text variant="bodyStrong">{comment.authorName}</Text>
                <Text variant="caption" tone="secondary">
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
                <TaskRichText source={comment.content} orgId={orgId} />
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <View style={styles.infoText}>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroCard: {
    overflow: "hidden",
  },
  heroImageWrap: {
    aspectRatio: 1.5,
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    aspectRatio: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
  },
  heroBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    minWidth: 0,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  commentStack: {
    gap: spacing.sm,
  },
  commentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
