import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Check, Mail, X } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Avatar, getInitials } from "../../../../../components/ui/avatar";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { EmptyState } from "../../../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../../../components/ui/state-views";
import { ListRow } from "../../../../../components/ui/list-row";
import { IconButton } from "../../../../../components/ui/icon-button";
import { CollapsibleSearchDock } from "../../../../../components/ui/collapsible-search-dock";
import { Screen } from "../../../../../components/ui/screen";
import { colors, spacing } from "../../../../lib/theme";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useNavbarSetters } from "../../../../../components/layout/navbar-context";
import { useMe } from "../../../../features/auth/me";
import {
  acceptMobileInvite,
  declineMobileInvite,
  fetchMobileInvites,
  type MobileInviteItem,
} from "../../org-mode/shared/organization-api";

const PAGE_SIZE = 20;

export function OrgInvitesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActions } = useNavbarSetters();
  const { data: me } = useMe();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 150);
  const accountId = me?.user.id ?? null;
  const orgInvitesQueryKey = useMemo(() => ["mobile-org-invites", accountId] as const, [accountId]);
  const pendingInviteCountQueryKey = useMemo(
    () => ["mobile-pending-org-invites-count", accountId] as const,
    [accountId],
  );

  useFocusEffect(
    useCallback(() => {
      setActions?.(
        <View style={styles.navShell}>
          <IconButton accessibilityLabel="Back to organizations" onPress={() => router.replace("/(app)/orgs") }>
            <ChevronLeft size={18} strokeWidth={2.4} color={colors.textPrimary} />
          </IconButton>
        </View>,
      );

      return () => {
        setActions?.(null);
      };
    }, [router, setActions]),
  );

  const { data, error, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey: orgInvitesQueryKey,
    queryFn: ({ pageParam = 1 }) => fetchMobileInvites(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: Boolean(accountId),
  });

  const invites = useMemo(() => {
    const searchValue = debouncedSearch.trim().toLowerCase();
    const allInvites =
      data?.pages.flatMap((page) => page.invites).filter((invite) => invite.subtype === "MEMBER" || invite.subtype === "BOT_SLOT") ?? [];

    if (!searchValue) {
      return allInvites;
    }

    return allInvites.filter((invite) => {
      const orgName = invite.orgName.toLowerCase();
      const inviterName = invite.inviterName?.toLowerCase() ?? "";

      return orgName.includes(searchValue) || inviterName.includes(searchValue);
    });
  }, [data?.pages, debouncedSearch]);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleAccept = useCallback(
    async (invite: MobileInviteItem) => {
      try {
        await acceptMobileInvite(invite.id);
        await queryClient.invalidateQueries({ queryKey: orgInvitesQueryKey });
        await queryClient.invalidateQueries({ queryKey: pendingInviteCountQueryKey });
        await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
        router.replace(`/(app)/orgs/${invite.orgId}`);
      } catch (err) {
        Alert.alert("Could not accept invite", err instanceof Error ? err.message : "Please try again.");
      }
    },
    [orgInvitesQueryKey, pendingInviteCountQueryKey, queryClient, router],
  );

  const handleDecline = useCallback(
    (invite: MobileInviteItem) => {
      Alert.alert("Decline invite", `Decline the invite to ${invite.orgName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await declineMobileInvite(invite.id);
                await queryClient.invalidateQueries({ queryKey: orgInvitesQueryKey });
                await queryClient.invalidateQueries({ queryKey: pendingInviteCountQueryKey });
              } catch (err) {
                Alert.alert("Could not decline invite", err instanceof Error ? err.message : "Please try again.");
              }
            })();
          },
        },
      ]);
    },
    [orgInvitesQueryKey, pendingInviteCountQueryKey, queryClient],
  );

  return (
    <Screen padded={false}>
      <CollapsibleSearchDock
        search={search}
        onChangeSearch={setSearch}
        placeholder="Search org or sender"
        containerStyle={styles.container}
        searchShellStyle={styles.searchShell}
      >
        {({ onScroll }) => (
          <FlatList
            data={invites}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            onScroll={onScroll}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.45}
            refreshing={isLoading}
            onRefresh={() => void refetch()}
            ListEmptyComponent={
              error ? (
                <Card padding="lg">
                  <ErrorState title="Could not load invites" message="Check your connection and try again." onRetry={() => void refetch()} />
                </Card>
              ) : isLoading ? (
                <Card padding="lg">
                  <LoadingState message="Loading invites." />
                </Card>
              ) : (
                <Card padding="lg">
                  <EmptyState
                    icon={<Mail size={24} strokeWidth={2} color={colors.textTertiary} />}
                    title={search.trim() ? "No matching invites" : "No organization invites"}
                    message={
                      search.trim()
                        ? "Try a different organization name or sender."
                        : "Invites to join as a member or replace a bot will show up here."
                    }
                  />
                </Card>
              )
            }
            renderItem={({ item }) => <InviteCard invite={item} onAccept={handleAccept} onDecline={handleDecline} />}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : null
            }
          />
        )}
      </CollapsibleSearchDock>
    </Screen>
  );
}

function InviteCard({
  invite,
  onAccept,
  onDecline,
}: {
  invite: MobileInviteItem;
  onAccept: (invite: MobileInviteItem) => void;
  onDecline: (invite: MobileInviteItem) => void;
}) {
  const accountLabel = invite.subtype === "BOT_SLOT" ? "Replace bot" : "Join as member";
  const badgeTone = invite.subtype === "BOT_SLOT" ? "warning" : "success";
  const senderLabel = invite.inviterName ? `Sent by ${invite.inviterName}` : "Sent invite";

  return (
    <Card padding="sm" elevation="xs" style={styles.card}>
      <ListRow
        title={invite.orgName}
        subtitle={senderLabel}
        leading={
          <Avatar
            imageUri={null}
            label={getInitials(invite.orgName)}
            tintId={invite.orgId}
            size="sm"
          />
        }
        trailing={<Badge label={accountLabel} tone={badgeTone} dotted />}
      />

      <View style={styles.actionsRow}>
        <Button
          label="Accept"
          variant="primary"
          size="xs"
          style={styles.actionButton}
          onPress={() => onAccept(invite)}
          leftIcon={<Check size={14} strokeWidth={2.2} color={colors.textInverse} />}
        />
        <Button
          label="Reject"
          variant="outline"
          size="xs"
          style={styles.actionButton}
          onPress={() => onDecline(invite)}
          leftIcon={<X size={14} strokeWidth={2.2} color={colors.textPrimary} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navShell: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  searchShell: {
    borderRadius: 18,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingTop: 88,
  },
  card: {
    gap: spacing.sm,
    borderColor: colors.hairline,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  separator: {
    height: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});