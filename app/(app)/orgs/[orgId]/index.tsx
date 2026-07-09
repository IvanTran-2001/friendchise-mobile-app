import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { useRegisterTabScrollToTop } from "../../../../components/layout/tab-scroll-to-top-context";

export default function OrgHomeScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;

  useRegisterTabScrollToTop(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  });

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Organization</Text>
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
    backgroundColor: "#0B1220",
    justifyContent: "center",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 15,
    marginBottom: 20,
  },
  panel: {
    gap: 10,
    marginBottom: 22,
  },
  panelLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orgId: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
});