import { Alert, FlatList, View } from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Building2, MoreVertical, ShieldCheck } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, getInitials } from "../../../../../components/ui/avatar";
import { Badge } from "../../../../../components/ui/badge";
import { Card } from "../../../../../components/ui/card";
import { CollapsibleSearchDock } from "../../../../../components/ui/collapsible-search-dock";
import { EmptyState } from "../../../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../../../components/ui/state-views";
import { ListSkeleton } from "../../../../../components/ui/list-skeleton";
import { ListRow } from "../../../../../components/ui/list-row";
import { IconButton } from "../../../../../components/ui/icon-button";
import { Screen } from "../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../components/ui/screen-header";
import { TextField } from "../../../../../components/ui/text-field";
import { Text } from "../../../../../components/ui/text";
import { Button } from "../../../../../components/ui/button";
import { colors, spacing } from "../../../../lib/theme";
import { deleteOrgRole, deleteOrganization, fetchOrgRoles, fetchOrganizations, leaveOrganization, type OrgRole } from "../shared/organization-api";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../../../hooks/use-dismiss-keyboard-on-idle";
import { useIsFocused } from "@react-navigation/native";
import { useOrgSettingsPermissions } from "./org-settings-permissions";
import { RoleEditorSheet } from "./role-management-sheets";

export type OrgSettingsSection = "user" | "organization" | "roles";

type OrgSettingsScreenProps = {
  orgId: string;
  section: OrgSettingsSection;
};

export function OrgSettingsScreen({ orgId, section }: OrgSettingsScreenProps) {
  if (section === "user") {
    return <LeaveOrgScreen orgId={orgId} />;
  }

  return <OrgSettingsManagementScreen orgId={orgId} section={section} />;
}

