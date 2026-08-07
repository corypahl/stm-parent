import { writeFile } from "node:fs/promises";

const feedUrl = process.env.GOOGLE_CONTENT_FEED_URL?.trim();
const outputUrl = new URL("../app/data/google-content.json", import.meta.url);

if (!feedUrl) {
  console.log("Google content sync skipped: GOOGLE_CONTENT_FEED_URL is not configured.");
  process.exit(0);
}

const response = await fetch(feedUrl, { redirect: "follow" });
if (!response.ok) throw new Error(`Google content feed returned ${response.status}.`);

const payload = await response.json();
if (!Array.isArray(payload.items)) throw new Error("Google content feed must contain an items array.");

const allowedTypes = new Set(["announcement", "event", "deadline", "action", "volunteer", "signup", "form", "other"]);
const now = new Date().toISOString();
const items = payload.items.map((item, index) => {
  if (!item.title || typeof item.title !== "string") throw new Error(`Google content item ${index + 1} is missing a title.`);
  const contentType = allowedTypes.has(item.contentType) ? item.contentType : "announcement";
  return {
    id: `google-${String(item.id ?? index + 1).replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    title: item.title.trim(),
    summary: String(item.summary ?? "").trim(),
    contentType,
    gradeTags: Array.isArray(item.gradeTags) && item.gradeTags.length ? item.gradeTags : ["all-school"],
    categoryTags: Array.isArray(item.categoryTags) ? item.categoryTags : ["Forwarded school email"],
    ...(item.startAt ? { startAt: item.startAt } : {}),
    ...(item.endAt ? { endAt: item.endAt } : {}),
    ...(item.deadlineAt ? { deadlineAt: item.deadlineAt } : {}),
    ...(item.location ? { location: item.location } : {}),
    ...(item.actionUrl ? { actionUrl: item.actionUrl, actionLabel: item.actionLabel || "Open link" } : {}),
    sourceUrl: item.sourceUrl || "https://st-martha.org/school",
    sourceLabel: "Reviewed school email",
    status: "published",
    actionStatus: item.actionStatus || "unknown",
    needsReview: false,
    isDemo: false,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || payload.updatedAt || now,
    publishedAt: item.publishedAt || payload.updatedAt || now,
  };
});

await writeFile(outputUrl, `${JSON.stringify(items, null, 2)}\n`, "utf8");
console.log(`Synced ${items.length} approved email item(s) from Google.`);
