import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../app/data/calendar.json", import.meta.url);
const outputUrl = new URL("../public/documents/st-martha-2026-27-calendar.ics", import.meta.url);
const events = JSON.parse(await readFile(sourceUrl, "utf8"));
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://corypahl.github.io/stm-parent").replace(/\/$/, "");

function compactDate(value) {
  return value.replaceAll("-", "");
}

function nextDay(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function escapeIcal(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function foldLine(line) {
  const chunks = [];
  let remaining = line;
  while (Buffer.byteLength(remaining, "utf8") > 73) {
    let end = Math.min(73, remaining.length);
    while (Buffer.byteLength(remaining.slice(0, end), "utf8") > 73) end -= 1;
    while (end > 1 && /[ \t]/.test(remaining[end - 1])) end -= 1;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  chunks.push(remaining);
  return chunks.join("\r\n ");
}

const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//St. Martha Unofficial Parent Site//Academic Calendar//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:St. Martha School Parent Events — Unofficial",
  "X-WR-TIMEZONE:America/Detroit",
];

for (const event of events) {
  const description = [event.time, event.details, "Source: St. Martha 2026–27 Academic Calendar"]
    .filter(Boolean)
    .join("\n");
  lines.push(
    "BEGIN:VEVENT",
    `UID:${event.id}@stm-parent`,
    "DTSTAMP:20260807T000000Z",
    `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
    `DTEND;VALUE=DATE:${compactDate(nextDay(event.endDate ?? event.date))}`,
    foldLine(`SUMMARY:${escapeIcal(event.title)}`),
    foldLine(`DESCRIPTION:${escapeIcal(description)}`),
    `CATEGORIES:${escapeIcal(event.category)}`,
    `URL:${siteUrl}/calendar.html`,
    "END:VEVENT",
  );
}

lines.push("END:VCALENDAR", "");
await writeFile(outputUrl, lines.join("\r\n"), "utf8");
console.log(`Generated ${events.length} calendar events at ${outputUrl.pathname}`);
