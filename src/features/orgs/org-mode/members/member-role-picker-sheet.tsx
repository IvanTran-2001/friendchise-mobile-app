import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ListRow } from "../../../../../components/ui/list-row";
import { Text } from "../../../../../components/ui/text";
import { ListSkeleton } from "../../../../../components/ui/list-skeleton";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../../../hooks/use-dismiss-keyboard-on-idle";
import { colors, spacing } from "../../../../lib/theme";
import { fetchOrgRoles } from "../shared/organization-api";
import { SearchableSheetPicker } from "../../../../../components/ui/searchable-sheet-picker";

type MemberRolePickerSheetProps = {
  orgId: string;
  selectedRoleIds: string[];
  onAddRole: (roleId: string) => void;
};

export function MemberRolePickerSheet({
  orgId,
  selectedRoleIds,
  onAddRole,
}: MemberRolePickerSheetProps) {
  return (
    <SearchableSheetPicker
      title="Add role"
      triggerLabel="Add role"
      triggerValue={selectedRoleIds.length > 0 ? `${selectedRoleIds.length} selected` : "Open role picker"}
      placeholder="Search roles"
    >
      {({ search, closeSheet }) => (
        <MemberRolePickerList
          orgId={orgId}
          search={search}
          selectedRoleIds={selectedRoleIds}
          onAddRole={(roleId) => {
            onAddRole(roleId);
            closeSheet();
          }}
        />
      )}
    </SearchableSheetPicker>
  );
}

type MemberRolePickerListProps = {
  orgId: string;
  search: string;
  selectedRoleIds: string[];
  onAddRole: (roleId: string) => void;
};

function MemberRolePickerList({ orgId, search, selectedRoleIds, onAddRole }: MemberRolePickerListProps) {
  const debouncedSearch = useDebouncedValue(search, 150);

  useDismissKeyboardOnIdle(search, 1000, { enabled: true });

  const rolePickerQuery = useInfiniteQuery({
    queryKey: ["mobile-org-role-picker", orgId, debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchOrgRoles(orgId, {
        page: pageParam,
        pageSize: 20,
        search: debouncedSearch,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: true,
  });

  const availableRoles = useMemo(
    () =>
      (rolePickerQuery.data?.pages.flatMap((page) => page.roles) ?? []).filter(
        (role) => role.key !== "owner" && !selectedRoleIds.includes(role.id),
      ),
    [rolePickerQuery.data?.pages, selectedRoleIds],
  );

  return (
    <FlatList
      data={availableRoles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.rolePickerList}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={() => {
        if (rolePickerQuery.hasNextPage && !rolePickerQuery.isFetchingNextPage) {
          void rolePickerQuery.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      refreshing={rolePickerQuery.isRefetching && !rolePickerQuery.isFetchingNextPage}
      onRefresh={() => void rolePickerQuery.refetch()}
      ListEmptyComponent={
        rolePickerQuery.isLoading && availableRoles.length === 0 ? (
          <ListSkeleton variant="role" count={3} />
        ) : (
          <Text variant="body" tone="secondary" align="center" style={styles.rolePickerEmpty}>
            {debouncedSearch.trim() ? "No roles found." : "No roles available."}
          </Text>
        )
      }
      ListFooterComponent={
        rolePickerQuery.isFetchingNextPage ? (
          <Text variant="caption" tone="secondary" align="center" style={styles.rolePickerEmpty}>
            Loading more roles...
          </Text>
        ) : null
      }
      renderItem={({ item: role }) => {
        const selected = selectedRoleIds.includes(role.id);

        return (
          <ListRow
            title={role.name}
            subtitle={selected ? "Already added" : undefined}
            leading={<View style={[styles.roleDotLarge, { backgroundColor: role.color ?? colors.textTertiary }]} />}
            trailing={selected ? <Check size={18} strokeWidth={2.4} color={colors.accent} /> : null}
            disabled={selected}
            onPress={() => {
              if (selected) {
                return;
              }

              onAddRole(role.id);
            }}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  rolePickerList: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rolePickerEmpty: {
    paddingVertical: spacing.xxl,
  },
  roleDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});