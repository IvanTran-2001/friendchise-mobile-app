import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, X } from "lucide-react-native";
import { apiFetch } from "../../../src/lib/api/client";
import { SurfaceCard } from "../../ui/surface-card";
import { APP_SHELL_BG } from "../../../src/lib/theme";

type Org = {
  id: string;
  name: string;
  image?: string | null;
};

type OrgResponse = {
  organizations: Org[];
};

type OrgSwitcherProps = {
  currentOrgId?: string | null;
};

async function fetchOrganizations() {
  return apiFetch<OrgResponse>("/api/mobile/me/organizations");
}

function orgHue(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash % 360;
}

function OrgBadge({ org, size = 28 }: { org: Org; size?: number }) {
  if (org.image) {
    return (
      <Image
        source={{ uri: org.image }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#1E293B" }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `hsl(${orgHue(org.id)} 60% 45%)`,
      }}
    >
      <Text style={styles.orgFallbackText}>{org.name[0]?.toUpperCase() ?? "?"}</Text>
    </View>
  );
}

export function OrgSwitcher({ currentOrgId }: OrgSwitcherProps) {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const organizations = useMemo(() => data?.organizations ?? [], [data?.organizations]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const currentOrg = organizations.find((org) => org.id === currentOrgId) ?? null;
  const filteredOrgs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return organizations;

    return organizations.filter((org) => {
      return org.name.toLowerCase().includes(query) || org.id.toLowerCase().includes(query);
    });
  }, [organizations, search]);
  const listOrgs = filteredOrgs.filter((org) => org.id !== currentOrg?.id);

  if (isLoading || error || organizations.length === 0) {
    return null;
  }

  const closeSheet = () => {
    setOpen(false);
    setSearch("");
  };

  const selectOrg = (orgId: string) => {
    closeSheet();
    InteractionManager.runAfterInteractions(() => {
      router.replace(`/(app)/orgs/${orgId}`);
    });
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}
      >
        <SurfaceCard style={styles.triggerCard}>
          <View style={styles.triggerInner}>
            <View style={styles.triggerBadgeWrap}>
              {currentOrg ? <OrgBadge org={currentOrg} size={28} /> : <View style={styles.triggerFallback} />}
            </View>

            <View style={styles.triggerTextWrap}>
              <Text style={styles.triggerLabel}>Organization</Text>
              <Text style={styles.triggerValue} numberOfLines={1}>
                {currentOrg?.name ?? "Select organization"}
              </Text>
            </View>

            <Text style={styles.chevron}>⌄</Text>
          </View>
        </SurfaceCard>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={styles.modalSafeArea}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView edges={["top"]} style={styles.modalSafeArea}>
            <View style={styles.sheetShell}>
              <Pressable
                onPress={closeSheet}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close organization switcher"
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <X size={16} strokeWidth={2.5} color="#0F172A" />
              </Pressable>

              <View style={styles.hero}>
                <View style={styles.heroIconWrap}>
                  <View style={styles.heroIcon}>
                    {currentOrg ? <OrgBadge org={currentOrg} size={34} /> : <Building2 size={26} strokeWidth={2.2} color="#1D4ED8" />}
                  </View>
                </View>

                <Text style={styles.sheetTitle}>Switch organization</Text>
                <Text style={styles.sheetSubtitle}>Search and jump between orgs</Text>
              </View>

              <SurfaceCard style={styles.searchCard}>
                <TextInput
                  autoFocus
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search organizations"
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                />
              </SurfaceCard>

              <FlatList
                data={listOrgs}
                keyExtractor={(item) => item.id}
                style={styles.listViewport}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                  currentOrg ? (
                    <View style={styles.currentOrgCard}>
                      <Text style={styles.currentOrgLabel}>Current organization</Text>
                      <View style={styles.currentOrgRow}>
                        <View style={styles.currentOrgBadge}>
                          <OrgBadge org={currentOrg} size={32} />
                        </View>
                        <View style={styles.currentOrgTextWrap}>
                          <Text style={styles.currentOrgName} numberOfLines={1}>
                            {currentOrg.name}
                          </Text>
                          <Text style={styles.currentOrgMeta} numberOfLines={1}>
                            Active organization
                          </Text>
                        </View>
                        <Text style={styles.currentOrgCheck}>✓</Text>
                      </View>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {search.trim() ? "No matching organizations" : "No organizations found"}
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                    onPress={() => selectOrg(item.id)}
                  >
                    <View style={styles.itemRow}>
                      <View style={styles.itemBadge}>
                        <OrgBadge org={item} size={26} />
                      </View>
                      <View style={styles.itemTextWrap}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemDescription} numberOfLines={1}>
                          Organization
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerInner: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerBadgeWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  triggerFallback: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#93C5FD",
  },
  triggerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  triggerValue: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  chevron: {
    color: "#64748B",
    fontSize: 22,
    marginTop: -2,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
  sheetShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  closeButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  hero: {
    paddingTop: 30,
    paddingBottom: 18,
    alignItems: "center",
    gap: 8,
  },
  heroIconWrap: {
    paddingTop: 6,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: "hidden",
  },
  sheetTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  sheetSubtitle: {
    color: "#475569",
    fontSize: 12,
    marginTop: 1,
    textAlign: "center",
  },
  searchCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  list: {
    padding: 12,
    gap: 10,
    backgroundColor: APP_SHELL_BG,
  },
  listViewport: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
  currentOrgCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.14)",
    backgroundColor: "#EFF6FF",
    padding: 12,
    marginBottom: 8,
  },
  currentOrgLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  currentOrgBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  currentOrgTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  currentOrgName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  currentOrgMeta: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  currentOrgCheck: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  itemPressed: {
    opacity: 0.85,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  itemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  itemDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  orgFallbackText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 24,
  },
});