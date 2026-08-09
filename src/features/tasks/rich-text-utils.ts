const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/**
 * Returns true when the value already looks like HTML rich text.
 */
export function isHtmlRichText(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

/**
 * Escapes raw text so it can be safely embedded inside HTML.
 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Normalizes a plain value into HTML rich text.
 *
 * If the string already contains HTML, it is returned as-is. Otherwise the
 * value is escaped and wrapped in a paragraph tag.
 */
export function toRichTextHtml(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "<p></p>";
  }

  if (isHtmlRichText(trimmed)) {
    return trimmed;
  }

  return `<p>${escapeHtml(trimmed)}</p>`;
}

/**
 * Returns true when the HTML contains no visible text after stripping tags.
 */
export function isEmptyRichTextHtml(value: string) {
  const stripped = value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "")
    .replace(/<\/?(p|div|span|strong|em|u|ul|ol|li|blockquote|h[1-6])[^>]*>/gi, " ")
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

  return trimmed;
}