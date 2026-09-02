import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react-native";
import { Avatar, getInitials } from "../../ui/avatar";
import { Card } from "../../ui/card";
import { ListRow } from "../../ui/list-row";
import { SearchField } from "../../ui/search-field";
import { SheetModal } from "../../ui/sheet-modal";
import { EmptyState } from "../../ui/empty-state";
import { ErrorState, LoadingState } from "../../ui/state-views";
import { Text } from "../../ui/text";
import { colors, radius, spacing } from "../../../src/lib/theme";
import { fetchOrganizations, type Org } from "../../../src/features/orgs/org-mode/shared/organization-api";
import { LogoMark } from "./logo-mark";
import { useOrgSwitcherStore } from "../../../src/features/orgs/org-mode/shared/org-switcher-store";

type OrgSwitcherProps = {
  currentOrgId?: string | null;
  onSelectComplete?: () => void;
  onPressLeadingAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function OrgSwitcher({ currentOrgId, onSelectComplete, onPressLeadingAction, style }: OrgSwitcherProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const organizations = useMemo(() => data?.organizations ?? [], [data?.organizations]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOrgId = useOrgSwitcherStore((state) => state.selectedOrgId);
  const setSelectedOrgId = useOrgSwitcherStore((state) => state.setSelectedOrgId);
  const clearSelectedOrgId = useOrgSwitcherStore((state) => state.clearSelectedOrgId);
  const currentOrg = organizations.find((org: Org) => org.id === currentOrgId) ?? null;
  const filteredOrgs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return organizations;

    return organizations.filter((org: Org) => {
      return org.name.toLowerCase().includes(query) || org.id.toLowerCase().includes(query);
    });
  }, [organizations, search]);
  const listOrgs = filteredOrgs.filter((org: Org) => org.id !== currentOrg?.id);

  const closeSheet = () => {
    setOpen(false);
    setSearch("");
  };

  const selectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    closeSheet();
  };

  const handleCloseComplete = () => {
    if (!selectedOrgId) {
      return;
    }

    const orgId = selectedOrgId;
    clearSelectedOrgId();
    router.replace(`/(app)/orgs/${orgId}`);
    onSelectComplete?.();
  };

  return (
    <>
      <View style={[styles.controlRow, style]}>
        {onPressLeadingAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to global home"
            onPress={onPressLeadingAction}
            style={({ pressed }) => [styles.leadingShell, pressed && styles.triggerPressed]}
          >
            <LogoMark size={56} />
          </Pressable>
        ) : null}
        {isLoading ? (
          <OrganizationStateCard>
            <LoadingState message="Fetching your organization list." compact />
          </OrganizationStateCard>
        ) : error ? (
          <OrganizationStateCard>
            <ErrorState
              title="Could not load organizations"
              message="Check your connection and try again."
              onRetry={() => void refetch()}
              compact
            />
          </OrganizationStateCard>
        ) : organizations.length === 0 ? (
          <OrganizationStateCard>
            <EmptyState title="No organizations" message="There are no organizations available on this account." />
          </OrganizationStateCard>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.triggerShell, pressed && styles.triggerPressed]}
            onPress={() => setOpen(true)}
          >
            <Card padding="md" style={styles.triggerCard}>
              <View style={styles.triggerInner}>
                <Avatar
                  imageUri={currentOrg?.image}
                  label={currentOrg ? getInitials(currentOrg.name) : "?"}
                  tintId={currentOrg?.id}
                />

                <View style={styles.triggerTextWrap}>
                  <Text variant="label" tone="secondary">
                    Organization
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {currentOrg?.name ?? "Select organization"}
                  </Text>
                </View>

                <ChevronDown size={18} strokeWidth={2.2} color={colors.textTertiary} />
              </View>
            </Card>
          </Pressable>
        )}
      </View>

      <SheetModal
        visible={open}
        onClose={closeSheet}
        onCloseComplete={handleCloseComplete}
        title="Switch organization"
        subtitle="Search and jump between orgs"
      >
        <SearchField
          autoFocusOnMount
          value={search}
          onChangeText={setSearch}
          placeholder="Search organizations"
        />

        <FlatList
          data={listOrgs}
          keyExtractor={(item) => item.id}
          style={styles.listViewport}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            currentOrg ? (
              <View style={styles.currentOrgSection}>
                <Text variant="label" tone="secondary" style={styles.currentOrgLabel}>
                  Current organization
                </Text>
                <Card padding="md" style={styles.currentOrgCard}>
                  <ListRow
                    title={currentOrg.name}
                    subtitle="Active organization"
                    leading={<Avatar imageUri={currentOrg.image} label={getInitials(currentOrg.name)} tintId={currentOrg.id} />}
                    trailing="check"
                  />
                </Card>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title={search.trim() ? "No matching organizations" : "No other organizations"}
              message={search.trim() ? "Try a different search term." : undefined}
            />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle="Organization"
              leading={<Avatar imageUri={item.image} label={getInitials(item.name)} tintId={item.id} />}
              trailing="chevron"
              onPress={() => selectOrg(item.id)}
            />
          )}
        />
      </SheetModal>
    </>
  );
}

function OrganizationStateCard({ children }: { children: React.ReactNode }) {
  return (
    <Card padding="md" style={styles.triggerCard}>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  leadingShell: {
    width: 56,
    height: 56,
  },
  triggerShell: {
    flex: 1,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerCard: {
    width: "100%",
  },
  triggerInner: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  triggerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listViewport: {
    flex: 1,
  },
  list: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  currentOrgSection: {
    marginBottom: spacing.lg,
  },
  currentOrgLabel: {
    marginBottom: spacing.sm,
  },
  currentOrgCard: {
    borderRadius: radius.lg,
  },
});
