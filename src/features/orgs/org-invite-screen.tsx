import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Mail, ArrowRight, ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { Text } from "../../../components/ui/text";
import { TextField } from "../../../components/ui/text-field";
import { colors, spacing } from "../../lib/theme";
import { joinOrganization } from "./organization-api";

export function OrgInviteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinFranchisee = async () => {
    const trimmedToken = token.trim();

    setMessage(null);
    setError(null);

    if (!trimmedToken) {
      setError("Invite token is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await joinOrganization({ token: trimmedToken });
      await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
      setMessage("Franchise joined successfully.");
      router.replace(`/(app)/orgs/${result.organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join franchisee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Organization"
        title="Join franchisee"
        subtitle="Use an invite token to join a franchise organization."
      />

      <Card padding="lg" elevation="md" style={styles.card}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Mail size={20} strokeWidth={2.2} color={colors.accent} />
          </View>
          <Text variant="bodyStrong" align="center">
            Join franchisee
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Enter the invite token from the franchise owner.
          </Text>
        </View>

        <TextField
          label="Invite token"
          value={token}
          onChangeText={setToken}
          placeholder="Paste token here"
          autoCapitalize="none"
          autoCorrect={false}
          helperText="This token links your account to the franchise join flow."
          containerStyle={styles.field}
          error={error ?? undefined}
        />

        <Button
          label="Join franchisee"
          variant="primary"
          fullWidth
          onPress={() => void handleJoinFranchisee()}
          loading={loading}
          loadingLabel="Joining..."
          leftIcon={<ArrowRight size={16} strokeWidth={2.2} color={colors.textInverse} />}
        />

        {message ? (
          <Text variant="caption" tone="secondary" align="center">
            {message}
          </Text>
        ) : null}

        <Button
          label="Back to organizations"
          variant="secondary"
          fullWidth
          onPress={() => router.replace("/(app)/orgs")}
          leftIcon={<ChevronLeft size={16} strokeWidth={2.2} color={colors.textPrimary} />}
        />

        <Pressable onPress={() => router.push("/(app)/orgs/new")} style={styles.inviteLink}>
          <Text variant="caption" tone="secondary" align="center">
            Need to create one instead? Open the create page.
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.xs,
  },
  inviteLink: {
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
});
