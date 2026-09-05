import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../components/ui/state-views";
import { Screen } from "../../../components/ui/screen";
import { Text } from "../../../components/ui/text";
import { Avatar, getInitials } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { IconButton } from "../../../components/ui/icon-button";
import { colors, radius, spacing, shadows } from "../../../src/lib/theme";
import {
  fetchNotificationFeed,
  markAnnouncementSeen,
  markInviteSeen,
  markNotificationSeen,
  type NotificationFeedItem,
  type NotificationView,
} from "./notifications-api";
import { acceptMobileInvite, declineMobileInvite } from "../orgs/org-mode/shared/organization-api";

const PAGE_SIZE = 20;

type NotificationsParams = {
  page?: string | string[];
  view?: string | string[];
};

export function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<NotificationsParams>();
  const page = parsePositiveInt(params.page, 1);
  const view = parseView(params.view);

  const feedQuery = useQuery({
    queryKey: ["mobile-notifications", page, view],
    queryFn: () => fetchNotificationFeed(page, PAGE_SIZE, view),
  });

  const feed = feedQuery.data;
  const items = useMemo(() => sortFeedItems(feed?.items ?? []), [feed?.items]);
  const totalPages = feed?.totalPages ?? 1;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const invalidateFeed = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] });
  }, [queryClient]);

  const notificationSeenMutation = useMutation({
    mutationFn: markNotificationSeen,
    onSuccess: () => void invalidateFeed(),
  });

  const announcementSeenMutation = useMutation({
    mutationFn: markAnnouncementSeen,
    onSuccess: () => void invalidateFeed(),
  });

  const inviteSeenMutation = useMutation({
    mutationFn: markInviteSeen,
    onSuccess: () => void invalidateFeed(),
  });

  const inviteActionMutation = useMutation({
    mutationFn: async (input: { invite: Extract<NotificationFeedItem, { kind: "invite" }>; action: "accept" | "decline" }) => {
      if (input.action === "accept") {
        await acceptMobileInvite(input.invite.invite.id);
        return;
      }

      await declineMobileInvite(input.invite.invite.id);
    },
    onSuccess: () => void invalidateFeed(),
  });

  const goToPage = useCallback(
    (nextPage: number) => {
      router.replace(buildNotificationsRoute(nextPage, view));
    },
    [router, view],
  );

  const setView = useCallback(
    (nextView: NotificationView) => {
      router.replace(buildNotificationsRoute(1, nextView));
    },
    [router],
  );

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Text variant="title">Notifications</Text>
          <View style={styles.segmentedRow}>
            <SegmentButton label="All" active={view === "all"} onPress={() => setView("all")} />
            <SegmentButton label="Unseen" active={view === "unseen"} onPress={() => setView("unseen")} />
          </View>
        </View>

        <Card padding="none" style={styles.feedCard}>
          {feedQuery.isLoading ? (
            <View style={styles.stateWrap}>
              <LoadingState message="Loading notifications..." />
            </View>
          ) : feedQuery.error ? (
            <View style={styles.stateWrap}>
              <ErrorState
                title="Failed to load notifications"
                message="Check your connection and try again."
                onRetry={() => void feedQuery.refetch()}
              />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateWrap}>
              <EmptyState
                icon={<Bell size={24} strokeWidth={2.1} color={colors.textTertiary} />}
                title={view === "unseen" ? "No unseen notifications" : "No notifications"}
                message={
                  view === "unseen"
                    ? "Everything here has already been handled."
                    : "Updates, invites, and announcements will show up here."
                }
              />
            </View>
          ) : (
            <ScrollView style={styles.feedScroll} contentContainerStyle={styles.pageList} showsVerticalScrollIndicator={false}>
              {items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderFeedItem(item, {
                    onSeenNotification: (notificationId) => notificationSeenMutation.mutate(notificationId),
                    onSeenAnnouncement: (announcementId) => announcementSeenMutation.mutate(announcementId),
                    onSeenInvite: (inviteId) => inviteSeenMutation.mutate(inviteId),
                    onInviteAction: (invite, action) => inviteActionMutation.mutate({ invite, action }),
                    busy:
                      notificationSeenMutation.isPending ||
                      announcementSeenMutation.isPending ||
                      inviteActionMutation.isPending ||
                      inviteSeenMutation.isPending,
                  })}
                  {itemIndex < items.length - 1 ? <View style={styles.rowSpacer} /> : null}
                </View>
              ))}
            </ScrollView>
          )}
        </Card>

        <View style={styles.paginationPanel}>
          <Button
            label="Previous"
            variant="outline"
            size="sm"
            disabled={!hasPreviousPage}
            onPress={() => goToPage(page - 1)}
            leftIcon={<ChevronLeft size={16} strokeWidth={2.2} color={colors.textPrimary} />}
          />
          <Text variant="caption" tone="secondary">
            {page}/{totalPages}
          </Text>
          <Button
            label="Next"
            variant="primary"
            size="sm"
            disabled={!hasNextPage}
            onPress={() => goToPage(page + 1)}
            rightIcon={<ChevronRight size={16} strokeWidth={2.2} color={colors.textInverse} />}
          />
        </View>
      </View>
    </Screen>
  );
}

