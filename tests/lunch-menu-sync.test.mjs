import assert from "node:assert/strict";
import test from "node:test";
import {
  findLatestLunchMenuCandidate,
  imageDimensions,
  lunchCellRectangles,
  lunchDaysFromOcr,
} from "../scripts/lib/lunch-menu.mjs";

const newsletter = {
  id: "smore-reb6y",
  title: "NEWS NOTES 05.26.26",
  newsletterDate: "2026-05-26",
  sourceUrl: "https://app.smore.com/n/reb6y",
};

test("finds the newest dated lunch-menu image independently of the newest newsletter", () => {
  const candidate = findLatestLunchMenuCandidate([
    {
      newsletter: { ...newsletter, id: "summer", title: "Summer Notes", newsletterDate: "2026-07-28" },
      parsed: { sections: [{ heading: "Lunch ordering", nativeText: "Ordering information", imageUrls: [] }] },
    },
    {
      newsletter,
      parsed: {
        sections: [{
          heading: "May",
          nativeText: "STM lunch May 2026.pdf.pdf",
          imageUrls: ["https://cdn.smore.com/lunch.png"],
        }],
      },
    },
  ]);

  assert.equal(candidate.month, 5);
  assert.equal(candidate.year, 2026);
  assert.equal(candidate.imageUrl, "https://cdn.smore.com/lunch.png");
  assert.equal(candidate.newsletter.sourceUrl, newsletter.sourceUrl);
});

test("maps the May 2026 weekday calendar grid into dated OCR rectangles", () => {
  const rectangles = lunchCellRectangles(1400, 1082, 2026, 5);
  assert.deepEqual(rectangles.map(({ day }) => day), [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29]);
  assert.deepEqual(rectangles[0], {
    day: 1,
    rectangle: { left: 1095, top: 234, width: 251, height: 118 },
  });
});

test("turns calendar-cell OCR into meals, sides, closures, and notes", () => {
  const candidate = {
    newsletter,
    imageUrl: "https://cdn.smore.com/lunch.png",
    month: 5,
    year: 2026,
  };
  const days = lunchDaysFromOcr(new Map([
    [4, "~ May the 4™ be with you 04\nChicken Patty\nGreen beans\nApple slices\nWG bun |"],
    [7, "No Hot Lunch available 07\nFirst Communioni\nBrunch\nStudents will still eatin\nthe cafeteria."],
    [13, "Tacos\nBeef & cheese\nLettuce/Tomato\nStrawberries"],
    [22, "oo\nNo School"],
    [25, "Memorial Day 25\nNo School"],
  ]), candidate);

  assert.deepEqual(days[0], {
    date: "2026-05-04T16:00:00Z",
    mainEntree: "Chicken Patty",
    sides: ["Green beans", "Apple slices", "WG bun"],
    notes: "May the 4th be with you.",
    gradeTags: ["all-school"],
    sourceUrl: newsletter.sourceUrl,
    sourceImageUrl: candidate.imageUrl,
    sourceNewsletterTitle: newsletter.title,
    isDemo: false,
  });
  assert.equal(days[1].mainEntree, "No hot lunch");
  assert.equal(days[1].notes, "First Communion brunch. Students will still eat in the cafeteria.");
  assert.equal(days[2].mainEntree, "Tacos with beef & cheese");
  assert.deepEqual(days[2].sides, ["Lettuce/Tomato", "Strawberries"]);
  assert.equal(days[3].mainEntree, "No school");
  assert.equal(days[4].notes, "Memorial Day.");
});

test("reads PNG dimensions without an image-processing dependency", () => {
  const pngHeader = Buffer.alloc(24);
  pngHeader.write("PNG", 1, "ascii");
  pngHeader.writeUInt32BE(1400, 16);
  pngHeader.writeUInt32BE(1082, 20);
  assert.deepEqual(imageDimensions(pngHeader), { width: 1400, height: 1082 });
});
