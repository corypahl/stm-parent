import { writeFile } from "node:fs/promises";

const feedUrl = process.env.GOOGLE_CONTENT_FEED_URL?.trim();
const contentOutputUrl = new URL("../app/data/google-content.json", import.meta.url);
const newsletterOutputUrl = new URL("../app/data/google-newsletters.json", import.meta.url);
const latestNewsletterOutputUrl = new URL("../app/data/latest-newsletter.json", import.meta.url);

if (!feedUrl) {
  console.log("Inbox newsletter sync skipped: GOOGLE_CONTENT_FEED_URL is not configured.");
  process.exit(0);
}

const response = await fetch(feedUrl, { redirect: "follow" });
if (!response.ok) throw new Error(`Inbox newsletter feed returned ${response.status}.`);

const payload = await response.json();
if (Number(payload.version) < 6) {
  console.log("Inbox newsletter sync skipped: deploy Apps Script feed version 6 or newer.");
  process.exit(0);
}
if (!Array.isArray(payload.newsletters)) throw new Error("Inbox newsletter feed must contain a newsletters array.");

const newsletters = payload.newsletters.map((newsletter, index) => {
  if (!newsletter.title || !newsletter.newsletterDate || !newsletter.sourceUrl) {
    throw new Error(`Inbox newsletter ${index + 1} is missing a title, newsletter date, or source URL.`);
  }
  return {
    id: String(newsletter.id || `inbox-newsletter-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "-"),
    title: String(newsletter.title).trim(),
    newsletterDate: String(newsletter.newsletterDate),
    sourceUrl: String(newsletter.sourceUrl),
  };
}).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));

const latestNewsletter = newsletters[0] ?? null;

await Promise.all([
  writeFile(contentOutputUrl, "[]\n", "utf8"),
  writeFile(newsletterOutputUrl, `${JSON.stringify(newsletters, null, 2)}\n`, "utf8"),
  writeFile(latestNewsletterOutputUrl, `${JSON.stringify(latestNewsletter, null, 2)}\n`, "utf8"),
]);

console.log(`Synced ${newsletters.length} inbox newsletter(s); the newest issue is ${latestNewsletter ? latestNewsletter.title : "not available"}.`);
