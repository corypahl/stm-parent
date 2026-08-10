import assert from "node:assert/strict";
import test from "node:test";
import { extractNewsletterEvents } from "../scripts/lib/newsletter-events.mjs";

test("extracts dated events from an Important Upcoming Dates newsletter section", () => {
  const events = extractNewsletterEvents([{
    id: "smore-3evgw",
    title: "Summer News Notes 08.10.26",
    newsletterDate: "2026-08-10",
    sourceUrl: "https://app.smore.com/n/3evgw",
    textSections: [{
      heading: "26-27 Calendar: Important Upcoming Dates",
      text: "August 11 - New Family Night 5:00pm August 20 - Meet the Miracles & Supply Drop-Off August 24 - First Day of School (Half Day): August 24, 25, 26 Kindergarten: Half Days September 9 - 4 YO Preschoolers begin September 10 - 3 YO Preschoolers begin There is always the possibility of a change throughout the school year.",
    }],
  }]);

  assert.equal(events.length, 5);
  assert.deepEqual(events[0], {
    id: "newsletter-smore-3evgw-2026-08-11-new-family-night",
    date: "2026-08-11",
    title: "New Family Night",
    time: "5:00 p.m.",
    details: "Automatically extracted from Summer News Notes 08.10.26. Verify details in the newsletter.",
    category: "Family event",
    sourceUrl: "https://app.smore.com/n/3evgw",
    sourceLabel: "Summer News Notes 08.10.26",
  });
  assert.equal(events[2].title, "First Day of School (Half Day)");
  assert.equal(events[3].date, "2026-09-09");
  assert.equal(events[3].category, "School day");
  assert.equal(events[4].title, "3 YO Preschoolers begin");
});

test("keeps future events from recent issues and ignores past dates", () => {
  const events = extractNewsletterEvents([
    {
      id: "new",
      title: "News Notes 09.01.26",
      newsletterDate: "2026-09-01",
      sourceUrl: "https://app.smore.com/n/new",
      textSections: [],
    },
    {
      id: "old",
      title: "News Notes 08.10.26",
      newsletterDate: "2026-08-10",
      sourceUrl: "https://app.smore.com/n/old",
      textSections: [{
        heading: "Important Upcoming Dates",
        text: "August 20 - Past gathering September 10 - Future gathering",
      }],
    },
  ]);

  assert.deepEqual(events.map((event) => event.title), ["Future gathering"]);
});
