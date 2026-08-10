const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_PATTERN = MONTH_NAMES.join("|");
const UPCOMING_DATE_MARKER = new RegExp(
  `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–—]\\s*`,
  "gi",
);

export function extractNewsletterEvents(newsletters) {
  const ordered = [...newsletters]
    .filter((newsletter) => newsletter?.newsletterDate && Array.isArray(newsletter.textSections))
    .sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));
  const cutoff = ordered[0]?.newsletterDate;
  const eventsByKey = new Map();

  for (const newsletter of ordered) {
    for (const section of newsletter.textSections) {
      if (!isUpcomingDatesSection_(section)) continue;
      for (const event of eventsFromSection_(section.text, newsletter)) {
        if (cutoff && event.date < cutoff) continue;
        const key = `${event.date}|${normalizeTitle_(event.title)}`;
        if (!eventsByKey.has(key)) eventsByKey.set(key, event);
      }
    }
  }

  return [...eventsByKey.values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function isUpcomingDatesSection_(section) {
  const heading = String(section?.heading || "");
  return /\bupcoming\s+dates?\b/i.test(heading)
    && /\b(?:calendar|important)\b/i.test(heading);
}

function eventsFromSection_(value, newsletter) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const matches = [...text.matchAll(new RegExp(UPCOMING_DATE_MARKER.source, UPCOMING_DATE_MARKER.flags))];
  const events = [];

  matches.forEach((match, index) => {
    const next = matches[index + 1];
    const rawTitle = text.slice(match.index + match[0].length, next?.index ?? text.length);
    const titleAndTime = cleanEventTitle_(rawTitle);
    if (!titleAndTime.title) return;
    const date = dateForNewsletter_(match[1], Number(match[2]), newsletter.newsletterDate);
    if (!date) return;

    events.push({
      id: `newsletter-${slug_(newsletter.id || "issue")}-${date}-${slug_(titleAndTime.title)}`,
      date,
      title: titleAndTime.title,
      ...(titleAndTime.time ? { time: titleAndTime.time } : {}),
      details: `Automatically extracted from ${newsletter.title}. Verify details in the newsletter.`,
      category: categoryForTitle_(titleAndTime.title),
      sourceUrl: newsletter.sourceUrl,
      sourceLabel: newsletter.title,
    });
  });

  return events;
}

function cleanEventTitle_(value) {
  let title = String(value || "")
    .replace(/\s+(?:There is always|Dates? (?:are )?subject to change|Please (?:check|verify))\b[\s\S]*$/i, "")
    .trim();
  const time = timeFromText_(title);
  if (time?.source) title = title.replace(time.source, " ");
  title = title
    .replace(new RegExp(`\\s*:\\s*(?=${MONTH_PATTERN}\\s+\\d)\\s*[\\s\\S]*$`, "i"), "")
    .replace(/\s+/g, " ")
    .replace(/[\s,;:–—-]+$/g, "")
    .trim();
  return { title: title.slice(0, 180), time: time?.formatted };
}

function timeFromText_(value) {
  const range = String(value).match(/\b(\d{1,2})(?::(\d{2}))?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (range) {
    return {
      source: range[0],
      formatted: `${clock_(range[1], range[2])}–${clock_(range[3], range[4])} ${range[5].toLowerCase()}.m.`,
    };
  }
  const single = String(value).match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (!single) return undefined;
  return {
    source: single[0],
    formatted: `${clock_(single[1], single[2])} ${single[3].toLowerCase()}.m.`,
  };
}

function clock_(hours, minutes) {
  return `${Number(hours)}:${minutes || "00"}`;
}

function dateForNewsletter_(monthName, day, newsletterDate) {
  const month = MONTH_NAMES.findIndex((name) => name.toLowerCase() === monthName.toLowerCase());
  const received = new Date(`${newsletterDate}T12:00:00Z`);
  if (month < 0 || !Number.isInteger(day) || Number.isNaN(received.getTime())) return "";
  let year = received.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, month, day, 12));
  const fortyFiveDaysBefore = new Date(received);
  fortyFiveDaysBefore.setUTCDate(fortyFiveDaysBefore.getUTCDate() - 45);
  if (candidate < fortyFiveDaysBefore) {
    year += 1;
    candidate = new Date(Date.UTC(year, month, day, 12));
  }
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month || candidate.getUTCDate() !== day) return "";
  return candidate.toISOString().slice(0, 10);
}

function categoryForTitle_(title) {
  const text = title.toLowerCase();
  if (/no school|break|weekend|closed/.test(text)) return "No school";
  if (/mass|communion|holy|liturgy|catholic/.test(text)) return "Faith";
  if (/quarter|report card|conference|testing/.test(text)) return "Academic";
  if (/first day|last day|preschool|kindergarten|dismissal|half day|back to school/.test(text)) return "School day";
  return "Family event";
}

function normalizeTitle_(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug_(value) {
  return normalizeTitle_(value).replaceAll(" ", "-").slice(0, 80) || "event";
}
