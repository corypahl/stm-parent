import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const outputUrl = new URL("../app/data/calendar.json", import.meta.url);

function unescapeIcal(value = "") {
  return value
    .replaceAll("\\n", "\n")
    .replaceAll("\\N", "\n")
    .replaceAll("\\,", ",")
    .replaceAll("\\;", ";")
    .replaceAll("\\\\", "\\")
    .trim();
}

function previousDay(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatClock(hours, minutes) {
  const suffix = hours >= 12 ? "p.m." : "a.m.";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseIcalDate(property) {
  if (!property) return undefined;
  const dateMatch = property.value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateMatch) return undefined;
  let [, year, month, day] = dateMatch;
  const timeMatch = property.value.match(/T(\d{2})(\d{2})/);
  let hours = timeMatch ? Number(timeMatch[1]) : undefined;
  let minutes = timeMatch ? Number(timeMatch[2]) : undefined;
  if (timeMatch && property.value.endsWith("Z")) {
    const instant = new Date(`${year}-${month}-${day}T${timeMatch[1]}:${timeMatch[2]}:00Z`);
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Detroit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant).map(({ type, value }) => [type, value]));
    year = parts.year;
    month = parts.month;
    day = parts.day;
    hours = Number(parts.hour);
    minutes = Number(parts.minute);
  }
  return {
    date: `${year}-${month}-${day}`,
    allDay: property.key.includes("VALUE=DATE") || !timeMatch,
    hours,
    minutes,
  };
}

function categoryFor(title, supplied) {
  const valid = new Set(["School day", "No school", "Family event", "Faith", "Academic"]);
  if (valid.has(supplied)) return supplied;
  const text = title.toLowerCase();
  if (/no school|break|weekend|closed/.test(text)) return "No school";
  if (/mass|communion|holy|good friday|liturgy|catholic/.test(text)) return "Faith";
  if (/quarter|report card|conference|testing/.test(text)) return "Academic";
  if (/first day|last day|dismissal|back to school|half day/.test(text)) return "School day";
  return "Family event";
}

export function parseCalendarIcs(source) {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  const events = [];

  for (const block of blocks) {
    const properties = new Map();
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const key = line.slice(0, colon);
      const baseKey = key.split(";", 1)[0];
      if (!properties.has(baseKey)) properties.set(baseKey, { key, value: line.slice(colon + 1) });
    }
    if (properties.get("STATUS")?.value === "CANCELLED") continue;
    const title = unescapeIcal(properties.get("SUMMARY")?.value);
    const start = parseIcalDate(properties.get("DTSTART"));
    const end = parseIcalDate(properties.get("DTEND"));
    if (!title || !start) continue;

    const description = unescapeIcal(properties.get("DESCRIPTION")?.value);
    const location = unescapeIcal(properties.get("LOCATION")?.value);
    const suppliedCategory = unescapeIcal(properties.get("CATEGORIES")?.value).split(",")[0];
    let time;
    if (!start.allDay && start.hours !== undefined && start.minutes !== undefined) {
      time = formatClock(start.hours, start.minutes);
      if (end?.hours !== undefined && end.minutes !== undefined) time += `–${formatClock(end.hours, end.minutes)}`;
    }
    const details = [location, description].filter(Boolean).join(" · ").replace(/\s*Source: St\. Martha 2026–27 Academic Calendar\s*/i, "").trim();
    const uid = properties.get("UID")?.value || `${title}-${start.date}`;
    const id = `google-${createHash("sha1").update(uid).digest("hex").slice(0, 12)}`;
    const inclusiveEnd = end?.allDay ? previousDay(end.date) : end?.date;

    events.push({
      id,
      date: start.date,
      ...(inclusiveEnd && inclusiveEnd !== start.date ? { endDate: inclusiveEnd } : {}),
      title,
      ...(time ? { time } : {}),
      ...(details ? { details } : {}),
      category: categoryFor(title, suppliedCategory),
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export async function syncGoogleCalendar() {
  const feedUrl = process.env.GOOGLE_CALENDAR_ICS_URL?.trim();
  if (!feedUrl) {
    console.log("Google Calendar sync skipped: GOOGLE_CALENDAR_ICS_URL is not configured.");
    return;
  }

  const response = await fetch(feedUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`Google Calendar feed returned ${response.status}.`);
  const events = parseCalendarIcs(await response.text());

  if (!events.length) {
    const existing = JSON.parse(await readFile(outputUrl, "utf8"));
    console.log(`Google Calendar is empty; keeping ${existing.length} school-issued calendar entries.`);
    return;
  }

  await writeFile(outputUrl, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  console.log(`Synced ${events.length} event(s) from Google Calendar.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await syncGoogleCalendar();
