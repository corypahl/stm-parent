import type { CalendarEvent, HandbookSection, NewsletterSummary } from "../types/content";

export type UnifiedSearchKind = "newsletter" | "handbook" | "event";

export type UnifiedSearchEntry = {
  id: string;
  kind: UnifiedSearchKind;
  kindLabel: "Newsletter" | "Handbook" | "Event";
  title: string;
  subtitle: string;
  text: string;
  path: "/newsletters" | "/handbook" | "/calendar";
  hash: string;
  sourceUrl?: string;
};

export type UnifiedSearchResult = UnifiedSearchEntry & {
  score: number;
  snippet: string;
  context: string;
};

const stopWords = new Set([
  "a", "about", "an", "and", "are", "at", "be", "can", "do", "does", "for", "from", "how",
  "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "the", "there", "to", "was",
  "we", "what", "when", "where", "which", "who", "will", "with",
]);

export function buildUnifiedSearchIndex({
  handbookSections,
  newsletters,
  calendarEvents,
}: {
  handbookSections: HandbookSection[];
  newsletters: NewsletterSummary[];
  calendarEvents: CalendarEvent[];
}): UnifiedSearchEntry[] {
  const handbookEntries: UnifiedSearchEntry[] = handbookSections.map((section) => ({
    id: `handbook:${section.id}`,
    kind: "handbook",
    kindLabel: "Handbook",
    title: section.title,
    subtitle: formatHandbookPages_(section.pageStart, section.pageEnd),
    text: [section.title, ...section.subheadings, section.content].join("\n"),
    path: "/handbook",
    hash: `handbook-${section.id}`,
  }));

  const newsletterEntries: UnifiedSearchEntry[] = newsletters.flatMap((newsletter) =>
    [
      ...newsletter.textSections.map((section, index) => ({
        id: `newsletter:${newsletter.id}:${index + 1}`,
        kind: "newsletter" as const,
        kindLabel: "Newsletter" as const,
        title: section.heading,
        subtitle: `${newsletter.title} · ${formatDate_(newsletter.newsletterDate)}`,
        text: [section.heading, section.text, newsletter.title, newsletter.newsletterDate].join("\n"),
        path: "/newsletters" as const,
        hash: `newsletter-${newsletter.id}`,
        sourceUrl: newsletter.sourceUrl,
      })),
      ...newsletter.signups.map((signup, index) => ({
        id: `newsletter:${newsletter.id}:signup:${index + 1}`,
        kind: "newsletter" as const,
        kindLabel: "Newsletter" as const,
        title: signup.title,
        subtitle: `Sign-up form · ${newsletter.title} · ${formatDate_(newsletter.newsletterDate)}`,
        text: `Sign up signup registration volunteer form. ${signup.title}. Found in ${newsletter.title}.`,
        path: "/newsletters" as const,
        hash: `newsletter-${newsletter.id}`,
        sourceUrl: signup.url,
      })),
    ],
  );

  const eventEntries: UnifiedSearchEntry[] = calendarEvents.map((event) => ({
    id: `event:${event.id}`,
    kind: "event",
    kindLabel: "Event",
    title: event.title,
    subtitle: eventSubtitle_(event),
    text: [event.title, event.date, event.endDate, event.time, event.details, event.category].filter(Boolean).join("\n"),
    path: "/calendar",
    hash: `event-${event.id}`,
    sourceUrl: event.sourceUrl,
  }));

  return [...eventEntries, ...newsletterEntries, ...handbookEntries];
}

export function searchUnifiedIndex(entries: UnifiedSearchEntry[], query: string, limit = 12): UnifiedSearchResult[] {
  const normalizedQuery = normalize_(query);
  const terms = queryTerms_(query);
  if (!normalizedQuery || !terms.length) return [];

  return entries
    .map((entry) => scoredResult_(entry, normalizedQuery, terms))
    .filter((result): result is UnifiedSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function scoredResult_(entry: UnifiedSearchEntry, normalizedQuery: string, terms: string[]): UnifiedSearchResult | null {
  const title = normalize_(entry.title);
  const subtitle = normalize_(entry.subtitle);
  const text = normalize_(entry.text);
  const searchable = `${title} ${subtitle} ${text}`;
  const matchedTerms = terms.filter((term) => searchable.includes(term));
  if (!matchedTerms.length) return null;

  let score = matchedTerms.length * 4;
  if (title.includes(normalizedQuery)) score += 32;
  else if (searchable.includes(normalizedQuery)) score += 18;
  for (const term of matchedTerms) {
    if (title.includes(term)) score += 9;
    if (subtitle.includes(term)) score += 4;
    score += Math.min(3, occurrences_(text, term));
  }
  score += (matchedTerms.length / terms.length) * 12;
  if (entry.kind === "event" && /\b(when|date|calendar|event)\b/i.test(normalizedQuery)) score += 3;

  return {
    ...entry,
    score,
    snippet: excerpt_(entry.text, matchedTerms, 280),
    context: excerpt_(entry.text, matchedTerms, 1400),
  };
}

function queryTerms_(value: string) {
  const terms = normalize_(value)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 2 && !stopWords.has(term));
  return [...new Set(terms.length ? terms : normalize_(value).split(/\s+/).filter(Boolean))];
}

function normalize_(value: string) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bpolicies\b/g, "policy")
    .replace(/\bsign[\s-]*ups?\b/g, "signup")
    .replace(/\bregistrations?\b/g, "register")
    .replace(/\babsences?\b/g, "absence")
    .replace(/\bvolunteers?\b/g, "volunteer")
    .replace(/\s+/g, " ")
    .trim();
}

function occurrences_(text: string, term: string) {
  let count = 0;
  let index = 0;
  while ((index = text.indexOf(term, index)) >= 0 && count < 3) {
    count += 1;
    index += term.length;
  }
  return count;
}

function excerpt_(value: string, terms: string[], length: number) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const lower = normalize_(text);
  const positions = terms.map((term) => lower.indexOf(term)).filter((position) => position >= 0);
  const matchAt = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, matchAt - Math.floor(length * 0.25));
  const raw = text.slice(start, start + length);
  const beginning = start > 0 ? raw.replace(/^\S*\s*/, "") : raw;
  const ending = start + length < text.length ? beginning.replace(/\s+\S*$/, "") : beginning;
  return `${start > 0 ? "…" : ""}${ending.trim()}${start + length < text.length ? "…" : ""}`;
}

function formatHandbookPages_(start: number, end: number) {
  return end > start ? `Pages ${start}–${end}` : `Page ${start}`;
}

function formatDate_(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function eventSubtitle_(event: CalendarEvent) {
  const start = formatDate_(event.date);
  const dates = event.endDate ? `${start}–${formatDate_(event.endDate)}` : start;
  return [dates, event.time, event.category].filter(Boolean).join(" · ");
}
