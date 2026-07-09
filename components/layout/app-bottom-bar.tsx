import { useRouter, useSegments } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCurrentOrgId } from "../../hooks/use-current-org-id";
import { useTabScrollToTop } from "./tab-scroll-to-top-context";

type NavButtonProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

function NavButton({ label, active, onPress }: NavButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AppBottomBar() {
  const router = useRouter();
  const segments = useSegments();
  const currentOrgId = useCurrentOrgId();
  const scrollToTop = useTabScrollToTop();
  const routeSegments = segments as unknown as string[];
  const orgIndex = routeSegments.indexOf("orgs");
  const routeOrgId = orgIndex >= 0 ? routeSegments[orgIndex + 1] ?? null : null;
  const isTasksRoute = !!routeOrgId && routeSegments[orgIndex + 2] === "tasks";

  const isOrgSelected = !!currentOrgId;
  const isHubActive = !routeOrgId;
  const isHomeActive = !!routeOrgId && !isTasksRoute;
  const isTasksActive = isTasksRoute;

  const goHub = () => {
    if (isHubActive) {
      scrollToTop();
      return;
    }

    router.replace("/(app)");
  };

  const goHome = () => {
    if (!currentOrgId) {
      return;
    }

    if (isHomeActive) {
      scrollToTop();
      return;
    }

    router.replace(`/(app)/orgs/${currentOrgId}`);
  };

  const goTasks = () => {
    if (!currentOrgId) {
      return;
    }

    if (isTasksActive) {
      scrollToTop();
      return;
    }

    router.replace(`/(app)/orgs/${currentOrgId}/tasks`);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        {!isOrgSelected ? (
          <NavButton label="Hub" active={isHubActive} onPress={goHub} />
        ) : (
          <>
            <NavButton label="Home" active={isHomeActive} onPress={goHome} />
            <NavButton label="Tasks" active={isTasksActive} onPress={goTasks} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#0B1220",
  },
  container: {
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#0B1220",
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  buttonActive: {
    borderColor: "rgba(96, 165, 250, 0.5)",
    backgroundColor: "rgba(37, 99, 235, 0.18)",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  buttonTextActive: {
    color: "#F8FAFC",
  },
});