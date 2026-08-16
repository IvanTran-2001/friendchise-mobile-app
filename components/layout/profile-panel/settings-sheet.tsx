import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { getApiUrl } from "../../../src/lib/config";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearSessionAndRedirect, useMe } from "../../../src/features/auth";
import { useGlobalSheet } from "../global-sheet";
import { Text } from "../../ui/text";
import { TextField } from "../../ui/text-field";
import { Button } from "../../ui/button";
import { colors, radius, spacing } from "../../../src/lib/theme";

type DeleteAccountResponse = {
  ok: true;
};

/**
 * Settings sheet content for the profile panel.
 *
 * Currently this sheet focuses on the destructive account-deletion flow and
 * keeps the confirmation logic isolated from the profile sheet itself.
 */
export function SettingsSheet() {
  return (
    <View style={styles.body}>
      <DeleteAccountPanel />
    </View>
  );
}

/**
 * Calls the account-delete endpoint with the user confirmation text.
 */
class DeleteAccountApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DeleteAccountApiError";
  }
}

async function deleteAccount(confirmText: string) {
  const response = await fetch(`${getApiUrl()}/api/account/delete`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirmText }),
    credentials: Platform.OS === "web" ? "include" : undefined,
  });

  if (!response.ok) {
    const message = (await response.text()).trim() || response.statusText || `HTTP ${response.status}`;
    throw new DeleteAccountApiError(response.status, message);
  }

  return (await response.json()) as DeleteAccountResponse;
}

function getDeleteAccountErrorMessage(error: unknown) {
  if (error instanceof DeleteAccountApiError) {
    switch (error.status) {
      case 401:
        return "Your session expired. Please sign in again.";
      case 403:
        return "You do not have permission to delete this account.";
      case 409:
        return "This account cannot be deleted right now because it is still in use.";
      default:
        return "Failed to delete account. Please try again.";
    }
  }

  return "Failed to delete account. Please try again.";
}

/**
 * Destructive account-deletion section.
 *
 * It validates the confirmation text locally, invokes the API, and clears the
 * mobile auth state after a successful delete.
 */
function DeleteAccountPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meData } = useMe();
  const { closeSheet } = useGlobalSheet();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedMatch = meData?.user.name?.trim() ?? "";
  const confirmed = expectedMatch.length > 0 && confirmText.trim() === expectedMatch;

  const handleDelete = async () => {
    if (!confirmed || isDeleting) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteAccount(confirmText.trim());
      closeSheet();
      await clearSessionAndRedirect({ queryClient, setAuthenticated, router });
    } catch (err) {
      setError(getDeleteAccountErrorMessage(err));
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

        {error ? <Text variant="caption" tone="danger">{error}</Text> : null}

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