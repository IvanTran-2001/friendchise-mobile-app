import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { apiFetch } from "../../../src/lib/api/client";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearAuthToken } from "../../../src/features/auth/token-store";
import { Text } from "../../ui/text";
import { TextField } from "../../ui/text-field";
import { Button } from "../../ui/button";
import { colors, radius, spacing } from "../../../src/lib/theme";

type SettingsSheetProps = {
  userName: string | null;
};

type DeleteAccountResponse = {
  ok: true;
};

/**
 * Settings sheet content for the profile panel.
 *
 * Currently this sheet focuses on the destructive account-deletion flow and
 * keeps the confirmation logic isolated from the profile sheet itself.
 */
export function SettingsSheet({ userName }: SettingsSheetProps) {
  return (
    <View style={styles.body}>
      <DeleteAccountPanel userName={userName} />
    </View>
  );
}

type DeleteAccountPanelProps = {
  userName: string | null;
};

/**
 * Calls the account-delete endpoint with the user confirmation text.
 */
async function deleteAccount(confirmText: string) {
  return apiFetch<DeleteAccountResponse>("/api/account/delete", {
    method: "DELETE",
    body: JSON.stringify({ confirmText }),
  });
}

/**
 * Destructive account-deletion section.
 *
 * It validates the confirmation text locally, invokes the API, and clears the
 * mobile auth state after a successful delete.
 */
function DeleteAccountPanel({ userName }: DeleteAccountPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedMatch = userName?.trim() ?? "";
  const confirmed = expectedMatch.length > 0 && confirmText.trim() === expectedMatch;

  const handleDelete = async () => {
    if (!confirmed || isDeleting) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteAccount(confirmText.trim());
      await clearAuthToken();
      queryClient.clear();
      setAuthenticated(false);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.deleteSection}>
      <View style={styles.deleteHeader}>
        <AlertTriangle size={18} strokeWidth={2.2} color={colors.danger} />
        <View style={styles.deleteHeaderText}>
          <Text variant="bodyStrong">Delete account</Text>
          <Text variant="caption" tone="secondary">
            This permanently removes your account and all associated data.
          </Text>
        </View>
      </View>

      <View style={styles.deleteCard}>
        <ConfirmationPrompt expectedMatch={expectedMatch} />

        <TextField
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={expectedMatch || "Display name"}
          helperText={
            expectedMatch
              ? "This action cannot be undone."
              : "A display name is required to confirm account deletion from mobile."
          }
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label={isDeleting ? "Deleting…" : "Delete account"}
          onPress={() => void handleDelete()}
          variant="danger"
          fullWidth
          disabled={!confirmed || isDeleting}
          leftIcon={<Trash2 size={16} strokeWidth={2.2} color={colors.danger} />}
        />
      </View>
    </View>
  );
}

type ConfirmationPromptProps = {
  expectedMatch: string;
};

/**
 * Inline confirmation instruction that highlights the exact text the user
 * must enter before the delete action becomes available.
 */
function ConfirmationPrompt({ expectedMatch }: ConfirmationPromptProps) {
  return (
    <Text variant="caption" tone="secondary">
      Type {expectedMatch ? <Text variant="captionStrong">{expectedMatch}</Text> : "your display name"} to confirm.
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  deleteSection: {
    gap: spacing.sm,
  },
  deleteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  deleteHeaderText: {
    flex: 1,
    gap: 2,
  },
  deleteCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
    padding: spacing.lg,
  },
});