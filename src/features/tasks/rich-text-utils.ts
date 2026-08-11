import { isHtmlRichText, sanitizeRichTextHtml, toRichTextHtml } from "../../lib/rich-text";

export { sanitizeRichTextHtml, isHtmlRichText, toRichTextHtml };

/**
 * Returns true when the HTML contains no visible text after stripping tags.
 */
export function isEmptyRichTextHtml(value: string) {
  const stripped = value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "")
    .replace(/<\/?(p|div|span|strong|em|u|ul|ol|li|blockquote|h[1-6])[^>]*>/gi, " ")
    .replace(/<(img|video|audio|source)\b[^>]*>/gi, " media ")
    .replace(/<[^>]+>/g, "")
    .trim();

  return stripped.length === 0;
}

/**
 * Normalizes stored rich text before submission.
 */
export function normalizeRichText(value?: string) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return "";
  }

  if (isEmptyRichTextHtml(trimmed)) {
    return "";
  }

  return sanitizeRichTextHtml(trimmed);
}