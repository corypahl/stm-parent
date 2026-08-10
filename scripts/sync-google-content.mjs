import { readFile, writeFile } from "node:fs/promises";
import { createWorker, PSM } from "tesseract.js";
import engLanguage from "@tesseract.js-data/eng";
import {
  newsletterWithText,
  normalizeOcrText,
  parseSmoreNewsletterHtml,
} from "./lib/smore-newsletter.mjs";
import { extractNewsletterEvents } from "./lib/newsletter-events.mjs";
import {
  findLatestLunchMenuCandidate,
  imageDimensions,
  lunchCellRectangles,
  lunchDaysFromOcr,
} from "./lib/lunch-menu.mjs";

const feedUrl = process.env.GOOGLE_CONTENT_FEED_URL?.trim();
const contentOutputUrl = new URL("../app/data/google-content.json", import.meta.url);
const newsletterOutputUrl = new URL("../app/data/google-newsletters.json", import.meta.url);
const latestNewsletterOutputUrl = new URL("../app/data/latest-newsletter.json", import.meta.url);
const newsletterEventsOutputUrl = new URL("../app/data/newsletter-events.json", import.meta.url);
const lunchOutputUrl = new URL("../app/data/lunch.json", import.meta.url);
const existingNewsletters = JSON.parse(await readFile(newsletterOutputUrl, "utf8"));
const existingLunchDays = JSON.parse(await readFile(lunchOutputUrl, "utf8"));

let baseNewsletters = existingNewsletters.map(publicNewsletterFields_);

if (!feedUrl) {
  console.log("Inbox newsletter feed is not configured; enriching the stored newsletter list.");
} else {
  const response = await fetch(feedUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`Inbox newsletter feed returned ${response.status}.`);
  const payload = await response.json();
  if (Number(payload.version) >= 6) {
    if (!Array.isArray(payload.newsletters)) throw new Error("Inbox newsletter feed must contain a newsletters array.");
    baseNewsletters = payload.newsletters.map((newsletter, index) => validateNewsletter_(newsletter, index));
  } else {
    console.log("Apps Script feed version 6 is not deployed yet; enriching the stored newsletter list.");
  }
}

baseNewsletters.sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));
const parsedNewsletters = await Promise.all(baseNewsletters.map(async (newsletter) => {
  try {
    const response = await fetch(newsletter.sourceUrl, { redirect: "follow" });
    if (!response.ok) throw new Error(`Smore returned ${response.status}.`);
    const parsed = parseSmoreNewsletterHtml(await response.text(), newsletter);
    return { newsletter, parsed };
  } catch (error) {
    console.warn(`Text extraction skipped for ${newsletter.title}: ${error.message || error}`);
    return { newsletter, parsed: null };
  }
}));

const imageUrls = [...new Set(parsedNewsletters.flatMap(({ parsed }) => parsed?.imageUrls || []))];
const imageTextByUrl = await recognizeImages_(imageUrls);
const lunchCandidate = findLatestLunchMenuCandidate(parsedNewsletters);
const lunchDays = lunchCandidate
  ? storedLunchMatchesCandidate_(existingLunchDays, lunchCandidate)
    ? existingLunchDays
    : await recognizeLunchMenu_(lunchCandidate).catch((error) => {
      console.warn(`Lunch menu extraction skipped: ${error.message || error}`);
      return existingLunchDays;
    })
  : existingLunchDays;
const existingById = new Map(existingNewsletters.map((newsletter) => [newsletter.id, newsletter]));

const newsletters = parsedNewsletters.map(({ newsletter, parsed }) => {
  if (parsed) return newsletterWithText(newsletter, parsed, imageTextByUrl);
  const existing = existingById.get(newsletter.id);
  return {
    ...newsletter,
    textContent: existing?.textContent || "",
    textSections: existing?.textSections || [],
    signups: existing?.signups || [],
    ocrImageCount: existing?.ocrImageCount || 0,
    textStatus: existing?.textContent ? "available" : "unavailable",
  };
}).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate) || a.title.localeCompare(b.title));

const latestNewsletter = newsletters[0]
  ? publicNewsletterFields_(newsletters[0])
  : null;
