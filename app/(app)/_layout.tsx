import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { AppNavbar } from "../../components/layout/app-navbar";
import { AppBottomBar } from "../../components/layout/app-bottom-bar";
import { TabScrollToTopProvider } from "../../components/layout/tab-scroll-to-top-context";

export default function AppLayout() {
  return (
    <TabScrollToTopProvider>
      <View style={styles.container}>
        <AppNavbar />
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </View>
        <AppBottomBar />
      </View>
    </TabScrollToTopProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    flex: 1,
  },
});