const PUBLIC_FEED_VERSION = 6;
const INBOX_SEARCH_BATCH_SIZE = 100;

/**
 * Run once after installing this version. The newsletter feed reads Gmail when
 * the public web-app URL is requested, so the old import and publishing
 * triggers are no longer needed.
 */
function setupParentSite() {
  removeLegacyTriggers_();
  const newsletters = newsletterArchiveFromInbox_();
  console.log(`Inbox newsletter feed ready with ${newsletters.length} newsletter(s).`);
  return newsletters.length;
}

/**
 * Compatibility stubs for triggers created by older versions. Reloading the
 * Apps Script project and running setupParentSite removes those triggers.
 */
function processInbox() {
  console.log("No import is needed. The public feed reads newsletters directly from the inbox.");
  return 0;
}

function publishApproved() {
  console.log("No approval or publishing step is needed.");
  return 0;
}

function importPendingNewsletters() {
  console.log("No section import is needed.");
  return 0;
}

function doGet() {
  const newsletters = newsletterArchiveFromInbox_();
  const latestNewsletter = latestNewsletterFromArchive_(newsletters);

  return ContentService
    .createTextOutput(JSON.stringify({
      version: PUBLIC_FEED_VERSION,
      updatedAt: new Date().toISOString(),
      latestNewsletter,
      newsletters,
      items: [],
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function newsletterArchiveFromInbox_() {
  const records = [];
  let start = 0;

  while (true) {
    const threads = GmailApp.search("in:inbox", start, INBOX_SEARCH_BATCH_SIZE);
    threads.forEach((thread) => {
      thread.getMessages().forEach((message) => {
        records.push({
          id: message.getId(),
          receivedAt: message.getDate(),
          subject: message.getSubject(),
          plainBody: message.getPlainBody(),
          htmlBody: message.getBody(),
        });
      });
    });

    if (threads.length < INBOX_SEARCH_BATCH_SIZE) break;
    start += INBOX_SEARCH_BATCH_SIZE;
  }

  return newsletterArchiveFromEmailRecords_(records);
}

function newsletterArchiveFromEmailRecords_(records) {
  const byId = {};

  records.forEach((record) => {
    const receivedAt = isoValue_(record.receivedAt);
    const subject = cleanSubject_(record.subject);
    const bodyTitle = smoreLinkTitle_(record.htmlBody);
    const title = cleanNewsletterTitle_(subject || bodyTitle || "School newsletter");
    const newsletterDate = newsletterDateFrom_(subject)
      || newsletterDateFrom_(bodyTitle)
      || dateOnlyValue_(record.receivedAt);

    smoreUrlsFrom_(record.plainBody, record.htmlBody).forEach((sourceUrl) => {
      const slug = sourceUrl.match(/\/n\/([a-z0-9-]+)/i)?.[1];
      if (!slug || !newsletterDate) return;
      const id = `smore-${slug}`;
      if (!byId[id] || receivedAt > byId[id].receivedAt) {
        byId[id] = { id, title, newsletterDate, sourceUrl, receivedAt };
      }
    });
  });

  return Object.keys(byId)
    .map((id) => byId[id])
    .sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate) || b.receivedAt.localeCompare(a.receivedAt))
    .map((newsletter) => ({
      id: newsletter.id,
      title: newsletter.title,
      newsletterDate: newsletter.newsletterDate,
      sourceUrl: newsletter.sourceUrl,
    }));
}

function latestNewsletterFromArchive_(newsletters) {
  if (!newsletters.length) return null;
  const latest = newsletters[0];
  return {
    id: latest.id,
    title: latest.title,
    newsletterDate: latest.newsletterDate,
    sourceUrl: latest.sourceUrl,
  };
}

function smoreUrlsFrom_() {
  const source = Array.prototype.slice.call(arguments).filter(Boolean).join("\n");
  const matches = source.match(/https?:\/\/[^\s<>"']+/gi) || [];
  const urls = [];

  matches.forEach((match) => {
    const canonical = canonicalSmoreUrl_(normalizeUrl_(match));
    if (canonical && urls.indexOf(canonical) < 0) urls.push(canonical);
  });

  return urls;
}

function canonicalSmoreUrl_(value) {
  const match = String(value || "").match(/^https?:\/\/(?:[a-z0-9-]+\.)*smore\.com\/n\/([a-z0-9-]+)/i);
  return match ? `https://app.smore.com/n/${match[1].toLowerCase()}` : "";
}

function smoreLinkTitle_(html) {
  const source = String(html || "");
  const anchors = source.match(/<a\b[^>]*href=["'][^"']*smore\.com\/n\/[^"']+["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchors) {
    const title = cleanText_(anchor.replace(/^<a\b[^>]*>/i, "").replace(/<\/a>$/i, ""));
    if (title) return title;
  }
  return "";
}

function cleanSubject_(subject) {
  return String(subject || "").replace(/^(?:(?:fwd?|re):\s*)+/gi, "").trim();
}

function cleanNewsletterTitle_(value) {
  return cleanText_(value)
    .replace(/^[-\s]+|[-\s]+$/g, "")
    .slice(0, 180) || "School newsletter";
}

function cleanText_(value) {
  return decodeHtmlEntities_(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function newsletterDateFrom_(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b(0?[1-9]|1[0-2])[.\/-](0?[1-9]|[12]\d|3[01])[.\/-](\d{2}|\d{4})\b/);
  if (match) {
    const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
    const month = Number(match[1]);
    const day = Number(match[2]);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return "";
}

function dateOnlyValue_(value) {
  const date = asDate_(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

function normalizeUrl_(value) {
  let normalized = decodeHtmlEntities_(String(value || "")).replace(/[\])},.;!?]+$/, "");
  const redirect = normalized.match(/[?&](?:url|u|target)=([^&]+)/i);
  if (redirect) {
    try {
      const unwrapped = decodeURIComponent(redirect[1]);
      if (/^https?:\/\//i.test(unwrapped)) normalized = unwrapped;
    } catch (error) {
      // Keep the original URL when a redirect parameter is malformed.
    }
  }
  return normalized;
}

function decodeHtmlEntities_(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return String(value || "").replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(named, lower)) return named[lower];
    if (lower[0] !== "#") return match;
    const hexadecimal = lower.slice(0, 2) === "#x";
    const codePoint = Number.parseInt(lower.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch (error) {
      return match;
    }
  });
}

function asDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function isoValue_(value) {
  const date = asDate_(value);
  return date ? date.toISOString() : "";
}

function removeLegacyTriggers_() {
  const legacyHandlers = ["processInbox", "publishApproved", "importPendingNewsletters"];
  ScriptApp.getProjectTriggers()
    .filter((trigger) => legacyHandlers.indexOf(trigger.getHandlerFunction()) >= 0)
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}
