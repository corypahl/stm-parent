const SIGNUP_HOSTS = new Set([
  "forms.gle",
  "forms.microsoft.com",
  "forms.office.com",
  "form.jotform.com",
  "jotform.com",
  "signup.com",
  "signupgenius.com",
]);

export function parseSmoreNewsletterHtml(html, fallback = {}) {
  const source = String(html || "");
  const contentMatch = source.match(/js_content:"((?:\\.|[^"\\])*)"/);
  if (!contentMatch) throw new Error("Smore newsletter content was not found.");

  const content = JSON.parse(JSON.parse(`"${contentMatch[1]}"`));
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const groups = groupBlocks_(blocks);
  const newsletterTitle = cleanText_(content.header?.title || fallback.title || "School newsletter");
  const newsletterDate = newsletterDateFrom_(content.header?.subtitle) || fallback.newsletterDate || "";

  const sections = groups.map((group, index) => sectionFromBlocks_(group, index));
  const signups = dedupeSignups_(sections.flatMap((section) => section.signups));

  return {
    title: newsletterTitle,
    newsletterDate,
    sections,
    signups,
    imageUrls: [...new Set(sections.flatMap((section) => section.imageUrls))],
  };
}

export function newsletterWithText(baseNewsletter, parsed, imageTextByUrl = new Map()) {
  const sections = parsed.sections.map((section) => {
    const ocrText = section.imageUrls
      .map((url) => cleanTextBlock_(imageTextByUrl.get(url) || ""))
      .filter(Boolean);
    const textParts = dedupeText_([section.nativeText, ...ocrText]);
    return {
      heading: section.heading,
      text: textParts.join("\n\n"),
    };
  }).filter((section) => section.text);

  return {
    ...baseNewsletter,
    title: cleanText_(baseNewsletter.title || parsed.title),
    newsletterDate: parsed.newsletterDate || baseNewsletter.newsletterDate,
    textContent: sections.map((section) => `${section.heading}\n${section.text}`).join("\n\n"),
    textSections: sections,
    signups: parsed.signups.map((signup, index) => ({
      id: `${baseNewsletter.id}-signup-${index + 1}`,
      title: signup.title,
      url: signup.url,
    })),
    ocrImageCount: parsed.imageUrls.filter((url) => imageTextByUrl.has(url)).length,
    textStatus: sections.length ? "available" : "unavailable",
  };
}

export function isSignupFormUrl(value, label = "") {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const knownHost = SIGNUP_HOSTS.has(hostname)
      || hostname.endsWith(".signupgenius.com")
      || hostname.endsWith(".jotform.com")
      || (hostname === "docs.google.com" && url.pathname.startsWith("/forms/"));
    return knownHost || /\b(sign\s*up|signup|rsvp|register|registration|volunteer|form)\b/i.test(label);
  } catch {
    return false;
  }
}

export function normalizeOcrText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function groupBlocks_(blocks) {
  const groups = [];
  let current = [];
  blocks.forEach((block) => {
    if (block?._t === "misc.separator") {
      if (current.length) groups.push(current);
      current = [];
    } else if (block) {
      current.push(block);
    }
  });
  if (current.length) groups.push(current);
  return groups;
}

function sectionFromBlocks_(blocks, index) {
  const nativeParts = [];
  const imageUrls = [];
  const signups = [];
  let heading = "";

  blocks.forEach((block) => {
    const blockText = blockText_(block);
    const preferredHeading = cleanText_(block.title || block.text || "");
    if (!heading && preferredHeading && block._t !== "button") heading = preferredHeading;
    nativeParts.push(...blockText);

    const imageUrl = normalizePublicUrl_(block.photo?.full || block.photo?.original_url || "");
    if (imageUrl) imageUrls.push(imageUrl);

    const label = cleanText_(block.text || block.title || blockText.join(" ") || "Sign up form");
    collectUrls_(block).forEach((url) => {
      if (isSignupFormUrl(url, label)) signups.push({ title: signupTitle_(label, url), url });
    });
  });

  const nativeText = dedupeText_(nativeParts)
    .filter((value) => cleanText_(value) !== cleanText_(heading));

  return {
    heading: (heading || `Section ${index + 1}`).slice(0, 180),
    nativeText: nativeText.join("\n\n"),
    imageUrls: [...new Set(imageUrls)],
    signups,
  };
}

function blockText_(block) {
  return dedupeText_([
    block.title,
    block.text,
    block.details,
    richText_(block.content),
    block.file_name,
    block.photo?.alt_text,
  ]);
}

function richText_(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(richText_).filter(Boolean).join(" ");
  if (node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, "c")) return richText_(node.c);
  return "";
}

function collectUrls_(node, urls = []) {
  if (!node || typeof node !== "object") return urls;
  if (Array.isArray(node)) {
    node.forEach((value) => collectUrls_(value, urls));
    return urls;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (["href", "url", "access_url"].includes(key) && typeof value === "string") {
      const normalized = normalizePublicUrl_(value);
      if (normalized) urls.push(normalized);
    } else if (value && typeof value === "object") {
      collectUrls_(value, urls);
    }
  });
  return [...new Set(urls)];
}

function normalizePublicUrl_(value) {
  const decoded = decodeHtmlEntities_(String(value || "")).replace(/[\])},.;!?]+$/, "");
  try {
    const url = new URL(decoded);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function signupTitle_(label, url) {
  const cleaned = cleanText_(label);
  if (cleaned && cleaned.length <= 180 && !/^https?:/i.test(cleaned)) return cleaned;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `Sign up form on ${host}`;
  } catch {
    return "Sign up form";
  }
}

function dedupeSignups_(signups) {
  const byUrl = new Map();
  signups.forEach((signup) => {
    if (!byUrl.has(signup.url)) byUrl.set(signup.url, signup);
  });
  return [...byUrl.values()];
}

function dedupeText_(values) {
  const result = [];
  values.forEach((value) => {
    const cleaned = cleanTextBlock_(value);
    if (cleaned && !result.includes(cleaned)) result.push(cleaned);
  });
  return result;
}

function cleanTextBlock_(value) {
  return decodeHtmlEntities_(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function cleanText_(value) {
  return cleanTextBlock_(value).replace(/\s+/g, " ").trim();
}

function newsletterDateFrom_(value) {
  const match = String(value || "").match(/\b(0?[1-9]|1[0-2])[./-](0?[1-9]|[12]\d|3[01])[./-](\d{2}|\d{4})\b/);
  if (!match) return "";
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : "";
}

function decodeHtmlEntities_(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return String(value || "").replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(named, lower)) return named[lower];
    if (lower[0] !== "#") return match;
    const hexadecimal = lower.startsWith("#x");
    const codePoint = Number.parseInt(lower.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
  });
}
