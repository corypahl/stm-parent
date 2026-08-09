const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const GRID = {
  left: 0.044,
  top: 0.216,
  columnStep: 0.1845,
  rowStep: 0.116,
  cellWidth: 0.179,
  cellHeight: 0.109,
};

export function findLatestLunchMenuCandidate(parsedNewsletters) {
  const candidates = [];

  parsedNewsletters.forEach(({ newsletter, parsed }) => {
    if (!parsed) return;
    parsed.sections.forEach((section) => {
      const context = `${section.heading || ""} ${section.nativeText || ""}`;
      if (!section.imageUrls?.length || !/\blunch\b/i.test(context) || !/\b(?:menu|pdf)\b/i.test(context)) return;

      const monthIndex = monthIndexFrom_(context);
      if (monthIndex < 0) return;
      const year = yearFrom_(context, newsletter.newsletterDate, monthIndex);
      candidates.push({
        newsletter,
        section,
        imageUrl: section.imageUrls[0],
        month: monthIndex + 1,
        year,
      });
    });
  });

  return candidates.sort((a, b) => {
    const monthDifference = (b.year * 12 + b.month) - (a.year * 12 + a.month);
    return monthDifference || b.newsletter.newsletterDate.localeCompare(a.newsletter.newsletterDate);
  })[0] || null;
}

export function lunchCellRectangles(width, height, year, month) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rectangles = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const column = weekday - 1;
    const row = Math.floor((day + mondayOffset - 1) / 7);
    rectangles.push({
      day,
      rectangle: {
        left: Math.round(width * (GRID.left + column * GRID.columnStep)),
        top: Math.round(height * (GRID.top + row * GRID.rowStep)),
        width: Math.round(width * GRID.cellWidth),
        height: Math.round(height * GRID.cellHeight),
      },
    });
  }

  return rectangles;
}

export function lunchDaysFromOcr(cellTextByDay, candidate) {
  return [...cellTextByDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, rawText]) => lunchDayFromCell_(day, rawText, candidate))
    .filter(Boolean);
}

export function imageDimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      offset += segmentLength + 2;
    }
  }

  throw new Error("Lunch menu image must be a PNG or JPEG with readable dimensions.");
}

function lunchDayFromCell_(day, rawText, candidate) {
  let lines = cleanCellLines_(rawText, day);
  if (!lines.length) return null;

  const noSchool = lines.find((line) => /\bno school\b/i.test(line));
  if (noSchool) {
    const holiday = lines.find((line) => !/\bno school\b/i.test(line) && /\b(?:day|holiday)\b/i.test(line));
    return lunchDay_(day, "No school", [], holiday ? sentence_(holiday) : undefined, candidate);
  }

  const noLunchIndex = lines.findIndex((line) => /\bno hot lunch\b/i.test(line));
  if (noLunchIndex >= 0) {
    const noteText = lines
      .filter((_, index) => index !== noLunchIndex)
      .join(" ")
      .replace(/First Communioni?/i, "First Communion")
      .replace(/\beatin\b/i, "eat in")
      .replace(/First Communion\s+Brunch/i, "First Communion brunch.")
      .replace(/\s+/g, " ")
      .trim();
    return lunchDay_(day, "No hot lunch", [], sentence_(noteText), candidate);
  }

  const notes = [];
  if (/may the 4/i.test(lines[0])) {
    notes.push("May the 4th be with you.");
    lines = lines.slice(1);
  } else if (/cinc.*mayo/i.test(lines[0])) {
    notes.push("Cinco de Mayo.");
    lines = lines.slice(1);
  }

  if (!lines.length) return null;
  let mainEntree = lines.shift();
  if (/^Beef\s*&\s*cheese$/i.test(mainEntree) && /^Lettuce\/Tomato$/i.test(lines[0] || "")) {
    mainEntree = `Tacos with ${lowercaseFirst_(mainEntree)}`;
  } else if (/\bon$/i.test(mainEntree) && /^WG bun$/i.test(lines[0] || "")) {
    mainEntree = `${mainEntree} ${lines.shift()}`;
  } else if (/\bon WG$/i.test(mainEntree) && /^bun$/i.test(lines[0] || "")) {
    mainEntree = `${mainEntree} ${lines.shift()}`;
  } else if (/^Tacos$/i.test(mainEntree) && /^Beef\s*&\s*cheese$/i.test(lines[0] || "")) {
    mainEntree = `${mainEntree} with ${lowercaseFirst_(lines.shift())}`;
  }

  return lunchDay_(day, mainEntree, lines, notes.join(" ") || undefined, candidate);
}

function lunchDay_(day, mainEntree, sides, notes, candidate) {
  return {
    date: `${candidate.year}-${String(candidate.month).padStart(2, "0")}-${String(day).padStart(2, "0")}T16:00:00Z`,
    mainEntree,
    sides,
    ...(notes ? { notes } : {}),
    gradeTags: ["all-school"],
    sourceUrl: candidate.newsletter.sourceUrl,
    sourceImageUrl: candidate.imageUrl,
    sourceNewsletterTitle: candidate.newsletter.title,
    isDemo: false,
  };
}

function cleanCellLines_(value, day) {
  return String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line
      .replace(/[|~]+/g, " ")
      .replace(/\s*(?:[({]|\[)?\d{1,2}[)\]},.]*\s*$/, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter((line) => line && /[a-z]/i.test(line))
    .filter((line) => {
      const letterCount = (line.match(/[a-z]/gi) || []).length;
      const shortNoise = letterCount < 3 && !/^WG\b/i.test(line);
      const fragmentedNoise = line.split(/\s+/).every((part) => part.replace(/[^a-z]/gi, "").length <= 2) && !/\bWG\b/i.test(line);
      return !shortNoise && !fragmentedNoise && !/^(?:oo|ne|re|dt|sa ee|rar\b.*)$/i.test(line);
    })
    .map((line) => line
      .replace(/CincodeMayo/i, "Cinco de Mayo")
      .replace(/Apple sauce/i, "Applesauce")
      .replace(/4(?:™|â„¢)/g, "4th")
      .replace(new RegExp(`\\s+0?${day}$`), "")
      .trim());
}

function monthIndexFrom_(value) {
  const lower = String(value || "").toLowerCase();
  return MONTHS.findIndex((month) => new RegExp(`\\b${month}\\b`, "i").test(lower));
}

function yearFrom_(context, newsletterDate, monthIndex) {
  const stated = String(context || "").match(/\b(20\d{2})\b/);
  if (stated) return Number(stated[1]);
  const newsletterYear = Number(String(newsletterDate).slice(0, 4));
  const newsletterMonth = Number(String(newsletterDate).slice(5, 7)) - 1;
  if (Number.isFinite(newsletterYear) && monthIndex - newsletterMonth > 6) return newsletterYear - 1;
  if (Number.isFinite(newsletterYear) && newsletterMonth - monthIndex > 6) return newsletterYear + 1;
  return newsletterYear;
}

function sentence_(value) {
  const text = String(value || "").trim();
  if (!text) return undefined;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function lowercaseFirst_(value) {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}
