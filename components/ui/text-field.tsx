import { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Text } from "./text";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Labeled text input with helper/error text. Use for forms across the app
 * instead of a bare `TextInput` so spacing and states stay consistent.
 *
 * @example <TextField label="Email" value={email} onChangeText={setEmail} />
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, containerStyle, style, ...rest },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="tertiary" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
