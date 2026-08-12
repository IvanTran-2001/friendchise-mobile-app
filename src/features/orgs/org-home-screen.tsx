import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ListTodo } from "lucide-react-native";
import { fetchOrganizations } from "./organization-api";
import { Avatar, getInitials } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { ListRow } from "../../../components/ui/list-row";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { ErrorState, LoadingState } from "../../../components/ui/state-views";
import { colors, spacing } from "../../lib/theme";

type OrgHomeScreenProps = {
  orgId?: string;
};

export function OrgHomeScreen({ orgId }: OrgHomeScreenProps) {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const org = data?.organizations.find((item) => item.id === orgId) ?? null;
  const isOrgLoading = isLoading && !org;

  return (
    <Screen scroll>
      <ScreenHeader
        kicker="Organization"
        title={isOrgLoading ? "Organization home" : org?.name ?? "Organization home"}
        subtitle={isOrgLoading ? "Loading organization details..." : "You are now in this organization."}
      />

      {isOrgLoading ? (
        <Card padding="lg" style={styles.orgCard}>
          <LoadingState message="Loading organization details." />
        </Card>
      ) : error && !org ? (
        <Card padding="lg" style={styles.orgCard}>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : (
        <Card padding="lg" style={styles.orgCard}>
          <View style={styles.orgRow}>
            <Avatar imageUri={org?.image} label={getInitials(org?.name ?? orgId)} tintId={orgId} size="lg" />
            <View style={styles.orgTextWrap}>
              <Badge
                label={org ? "Active organization" : "Unknown organization"}
                tone={org ? "success" : "neutral"}
                dotted
              />
            </View>
          </View>
        </Card>
      )}

      <Card padding="sm">
        <ListRow
          title="Tasks"
          subtitle="View and search organization tasks"
          leading={<ListTodo size={20} strokeWidth={2.1} color={colors.textPrimary} />}
          trailing="chevron"
          onPress={orgId ? () => router.push({ pathname: "/(app)/orgs/[orgId]/tasks", params: { orgId } }) : undefined}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orgCard: {
    marginBottom: spacing.lg,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  orgTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});