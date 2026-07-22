import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Search } from "lucide-react-native";
import { colors, radius, spacing } from "../../src/lib/theme";

type SearchFieldProps = Omit<TextInputProps, "style"> & {
  autoFocusOnMount?: boolean;
};

/**
 * Search input with a leading icon, used in navbars and sheet modals.
 *
 * @example <SearchField placeholder="Search tasks" value={search} onChangeText={setSearch} />
 */
export function SearchField({ autoFocusOnMount, ...rest }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <Search size={16} strokeWidth={2.2} color={colors.textTertiary} />
      <TextInput
        autoFocus={autoFocusOnMount}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
