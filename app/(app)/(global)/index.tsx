import { FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react-native";
import { fetchOrganizations } from "../../../src/features/orgs/organization-api";
import { Avatar, getInitials } from "../../../components/ui/avatar";
import { Card } from "../../../components/ui/card";
import { ListRow } from "../../../components/ui/list-row";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { EmptyState } from "../../../components/ui/empty-state";
import { ErrorState, LoadingState } from "../../../components/ui/state-views";
import { colors, spacing } from "../../../src/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const organizations = data?.organizations ?? [];

  return (
    <Screen>
      <FlatList
        data={organizations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ListHeaderComponent={
          <ScreenHeader
            kicker="Organization"
            title="Choose your organization"
            subtitle="Select an organization to continue."
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <Card padding="lg">
              <LoadingState message="Fetching your organizations." />
            </Card>
          ) : error ? (
            <Card padding="lg">
              <ErrorState onRetry={() => void refetch()} />
            </Card>
          ) : (
            <Card padding="lg">
              <EmptyState
                icon={<Building2 size={24} strokeWidth={2} color={colors.textTertiary} />}
                title="No organizations yet"
                message="Organizations you belong to will show up here."
              />
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card padding="sm" style={styles.orgCard}>
            <ListRow
              title={item.name}
              subtitle="Organization"
              leading={<Avatar imageUri={item.image} label={getInitials(item.name)} tintId={item.id} />}
              trailing="chevron"
              onPress={() => router.push(`/(app)/orgs/${item.id}`)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  orgCard: {
    marginBottom: 0,
  },
});