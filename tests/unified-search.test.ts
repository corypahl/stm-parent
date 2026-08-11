import assert from "node:assert/strict";
import test from "node:test";
import { absoluteSourceHref } from "../app/lib/ai-search";
import { buildUnifiedSearchIndex, searchUnifiedIndex } from "../app/lib/unified-search";
import type { CalendarEvent, HandbookSection, NewsletterSummary } from "../app/types/content";

const calendarEvents: CalendarEvent[] = [{
  id: "family-night",
  date: "2026-08-11",
  title: "New Family Night",
  time: "6:00 PM",
  details: "Welcome for new families in the school gym.",
  category: "Family event",
}];
const handbookSections: HandbookSection[] = [{
  id: "attendance",
  title: "Attendance and Absences",
  content: "Parents must notify the school office when a student will be absent. Repeated tardiness affects instructional time.",
  subheadings: ["Reporting an absence", "Tardiness"],
  pageStart: 12,
  pageEnd: 13,
}];
const newsletters: NewsletterSummary[] = [{
  id: "news-notes",
  title: "News Notes 08/11/26",
  newsletterDate: "2026-08-11",
  sourceUrl: "https://app.smore.com/n/example",
  textContent: "Volunteer registration is open.",
  textSections: [{ heading: "Fall Festival Volunteers", text: "Use the SignUpGenius form to volunteer for the fall festival." }],
  signups: [{ id: "fall-festival", title: "Fall Festival Volunteer Form", url: "https://signupgenius.com/example" }],
  ocrImageCount: 1,
  textStatus: "available",
}];

const index = buildUnifiedSearchIndex({ calendarEvents, handbookSections, newsletters });

test("builds one searchable corpus from events, newsletters, and handbook sections", () => {
  assert.deepEqual(new Set(index.map((entry) => entry.kind)), new Set(["event", "newsletter", "handbook"]));
  assert.equal(index.length, 4);
});

test("ranks natural-language event questions and keeps a cited context excerpt", () => {
  const [result] = searchUnifiedIndex(index, "When is New Family Night?");
  assert.equal(result.kind, "event");
  assert.equal(result.title, "New Family Night");
  assert.match(result.context, /2026-08-11/);
  assert.match(result.context, /6:00 PM/);
});

test("finds policy and newsletter information with stop words removed", () => {
  assert.equal(searchUnifiedIndex(index, "What is the policy for reporting an absence?")[0].kind, "handbook");
  assert.equal(searchUnifiedIndex(index, "Are there any volunteer sign ups?")[0].kind, "newsletter");
});

test("returns no results for an empty or unrelated query", () => {
  assert.deepEqual(searchUnifiedIndex(index, ""), []);
  assert.deepEqual(searchUnifiedIndex(index, "snowmobile"), []);
});

test("expands site-relative citation links before sending sources to Apps Script", () => {
  assert.equal(
    absoluteSourceHref("/stm-parent/calendar.html#event-first-day-of-school", "https://corypahl.github.io"),
    "https://corypahl.github.io/stm-parent/calendar.html#event-first-day-of-school",
  );
  assert.equal(
    absoluteSourceHref("https://app.smore.com/n/example", "https://corypahl.github.io"),
    "https://app.smore.com/n/example",
  );
});
