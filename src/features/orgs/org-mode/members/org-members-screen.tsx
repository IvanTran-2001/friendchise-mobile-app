import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { Avatar, getInitials } from "../../../../../components/ui/avatar";
import { Card } from "../../../../../components/ui/card";
import { EmptyState } from "../../../../../components/ui/empty-state";
import { ErrorState } from "../../../../../components/ui/state-views";
import { ListSkeleton } from "../../../../../components/ui/list-skeleton";
import { Screen } from "../../../../../components/ui/screen";
import { Text } from "../../../../../components/ui/text";
import { colors, spacing } from "../../../../lib/theme";
import { fetchOrgMembersPage, fetchOrgRoles, type OrgMember, type OrgRole } from "../shared/organization-api";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../../../hooks/use-dismiss-keyboard-on-idle";
import { CollapsibleSearchDock } from "../../../../../components/ui/collapsible-search-dock";
import { useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useNavbarSetters } from "../../../../../components/layout/navbar-context";
import { MembersNavbarActions } from "./members-navbar-actions";
import { Badge } from "../../../../../components/ui/badge";
import { MemberRowActions } from "./member-row-actions";

type OrgMembersScreenProps = {
  orgId: string;
};

const PAGE_SIZE = 20;

export function OrgMembersScreen({ orgId }: OrgMembersScreenProps) {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 150);
  const isSearchSettled = debouncedSearch === search;
  const isFocused = useIsFocused();
  const { setActions } = useNavbarSetters();
  const { data: rolesData } = useQuery({
    queryKey: ["mobile-org-roles", orgId],
    queryFn: () => fetchOrgRoles(orgId),
    enabled: Boolean(orgId),
  });

  const { data, error, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey: ["mobile-org-members", orgId, debouncedSearch],
    queryFn: ({ pageParam = 1 }) => fetchOrgMembersPage(orgId, pageParam, PAGE_SIZE, debouncedSearch),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: Boolean(orgId) && isSearchSettled,
  });

  const members = useMemo(() => data?.pages.flatMap((page) => page.memberships) ?? [], [data?.pages]);
  const allRoles = rolesData?.roles ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? members.length;
  const hasMembers = members.length > 0;

  useDismissKeyboardOnIdle(search, 1000, { enabled: isFocused });

  useFocusEffect(
    useCallback(() => {
      setActions?.(<MembersNavbarActions orgId={orgId} />);

      return () => {
        setActions?.(null);
      };
    }, [orgId, setActions]),
  );

  if (isLoading && !hasMembers) {
    return (
      <Screen padded={false}>
        <CollapsibleSearchDock
          search={search}
          onChangeSearch={setSearch}
          placeholder="Search members"
          containerStyle={styles.container}
          searchShellStyle={styles.searchShell}
          topContent={<Text variant="caption" tone="secondary">Loading members...</Text>}
        >
          {({ onScroll }) => (
            <FlatList
              data={[]}
              keyExtractor={() => "loading"}
              contentContainerStyle={styles.listContent}
              onScroll={onScroll}
              renderItem={null as never}
              ListEmptyComponent={
                <ListSkeleton variant="member" count={4} />
              }
            />
          )}
        </CollapsibleSearchDock>
      </Screen>
    );
  }

  if (error && !hasMembers) {
    return (
      <Screen padded={false}>
        <CollapsibleSearchDock
          search={search}
          onChangeSearch={setSearch}
          placeholder="Search members"
          containerStyle={styles.container}
          searchShellStyle={styles.searchShell}
          topContent={<Text variant="caption" tone="secondary">Members</Text>}
        >
          {({ onScroll }) => (
            <FlatList
              data={[]}
              keyExtractor={() => "error"}
              contentContainerStyle={styles.listContent}
              onScroll={onScroll}
              renderItem={null as never}
              ListEmptyComponent={
                <Card padding="lg">
                  <ErrorState title="Could not load members" message="Check your connection and try again." onRetry={() => void refetch()} />
                </Card>
              }
            />
          )}
        </CollapsibleSearchDock>
      </Screen>
    );
  }

  const handleEndReached = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Screen padded={false}>
      <CollapsibleSearchDock
        search={search}
        onChangeSearch={setSearch}
        placeholder="Search members"
        containerStyle={styles.container}
        searchShellStyle={styles.searchShell}
        topContent={
          <Text variant="caption" tone="secondary">
            {totalCount} member{totalCount === 1 ? "" : "s"}
          </Text>
        }
      >
        {({ onScroll }) => (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            onScroll={onScroll}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.45}
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            ListEmptyComponent={
              <Card padding="lg">
                <EmptyState
                  icon={<AlertTriangle size={24} strokeWidth={2} color={colors.textTertiary} />}
                  title="No members"
                  message="This organization does not have any members yet."
                />
              </Card>
            }
            renderItem={({ item }) => <MemberRow member={item} orgId={orgId} allRoles={allRoles} />}
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

function MemberRow({
  member,
  orgId,
  allRoles,
}: {
  member: OrgMember;
  orgId: string;
  allRoles: OrgRole[];
}) {
  const name = member.user?.name ?? member.botName ?? "Unknown member";
  const roles = member.memberRoles
    .map((memberRole) => memberRole.role)
    .filter((role): role is NonNullable<(typeof member.memberRoles)[number]["role"]> => Boolean(role));
  const isBot = member.userId === null;

  return (
    <Card padding="md" style={styles.memberCard}>
      <View style={styles.memberRow}>
        <Avatar imageUri={member.user?.image} label={getInitials(name)} tintId={member.userId ?? member.id} />

        <View style={styles.memberTextWrap}>
          <View style={styles.memberTitleRow}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.memberName}>
              {name}
            </Text>
            {isBot ? <Badge label="Bot" tone="warning" dotted /> : null}
          </View>

          <RoleBadges roles={roles} />
        </View>

        <MemberRowActions orgId={orgId} member={member} allRoles={allRoles} />
      </View>
    </Card>
  );
}

function RoleBadges({
  roles,
}: {
  roles: { id: string; name: string; color: string | null }[];
}) {
  if (roles.length === 0) {
    return <Text variant="caption" tone="secondary">No role</Text>;
  }

  if (roles.length > 2) {
    return (
      <View style={styles.roleInitialsRow}>
        {roles.map((role) => (
          <View
            key={role.id}
            style={[
              styles.roleInitial,
              { backgroundColor: role.color ?? colors.accentSoft, borderColor: role.color ?? colors.accentSoftBorder },
            ]}
          >
            <Text variant="label" style={styles.roleInitialText}>
              {getRoleInitials(role.name)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.roleChipsRow}>
      {roles.map((role) => (
        <View
          key={role.id}
          style={[
            styles.roleChip,
            { backgroundColor: role.color ? `${role.color}18` : colors.surfaceMuted, borderColor: role.color ?? colors.border },
          ]}
        >
          <View style={[styles.roleDot, { backgroundColor: role.color ?? colors.textTertiary }]} />
          <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.roleChipText}>
            {role.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getRoleInitials(name: string) {
  const words = name
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 88,
    paddingBottom: spacing.xxl,
  },
  searchShell: {
    borderRadius: 18,
  },
  memberCard: {
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  memberTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  memberName: {
    flex: 1,
    minWidth: 0,
  },
  roleChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "100%",
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  roleChipText: {
    maxWidth: 120,
  },
  roleInitialsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  roleInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInitialText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 11,
    letterSpacing: 0,
  },
  separator: {
    height: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});