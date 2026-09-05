import { Image, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Lock, RefreshCw, Users, Clock, AlarmClock } from "lucide-react-native";
import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { Button } from "../../../../../../components/ui/button";
import { Card } from "../../../../../../components/ui/card";
import { ErrorState, LoadingState } from "../../../../../../components/ui/state-views";
import { Screen } from "../../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../../components/ui/screen-header";
import { Badge } from "../../../../../../components/ui/badge";
import { Text } from "../../../../../../components/ui/text";
import { TaskRichText } from "../../../../../../src/features/tasks/components/task-rich-text";
import { getTaskById } from "../../../../../../src/features/tasks/task-api";
import { colors, radius, spacing } from "../../../../../../src/lib/theme";

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function formatTime(min: number): string {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  const period = hours < 12 ? "am" : "pm";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function TaskDetailRoute() {
  const router = useRouter();
  const orgId = useOrgIdParam();
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;

  const taskQuery = useQuery({
    queryKey: ["task", orgId, taskId],
    queryFn: () => getTaskById(orgId ?? "", taskId ?? ""),
    enabled: !!orgId && !!taskId,
  });

  if (taskQuery.isLoading) {
    return <LoadingState message="Loading task details..." />;
  }

  if (!orgId || !taskId || taskQuery.error || !taskQuery.data) {
    return <ErrorState title="Failed to load task" message="Please go back and try again." />;
  }

  const task = taskQuery.data;
  const imageUrl = task.imageSignedUrl ?? task.imageUrl ?? null;
  const sharedBy = task.scope === "GLOBAL" ? task.organization?.name ?? null : null;

  return (
    <Screen scroll keyboardAvoiding contentStyle={styles.screen}>
      <ScreenHeader kicker="Tasks" title={task.name} subtitle={sharedBy ? `Shared from ${sharedBy}` : "Task details"} />

      <View style={styles.actionsRow}>
        <Button label="Back" variant="secondary" leftIcon={<ArrowLeft size={16} color={colors.textPrimary} />} onPress={() => router.back()} />
        <Button
          label="Edit"
          leftIcon={<Edit3 size={16} color={colors.textInverse} />}
          onPress={() =>
            router.push({
              pathname: "/(app)/orgs/[orgId]/tasks/edit",
              params: { orgId, taskId },
            })
          }
        />
      </View>

      <Card padding="lg" style={styles.heroCard}>
        <View style={styles.heroAccent} />
        <View style={styles.heroBody}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImageFallback, { backgroundColor: `${task.color}18` }]}>
              <Text variant="title" style={[styles.heroLetter, { color: task.color }]}>
                {task.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.heroMeta}>
            <View style={styles.badgeRow}>
              <Badge label={task.scope === "GLOBAL" ? "Global" : "Org"} tone={task.scope === "GLOBAL" ? "accent" : "neutral"} />
              <Badge label={`${task.durationMin} min`} tone="neutral" />
              <Badge label={`${task.minPeople}+ ppl`} tone="neutral" />
            </View>

            <View style={styles.detailGrid}>
              <DetailRow icon={<Clock size={16} color={colors.textTertiary} />} label="Duration" value={formatDuration(task.durationMin)} />
              <DetailRow icon={<Users size={16} color={colors.textTertiary} />} label="People" value={String(task.minPeople)} />
              {task.preferredStartTimeMin != null ? (
                <DetailRow icon={<AlarmClock size={16} color={colors.textTertiary} />} label="Start time" value={formatTime(task.preferredStartTimeMin)} />
              ) : null}
              {(task.minWaitDays != null || task.maxWaitDays != null) ? (
                <DetailRow
                  icon={<RefreshCw size={16} color={colors.textTertiary} />}
                  label="Wait days"
                  value={
                    task.minWaitDays != null && task.maxWaitDays != null
                      ? `${task.minWaitDays}–${task.maxWaitDays} days`
                      : task.minWaitDays != null
                        ? `Min ${task.minWaitDays} days`
                        : `Max ${task.maxWaitDays} days`
                  }
                />
              ) : null}
            </View>
          </View>
        </View>
      </Card>

      {task.description ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="label" tone="secondary" style={styles.sectionLabel}>
            Description
          </Text>
          <TaskRichText source={task.description} orgId={orgId} />
        </Card>
      ) : null}

      {task.tags.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="label" tone="secondary" style={styles.sectionLabel}>
            Tags
          </Text>
          <View style={styles.pillRow}>
            {task.tags.map((entry) => (
              <Badge key={entry.tag.id} label={entry.tag.name} tone="neutral" />
            ))}
          </View>
        </Card>
      ) : null}

      {task.eligibility.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="label" tone="secondary" style={styles.sectionLabel}>
            Eligibility
          </Text>
          <View style={styles.pillRow}>
            {task.eligibility.map((entry) => (
              <Badge key={entry.role.id} label={entry.role.name} tone="neutral" />
            ))}
          </View>
        </Card>
      ) : null}

      {task.taskToolLinks.length > 0 ? (
        <Card padding="lg" style={styles.sectionCard}>
          <Text variant="label" tone="secondary" style={styles.sectionLabel}>
            Tools
          </Text>
          <View style={styles.toolList}>
            {task.taskToolLinks.map((link) => (
              <View key={link.toolPath} style={styles.toolItem}>
                <Lock size={14} color={colors.textTertiary} />
                <Text variant="bodyStrong" numberOfLines={1} style={styles.toolText}>
                  {link.toolLabel ?? link.toolPath}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <View style={styles.detailText}>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroCard: {
    overflow: "hidden",
  },
  heroAccent: {
    height: 4,
    backgroundColor: colors.accent,
  },
  heroBody: {
    gap: spacing.lg,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
  },
  heroImageFallback: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLetter: {
    fontSize: 44,
    fontWeight: "800",
  },
  heroMeta: {
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  detailGrid: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  toolList: {
    gap: spacing.sm,
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  toolText: {
    flex: 1,
  },
});
