import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, spacing } from "../../src/lib/theme";

type DividerProps = {
  style?: StyleProp<ViewStyle>;
  inset?: boolean;
};

/** Thin horizontal rule used to separate list rows or sections. */
export function Divider({ style, inset }: DividerProps) {
  return <View style={[styles.line, inset && styles.inset, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    width: "100%",
  },
  inset: {
    marginLeft: spacing.lg,
  },
});
