import assert from "node:assert/strict";
import test from "node:test";
import {
  isSignupFormUrl,
  newsletterWithText,
  normalizeOcrText,
  parseSmoreNewsletterHtml,
} from "../scripts/lib/smore-newsletter.mjs";

const content = {
  header: { title: "WEEKLY NOTES", subtitle: "08.08.26" },
  blocks: [
    { _t: "misc.separator" },
    { _t: "text.title", title: "Welcome back" },
    { _t: "text.paragraph", content: [{ c: ["The first day is almost here."], t: "p" }] },
    { _t: "image.single", photo: { full: "https://cdn.smore.com/image-one.png", alt_text: "" } },
    { _t: "button", text: "Family RSVP", cta: { url: "https://forms.gle/example" } },
    { _t: "misc.separator" },
    { _t: "text.title", title: "Uniforms" },
    { _t: "text.paragraph", content: [{ c: ["Uniform ordering is open."], t: "p" }] },
    { _t: "button", text: "Shop uniforms", cta: { url: "https://example.com/shop" } },
  ],
};
const html = `<script>newsletter:{js_content:${JSON.stringify(JSON.stringify(content))}}</script>`;

test("extracts native Smore text, image URLs, and signup forms", () => {
  const parsed = parseSmoreNewsletterHtml(html, { title: "Fallback", newsletterDate: "2026-08-01" });

  assert.equal(parsed.title, "WEEKLY NOTES");
  assert.equal(parsed.newsletterDate, "2026-08-08");
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0].heading, "Welcome back");
  assert.match(parsed.sections[0].nativeText, /The first day is almost here/);
  assert.doesNotMatch(parsed.sections[0].nativeText, /^Welcome back/);
  assert.deepEqual(parsed.imageUrls, ["https://cdn.smore.com/image-one.png"]);
  assert.deepEqual(parsed.signups, [{ title: "Family RSVP", url: "https://forms.gle/example" }]);
});

test("prefers an explicit email title date when the Smore subtitle year is wrong", () => {
  const mismatchedContent = {
    ...content,
    header: { title: "NEWS NOTES", subtitle: "01/06/25" },
  };
  const mismatchedHtml = `<script>newsletter:{js_content:${JSON.stringify(JSON.stringify(mismatchedContent))}}</script>`;
  const parsed = parseSmoreNewsletterHtml(mismatchedHtml, {
    title: "NEWS NOTES 01/06/26",
    newsletterDate: "2026-01-06",
  });

  assert.equal(parsed.newsletterDate, "2026-01-06");
});

test("unwraps a Google Form from an email security redirect", () => {
  const wrappedContent = {
    header: { title: "WEEKLY NOTES", subtitle: "08.10.26" },
    blocks: [
      { _t: "misc.separator" },
      {
        _t: "button",
        text: "New Family Orientation - RSVP",
        cta: { url: "https://urldefense.com/v3/__https://docs.google.com/forms/d/e/example/viewform?usp=publish-editor__;!!token$" },
      },
    ],
  };
  const wrappedHtml = `<script>newsletter:{js_content:${JSON.stringify(JSON.stringify(wrappedContent))}}</script>`;

  assert.deepEqual(parseSmoreNewsletterHtml(wrappedHtml).signups, [{
    title: "New Family Orientation - RSVP",
    url: "https://docs.google.com/forms/d/e/example/viewform?usp=publish-editor",
  }]);
});

test("combines native and OCR text into a searchable newsletter representation", () => {
  const parsed = parseSmoreNewsletterHtml(html);
  const newsletter = newsletterWithText({
    id: "smore-test",
    title: "Weekly Notes 8/8/26",
    newsletterDate: "2026-08-08",
    sourceUrl: "https://app.smore.com/n/test",
  }, parsed, new Map([["https://cdn.smore.com/image-one.png", "Canvas image reminder\nBring school supplies"]]));

  assert.match(newsletter.textContent, /The first day is almost here/);
  assert.match(newsletter.textContent, /Bring school supplies/);
  assert.equal(newsletter.textSections.length, 2);
  assert.equal(newsletter.ocrImageCount, 1);
  assert.equal(newsletter.textStatus, "available");
  assert.equal(newsletter.signups[0].url, "https://forms.gle/example");
});

test("recognizes supported form hosts and contextual signup links", () => {
  assert.equal(isSignupFormUrl("https://www.signupgenius.com/go/example"), true);
  assert.equal(isSignupFormUrl("https://docs.google.com/forms/d/e/example/viewform"), true);
  assert.equal(isSignupFormUrl("https://forms.office.com/r/example"), true);
  assert.equal(isSignupFormUrl("https://example.com/rsvp", "Register for family night"), true);
  assert.equal(isSignupFormUrl("https://virtus.org/", "Criminal Background Check Form"), false);
  assert.equal(isSignupFormUrl("https://security.example.com/?d=factsmgt.com", "Medication form and family portal"), false);
  assert.equal(isSignupFormUrl("https://example.com/shop", "Shop uniforms"), false);
  assert.equal(isSignupFormUrl("not a URL", "RSVP"), false);
});

test("normalizes OCR whitespace while preserving useful line breaks", () => {
  assert.equal(normalizeOcrText("  First line  \r\n\n Second   line "), "First line\nSecond line");
});
