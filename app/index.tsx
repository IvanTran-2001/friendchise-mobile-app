import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { getAuthToken } from "../src/features/auth/token-store";

export default function Index() {
  const [target, setTarget] = useState<"/(auth)/login" | "/(app)/tasks" | null>(
    null,
  );

  useEffect(() => {
    let alive = true;

    getAuthToken().then((token) => {
      if (!alive) {
        return;
      }

      setTarget(token ? "/(app)/tasks" : "/(auth)/login");
    });

    return () => {
      alive = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading FriendChise...</Text>
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#F8FAFC",
    fontSize: 16,
  },
});