function renderFeedItem(
  item: NotificationFeedItem,
  handlers: {
    onSeenNotification: (notificationId: string) => void;
    onSeenAnnouncement: (announcementId: string) => void;
    onSeenInvite: (inviteId: string) => void;
    onInviteAction: (
      invite: Extract<NotificationFeedItem, { kind: "invite" }>,
      action: "accept" | "decline",
    ) => void;
    busy: boolean;
  },
) {
  if (item.kind === "invite") {
    return (
      <InviteRow
        item={item}
        busy={handlers.busy}
        onAction={handlers.onInviteAction}
        onSeen={handlers.onSeenInvite}
      />
    );
  }

  if (item.kind === "announcement") {
    return (
      <AnnouncementRow
        announcement={item.announcement}
        busy={handlers.busy}
        onSeen={handlers.onSeenAnnouncement}
      />
    );
  }

  return <NotificationRow notification={item.notification} busy={handlers.busy} onSeen={handlers.onSeenNotification} />;
}

function NotificationRow({
  notification,
  busy,
  onSeen,
}: {
  notification: Extract<NotificationFeedItem, { kind: "notification" }>["notification"];
  busy: boolean;
  onSeen: (notificationId: string) => void;
}) {
  const isSeen = notification.seenAt !== null;

  return (
    <View style={[styles.row, !isSeen && styles.unseenRow, styles.itemCard]}>
      <View style={styles.cardHeader}>
        <Avatar imageUri={null} label="N" tintId={notification.id} size="sm" />
        <View style={styles.cardHeaderText}>
          <Text variant="bodyStrong" numberOfLines={2}>
            Notification
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            Update
          </Text>
        </View>
      </View>
      <IconButton
        size="sm"
        variant={isSeen ? "ghost" : "muted"}
        onPress={() => onSeen(notification.id)}
        disabled={busy}
        accessibilityLabel={isSeen ? "Already seen" : "Mark as seen"}
        style={styles.readButton}
      >
        <Check size={14} strokeWidth={2.2} color={isSeen ? colors.textSecondary : colors.accent} />
      </IconButton>
      <View style={styles.cardBody}>
        <Text variant="bodyStrong" style={styles.rowMessage} numberOfLines={3}>
          {notification.message}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text variant="caption" tone="secondary" style={styles.footerTime}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function AnnouncementRow({
  announcement,
  busy,
  onSeen,
}: {
  announcement: Extract<NotificationFeedItem, { kind: "announcement" }>["announcement"];
  busy: boolean;
  onSeen: (announcementId: string) => void;
}) {
  const isSeen = announcement.seenAt !== null;

  return (
    <View style={[styles.row, !isSeen && styles.unseenRow, styles.itemCard]}>
      <View style={styles.cardHeader}>
        <Avatar imageUri={null} label={getInitials(announcement.orgName)} tintId={announcement.id} size="sm" />
        <View style={styles.cardHeaderText}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {announcement.title}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {announcement.orgName}
          </Text>
        </View>
      </View>
      <IconButton
        size="sm"
        variant={isSeen ? "ghost" : "muted"}
        onPress={() => onSeen(announcement.id)}
        disabled={busy}
        accessibilityLabel={isSeen ? "Already seen" : "Mark announcement as seen"}
        style={styles.readButton}
      >
        <Check size={14} strokeWidth={2.2} color={isSeen ? colors.textSecondary : colors.accent} />
      </IconButton>
      <View style={styles.cardBody}>
        <Text variant="body" tone="secondary" numberOfLines={2}>
          {announcement.description}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text variant="caption" tone="secondary" style={styles.footerTime}>
          {formatRelativeTime(announcement.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function InviteRow({
  item,
  busy,
  onAction,
  onSeen,
}: {
  item: Extract<NotificationFeedItem, { kind: "invite" }>;
  busy: boolean;
  onAction: (invite: Extract<NotificationFeedItem, { kind: "invite" }>, action: "accept" | "decline") => void;
  onSeen: (inviteId: string) => void;
}) {
  const invite = item.invite;
  const isHandled = invite.status !== "PENDING";
  const initials = getInitials(invite.inviterName ?? invite.orgName);
  const isFranchise = invite.type === "FRANCHISE";

  return (
    <View style={[styles.row, !invite.seenAt && !isHandled && styles.unseenRow, styles.itemCard]}>
      <View style={styles.cardHeader}>
        <Avatar imageUri={null} label={initials} tintId={invite.orgId} size="sm" />
        <View style={styles.cardHeaderText}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {invite.orgName}
          </Text>
          {invite.inviterName ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              Invited by {invite.inviterName}
            </Text>
          ) : (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              Sent invite
            </Text>
          )}
        </View>
      </View>
      {isHandled ? (
        <IconButton
          size="sm"
          variant={invite.seenAt ? "ghost" : "muted"}
          onPress={() => onSeen(item.invite.id)}
          disabled={busy}
          accessibilityLabel={invite.seenAt ? "Already read" : "Mark as read"}
          style={styles.readButton}
        >
          <Check size={14} strokeWidth={2.2} color={invite.seenAt ? colors.textSecondary : colors.accent} />
        </IconButton>
      ) : null}
      <View style={styles.cardBody}>
        <Text variant="body" tone="secondary" numberOfLines={2}>
          {invite.status === "PENDING"
            ? isFranchise
              ? "Franchise invite awaiting your response."
              : "Invite pending your response."
            : invite.status === "ACCEPTED"
              ? "Accepted"
              : invite.status === "EXPIRED"
                ? "Expired"
                : "Declined"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        {isHandled ? (
          <View style={styles.cardFooterCenter}>
            <Text
              variant="caption"
              tone={invite.status === "ACCEPTED" ? "success" : invite.status === "EXPIRED" ? "warning" : "secondary"}
            >
              {invite.status === "ACCEPTED" ? "Accepted" : invite.status === "EXPIRED" ? "Expired" : "Declined"}
            </Text>
          </View>
        ) : (
          <View style={styles.cardFooterCenter}>
            <View style={styles.inviteActions}>
              <Button
                label={isFranchise ? "Join" : "Accept"}
                size="xs"
                variant="primary"
                onPress={() => onAction(item, "accept")}
                loading={busy}
                leftIcon={!isFranchise ? <Check size={14} strokeWidth={2.2} color={colors.textInverse} /> : undefined}
              />
              <Button
                label="Decline"
                size="xs"
                variant="ghost"
                onPress={() => onAction(item, "decline")}
                loading={busy}
                leftIcon={<X size={14} strokeWidth={2.2} color={colors.textSecondary} />}
              />
            </View>
          </View>
        )}
        <Text variant="caption" tone="secondary" style={styles.footerTime}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.segmentButton, active && styles.segmentButtonActive, pressed && styles.segmentButtonPressed]}
    >
      <Text variant="caption" tone={active ? "primary" : "secondary"} style={styles.segmentLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function buildNotificationsRoute(page: number, view: NotificationView) {
  const params: Record<string, string> = { view };
  if (page > 1) {
    params.page = String(page);
  }

  return { pathname: "/notifications", params };
}

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseView(value: string | string[] | undefined): NotificationView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "unseen" ? "unseen" : "all";
}

function sortFeedItems(items: NotificationFeedItem[]) {
  return [...items].sort((left, right) => {
    const leftSeen = isFeedItemSeen(left);
    const rightSeen = isFeedItemSeen(right);

    if (leftSeen !== rightSeen) {
      return leftSeen ? 1 : -1;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function isFeedItemSeen(item: NotificationFeedItem) {
  if (item.kind === "invite") {
    return item.invite.seenAt !== null;
  }

  if (item.kind === "announcement") {
    return item.announcement.seenAt !== null;
  }

  return item.notification.seenAt !== null;
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const diff = now - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  screenContent: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
  feedScroll: {
    flex: 1,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  segmentedRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  segmentButtonPressed: {
    opacity: 0.84,
  },
  segmentLabel: {
    letterSpacing: 0,
    textTransform: "none",
  },
  feedCard: {
    overflow: "hidden",
    flex: 1,
  },
  itemCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    ...shadows.sm,
    minHeight: 168,
  },
  stateWrap: {
    paddingVertical: spacing.xl,
  },
  row: {
    position: "relative",
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: 56,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemMain: {
    flex: 1,
  },
  cardBody: {
    marginTop: spacing.md,
    minWidth: 0,
    paddingRight: 2,
    flexGrow: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardFooterLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  cardFooterCenter: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  footerRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  footerTime: {
    textAlign: "right",
  },
  readButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
  },
  unseenRow: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: colors.accentSoftBorder,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 1,
  },
  topIcon: {
    marginTop: 0,
  },
  announcementIcon: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  announcementIconUnread: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  notificationIcon: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  notificationIconUnread: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  avatarWrap: {
    paddingTop: 1,
  },
  inviteAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowMessage: {
    lineHeight: 20,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  description: {
    flex: 1,
    minWidth: 0,
  },
  timeLabel: {
    paddingTop: 1,
  },
  announcementTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  inviteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "nowrap",
    justifyContent: "center",
  },
  paginationPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    alignSelf: "flex-end",
  },
  currentItemWrap: {
    flex: 1,
  },
  pageList: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rowSpacer: {
    height: spacing.xs,
  },
});