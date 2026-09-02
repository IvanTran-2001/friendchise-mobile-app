import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Bot, Check, MoreVertical, Search, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconButton } from "../../../../../components/ui/icon-button";
import { ActionSheet, ActionSheetSection } from "../../../../../components/ui/action-sheet";
import { Button } from "../../../../../components/ui/button";
import { ListRow } from "../../../../../components/ui/list-row";
import { Text } from "../../../../../components/ui/text";
import { TextField } from "../../../../../components/ui/text-field";
import { SearchField } from "../../../../../components/ui/search-field";
import { SheetModal } from "../../../../../components/ui/sheet-modal";
import { colors, radius, spacing } from "../../../../lib/theme";
import {
  convertOrgMemberToBot,
  deleteOrgMember,
  type OrgMember,
  type OrgRole,
  updateOrgMember,
} from "../shared/organization-api";

type MemberRowActionsProps = {
  orgId: string;
  member: OrgMember;
  allRoles: OrgRole[];
};

export function MemberRowActions({ orgId, member, allRoles }: MemberRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [botName, setBotName] = useState("");
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const queryClient = useQueryClient();

  const isBot = member.userId === null;
  const currentRoleIds = useMemo(() => member.memberRoles.map((memberRole) => memberRole.role.id), [member.memberRoles]);
  const displayName = member.user?.name ?? member.botName ?? "Member";

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoleIds(currentRoleIds.length > 0 ? currentRoleIds : allRoles.filter((role) => role.isDefault).map((role) => role.id));
    setBotName(displayName);
    setRoleSearch("");
    setRolePickerOpen(false);
  }, [allRoles, currentRoleIds, displayName, open]);

  const updateMutation = useMutation({
    mutationFn: () => updateOrgMember(orgId, member.id, selectedRoleIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      setOpen(false);
    },
    onError: (error) => {
      Alert.alert("Could not update member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrgMember(orgId, member.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      setOpen(false);
    },
    onError: (error) => {
      Alert.alert("Could not delete member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertOrgMemberToBot(orgId, member.id, botName.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      setOpen(false);
    },
    onError: (error) => {
      Alert.alert("Could not convert member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const selectedRoles = useMemo(
    () => allRoles.filter((role) => selectedRoleIds.includes(role.id)),
    [allRoles, selectedRoleIds],
  );
  const availableRoles = useMemo(
    () => allRoles.filter((role) => !selectedRoleIds.includes(role.id)),
    [allRoles, selectedRoleIds],
  );
  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return availableRoles;
    return availableRoles.filter((role) => role.name.toLowerCase().includes(query));
  }, [availableRoles, roleSearch]);

  const canSave = selectedRoleIds.length > 0 && !updateMutation.isPending;

  const handleDelete = () => {
    Alert.alert("Delete member?", `Remove ${displayName} from this organization?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  const openActions = () => {
    Alert.alert("Member actions", `Choose what to do with ${displayName}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: handleDelete,
      },
      {
        text: "Edit",
        onPress: () => setOpen(true),
      },
    ]);
  };

  return (
    <>
      <IconButton accessibilityLabel={`Open actions for ${displayName}`} onPress={openActions} size="sm" variant="muted">
        <MoreVertical size={18} strokeWidth={2.3} color={colors.textSecondary} />
      </IconButton>

      <ActionSheet visible={open} onClose={() => setOpen(false)} title={displayName} subtitle={isBot ? "Bot member" : "Edit member"}>
        <ActionSheetSection title="Roles" subtitle="Choose one or more roles for this member.">
          <Pressable
            onPress={() => setRolePickerOpen(true)}
            style={({ pressed }) => [styles.roleTrigger, pressed && styles.roleTriggerPressed]}
          >
            <View style={styles.roleTriggerTextWrap}>
              <Text variant="label" tone="secondary">
                Add role
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {availableRoles.length > 0 ? "Open role picker" : "No more roles available"}
              </Text>
            </View>
            <Search size={18} strokeWidth={2.2} color={colors.textTertiary} />
          </Pressable>

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
                    onPress={() => {
                      setSelectedRoleIds((current) => current.filter((roleId) => roleId !== role.id));
                    }}
                    style={({ pressed }) => [styles.removeRoleButton, pressed && styles.removeRoleButtonPressed]}
                  >
                    <X size={12} strokeWidth={2.6} color={role.color ?? colors.textPrimary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {selectedRoles.length === 0 ? <Text variant="caption" tone="danger">Pick at least one role.</Text> : null}
        </ActionSheetSection>

        {!isBot ? (
          <ActionSheetSection title="Turn into bot" subtitle="This converts the member into a bot placeholder.">
            <TextField
              label="Bot name"
              value={botName}
              onChangeText={setBotName}
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

                convertMutation.mutate();
              }}
              loading={convertMutation.isPending}
              loadingLabel="Converting..."
              leftIcon={<Bot size={16} strokeWidth={2.3} color={colors.textPrimary} />}
            />
          </ActionSheetSection>
        ) : null}

        <ActionSheetSection title="Save changes">
          <Button
            label="Save roles"
            onPress={() => updateMutation.mutate()}
            disabled={!canSave}
            loading={updateMutation.isPending}
            loadingLabel="Saving..."
            fullWidth
          />
        </ActionSheetSection>
      </ActionSheet>

      <SheetModal
        visible={rolePickerOpen}
        onClose={() => setRolePickerOpen(false)}
        title="Add role"
        subtitle="Select a role to add it to this member."
      >
        <SearchField
          autoFocusOnMount
          value={roleSearch}
          onChangeText={setRoleSearch}
          placeholder="Search roles"
        />

        <View style={styles.rolePickerList}>
          {filteredRoles.length > 0 ? (
            filteredRoles.map((role) => {
              const selected = selectedRoleIds.includes(role.id);

              return (
                <ListRow
                  key={role.id}
                  title={role.name}
                  subtitle={selected ? "Already added" : undefined}
                  leading={<View style={[styles.roleDotLarge, { backgroundColor: role.color ?? colors.textTertiary }]} />}
                  trailing={selected ? <Check size={18} strokeWidth={2.4} color={colors.accent} /> : null}
                  disabled={selected}
                  onPress={() => {
                    if (selected) {
                      return;
                    }

                    setSelectedRoleIds((current) => [...current, role.id]);
                    setRoleSearch("");
                    setRolePickerOpen(false);
                  }}
                />
              );
            })
          ) : (
            <Text variant="body" tone="secondary" align="center" style={styles.rolePickerEmpty}>
              No roles found.
            </Text>
          )}
        </View>
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  roleTrigger: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  roleTriggerPressed: {
    opacity: 0.85,
  },
  roleTriggerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
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
  roleDotLarge: {
    width: 10,
    height: 10,
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
  rolePickerList: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rolePickerEmpty: {
    paddingVertical: spacing.xxl,
  },
  roleLabel: {
    color: colors.textSecondary,
  },
  roleLabelSelected: {
    color: colors.accent,
  },
});