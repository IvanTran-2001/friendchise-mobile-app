import { ScrollView, View, Text, StyleSheet } from "react-native";
import { OrgSwitcher } from "../../components/layout/org-switcher";
import { useRef } from "react";
import { useRegisterTabScrollToTop } from "../../components/layout/tab-scroll-to-top-context";

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView | null>(null);

  useRegisterTabScrollToTop(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  });

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>FriendChise</Text>
      <Text style={styles.subtitle}>Choose your organization to continue.</Text>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Organization</Text>
        <OrgSwitcher />
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
});