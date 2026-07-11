import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { clearAuthToken, getAuthToken } from "../src/features/auth/token-store";
import { getLastRoute } from "../src/features/navigation/last-route-store";
import { isJwtExpired } from "../src/features/auth/jwt-utils";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.all([getAuthToken(), getLastRoute()]).then(([token, lastRoute]) => {
      if (!alive) {
        return;
      }

      if (token && isJwtExpired(token)) {
        void clearAuthToken();
        setTarget("/(auth)/login");
        return;
      }

      const nextTarget =
        token && lastRoute && lastRoute !== "/" ? lastRoute : "/(app)";

      setTarget(token ? nextTarget : "/(auth)/login");
    }).catch(() => {
      if (!alive) {
        return;
      }

      setTarget("/(auth)/login");
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