import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppNavbar } from "../../../components/layout/app-navbar";
import { AppBottomBar } from "../../../components/layout/app-bottom-bar";
import { colors } from "../../../src/lib/theme";

export default function GlobalLayout() {
  return (
    <View style={styles.container}>
      <AppNavbar />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </View>
      <AppBottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
});