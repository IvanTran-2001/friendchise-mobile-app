import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import MarkdownIt from "markdown-it";
import { colors, spacing } from "../../../lib/theme";
import { getRichTextImageReadUrl } from "../task-image-api";

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
  const blocks = source.replace(/\r\n/g, "\n").trim();
  /** Measures the available width for the HTML renderer. */
  const { width } = useWindowDimensions();
  /** Markdown parser configured to preserve HTML and render line breaks. */
  const markdown = useState(() => new MarkdownIt({ html: true, breaks: true, linkify: true }))[0];
  /** Markdown converted to HTML before signed image URLs are resolved. */
  const renderedHtml = markdown.render(blocks);
  /** Final HTML source passed to the renderer. */
  const [htmlSource, setHtmlSource] = useState(renderedHtml);

  /** Resolves org-owned storage-path images to signed URLs on the client. */
  useEffect(() => {
    /** Prevents stale async image lookups from updating unmounted state. */
    let cancelled = false;

    void resolveTaskRichTextHtml(orgId, renderedHtml)
      .then((nextHtml) => {
        if (!cancelled) {
          setHtmlSource(nextHtml);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtmlSource(renderedHtml);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, renderedHtml]);

  if (!blocks) {
    return null;
  }

  return (
    <RenderHTML
      contentWidth={width}
      source={{ html: htmlSource }}
      tagsStyles={htmlStyles}
      baseStyle={htmlBaseStyle}
    />
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
  /** Resolves each storage path and swaps in the signed read URL. */
  const entries = await Promise.all(paths.map(async (path) => [path, await getRichTextImageReadUrl(orgId, path)] as const));

  /** HTML string updated with signed image URLs. */
  let nextHtml = renderedHtml;
  for (const [path, signedUrl] of entries) {
    if (!signedUrl) continue;
    nextHtml = nextHtml.replaceAll(`src="${path}"`, `src="${signedUrl}"`);
    nextHtml = nextHtml.replaceAll(`src='${path}'`, `src='${signedUrl}'`);
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
