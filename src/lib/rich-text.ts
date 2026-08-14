import { Parser } from "htmlparser2";

/**
 * Escapes raw text so it can be safely embedded inside HTML.
 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
/** Tags whose raw content (scripts, styles) must never reach the output. */
const RAW_TEXT_TAGS = new Set(["script", "style"]);
const SAFE_URI_PATTERN = /^(https?:|mailto:|tel:|#|\/|orgs\/)/i;
const BOOLEAN_ATTRIBUTES = new Set(["controls", "autoplay", "loop", "muted", "playsinline", "allowfullscreen"]);
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  video: ["src", "controls", "autoplay", "loop", "muted", "playsinline", "poster"],
  audio: ["src", "controls", "autoplay", "loop", "muted"],
  source: ["src", "type"],
};

const HTML_TAG_PATTERN = new RegExp(`</?(?:${Array.from(ALLOWED_TAGS).join("|")})(?=[\\s>/])`, "i");

/**
 * Removes unsafe tags, event handlers, and disallowed URI schemes from HTML.
 *
 * Uses a real HTML tokenizer (the same parsing engine react-native-render-html
 * relies on) instead of regular expressions, so malformed tags, unquoted
 * attributes, and attribute values containing ">" are still parsed correctly.
 */
export function sanitizeRichTextHtml(value: string) {
  let output = "";
  /** Name of the raw-text tag (script/style) currently being skipped, if any. */
  let skipTagName: string | null = null;
  let skipNestLevel = 0;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();

        if (skipTagName) {
          if (tagName === skipTagName) skipNestLevel++;
          return;
        }

        if (RAW_TEXT_TAGS.has(tagName)) {
          skipTagName = tagName;
          skipNestLevel = 1;
          return;
        }

        if (!ALLOWED_TAGS.has(tagName)) {
          return;
        }

        output += `<${tagName}${buildAttributes(tagName, attribs)}>`;
      },
      onclosetag(name) {
        const tagName = name.toLowerCase();

        if (skipTagName) {
          if (tagName === skipTagName) {
            skipNestLevel--;
            if (skipNestLevel <= 0) {
              skipTagName = null;
            }
          }
          return;
        }

        if (!ALLOWED_TAGS.has(tagName) || VOID_TAGS.has(tagName)) {
          return;
        }

        output += `</${tagName}>`;
      },
      ontext(text) {
        if (skipTagName) return;
        output += escapeHtml(text);
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
  );

  parser.end(value);

  return output;
}

/**
 * Returns true when the value already looks like allowlisted HTML rich text.
 */
export function isHtmlRichText(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

/**
 * Filters and re-escapes the attributes of an allowed tag.
 */
function buildAttributes(tagName: string, attribs: Record<string, string>) {
  const allowed = ALLOWED_ATTRIBUTES[tagName] ?? [];
  let result = "";
  let hasTarget = false;
  let relValue: string | null = null;

  for (const [rawName, rawValue] of Object.entries(attribs)) {
    const name = rawName.toLowerCase();

    if (!allowed.includes(name) || name.startsWith("on")) {
      continue;
    }

    if (["href", "src", "poster"].includes(name) && !isSafeUri(rawValue, tagName, name)) {
      continue;
    }

    if (tagName === "a" && name === "target") {
      hasTarget = true;
    }

    if (tagName === "a" && name === "rel") {
      relValue = rawValue.trim();
      continue;
    }

    if (BOOLEAN_ATTRIBUTES.has(name)) {
      result += ` ${name}`;
      continue;
    }

    result += ` ${name}="${escapeHtml(rawValue)}"`;
  }

  if (tagName === "a" && hasTarget) {
    const relTokens = relValue ? relValue.split(/\s+/).filter(Boolean) : [];
    if (!relTokens.includes("noopener")) {
      relTokens.push("noopener");
    }
    if (!relTokens.includes("noreferrer")) {
      relTokens.push("noreferrer");
    }
    result += ` rel="${escapeHtml(relTokens.join(" "))}"`;
  } else if (relValue !== null) {
    result += ` rel="${escapeHtml(relValue)}"`;
  }

  return result;
}

function isSafeUri(rawValue: string, tagName: string, attributeName: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("//")) {
    return false;
  }

  const allowedImageDataMimeTypes = [
    "data:image/png",
    "data:image/jpeg",
    "data:image/jpg",
    "data:image/gif",
    "data:image/webp",
    "data:image/avif",
    "data:image/heic",
    "data:image/heif",
  ];

  if (
    attributeName === "src" &&
    tagName === "img" &&
    allowedImageDataMimeTypes.some((prefix) => trimmed === prefix || trimmed.startsWith(`${prefix};`) || trimmed.startsWith(`${prefix},`))
  ) {
    return true;
  }

  if (/^javascript:/i.test(trimmed) || /^data:text\//i.test(trimmed)) {
    return false;
  }

  return SAFE_URI_PATTERN.test(trimmed);
}

/**
 * Normalizes a value into HTML rich text for shared UI inputs.
 */
export function toRichTextHtml(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "<p></p>";
  }

  if (isHtmlRichText(trimmed)) {
    return sanitizeRichTextHtml(trimmed);
  }

  return `<p>${escapeHtml(trimmed).replace(/\r\n|\r|\n/g, "<br>")}</p>`;
}