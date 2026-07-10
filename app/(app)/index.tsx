import { ScrollView, Text, StyleSheet, View } from "react-native";
import { SurfaceCard } from "../../components/ui/surface-card";
import { APP_SHELL_BG } from "../../src/lib/theme";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <SurfaceCard style={styles.card}>
        <View style={styles.kickerPill}>
          <Text style={styles.kicker}>Organization</Text>
        </View>
        <Text style={styles.title}>Choose your organization</Text>
        <Text style={styles.subtitle}>Select an organization to continue.</Text>
      </SurfaceCard>
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
  card: {
    maxWidth: 420,
    alignSelf: "center",
    padding: 20,
    gap: 8,
  },
  kickerPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  kicker: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
});