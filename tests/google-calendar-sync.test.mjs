import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCalendarIcs } from "../scripts/sync-google-calendar.mjs";

test("parses the generated school calendar feed", async () => {
  const source = await readFile(new URL("../public/documents/st-martha-2026-27-calendar.ics", import.meta.url), "utf8");
  const events = parseCalendarIcs(source);

  assert.equal(events.length, 44);
  assert.deepEqual(events[0], {
    id: events[0].id,
    date: "2026-08-20",
    title: "Student Walk Through",
    details: "4:00–5:30 p.m.\nMeet the Miracles, 5:30–7:00 p.m.",
    category: "Family event",
  });
  assert.equal(events.find((event) => event.title === "Christmas Break")?.endDate, "2027-01-03");
});

test("converts timed UTC events to Detroit time", () => {
  const source = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:test-timed",
    "DTSTART:20260910T220000Z",
    "DTEND:20260910T230000Z",
    "SUMMARY:Curriculum Night",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const [event] = parseCalendarIcs(source);
  assert.equal(event.date, "2026-09-10");
  assert.equal(event.time, "6:00 p.m.–7:00 p.m.");
});
