import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CirclePlus, LogIn, Network } from "lucide-react-native";
import { Card } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { ListRow } from "../../../../../components/ui/list-row";
import { Screen } from "../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../components/ui/screen-header";
import { colors, spacing } from "../../../../lib/theme";
import { fetchPendingMobileInviteCount } from "../../org-mode/shared/organization-api";

export function OrgsHubScreen() {
  const router = useRouter();
  const { data: pendingInviteCount } = useQuery({
    queryKey: ["mobile-pending-org-invites-count"],
    queryFn: fetchPendingMobileInviteCount,
  });

  const inviteCountLabel = pendingInviteCount?.count ? String(Math.min(pendingInviteCount.count, 99)) + (pendingInviteCount.count > 99 ? "+" : "") : null;

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
          subtitle="View pending invites"
          leading={<Network size={20} strokeWidth={2.1} color={colors.textPrimary} />}
          trailing={inviteCountLabel ? <Badge label={inviteCountLabel} tone="accent" /> : "chevron"}
          onPress={() => router.push("/(app)/orgs/invites")}
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