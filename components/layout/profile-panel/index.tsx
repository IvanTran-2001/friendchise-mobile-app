import { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserRound, X } from "lucide-react-native";
import { apiFetch } from "../../../src/lib/api/client";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearAuthToken } from "../../../src/features/auth/token-store";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { APP_SHELL_BG } from "../../../src/lib/theme";
import { OrgSwitcher } from "./org-switcher";

type Org = {
  id: string;
  name: string;
  image?: string | null;
};

type OrgResponse = {
  organizations: Org[];
};

type MeResponse = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

async function fetchOrganizations() {
  return apiFetch<OrgResponse>("/api/mobile/me/organizations");
}

async function fetchMe() {
  return apiFetch<MeResponse>("/api/mobile/me");
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function AvatarFallback({ label, size = 26 }: { label: string; size?: number }) {
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarFallbackText}>{label}</Text>
    </View>
  );
}

function Avatar({ image, label, size = 26 }: { image?: string | null; label: string; size?: number }) {
  if (image) {
    return <Image source={{ uri: image }} style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return <AvatarFallback label={label} size={size} />;
}

function SelectedOrgAvatar({ org }: { org: Org | null }) {
  if (org) {
    return <Avatar image={org.image} label={getInitials(org.name)} size={26} />;
  }

  return (
    <View style={styles.notSelectedBadge}>
      <Text style={styles.notSelectedText}>?</Text>
    </View>
  );
}

export function ProfileOrgButton() {
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();
  const [profileOpen, setProfileOpen] = useState(false);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const { data: meData } = useQuery({
    queryKey: ["mobile-me"],
    queryFn: fetchMe,
  });
  const { data: orgData } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const currentUser = meData?.user ?? null;
  const currentOrg = orgData?.organizations.find((org) => org.id === currentOrgId) ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);
  const orgLabel = currentOrg ? currentOrg.name : "Not selected";

  const handleLogout = async () => {
    setProfileOpen(false);
    await clearAuthToken();
    setAuthenticated(false);
    router.replace("/(auth)/login");
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open profile and organization panel"
        onPress={() => setProfileOpen(true)}
      >
        <View style={styles.avatarCluster}>
          <View style={styles.avatarPrimary}>
            <Avatar image={currentUser?.image} label={userInitials} />
          </View>
          <View style={styles.avatarDivider} />
          <View style={styles.avatarSecondary}>
            <SelectedOrgAvatar org={currentOrg} />
          </View>
        </View>
      </Pressable>

      <Modal
        visible={profileOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileOpen(false)}
      >
        <SafeAreaView edges={["top"]} style={styles.panelSafeArea}>
          <View style={styles.panelShell}>
            <Pressable
              onPress={() => setProfileOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close profile panel"
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <X size={16} strokeWidth={2.5} color="#0F172A" />
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.heroAvatarWrap}>
                <View style={styles.heroAvatar}>
                  {currentUser?.image ? (
                    <Image source={{ uri: currentUser.image }} style={styles.heroAvatarImage} />
                  ) : (
                    <UserRound size={28} strokeWidth={2.1} color="#1D4ED8" />
                  )}
                </View>
              </View>

              <Text style={styles.heroName} numberOfLines={1}>
                {currentUser?.name ?? "Your profile"}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>{orgLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.panelBody}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Organization</Text>
                <View style={styles.sectionCard}>
                  <OrgSwitcher currentOrgId={currentOrgId} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                  <Pressable
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  avatarCluster: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: APP_SHELL_BG,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
  },
  avatarDivider: {
    width: 8,
  },
  avatarPrimary: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarSecondary: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarTextWrap: {
    marginLeft: 2,
    minWidth: 0,
    flexShrink: 1,
  },
  avatarLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  avatarSubLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
    marginTop: 1,
  },
  avatarImage: {
    backgroundColor: "#FFFFFF",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  avatarFallbackText: {
    color: "#0B1220",
    fontSize: 12,
    fontWeight: "800",
  },
  notSelectedBadge: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: APP_SHELL_BG,
    overflow: "hidden",
  },
  notSelectedText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  panelSafeArea: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
  panelShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_SHELL_BG,
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
    paddingTop: 28,
    paddingBottom: 18,
    alignItems: "center",
    gap: 10,
  },
  heroAvatarWrap: {
    paddingTop: 6,
    paddingBottom: 2,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  heroAvatarImage: {
    width: 72,
    height: 72,
  },
  heroName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  heroMetaRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.9)",
  },
  heroPillText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  panelBody: {
    flex: 1,
    gap: 14,
    paddingBottom: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    backgroundColor: "#FFFFFF",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  placeholderCard: {
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#FFFFFF",
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
    backgroundColor: "#EFF6FF",
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonText: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "700",
  },
});
