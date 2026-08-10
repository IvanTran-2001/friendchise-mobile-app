import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "../../src/lib/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  centered?: boolean;
  keyboardAvoiding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard screen container: applies the app background, safe-area edges,
 * and consistent horizontal padding. Use `scroll` for content that may
 * overflow the viewport, and `centered` for simple hero-style screens.
 *
 * @example
 * <Screen scroll>
 *   <ScreenHeader kicker="Organization" title="Choose your organization" />
 *   ...
 * </Screen>
 */
export function Screen({
  children,
  scroll = false,
  edges = ["bottom"],
  padded = true,
  centered = false,
  keyboardAvoiding = false,
  refreshing,
  onRefresh,
  style,
  contentStyle,
}: ScreenProps) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        padded && styles.padded,
        centered && styles.centered,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, centered && styles.centered, contentStyle]}>
      {children}
    </View>
  );

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.xxl,
  },
  centered: {
    justifyContent: "center",
  },
});
