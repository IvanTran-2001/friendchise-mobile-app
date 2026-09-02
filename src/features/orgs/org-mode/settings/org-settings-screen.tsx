import { Alert, View } from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Building2, ShieldCheck, UserRound } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, getInitials } from "../../../../../components/ui/avatar";
import { Card } from "../../../../../components/ui/card";
import { EmptyState } from "../../../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../../../components/ui/state-views";
import { ListRow } from "../../../../../components/ui/list-row";
import { Screen } from "../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../components/ui/screen-header";
import { TextField } from "../../../../../components/ui/text-field";
import { Text } from "../../../../../components/ui/text";
import { Button } from "../../../../../components/ui/button";
import { colors, spacing } from "../../../../lib/theme";
import { deleteOrganization, fetchOrganizations, leaveOrganization } from "../shared/organization-api";
import { useOrgSettingsPermissions } from "./org-settings-permissions";

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
      ) : (
        <Card padding="lg">
          <EmptyState
            icon={<UserRound size={24} strokeWidth={2} color={colors.textTertiary} />}
            title="Roles"
            message="This section is ready for settings controls."
          />
        </Card>
      )}
    </Screen>
  );
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
};