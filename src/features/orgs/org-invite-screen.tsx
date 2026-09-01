import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { TextField } from "../../../components/ui/text-field";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { Text } from "../../../components/ui/text";
import { colors, spacing } from "../../lib/theme";
import { joinOrganization } from "./organization-api";

export function OrgInviteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError("Invite token is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await joinOrganization({ token: trimmedToken });
      await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
      router.replace(`/(app)/orgs/${result.organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Organization"
        title="Invite"
        subtitle="Invite members to your organization."
      />

      <Card padding="lg" elevation="md" style={styles.card}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Mail size={20} strokeWidth={2.2} color={colors.accent} />
          </View>
          <Text variant="bodyStrong" align="center">
            Join with a token
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Paste the invite token from your organization owner to join the org on this device.
          </Text>
        </View>

        <TextField
          label="Invite token"
          value={token}
          onChangeText={setToken}
          placeholder="e.g. abcd1234-token"
          autoCapitalize="none"
          autoCorrect={false}
          helperText="Tokens are one-time use and tied to your account email."
          error={error ?? undefined}
        />

        <Button
          label={loading ? "Joining..." : "Join organization"}
          variant="primary"
          fullWidth
          onPress={() => void handleJoin()}
        />

        <Button label="Back to home" variant="secondary" fullWidth onPress={() => router.replace("/(app)")} />
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
});
