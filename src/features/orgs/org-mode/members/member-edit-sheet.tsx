import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Bot, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionSheet, ActionSheetSection } from "../../../../../components/ui/action-sheet";
import { Button } from "../../../../../components/ui/button";
import { Text } from "../../../../../components/ui/text";
import { TextField } from "../../../../../components/ui/text-field";
import { colors, radius, spacing } from "../../../../lib/theme";
import { convertOrgMemberToBot, type OrgMember, type OrgRole, updateOrgMember } from "../shared/organization-api";
import { MemberRolePickerSheet } from "./member-role-picker-sheet";

type MemberEditSheetProps = {
  orgId: string;
  member: OrgMember;
  allRoles: OrgRole[];
  open: boolean;
  onClose: () => void;
};

export function MemberEditSheet({ orgId, member, allRoles, open, onClose }: MemberEditSheetProps) {
  const queryClient = useQueryClient();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [botName, setBotName] = useState("");

  const isBot = member.userId === null;
  const currentRoleIds = useMemo(
    () =>
      member.memberRoles
        .map((memberRole) => memberRole.role)
        .filter((role): role is NonNullable<(typeof member.memberRoles)[number]["role"]> => Boolean(role))
        .map((role) => role.id),
    [member],
  );
  const displayName = member.user?.name ?? member.botName ?? "Member";

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoleIds(currentRoleIds.length > 0 ? currentRoleIds : allRoles.filter((role) => role.isDefault).map((role) => role.id));
    setBotName(displayName);
  }, [allRoles, currentRoleIds, displayName, open]);

  const updateMutation = useMutation({
    mutationFn: () => updateOrgMember(orgId, member.id, selectedRoleIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      onClose();
    },
    onError: (error) => {
      Alert.alert("Could not update member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertOrgMemberToBot(orgId, member.id, botName.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      onClose();
    },
    onError: (error) => {
      Alert.alert("Could not convert member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const selectedRoles = useMemo(
    () => allRoles.filter((role) => selectedRoleIds.includes(role.id)),
    [allRoles, selectedRoleIds],
  );

  const canSave = selectedRoleIds.length > 0 && !updateMutation.isPending;

  if (!open) {
    return null;
  }

  return (
    <>
      <ActionSheet visible={open} onClose={onClose} title={displayName} subtitle={isBot ? "Bot member" : "Edit member"}>
        <MemberRolesSection
          orgId={orgId}
          selectedRoles={selectedRoles}
          onAddRole={(roleId) => {
            setSelectedRoleIds((current) => [...current, roleId]);
          }}
          onRemoveRole={(roleId) => {
            setSelectedRoleIds((current) => current.filter((currentRoleId) => currentRoleId !== roleId));
          }}
          onSaveRoles={() => updateMutation.mutate()}
          isSaving={updateMutation.isPending}
          canSave={canSave}
        />

        <MemberBotSection
          visible={!isBot}
          botName={botName}
          onBotNameChange={setBotName}
          onConvert={() => convertMutation.mutate()}
          isConverting={convertMutation.isPending}
        />
      </ActionSheet>

    </>
  );
}

type MemberRolesSectionProps = {
  orgId: string;
  selectedRoles: OrgRole[];
  onAddRole: (roleId: string) => void;
  onRemoveRole: (roleId: string) => void;
  onSaveRoles: () => void;
  isSaving: boolean;
  canSave: boolean;
};

function MemberRolesSection({
  orgId,
  selectedRoles,
  onAddRole,
  onRemoveRole,
  onSaveRoles,
  isSaving,
  canSave,
}: MemberRolesSectionProps) {
  return (
    <ActionSheetSection title="Roles" subtitle="Choose one or more roles for this member.">
      <MemberRolePickerSheet orgId={orgId} selectedRoleIds={selectedRoles.map((role) => role.id)} onAddRole={onAddRole} />

      {selectedRoles.length > 0 ? (
        <View style={styles.selectedRolesList}>
          {selectedRoles.map((role) => (
            <View
              key={role.id}
              style={[
                styles.selectedRoleChip,
                { backgroundColor: role.color ? `${role.color}18` : colors.surfaceMuted, borderColor: role.color ?? colors.border },
              ]}
            >
              <View style={[styles.roleDot, { backgroundColor: role.color ?? colors.textTertiary }]} />
              <Text variant="captionStrong" numberOfLines={1} style={styles.selectedRoleLabel}>
                {role.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${role.name}`}
                onPress={() => onRemoveRole(role.id)}
                style={({ pressed }) => [styles.removeRoleButton, pressed && styles.removeRoleButtonPressed]}
              >
                <X size={12} strokeWidth={2.6} color={role.color ?? colors.textPrimary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {selectedRoles.length === 0 ? <Text variant="caption" tone="danger">Pick at least one role.</Text> : null}

      <Button
        label="Save roles"
        onPress={onSaveRoles}
        disabled={!canSave}
        loading={isSaving}
        loadingLabel="Saving..."
        fullWidth
      />
    </ActionSheetSection>
  );
}

type MemberBotSectionProps = {
  visible: boolean;
  botName: string;
  onBotNameChange: (value: string) => void;
  onConvert: () => void;
  isConverting: boolean;
};

function MemberBotSection({ visible, botName, onBotNameChange, onConvert, isConverting }: MemberBotSectionProps) {
  if (!visible) {
    return null;
  }

  return (
    <ActionSheetSection title="Turn into bot" subtitle="This converts the member into a bot placeholder.">
      <TextField
        label="Bot name"
        value={botName}
        onChangeText={onBotNameChange}
        placeholder="e.g. Open Slot"
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Button
        label="Turn into bot"
        variant="outline"
        fullWidth
        onPress={() => {
          if (!botName.trim()) {
            Alert.alert("Bot name is required", "Enter a bot name before converting this member.");
            return;
          }

          onConvert();
        }}
        loading={isConverting}
        loadingLabel="Converting..."
        leftIcon={<Bot size={16} strokeWidth={2.3} color={colors.textPrimary} />}
      />
    </ActionSheetSection>
  );
}

const styles = StyleSheet.create({
  selectedRolesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectedRoleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: "100%",
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  selectedRoleLabel: {
    color: colors.textSecondary,
  },
  removeRoleButton: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  removeRoleButtonPressed: {
    opacity: 0.7,
  },
});