import { isHtmlRichText, sanitizeRichTextHtml, toRichTextHtml as sharedToRichTextHtml } from "../../lib/rich-text";

export { sanitizeRichTextHtml, isHtmlRichText };

/**
 * Normalizes a plain value into HTML rich text.
 *
 * If the string already contains HTML, it is returned as-is. Otherwise the
 * value is escaped and wrapped in a paragraph tag.
 */
export function toRichTextHtml(value: string) {
  return sharedToRichTextHtml(value);
}

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