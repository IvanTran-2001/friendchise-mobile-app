import { sanitizeRichTextHtml, toRichTextHtml as sharedToRichTextHtml } from "../../lib/rich-text";

export { sanitizeRichTextHtml };

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/**
 * Returns true when the value already looks like HTML rich text.
 */
export function isHtmlRichText(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

/**
 * Normalizes a plain value into HTML rich text.
 *
 * If the string already contains HTML, it is returned as-is. Otherwise the
 * value is escaped and wrapped in a paragraph tag.
 */
export function toRichTextHtml(value: string) {
  const html = sharedToRichTextHtml(value);
  return isHtmlRichText(html) ? sanitizeRichTextHtml(html) : html;
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