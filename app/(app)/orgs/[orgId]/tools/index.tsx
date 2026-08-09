import { useMemo, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CollapsibleSearchDock } from "../../../../../components/ui/collapsible-search-dock";
import { Screen } from "../../../../../components/ui/screen";
import { Card } from "../../../../../components/ui/card";
import { ListRow } from "../../../../../components/ui/list-row";
import { EmptyState } from "../../../../../components/ui/empty-state";
import { colors, spacing } from "../../../../../src/lib/theme";
import { ScanLine, Search } from "lucide-react-native";

type ToolItem = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: typeof ScanLine;
  href: string;
};

export default function OrgToolsScreen() {
  const [search, setSearch] = useState("");
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const router = useRouter();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;

  const tools = useMemo<ToolItem[]>(
    () =>
      orgId
        ? [
            {
              id: "scan-to-task",
              title: "Scan to Task",
              subtitle: "Convert PDF or PNG scans into tasks.",
              keywords: ["scan", "task", "pdf", "png", "image"],
              icon: ScanLine,
              href: `/(app)/orgs/${orgId}/tools/scan-to-task`,
            },
          ]
        : [],
    [orgId],
  );

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tools;
    }

    return tools.filter((tool) => {
      const searchableText = [tool.title, tool.subtitle, ...tool.keywords].join(" ").toLowerCase();
      return searchableText.includes(query);
    });
  }, [search, tools]);

  return (
    <Screen padded={false}>
      <CollapsibleSearchDock
        search={search}
        onChangeSearch={setSearch}
        placeholder="Search tools"
        containerStyle={styles.container}
        searchDockStyle={styles.searchDock}
        searchShellStyle={styles.searchShell}
      >
        {({ onScroll }) => (
          <Animated.FlatList
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
              message="Try a different search term."
            />
          }
            />
          )}
        </CollapsibleSearchDock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  searchDock: {
    position: "absolute",
    top: spacing.sm + 2,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    elevation: 3,
  },
  searchShell: {
    borderRadius: 12,
  },
  list: {
    gap: spacing.md,
    paddingTop: 72,
    paddingBottom: spacing.xl,
  },
});