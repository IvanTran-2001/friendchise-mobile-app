import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Bot, UserPlus, ArrowLeft } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionSheet, ActionSheetSection } from "../../../../../components/ui/action-sheet";
import { Button } from "../../../../../components/ui/button";
import { TextField } from "../../../../../components/ui/text-field";
import { Text } from "../../../../../components/ui/text";
import { colors, spacing } from "../../../../lib/theme";
import { createOrgBot, inviteOrgMember } from "../shared/organization-api";

type MembersActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  orgId: string;
};

type SheetMode = "menu" | "invite" | "bot";

export function MembersActionSheet({ visible, onClose, orgId }: MembersActionSheetProps) {
  const [mode, setMode] = useState<SheetMode>("menu");
  const [inviteEmail, setInviteEmail] = useState("");
  const [botName, setBotName] = useState("");
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => inviteOrgMember(orgId, { email: inviteEmail.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      Alert.alert("Invite sent", "The member invite was created.");
      handleClose();
    },
    onError: (error) => {
      Alert.alert("Could not invite member", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const botMutation = useMutation({
    mutationFn: () => createOrgBot(orgId, { botName: botName.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-org-members"] });
      Alert.alert("Bot added", "The bot membership was created.");
      handleClose();
    },
    onError: (error) => {
      Alert.alert("Could not add bot", error instanceof Error ? error.message : "Please try again.");
    },
  });

  useEffect(() => {
    if (visible) {
      return;
    }

    setMode("menu");
    setInviteEmail("");
    setBotName("");
  }, [visible]);

  const isWorking = inviteMutation.isPending || botMutation.isPending;

  const handleClose = () => {
    setMode("menu");
    onClose();
  };

  const openInvite = () => setMode("invite");
  const openBot = () => setMode("bot");

  const body = useMemo(() => {
    if (mode === "invite") {
      return (
        <ActionSheetSection title="Invite member">
          <Button
            label="Back"
            onPress={() => setMode("menu")}
            variant="outline"
            leftIcon={<ArrowLeft size={16} strokeWidth={2.3} color={colors.textPrimary} />}
          />
          <View style={styles.formWrap}>
            <Text variant="body" tone="secondary">
              Send an email invite to join this organization.
            </Text>
            <TextField
              label="Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              label={inviteMutation.isPending ? "Sending..." : "Invite member"}
              onPress={() => inviteMutation.mutate()}
              disabled={isWorking || !inviteEmail.trim()}
              fullWidth
            />
          </View>
        </ActionSheetSection>
      );
    }

    if (mode === "bot") {
      return (
        <ActionSheetSection title="Add bot">
          <Button
            label="Back"
            onPress={() => setMode("menu")}
            variant="outline"
            leftIcon={<ArrowLeft size={16} strokeWidth={2.3} color={colors.textPrimary} />}
          />
          <View style={styles.formWrap}>
            <Text variant="body" tone="secondary">
              Create a new bot membership for this organization.
            </Text>
            <TextField
              label="Bot name"
              value={botName}
              onChangeText={setBotName}
              placeholder="e.g. Open Slot"
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Button
              label={botMutation.isPending ? "Adding..." : "Add bot"}
              onPress={() => botMutation.mutate()}
              disabled={isWorking || !botName.trim()}
              fullWidth
            />
          </View>
        </ActionSheetSection>
      );
    }

    return (
      <ActionSheetSection title="Actions">
        <Button
          label="Invite member"
          onPress={openInvite}
          variant="outline"
          fullWidth
          leftIcon={<UserPlus size={16} strokeWidth={2.3} color={colors.textPrimary} />}
        />
        <Button
          label="Add bot"
          onPress={openBot}
          variant="outline"
          fullWidth
          leftIcon={<Bot size={16} strokeWidth={2.3} color={colors.textPrimary} />}
        />
      </ActionSheetSection>
    );
  }, [botMutation.isPending, botName, inviteEmail, inviteMutation.isPending, isWorking, mode]);

  return (
    <ActionSheet visible={visible} onClose={handleClose} title="Members" subtitle="Actions and creation tools">
      {body}
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    gap: spacing.md,
  },
});