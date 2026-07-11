import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { APP_SHELL_BG } from "../../../../src/lib/theme";

export default function OrgHomeScreen() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Organization</Text>
      <Text style={styles.title}>Organization home</Text>
      <Text style={styles.subtitle}>You are now in this organization.</Text>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Org ID</Text>
        <Text style={styles.orgId}>{orgId ?? "Unknown"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: APP_SHELL_BG,
    justifyContent: "center",
  },
  kicker: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    marginBottom: 20,
  },
  panel: {
    gap: 10,
    marginBottom: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  panelLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orgId: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },
});