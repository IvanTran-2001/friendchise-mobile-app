import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CirclePlus, LogIn, Network } from "lucide-react-native";
import { Card } from "../../../../components/ui/card";
import { ListRow } from "../../../../components/ui/list-row";
import { Screen } from "../../../../components/ui/screen";
import { ScreenHeader } from "../../../../components/ui/screen-header";
import { colors, spacing } from "../../../../src/lib/theme";

export default function OrgsHubScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader
        kicker="Organization"
        title="Organizations"
        subtitle="Create a new org or join an existing one."
      />

      <Card padding="sm" style={styles.actionsCard}>
        <ListRow
          title="Create an organization"
          subtitle="Set up a new organization"
          leading={<CirclePlus size={20} strokeWidth={2.1} color={colors.textPrimary} />}
          trailing="chevron"
          onPress={() => router.push("/(app)/orgs/new")}
        />
        <ListRow
          title="Join a franchisee"
          subtitle="Use an invite token to join"
          leading={<LogIn size={20} strokeWidth={2.1} color={colors.textPrimary} />}
          trailing="chevron"
          onPress={() => router.push("/(app)/orgs/invite")}
        />
        <ListRow
          title="Join an organization"
          subtitle="Coming soon"
          leading={<Network size={20} strokeWidth={2.1} color={colors.textPrimary} />}
          trailing={null}
          disabled
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    gap: spacing.xs,
  },
});