function LeaveOrgScreen({ orgId }: { orgId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const leaveMutation = useMutation({
    mutationFn: () => leaveOrganization(orgId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
      router.replace("/");
    },
    onError: () => {
      Alert.alert("Could not leave organization", "Please try again.");
    },
  });

  const handleLeave = () => {
    if (leaveMutation.isPending) {
      return;
    }

    Alert.alert(
      "Leave organization",
      "Are you sure you want to leave this organization? You will lose access to its content and resources.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => leaveMutation.mutate(),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Settings"
        title="Leave organization"
        subtitle="Remove yourself from this organization."
      />

      <View style={styles.leaveActionWrap}>
        <Button
          label={leaveMutation.isPending ? "Leaving..." : "Leave organization"}
          onPress={handleLeave}
          variant="danger"
          fullWidth
          disabled={leaveMutation.isPending}
        />
      </View>
    </Screen>
  );
}

function OrgSettingsManagementScreen({ orgId, section }: OrgSettingsScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: orgData, isLoading: isOrgLoading, error: orgError } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });
  const { data: permissionsData, isLoading: isPermissionsLoading, error: permissionsError } =
    useOrgSettingsPermissions(orgId);

  const org = useMemo(
    () => orgData?.organizations.find((item) => item.id === orgId) ?? null,
    [orgData?.organizations, orgId],
  );
  const [confirmName, setConfirmName] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(orgId, confirmName.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
      router.replace("/");
    },
    onError: () => {
      Alert.alert("Could not delete organization", "Please confirm the name and try again.");
    },
  });

  const permissions = permissionsData ?? null;
  const canManageOrg = permissions?.canManageOrgSettings ?? false;
  const canManageRoles = permissions?.canManageRoles ?? false;

  const isLoading = isOrgLoading || isPermissionsLoading;
  const screenTitle =
    section === "organization" ? "Organization settings" : section === "roles" ? "Roles" : "Settings";
  const screenSubtitle =
    section === "organization"
      ? "Manage organization details and configuration."
      : section === "roles"
        ? "Manage access roles and permissions."
        : "Manage your account and organization access.";

  if (isLoading) {
    return (
      <Screen scroll>
        <ScreenHeader kicker="Organization" title={screenTitle} subtitle={screenSubtitle} />
        <Card padding="lg">
          <LoadingState message="Loading settings." />
        </Card>
      </Screen>
    );
  }

  if (orgError || permissionsError) {
    return (
      <Screen scroll>
        <ScreenHeader kicker="Settings" title={screenTitle} subtitle={screenSubtitle} />
        <Card padding="lg">
          <ErrorState
            title="Could not load settings"
            message="Check your connection and try again."
            onRetry={() => router.replace(`/(app)/orgs/${orgId}/settings`)}
          />
        </Card>
      </Screen>
    );
  }

  const blocked =
    (section === "organization" && !canManageOrg) || (section === "roles" && !canManageRoles);

  if (blocked) {
    return (
      <Screen scroll>
        <ScreenHeader kicker="Organization" title={screenTitle} subtitle={screenSubtitle} />
        <Card padding="lg">
          <ErrorState
            title="Permission required"
            message="You do not have access to this settings section."
            compact
          />
        </Card>
      </Screen>
    );
  }

  if (section === "roles") {
    return <RolesSection orgId={orgId} />;
  }

  const isDeleteConfirmed = org ? confirmName.trim() === org.name : false;

  const handleDelete = () => {
    if (!canManageOrg || deleteMutation.isPending || !isDeleteConfirmed) {
      return;
    }

    Alert.alert(
      "Delete organization",
      `This will permanently delete ${org?.name ?? "this organization"} and all of its data. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Settings"
        title={screenTitle}
        subtitle={org ? `${org.name} · ${screenSubtitle}` : screenSubtitle}
      />

      <Card padding="lg" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Avatar imageUri={org?.image} label={getInitials(org?.name ?? orgId)} tintId={orgId} size="lg" />
          <View style={styles.summaryTextWrap}>
            <Text variant="label" tone="secondary">
              Active organization
            </Text>
            <Text variant="title" numberOfLines={1}>
              {org?.name ?? "Organization"}
            </Text>
          </View>
        </View>
      </Card>

      {section === "user" ? (
        <Card padding="sm">
          <ListRow
            title="Organization"
            subtitle={canManageOrg ? "Manage organization details" : "Requires organization settings access"}
            leading={<Building2 size={20} strokeWidth={2.1} color={colors.textPrimary} />}
            trailing={canManageOrg ? "chevron" : null}
            disabled={!canManageOrg}
            onPress={canManageOrg ? () => router.push(`/(app)/orgs/${orgId}/settings/organization`) : undefined}
          />
          <ListRow
            title="Roles"
            subtitle={canManageRoles ? "Manage role access" : "Requires roles permission"}
            leading={<ShieldCheck size={20} strokeWidth={2.1} color={colors.textPrimary} />}
            trailing={canManageRoles ? "chevron" : null}
            disabled={!canManageRoles}
            onPress={canManageRoles ? () => router.push(`/(app)/orgs/${orgId}/settings/roles`) : undefined}
          />
        </Card>
      ) : section === "organization" ? (
        <Card padding="lg" style={styles.dangerCard}>
          <Text variant="title" style={styles.deleteTitle}>
            Delete organization
          </Text>
          <Text variant="body" tone="secondary" style={styles.deleteCopy}>
            Type the organization name to confirm permanent deletion of this organization and all of its data.
          </Text>

          <TextField
            label="Confirm organization name"
            value={confirmName}
            onChangeText={setConfirmName}
            placeholder={org?.name ?? "Organization name"}
            autoCapitalize="words"
            autoCorrect={false}
            containerStyle={styles.deleteInput}
          />

          <Button
            label={deleteMutation.isPending ? "Deleting..." : "Delete organization"}
            onPress={handleDelete}
            variant="danger"
            fullWidth
            disabled={!canManageOrg || deleteMutation.isPending || !isDeleteConfirmed}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function RolesSection({ orgId }: { orgId: string }) {
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<OrgRole | null>(null);
  const debouncedSearch = useDebouncedValue(search, 150);
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({
    queryKey: ["mobile-org-roles", orgId],
    queryFn: () => fetchOrgRoles(orgId),
    enabled: Boolean(orgId),
  });

  const roles = useMemo(() => {
    return [...(rolesQuery.data?.roles ?? [])].sort((left, right) => {
      if (left.isDefault !== right.isDefault) {
        return Number(right.isDefault) - Number(left.isDefault);
      }

      return left.name.localeCompare(right.name);
    });
  }, [rolesQuery.data?.roles]);

  const filteredRoles = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return roles;
    }

    return roles.filter((role) => {
      const searchableParts = [
        role.name,
        ...role.permissions.map((permission) => formatPermissionLabel(permission.action)),
        ...role.eligibleFor.map(({ task }) => task.name),
      ];

      return searchableParts.some((part) => part.toLowerCase().includes(normalizedSearch));
    });
  }, [debouncedSearch, roles]);

  const totalCount = filteredRoles.length;
  const isInitialLoading = rolesQuery.isLoading && roles.length === 0;
  const isRefreshing = rolesQuery.isRefetching;
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteOrgRole(orgId, roleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mobile-org-roles", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["mobile-org-members", orgId] }),
      ]);
    },
    onError: () => {
      Alert.alert("Could not delete role", "Please try again.");
    },
  });

  useDismissKeyboardOnIdle(search, 1000, { enabled: isFocused });

  const handleDeleteRole = (role: OrgRole) => {
    Alert.alert(
      "Delete role",
      `This will permanently remove ${role.name} and unassign it from all members. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: deleteRoleMutation.isPending ? "Deleting..." : "Delete",
          style: "destructive",
          onPress: () => deleteRoleMutation.mutate(role.id),
        },
      ],
    );
  };

  const handleRoleMenuPress = (role: OrgRole) => {
    const actions = [
      {
        text: "Edit",
        onPress: () => setEditingRole(role),
      },
    ];

    if (role.isDeletable) {
      actions.push({
        text: "Delete",
        onPress: () => handleDeleteRole(role),
      });
    }

    actions.push({ text: "Cancel", onPress: () => {} });

    Alert.alert(role.name, "Choose an action", actions);
  };

  return (
    <>
      <Screen padded={false}>
        <CollapsibleSearchDock
          search={search}
          onChangeSearch={setSearch}
          placeholder="Search roles"
          containerStyle={styles.rolesContainer}
          searchShellStyle={styles.rolesSearchShell}
          topContent={
            <Text variant="caption" tone="secondary">
              {totalCount} role{totalCount === 1 ? "" : "s"}
            </Text>
          }
        >
          {({ onScroll }) => (
            <FlatList
              data={filteredRoles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.rolesListContent}
              ItemSeparatorComponent={() => <View style={styles.rolesSeparator} />}
              onScroll={onScroll}
              refreshing={isRefreshing}
              onRefresh={() => void rolesQuery.refetch()}
              ListEmptyComponent={
                isInitialLoading ? (
                  <ListSkeleton variant="role" count={4} />
                ) : rolesQuery.error ? (
                  <Card padding="lg">
                    <ErrorState
                      title="Could not load roles"
                      message="Check your connection and try again."
                      onRetry={() => void rolesQuery.refetch()}
                    />
                  </Card>
                ) : (
                  <Card padding="lg">
                    <EmptyState
                      icon={<ShieldCheck size={24} strokeWidth={2} color={colors.textTertiary} />}
                      title={search.trim() ? "No matching roles" : "No roles"}
                      message={search.trim() ? "Try a different role, permission, or task." : "This organization does not have any roles yet."}
                    />
                  </Card>
                )
              }
              renderItem={({ item }) => (
                <RoleCard
                  role={item}
                  onMenuPress={item.key === "owner" ? undefined : () => handleRoleMenuPress(item)}
                />
              )}
            />
          )}
        </CollapsibleSearchDock>
      </Screen>

      <RoleEditorSheet
        orgId={orgId}
        visible={Boolean(editingRole)}
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onSaved={() => setEditingRole(null)}
      />
    </>
  );
}

