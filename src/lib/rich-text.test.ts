import { describe, expect, it } from "vitest";
import { isSafeUri, sanitizeRichTextHtml, toRichTextHtml } from "./rich-text";

describe("sanitizeRichTextHtml", () => {
  it("removes raw-text content, iframe content, and keeps allowlisted void and boolean attributes", () => {
    const html = [
      '<p>Hello<script>alert("x")</script><iframe src="https://example.com">bad<em>content</em></iframe>world</p>',
      '<img src="https://example.com/image.png" alt="Logo">',
      '<video controls><source src="https://example.com/movie.mp4" type="video/mp4"></video>',
    ].join("");

    expect(sanitizeRichTextHtml(html)).toBe(
      '<p>Helloworld</p><img src="https://example.com/image.png" alt="Logo"><video controls><source src="https://example.com/movie.mp4" type="video/mp4"></video>',
    );
  });

  it('adds rel protection for target="_blank" links', () => {
    expect(sanitizeRichTextHtml('<a href="https://example.com" target="_blank">Visit</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Visit</a>',
    );
  });
});

describe("isSafeUri", () => {
  it("rejects javascript and protocol-relative URIs while allowing safe image data URLs", () => {
    expect(isSafeUri("javascript:alert(1)", "a", "href")).toBe(false);
    expect(isSafeUri("//example.com/image.png", "img", "src")).toBe(false);
    expect(isSafeUri("data:image/svg+xml;base64,PHN2Zy8+", "img", "src")).toBe(false);
    expect(isSafeUri("data:image/png;base64,iVBORw0KGgo=", "img", "src")).toBe(true);
  });
});

describe("toRichTextHtml", () => {
  it("escapes literal closing-tag text instead of treating it as HTML", () => {
    expect(toRichTextHtml("Look </p> here")).toBe("<p>Look &lt;/p&gt; here</p>\n");
  });

  it("preserves newline breaks as br elements", () => {
    expect(toRichTextHtml("First line\nSecond line")).toBe("<p>First line<br>\nSecond line</p>\n");
  });

  it("renders markdown formatting instead of leaving marker text visible", () => {
    expect(toRichTextHtml("**Bold** and _italic_")).toBe("<p><strong>Bold</strong> and <em>italic</em></p>\n");
  });
});