import { escapeHtml, toRichTextHtml as sharedToRichTextHtml } from "../../lib/rich-text";

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "img",
  "video",
  "audio",
  "source",
  "div",
  "span",
  "code",
  "pre",
]);

const VOID_TAGS = new Set(["br", "img", "source"]);
const SAFE_URI_PATTERN = /^(https?:|mailto:|tel:|#|\/|orgs\/)/i;

/**
 * Returns true when the value already looks like HTML rich text.
 */
export function isHtmlRichText(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

/**
 * Removes unsafe tags, event handlers, and disallowed URI schemes from HTML.
 */
export function sanitizeRichTextHtml(value: string) {
  const withoutBlocks = value
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");

  return withoutBlocks.replace(/<\/?([a-z][\w-]*)([^>]*)>/gi, (match, rawTagName, rawAttributes) => {
    const tagName = String(rawTagName).toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    if (match.startsWith("</")) {
      return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;
    }

    const attributes = parseAllowedAttributes(tagName, String(rawAttributes));
    return `<${tagName}${attributes}>`;
  });
}

function parseAllowedAttributes(tagName: string, rawAttributes: string) {
  const allowedAttributes: Record<string, string[]> = {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    video: ["src", "controls", "autoplay", "loop", "muted", "playsinline", "poster"],
    audio: ["src", "controls", "autoplay", "loop", "muted"],
    source: ["src", "type"],
  };

  const allowed = allowedAttributes[tagName] ?? [];
  const attributes: string[] = [];

  for (const match of rawAttributes.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    const name = match[1].toLowerCase();
    if (!allowed.includes(name)) {
      continue;
    }

    const rawValue = match[3] ?? match[4] ?? match[5] ?? "";

    if (name.startsWith("on")) {
      continue;
    }

    if (["href", "src", "data"].includes(name) && !isSafeUri(rawValue, tagName, name)) {
      continue;
    }

    if (["controls", "autoplay", "loop", "muted", "playsinline", "allowfullscreen"].includes(name)) {
      attributes.push(` ${name}`);
      continue;
    }

    attributes.push(` ${name}="${escapeHtml(rawValue)}"`);
  }

  return attributes.join("");
}

function isSafeUri(rawValue: string, tagName: string, attributeName: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return false;
  }

  if (attributeName === "src" && tagName === "img" && trimmed.startsWith("data:image/")) {
    return true;
  }

  if (/^javascript:/i.test(trimmed) || /^data:text\//i.test(trimmed)) {
    return false;
  }

  return SAFE_URI_PATTERN.test(trimmed);
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