function RoleCard({
  role,
  onMenuPress,
}: {
  role: OrgRole;
  onMenuPress?: () => void;
}) {
  const permissionLabels = role.permissions.map((permission) => formatPermissionLabel(permission.action));
  const taskLabels = role.eligibleFor.map(({ task }) => task);

  return (
    <Card padding="md" style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleIdentity}>
          <View
            style={[
              styles.roleSwatch,
              {
                backgroundColor: role.color ?? colors.textTertiary,
              },
            ]}
          />
          <View style={styles.roleTitleWrap}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {role.name}
            </Text>
            <Text variant="caption" tone="secondary">
              {role.isDefault ? "Default role" : "Custom role"}
            </Text>
          </View>
        </View>

        <View style={styles.roleHeaderActions}>
          <Badge label={role.isDefault ? "Default" : "Custom"} tone={role.isDefault ? "accent" : "neutral"} />
          {onMenuPress ? (
            <IconButton accessibilityLabel={`Open actions for ${role.name}`} onPress={onMenuPress} size="sm" variant="muted">
              <MoreVertical size={18} strokeWidth={2.3} color={colors.textSecondary} />
            </IconButton>
          ) : null}
        </View>
      </View>

      <View style={styles.roleSection}>
        <Text variant="label" tone="secondary" style={styles.roleSectionTitle}>
          Permissions
        </Text>
        {permissionLabels.length > 0 ? (
          <View style={styles.badgeList}>
            {permissionLabels.map((label) => (
              <Badge key={label} label={label} tone="neutral" />
            ))}
          </View>
        ) : (
          <Text variant="caption" tone="secondary">
            No permissions assigned.
          </Text>
        )}
      </View>

      <View style={styles.roleSection}>
        <Text variant="label" tone="secondary" style={styles.roleSectionTitle}>
          Tasks
        </Text>
        {taskLabels.length > 0 ? (
          <View style={styles.badgeList}>
            {taskLabels.map((task) => (
              <Badge key={task.id} label={task.name} dotted dotColor={task.color} tone="neutral" />
            ))}
          </View>
        ) : (
          <Text variant="caption" tone="secondary">
            Not assigned to any tasks.
          </Text>
        )}
      </View>
    </Card>
  );
}

function formatPermissionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = {
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
  },
  summaryTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  leaveActionWrap: {
    marginTop: spacing.xl,
  },
  dangerCard: {
    marginTop: spacing.lg,
  },
  deleteTitle: {
    marginBottom: spacing.xs,
  },
  deleteCopy: {
    marginBottom: spacing.lg,
  },
  deleteInput: {
    marginBottom: spacing.lg,
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  rolesSearchShell: {
    borderRadius: 16,
  },
  rolesListContent: {
    paddingTop: 72,
    paddingBottom: spacing.lg,
  },
  rolesSeparator: {
    height: spacing.md,
  },
  roleCard: {
    gap: spacing.md,
  },
  roleHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const,
    gap: spacing.md,
  },
  roleHeaderActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
  },
  roleIdentity: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  roleSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
    marginTop: 2,
    flexShrink: 0,
  },
  roleTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  roleSection: {
    gap: spacing.sm,
  },
  roleSectionTitle: {
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  badgeList: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing.xs,
  },
};