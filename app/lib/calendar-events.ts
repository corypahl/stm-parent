import type { CalendarEvent } from "../types/content";

export function mergeCalendarEvents(officialEvents: CalendarEvent[], newsletterEvents: CalendarEvent[]) {
  const merged = [...officialEvents];

  for (const candidate of newsletterEvents) {
    const duplicate = merged.some((event) => event.date === candidate.date && eventsOverlap(event, candidate));
    if (!duplicate) merged.push(candidate);
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function eventsOverlap(existing: CalendarEvent, candidate: CalendarEvent) {
  const existingText = normalize(`${existing.title} ${existing.details ?? ""}`);
  const candidateTitle = normalize(candidate.title);
  if (existingText.includes(candidateTitle) || candidateTitle.includes(normalize(existing.title))) return true;

  return candidate.title
    .split(/\s+(?:&|and)\s+|[,/]/i)
    .map(normalize)
    .filter((part) => part.length >= 8)
    .some((part) => existingText.includes(part));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
