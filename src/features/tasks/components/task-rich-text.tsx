import type { ReactNode } from "react";
import { Image, Linking, StyleSheet, Text as RNText, View } from "react-native";
import { colors, radius, spacing } from "../../../lib/theme";

type RichToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string }
  | { type: "image"; alt: string; src: string };

type TaskRichTextProps = {
  source: string;
};

export function TaskRichText({ source }: TaskRichTextProps) {
  const blocks = source.replace(/\r\n/g, "\n").trim();

  if (!blocks) {
    return null;
  }

  return <View style={styles.container}>{renderBlocks(blocks)}</View>;
}

function renderBlocks(source: string): ReactNode[] {
  const blocks = source.split(/\n{2,}/);

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const listItems = lines.filter((line) => /^([*-]|\d+\.)\s+/.test(line));
    const isListBlock = lines.length > 0 && listItems.length === lines.length;

    if (isListBlock) {
      const ordered = /^\d+\./.test(listItems[0]);

      return (
        <View key={`block-${blockIndex}`} style={styles.listBlock}>
          {listItems.map((line, itemIndex) => {
            const content = line.replace(/^([*-]|\d+\.)\s+/, "");
            return (
              <View key={`item-${blockIndex}-${itemIndex}`} style={styles.listRow}>
                <RNText style={styles.listBullet}>{ordered ? `${itemIndex + 1}.` : "•"}</RNText>
                <View style={styles.listContent}>{renderInline(content, `list-${blockIndex}-${itemIndex}`)}</View>
              </View>
            );
          })}
        </View>
      );
    }

    if (block.trim().startsWith(">")) {
      const quote = block
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n");

      return (
        <View key={`block-${blockIndex}`} style={styles.quoteBlock}>
          {quote.split("\n").map((line, lineIndex) => (
            <RNText key={`quote-${blockIndex}-${lineIndex}`} style={styles.paragraph}>
              {renderInline(line, `quote-${blockIndex}-${lineIndex}`)}
            </RNText>
          ))}
        </View>
      );
    }

    return (
      <RNText key={`block-${blockIndex}`} style={styles.paragraph}>
        {renderInline(block, `paragraph-${blockIndex}`)}
      </RNText>
    );
  });
}

function renderInline(source: string, keyPrefix: string): ReactNode[] {
  const tokens = tokenizeInline(source);

  return tokens.map((token, index) => {
    if (token.type === "text") {
      return <RNText key={`${keyPrefix}-text-${index}`}>{token.value}</RNText>;
    }

    if (token.type === "bold") {
      return (
        <RNText key={`${keyPrefix}-bold-${index}`} style={styles.bold}>
          {token.value}
        </RNText>
      );
    }

    if (token.type === "italic") {
      return (
        <RNText key={`${keyPrefix}-italic-${index}`} style={styles.italic}>
          {token.value}
        </RNText>
      );
    }

    if (token.type === "code") {
      return (
        <RNText key={`${keyPrefix}-code-${index}`} style={styles.code}>
          {token.value}
        </RNText>
      );
    }

    if (token.type === "link") {
      return (
        <RNText
          key={`${keyPrefix}-link-${index}`}
          style={styles.link}
          onPress={() => {
            void Linking.openURL(token.href);
          }}
          accessibilityRole="link"
          suppressHighlighting
        >
          {token.value}
        </RNText>
      );
    }

    return <Image key={`${keyPrefix}-image-${index}`} source={{ uri: token.src }} accessibilityLabel={token.alt} style={styles.image} />;
  });
}

function tokenizeInline(source: string): RichToken[] {
  const tokens: RichToken[] = [];
  const pattern = /(!\[[^\]]*\]\([^\)]+\)|\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, index) });
    }

    const fragment = match[0];
    if (fragment.startsWith("![")) {
      const alt = fragment.slice(2, fragment.indexOf("]"));
      const src = fragment.slice(fragment.indexOf("(") + 1, -1);
      tokens.push({ type: "image", alt, src });
    } else if (fragment.startsWith("[")) {
      const value = fragment.slice(1, fragment.indexOf("]"));
      const href = fragment.slice(fragment.indexOf("(") + 1, -1);
      tokens.push({ type: "link", value, href });
    } else if (fragment.startsWith("**") || fragment.startsWith("__")) {
      tokens.push({ type: "bold", value: fragment.slice(2, -2) });
    } else if (fragment.startsWith("`")) {
      tokens.push({ type: "code", value: fragment.slice(1, -1) });
    } else if (fragment.startsWith("*") || fragment.startsWith("_")) {
      tokens.push({ type: "italic", value: fragment.slice(1, -1) });
    }

    lastIndex = index + fragment.length;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", value: source.slice(lastIndex) });
  }

  return tokens;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  code: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontFamily: "monospace",
  },
  link: {
    color: colors.accent,
    textDecorationLine: "underline",
  },
  image: {
    width: "100%",
    minHeight: 160,
    borderRadius: radius.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.surfaceMuted,
  },
  listBlock: {
    gap: spacing.xs,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  listBullet: {
    color: colors.textSecondary,
    lineHeight: 20,
    width: 16,
  },
  listContent: {
    flex: 1,
    minWidth: 0,
  },
  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    gap: spacing.xs,
  },
});
