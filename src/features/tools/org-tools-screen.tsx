import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { CollapsibleSearchDock } from "../../../components/ui/collapsible-search-dock";
import { Card } from "../../../components/ui/card";
import { ListRow } from "../../../components/ui/list-row";
import { EmptyState } from "../../../components/ui/empty-state";
import { colors, radius, shadows, spacing } from "../../lib/theme";
import { useOrgTools } from "./org-tools";

export function OrgToolsScreen() {
  const [search, setSearch] = useState("");
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const router = useRouter();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const hasSearch = search.trim().length > 0;
  const { filteredTools } = useOrgTools(orgId, search);

  return (
    <CollapsibleSearchDock
      search={search}
      onChangeSearch={setSearch}
      placeholder="Search tools"
      containerStyle={styles.container}
      searchShellStyle={styles.searchShell}
    >
      {({ onScroll }) => (
        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={onScroll}
          renderItem={({ item }) => (
            <Card padding="sm">
              <ListRow
                title={item.title}
                subtitle={item.subtitle}
                leading={<item.icon size={20} strokeWidth={2.1} color={colors.textPrimary} />}
                trailing="chevron"
                onPress={() => router.push(item.href)}
              />
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Search size={24} strokeWidth={2} color={colors.textTertiary} />}
              title="No tools found"
              message={
                hasSearch
                  ? "Try a different search term."
                  : orgId
                    ? "Tools created for this organization will appear here."
                    : "Select an organization to view available tools."
              }
            />
          }
        />
      )}
    </CollapsibleSearchDock>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  searchShell: {
    borderRadius: radius.lg,
    ...shadows.xs,
  },
  list: {
    gap: spacing.md,
    paddingTop: 72,
    paddingBottom: spacing.xl,
  },
});