const newsletterEvents = extractNewsletterEvents(newsletters);

await Promise.all([
  writeFile(contentOutputUrl, "[]\n", "utf8"),
  writeFile(newsletterOutputUrl, `${JSON.stringify(newsletters, null, 2)}\n`, "utf8"),
  writeFile(latestNewsletterOutputUrl, `${JSON.stringify(latestNewsletter, null, 2)}\n`, "utf8"),
  writeFile(newsletterEventsOutputUrl, `${JSON.stringify(newsletterEvents, null, 2)}\n`, "utf8"),
  writeFile(lunchOutputUrl, `${JSON.stringify(lunchDays, null, 2)}\n`, "utf8"),
]);

const signupCount = newsletters.reduce((total, newsletter) => total + newsletter.signups.length, 0);
console.log(`Synced ${newsletters.length} inbox newsletter(s), ${imageTextByUrl.size} OCR image(s), ${signupCount} signup link(s), ${newsletterEvents.length} upcoming event(s), and ${lunchDays.length} lunch day(s).`);

async function recognizeImages_(urls) {
  const results = new Map();
  if (!urls.length) return results;

  const worker = await createWorker("eng", 1, {
    langPath: engLanguage.langPath,
    gzip: engLanguage.gzip,
    cacheMethod: "none",
  });

  try {
    for (const url of urls) {
      try {
        const response = await fetch(url, { redirect: "follow" });
        if (!response.ok) throw new Error(`image returned ${response.status}`);
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) throw new Error(`unexpected content type ${contentType || "unknown"}`);
        const image = Buffer.from(await response.arrayBuffer());
        if (image.length > 20 * 1024 * 1024) throw new Error("image exceeds the 20 MB OCR limit");
        const { data } = await worker.recognize(image);
        const text = normalizeOcrText(data.text);
        if (text) results.set(url, text);
      } catch (error) {
        console.warn(`OCR skipped for ${url}: ${error.message || error}`);
      }
    }
  } finally {
    await worker.terminate();
  }

  return results;
}

async function recognizeLunchMenu_(candidate) {
  const response = await fetch(candidate.imageUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`lunch menu image returned ${response.status}`);
  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > 20 * 1024 * 1024) throw new Error("lunch menu image exceeds the 20 MB OCR limit");
  const { width, height } = imageDimensions(image);
  const worker = await createWorker("eng", 1, {
    langPath: engLanguage.langPath,
    gzip: engLanguage.gzip,
    cacheMethod: "none",
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });
    const cellTextByDay = new Map();
    for (const { day, rectangle } of lunchCellRectangles(width, height, candidate.year, candidate.month)) {
      const { data } = await worker.recognize(image, { rectangle });
      const text = normalizeOcrText(data.text);
      if (text) cellTextByDay.set(day, text);
    }
    const days = lunchDaysFromOcr(cellTextByDay, candidate);
    if (!days.length) throw new Error("no dated lunch entries were recognized");
    return days;
  } finally {
    await worker.terminate();
  }
}

function storedLunchMatchesCandidate_(days, candidate) {
  return days.length > 0 && days.every((day) => day.sourceImageUrl === candidate.imageUrl);
}

function validateNewsletter_(newsletter, index) {
  if (!newsletter.title || !newsletter.newsletterDate || !newsletter.sourceUrl) {
    throw new Error(`Inbox newsletter ${index + 1} is missing a title, newsletter date, or source URL.`);
  }
  const normalized = publicNewsletterFields_(newsletter);
  const source = new URL(normalized.sourceUrl);
  if (source.protocol !== "https:" || (source.hostname !== "smore.com" && !source.hostname.endsWith(".smore.com"))) {
    throw new Error(`Inbox newsletter ${index + 1} does not use a public Smore URL.`);
  }
  return normalized;
}

function publicNewsletterFields_(newsletter) {
  return {
    id: String(newsletter.id || "inbox-newsletter").replace(/[^a-zA-Z0-9_-]/g, "-"),
    title: String(newsletter.title || "School newsletter").trim(),
    newsletterDate: String(newsletter.newsletterDate || ""),
    sourceUrl: String(newsletter.sourceUrl || ""),
  };
}
