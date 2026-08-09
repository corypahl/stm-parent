import assert from "node:assert/strict";
import test from "node:test";
import { getLatestNewsletterDate, isVolunteerSignupUrl, smoreEmbedUrl } from "../app/lib/newsletters";
import type { ContentItem } from "../app/types/content";

test("recognizes SignUpGenius and Google Forms action links", () => {
  assert.equal(isVolunteerSignupUrl("https://www.signupgenius.com/go/example"), true);
  assert.equal(isVolunteerSignupUrl("https://forms.gle/example"), true);
  assert.equal(isVolunteerSignupUrl("https://docs.google.com/forms/d/e/example/viewform"), true);
  assert.equal(isVolunteerSignupUrl("https://docs.google.com/document/d/example"), false);
  assert.equal(isVolunteerSignupUrl("https://example.com/forms.gle/example"), false);
  assert.equal(isVolunteerSignupUrl("not a url"), false);
});

test("uses the newsletter date instead of the import or publish date", () => {
  const items = [
    { newsletterDate: "2026-07-28", publishedAt: "2026-08-07T18:00:00Z" },
    { newsletterDate: "2026-08-04", publishedAt: "2026-08-05T18:00:00Z" },
    { publishedAt: "2026-08-08T18:00:00Z" },
  ] as ContentItem[];

  assert.equal(getLatestNewsletterDate(items), "2026-08-04");
});

test("creates the supported Smore iframe URL from a public newsletter link", () => {
  assert.equal(smoreEmbedUrl("https://app.smore.com/n/zk12p"), "https://secure.smore.com/n/zk12p?embed=1");
  assert.equal(smoreEmbedUrl("https://secure.smore.com/n/kzd0-embedding-your-smore-newsletter?ref=email"), "https://secure.smore.com/n/kzd0-embedding-your-smore-newsletter?embed=1");
  assert.equal(smoreEmbedUrl("https://example.com/n/zk12p"), undefined);
});
