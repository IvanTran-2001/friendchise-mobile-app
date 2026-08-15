import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { List, ListOrdered } from "lucide-react-native";
import { actions, RichEditor } from "react-native-pell-rich-editor";
import { colors, radius, spacing } from "../../src/lib/theme";
import { toRichTextHtml } from "../../src/lib/rich-text";
import { Text } from "./text";

type RichTextFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
};

/**
 * Larger rich-text style input for longer descriptions and notes.
 * Use this for multi-line task descriptions instead of a plain TextInput.
 */
export const RichTextField = forwardRef<RichEditor, RichTextFieldProps>(function RichTextField(
  { label, error, helperText, containerStyle, value = "", onChangeText, placeholder },
  ref,
) {
  /** Internal editor instance used for imperative toolbar actions. */
  const editorRef = useRef<RichEditor>(null);
  /** Tracks which formatting actions are currently active in the editor. */
  const [activeActions, setActiveActions] = useState<string[]>([]);
  /** Converts the current value into the HTML format required by the editor. */
  const initialHtml = useMemo(() => toRichTextHtml(value), [value]);
  /** Remembers the last raw HTML emitted by the editor so external updates can stay in sync. */
  const lastHtmlRef = useRef(value);
  /** Keeps the editor tall enough for a comfortable multi-line writing area. */
  const initialHeight = 280;

  /** Merges the internal editor ref with the forwarded ref so it never goes stale. */
  const setEditorRef = useCallback((node: RichEditor | null) => {
    editorRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  /** Mirrors the editor toolbar state into local React state for button styling. */
  const bindToolbar = useCallback(() => {
    editorRef.current?.registerToolbar((items) => {
      const nextActive = items.filter((item): item is string => typeof item === "string");
      setActiveActions(nextActive);
    });
  }, []);

  useEffect(() => {
    if (value === lastHtmlRef.current) {
      return;
    }

    lastHtmlRef.current = value;
    editorRef.current?.setContentHTML(toRichTextHtml(value));
  }, [value]);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.shell, error ? styles.shellError : null]}>
        <FormatBar
          activeActions={activeActions}
          onBoldPress={() => editorRef.current?.sendAction(actions.setBold, "result")}
          onItalicPress={() => editorRef.current?.sendAction(actions.setItalic, "result")}
          onUnderlinePress={() => editorRef.current?.sendAction(actions.setUnderline, "result")}
          onBulletListPress={() => editorRef.current?.sendAction(actions.insertBulletsList, "result")}
          onNumberedListPress={() => editorRef.current?.sendAction(actions.insertOrderedList, "result")}
        />
        <RichEditor
          ref={setEditorRef}
          useContainer={false}
                initialHeight={initialHeight}
          initialContentHTML={initialHtml}
          placeholder={placeholder}
          initialFocus={false}
          editorStyle={editorStyle}
          style={styles.editor}
          editorInitializedCallback={bindToolbar}
          onChange={(nextHtml) => {
            lastHtmlRef.current = nextHtml;
            onChangeText?.(nextHtml);
          }}
        />
      </View>
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

function ToolbarButton({
  label,
  icon,
  active,
  onPress,
  title,
}: {
  label?: string;
  icon?: ReactNode;
  active?: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      style={[styles.button, active ? styles.buttonActive : null]}
    >
      {icon ?? <View>{label ? <Text style={styles.buttonText}>{label}</Text> : null}</View>}
    </Pressable>
  );
}

function FormatBar({
  activeActions,
  onBoldPress,
  onItalicPress,
  onUnderlinePress,
  onBulletListPress,
  onNumberedListPress,
}: {
  activeActions: string[];
  onBoldPress: () => void;
  onItalicPress: () => void;
  onUnderlinePress: () => void;
  onBulletListPress: () => void;
  onNumberedListPress: () => void;
}) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarGroup}>
        <ToolbarButton
          label="B"
          title="Bold"
          active={activeActions.includes(actions.setBold)}
          onPress={onBoldPress}
        />
        <ToolbarButton
          label="I"
          title="Italic"
          active={activeActions.includes(actions.setItalic)}
          onPress={onItalicPress}
        />
        <ToolbarButton
          label="U"
          title="Underline"
          active={activeActions.includes(actions.setUnderline)}
          onPress={onUnderlinePress}
        />
      </View>

      <View style={styles.toolbarSeparator} />

      <View style={styles.toolbarGroup}>
        <ToolbarButton
          icon={
            <List
              size={16}
              strokeWidth={2.4}
              color={activeActions.includes(actions.insertBulletsList) ? colors.accent : colors.textPrimary}
            />
          }
          title="Bullet list"
          active={activeActions.includes(actions.insertBulletsList)}
          onPress={onBulletListPress}
        />
        <ToolbarButton
          icon={
            <ListOrdered
              size={16}
              strokeWidth={2.4}
              color={activeActions.includes(actions.insertOrderedList) ? colors.accent : colors.textPrimary}
            />
          }
          title="Numbered list"
          active={activeActions.includes(actions.insertOrderedList)}
          onPress={onNumberedListPress}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  toolbar: {
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toolbarSeparator: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  shell: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  shellError: {
    borderColor: colors.danger,
  },
  editor: {
    minHeight: 280,
    paddingHorizontal: spacing.lg,
    paddingVertical: 20,
  },
  helper: {
    marginTop: spacing.xs,
  },
  button: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 4,
  },
  buttonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 12,
    letterSpacing: 0.2,
  },
});

const editorStyle = {
  backgroundColor: colors.surface,
  color: colors.textPrimary,
  caretColor: colors.accent,
  placeholderColor: colors.textTertiary,
  contentCSSText:
    `html, body { margin: 0; padding: 0; background-color: ${colors.surface}; color: ${colors.textPrimary}; font-size: 15px; line-height: 23px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; } ` +
    `body { padding: 0; } ` +
    `p { margin: 0 0 16px 0; } ` +
    `p:last-child { margin-bottom: 0; } ` +
    `ul, ol { margin: 0 0 16px 20px; padding-left: 18px; } ` +
    `li { margin-bottom: 4px; } ` +
    `strong { font-weight: 700; } ` +
    `em { font-style: italic; } ` +
    `u { text-decoration: underline; }`,
} as const;