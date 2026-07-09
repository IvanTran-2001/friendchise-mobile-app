import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCurrentOrgId } from "../../hooks/use-current-org-id";
import { OrgSwitcher } from "./org-switcher";

export function AppNavbar() {
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [styles.brand, pressed && styles.brandPressed]}
          onPress={() => router.push("/(app)")}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>F</Text>
          </View>
          <Text style={styles.title}>FriendChise</Text>
        </Pressable>

        <View style={styles.switcherWrap}>
          <OrgSwitcher currentOrgId={currentOrgId} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#0B1220",
  },
  container: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#0B1220",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
    paddingRight: 12,
  },
  brandPressed: {
    opacity: 0.85,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  logoLetter: {
    color: "#0B1220",
    fontSize: 17,
    fontWeight: "800",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  switcherWrap: {
    flexShrink: 0,
    maxWidth: 190,
  },
});