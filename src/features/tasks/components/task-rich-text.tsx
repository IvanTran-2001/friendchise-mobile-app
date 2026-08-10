import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import RenderHTML from "react-native-render-html";
import MarkdownIt from "markdown-it";
import { colors, spacing } from "../../../lib/theme";
import { getRichTextImageReadUrl } from "../task-image-api";
import { sanitizeRichTextHtml } from "../rich-text-utils";

const markdownParser = new MarkdownIt({ html: true, breaks: true, linkify: true });

/**
 * Renders task descriptions as web-style markdown rich text.
 *
 * Markdown is rendered to HTML first, then any org-owned storage-path images
 * are resolved to signed read URLs before the markup is passed to the HTML
 * renderer.
 */

type TaskRichTextProps = {
  source: string;
  orgId?: string;
};

/**
 * Renders task descriptions as web-style markdown rich text.
 */
export function TaskRichText({ source, orgId }: TaskRichTextProps) {
  /** Normalized source text used by the renderer and image resolver. */
  const blocks = useMemo(() => source.replace(/\r\n/g, "\n").trim(), [source]);
  /** Markdown converted to HTML before signed image URLs are resolved. */
  const renderedHtml = useMemo(() => markdownParser.render(blocks), [blocks]);
  /** Sanitized HTML that strips unsafe tags and URI schemes before rendering. */
  const sanitizedHtml = useMemo(() => sanitizeRichTextHtml(renderedHtml), [renderedHtml]);
  const needsResolution = useMemo(() => !!orgId && renderedHtml.includes(`orgs/${orgId}/`), [orgId, renderedHtml]);
  /** Final HTML source passed to the renderer. */
  const [htmlSource, setHtmlSource] = useState(sanitizedHtml);
  /** Width of the actual content column inside the surrounding card/list layout. */
  const [contentWidth, setContentWidth] = useState(0);

  /** Resolves org-owned storage-path images to signed URLs on the client. */
  useEffect(() => {
    /** Prevents stale async image lookups from updating unmounted state. */
    let cancelled = false;

    setHtmlSource(sanitizedHtml);

    if (!needsResolution) {
      return () => {
        cancelled = true;
      };
    }

    void resolveTaskRichTextHtml(orgId, sanitizedHtml)
      .then((nextHtml) => {
        if (!cancelled) {
          setHtmlSource(nextHtml);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtmlSource(sanitizedHtml);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [needsResolution, orgId, sanitizedHtml]);

  if (!blocks) {
    return null;
  }

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0) {
          setContentWidth(nextWidth);
        }
      }}
    >
      {contentWidth > 0 ? (
        <RenderHTML
          contentWidth={contentWidth}
          source={{ html: htmlSource }}
          tagsStyles={htmlStyles}
          baseStyle={htmlBaseStyle}
        />
      ) : null}
    </View>
  );
}

/**
 * Prepares rendered task HTML for display by rewriting org-owned image URLs.
 */
async function resolveTaskRichTextHtml(orgId: string | undefined, renderedHtml: string) {
  if (!renderedHtml || !orgId) {
    return renderedHtml;
  }

  /** Collects the unique org storage paths embedded in rendered image tags. */
  const paths = Array.from(
    new Set(
      [...renderedHtml.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
        .map((match) => match[1])
        .filter((src) => src.startsWith(`orgs/${orgId}/`)),
    ),
  );

  if (paths.length === 0) {
    return renderedHtml;
  }

  return resolveHtmlWithSignedImageUrls(orgId, renderedHtml, paths);
}

/**
 * Rewrites org-owned image paths in rendered HTML to signed read URLs.
 */
async function resolveHtmlWithSignedImageUrls(orgId: string, renderedHtml: string, paths: string[]) {
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        return [path, await getRichTextImageReadUrl(orgId, path)] as const;
      } catch {
        return [path, path] as const;
      }
    }),
  );

  /** HTML string updated with signed image URLs. */
  let nextHtml = renderedHtml;
  for (const [path, signedUrl] of entries) {
    if (!signedUrl) continue;
    const escapedSignedUrl = signedUrl.replace(/&/g, "&amp;");
    nextHtml = nextHtml.replaceAll(`src="${path}"`, `src="${escapedSignedUrl}"`);
    nextHtml = nextHtml.replaceAll(`src='${path}'`, `src='${escapedSignedUrl}'`);
  }

  return nextHtml;
}

/** Shared base text style used by the HTML renderer. */
const htmlBaseStyle = {
  color: colors.textSecondary,
  fontSize: 14,
  lineHeight: 20,
};

/** Tag-specific HTML styles applied to rendered markdown output. */
const htmlStyles = {
  p: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 0,
    marginBottom: spacing.sm,
  },
  strong: {
    color: colors.textPrimary,
    fontWeight: "700" as const,
  },
  em: {
    fontStyle: "italic" as const,
  },
  u: {
    textDecorationLine: "underline" as const,
  },
  ul: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.lg,
  },
  ol: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.lg,
  },
  li: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
} as const;
