const QUEUE_SHEET = "Review Queue";
const SECTION_SHEET = "Newsletter Sections";
const CALENDAR_ID = "stm.parent.updates@gmail.com";
const PUBLIC_FEED_VERSION = 3;
const HEADERS = [
  "Message ID",
  "Received At",
  "From",
  "Subject",
  "Private Email Body",
  "Content Type",
  "Title",
  "Public Summary",
  "Start",
  "End",
  "All Day",
  "Location",
  "Grades",
  "Action URL",
  "Status",
  "Calendar Event ID",
  "Published At",
  "Review Notes",
];
const SECTION_HEADERS = [
  "Section ID",
  "Message ID",
  "Newsletter ID",
  "Newsletter Date",
  "Newsletter Title",
  "Newsletter URL",
  "Section Order",
  "Title",
  "Public Summary",
  "Content Type",
  "Grades",
  "Categories",
  "Start",
  "End",
  "Deadline",
  "All Day",
  "Location",
  "Action URL",
  "Status",
  "Calendar Event ID",
  "Published At",
  "Review Notes",
];
const CONTENT_TYPES = ["announcement", "event", "deadline", "action", "volunteer", "signup", "form", "other"];
const GRADE_TAGS = ["all-school", "preschool", "kindergarten", "grade-1", "grade-2", "grade-3", "grade-4", "grade-5", "grade-6", "grade-7", "grade-8"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Parent Site")
    .addItem("Open section admin", "showSectionAdmin")
    .addItem("Run setup", "setupParentSite")
    .addItem("Check inbox now", "processInbox")
    .addItem("Import newsletter sections", "importPendingNewsletters")
    .addItem("Publish approved rows", "publishApproved")
    .addToUi();
}

function setupParentSite() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open the review spreadsheet before running setup.");
  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: spreadsheet.getId(),
    CALENDAR_ID,
  });

  let sheet = spreadsheet.getSheetByName(QUEUE_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(QUEUE_SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  compactDataRows_(sheet, HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#711b34").setFontColor("white");
  sheet.setColumnWidth(column_("Private Email Body"), 440);
  sheet.setColumnWidth(column_("Public Summary"), 360);
  sheet.setColumnWidth(column_("Title"), 260);
  sheet.getRange(2, column_("Content Type"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONTENT_TYPES, true).build(),
  );
  sheet.getRange(2, column_("Status"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Review", "Approved", "Rejected", "Remove"], true).build(),
  );
  applyCheckboxValidation_(sheet, HEADERS);

  setupSectionSheet_(spreadsheet);

  replaceClockTrigger_("processInbox");
  replaceClockTrigger_("publishApproved");
  GmailApp.getUserLabelByName("ParentSiteProcessed") || GmailApp.createLabel("ParentSiteProcessed");
  console.log(`Review queue ready: ${spreadsheet.getUrl()}`);
  return spreadsheet.getUrl();
}

function processInbox() {
  const sheet = queueSheet_();
  compactDataRows_(sheet, HEADERS);
  const existingIds = new Set(
    sheet.getLastRow() < 2
      ? []
      : sheet.getRange(2, column_("Message ID"), sheet.getLastRow() - 1, 1).getValues().flat().map(String),
  );
  const rows = [];
  const threadsToLabel = [];
  const processedLabel = GmailApp.getUserLabelByName("ParentSiteProcessed") || GmailApp.createLabel("ParentSiteProcessed");

  for (const thread of GmailApp.search("in:inbox newer_than:90d", 0, 100)) {
    let addedFromThread = false;
    for (const message of thread.getMessages()) {
      if (existingIds.has(message.getId())) continue;
      const plainBody = message.getPlainBody();
      const htmlBody = message.getBody();
      const body = cleanBody_(plainBody || htmlBody);
      const subject = cleanSubject_(message.getSubject());
      rows.push([
        message.getId(),
        message.getDate(),
        message.getFrom(),
        message.getSubject(),
        body,
        inferContentType_(subject, body),
        subject || "School update",
        publicSummary_(body),
        "",
        "",
        true,
        "",
        "all-school",
        preferredUrl_(plainBody, htmlBody),
        "Review",
        "",
        "",
        "Review the title, summary, dates, grades, links, and privacy before approving.",
      ]);
      existingIds.add(message.getId());
      addedFromThread = true;
    }
    if (addedFromThread) threadsToLabel.push(thread);
  }

  if (rows.length) {
    const firstRow = sheet.getLastRow() + 1;
    sheet.getRange(firstRow, 1, rows.length, HEADERS.length).setValues(rows);
    sheet.getRange(firstRow, column_("All Day"), rows.length, 1)
      .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
      .setValue(true);
    SpreadsheetApp.flush();
    threadsToLabel.forEach((thread) => thread.addLabel(processedLabel));
    importPendingNewsletters();
    console.log(`Added ${rows.length} new message(s) to ${sheet.getParent().getUrl()} starting at row ${firstRow}.`);
    return rows.length;
  }
  console.log("Added 0 new message(s) to the review queue.");
  return 0;
}

function publishApproved() {
  publishCalendarRows_(queueSheet_(), HEADERS);
  const sectionSheet = optionalSectionSheet_();
  if (sectionSheet) publishCalendarRows_(sectionSheet, SECTION_HEADERS);
  console.log("Approved rows synchronized.");
}

function publishCalendarRows_(sheet, headers) {
  if (sheet.getLastRow() < 2) return;
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
  const rows = range.getValues();
  const calendar = CalendarApp.getCalendarById(scriptProperty_("CALENDAR_ID"));
  if (!calendar) throw new Error("The configured Google Calendar could not be opened.");

  rows.forEach((row) => {
    const status = String(valueFrom_(row, headers, "Status"));
    const existingEventId = String(valueFrom_(row, headers, "Calendar Event ID") || "");
    const contentType = String(valueFrom_(row, headers, "Content Type"));
    if (status !== "Approved" && existingEventId) {
      const existing = calendar.getEventById(existingEventId);
      if (existing) existing.deleteEvent();
      setValueFrom_(row, headers, "Calendar Event ID", "");
      setValueFrom_(row, headers, "Published At", "");
      return;
    }
    if (status !== "Approved") return;

    const start = asDate_(valueFrom_(row, headers, "Start"));
    if (contentType === "event" && start) {
      const allDay = valueFrom_(row, headers, "All Day") === true;
      const suppliedEnd = asDate_(valueFrom_(row, headers, "End"));
      const title = String(valueFrom_(row, headers, "Title"));
      const description = [valueFrom_(row, headers, "Public Summary"), valueFrom_(row, headers, "Action URL")].filter(Boolean).join("\n\n");
      const location = String(valueFrom_(row, headers, "Location") || "");
      let event = existingEventId ? calendar.getEventById(existingEventId) : null;

      if (allDay) {
        const endExclusive = dayAfter_(suppliedEnd || start);
        event = event
          ? event.setTitle(title).setAllDayDates(start, endExclusive)
          : calendar.createAllDayEvent(title, start, endExclusive);
      } else {
        const end = suppliedEnd || new Date(start.getTime() + 60 * 60 * 1000);
        event = event
          ? event.setTitle(title).setTime(start, end)
          : calendar.createEvent(title, start, end);
      }
      event.setDescription(description).setLocation(location);
      setValueFrom_(row, headers, "Calendar Event ID", event.getId());
    }
    setValueFrom_(row, headers, "Published At", new Date());
  });

  range.setValues(rows);
}

function doGet() {
  const sheet = queueSheet_();
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const emailItems = rows
    .filter((row) => String(value_(row, "Status")) === "Approved")
    .filter((row) => !isSmoreUrl_(String(value_(row, "Action URL") || "")))
    .map((row) => {
      const actionUrl = String(value_(row, "Action URL") || "");
      return {
        id: String(value_(row, "Message ID")),
        title: String(value_(row, "Title")).trim(),
        summary: String(value_(row, "Public Summary")).trim(),
        contentType: String(value_(row, "Content Type") || "announcement"),
        gradeTags: String(value_(row, "Grades") || "all-school").split(",").map((value) => value.trim()).filter(Boolean),
        categoryTags: categoryTagsFor_(actionUrl),
        startAt: isoValue_(value_(row, "Start")),
        endAt: isoValue_(value_(row, "End")),
        location: String(value_(row, "Location") || ""),
        actionUrl,
        actionLabel: actionLabelFor_(actionUrl),
        sourceUrl: "https://st-martha.org/school",
        sourceLabel: "Reviewed school email",
        createdAt: isoValue_(value_(row, "Received At")),
        updatedAt: isoValue_(value_(row, "Published At")) || new Date().toISOString(),
        publishedAt: isoValue_(value_(row, "Published At")) || new Date().toISOString(),
      };
    })
    .filter((item) => item.title);

  const sectionRows = publicSectionRows_();
  const sectionItems = sectionRows.map(sectionItemFromRow_).filter((item) => item.title);
  const newsletters = newsletterSummaries_(sectionRows);
  const items = sectionItems.concat(emailItems);

  return ContentService
    .createTextOutput(JSON.stringify({ version: PUBLIC_FEED_VERSION, updatedAt: new Date().toISOString(), items, newsletters }))
    .setMimeType(ContentService.MimeType.JSON);
}

function showSectionAdmin() {
  const output = HtmlService.createTemplateFromFile("Admin")
    .evaluate()
    .setWidth(1100)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(output, "Newsletter section admin");
}

function setupSectionSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SECTION_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(SECTION_SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(SECTION_HEADERS);
  compactDataRows_(sheet, SECTION_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, SECTION_HEADERS.length).setFontWeight("bold").setBackground("#711b34").setFontColor("white");
  sheet.setColumnWidth(columnFrom_(SECTION_HEADERS, "Public Summary"), 420);
  sheet.setColumnWidth(columnFrom_(SECTION_HEADERS, "Title"), 280);
  sheet.setColumnWidth(columnFrom_(SECTION_HEADERS, "Grades"), 220);
  sheet.setColumnWidth(columnFrom_(SECTION_HEADERS, "Categories"), 220);
  sheet.getRange(2, columnFrom_(SECTION_HEADERS, "Content Type"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONTENT_TYPES, true).build(),
  );
  sheet.getRange(2, columnFrom_(SECTION_HEADERS, "Status"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Unreviewed", "Approved", "Rejected"], true).build(),
  );
  applyCheckboxValidation_(sheet, SECTION_HEADERS);
  return sheet;
}

function compactDataRows_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const populatedRows = range.getValues().filter((row) => String(row[0] || "").trim());
  range.clearContent();
  if (populatedRows.length) {
    sheet.getRange(2, 1, populatedRows.length, headers.length).setValues(populatedRows);
  }
  return populatedRows.length;
}

function applyCheckboxValidation_(sheet, headers) {
  sheet
    .getRange(2, columnFrom_(headers, "All Day"), Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
}

function importPendingNewsletters() {
  const queue = queueSheet_();
  const sectionSheet = sectionSheet_();
  compactDataRows_(queue, HEADERS);
  compactDataRows_(sectionSheet, SECTION_HEADERS);
  if (queue.getLastRow() < 2) return 0;
  const range = queue.getRange(2, 1, queue.getLastRow() - 1, HEADERS.length);
  const rows = range.getValues();
  const existingIds = new Set(
    sectionSheet.getLastRow() < 2
      ? []
      : sectionSheet.getRange(2, columnFrom_(SECTION_HEADERS, "Section ID"), sectionSheet.getLastRow() - 1, 1).getValues().flat().map(String),
  );
  let imported = 0;

  rows.forEach((row) => {
    const newsletterUrl = String(value_(row, "Action URL") || "");
    if (!isSmoreUrl_(newsletterUrl)) return;
    try {
      const count = importNewsletterSections_(sectionSheet, existingIds, {
        messageId: String(value_(row, "Message ID")),
        newsletterUrl,
        fallbackTitle: String(value_(row, "Title") || value_(row, "Subject") || "School newsletter"),
      });
      if (count) {
        imported += count;
        setValue_(row, "Review Notes", `Imported ${count} newsletter sections. Open the section admin to review them.`);
      }
    } catch (error) {
      setValue_(row, "Review Notes", `Newsletter section import failed: ${error.message || error}`);
    }
  });

  range.setValues(rows);
  console.log(`Imported ${imported} new newsletter section(s).`);
  return imported;
}

function importNewsletterSections_(sheet, existingIds, source) {
  const response = UrlFetchApp.fetch(source.newsletterUrl, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: { "User-Agent": "StMarthaParentSite/1.0" },
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error(`Smore returned HTTP ${status}.`);
  const newsletter = parseSmoreNewsletterHtml_(response.getContentText(), source.newsletterUrl, source.fallbackTitle);
  const newSections = newsletter.sections.filter((section) => !existingIds.has(section.id));
  if (!newSections.length) return 0;

  const rows = newSections.map((section) => [
    section.id,
    source.messageId,
    newsletter.id,
    newsletter.date,
    newsletter.title,
    source.newsletterUrl,
    section.order,
    section.title,
    section.summary,
    section.contentType,
    "",
    "",
    "",
    "",
    "",
    true,
    "",
    section.actionUrl,
    "Unreviewed",
    "",
    "",
    "Add grade and category tags, verify the public text and links, then approve.",
  ]);
  const firstRow = sheet.getLastRow() + 1;
  sheet.getRange(firstRow, 1, rows.length, SECTION_HEADERS.length).setValues(rows);
  sheet.getRange(firstRow, columnFrom_(SECTION_HEADERS, "All Day"), rows.length, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
    .setValue(true);
  newSections.forEach((section) => existingIds.add(section.id));
  return rows.length;
}

function parseSmoreNewsletterHtml_(html, sourceUrl, fallbackTitle) {
  const source = String(html || "");
  const contentMatch = source.match(/js_content:"((?:\\.|[^"\\])*)"/);
  if (!contentMatch) throw new Error("The Smore newsletter data could not be found.");
  const content = JSON.parse(JSON.parse(`"${contentMatch[1]}"`));
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const groups = [];
  let current = [];
  blocks.forEach((block) => {
    if (block && block._t === "misc.separator") {
      if (current.length) groups.push(current);
      current = [];
    } else if (block) {
      current.push(block);
    }
  });
  if (current.length) groups.push(current);

  const shortCode = String(sourceUrl || "").match(/\/n\/([a-z0-9-]+)/i)?.[1]?.split("-")[0] || "newsletter";
  const newsletterId = `smore-${shortCode}`;
  const header = content.header || {};
  const metaDate = source.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  const newsletterDate = newsletterDateFrom_(header.subtitle) || newsletterDateFrom_(metaDate);
  const newsletterTitle = cleanText_(header.title || fallbackTitle || "School newsletter");
  const sections = groups.map((group, index) => {
    const title = sectionTitle_(group, index);
    const summary = sectionSummary_(group, title);
    return {
      id: `${newsletterId}-section-${index + 1}`,
      order: index + 1,
      title,
      summary,
      contentType: inferContentType_(title, summary),
      actionUrl: preferredSectionUrl_(group),
    };
  });

  if (!sections.length) throw new Error("No newsletter sections were found between the Smore separators.");
  return { id: newsletterId, title: newsletterTitle, date: newsletterDate, sections };
}

function sectionTitle_(blocks, index) {
  for (const block of blocks) {
    const title = cleanText_(block.title || block.text || "");
    if (title) return title.slice(0, 180);
  }
  return `Section ${index + 1}`;
}

function sectionSummary_(blocks, title) {
  const values = [];
  blocks.forEach((block) => {
    [
      block.title,
      richTextValue_(block.content),
      block.details,
      block.text,
      block.file_name,
      block.photo && block.photo.alt_text,
    ].forEach((value) => {
      const cleaned = cleanText_(value);
      if (cleaned && cleaned !== title && values.indexOf(cleaned) < 0) values.push(cleaned);
    });
  });
  return values.join(" ").replace(/\s+/g, " ").trim().slice(0, 2000);
}

function richTextValue_(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(richTextValue_).filter(Boolean).join(" ");
  if (node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, "c")) return richTextValue_(node.c);
  return "";
}

function preferredSectionUrl_(blocks) {
  const urls = [];
  blocks.forEach((block) => collectActionUrls_(block, urls));
  const candidates = urls.map(normalizeUrl_).filter((url, index, all) => url && !isIgnoredUrl_(url) && all.indexOf(url) === index);
  return candidates.find(isVolunteerSignupUrl_) || candidates[0] || "";
}

function collectActionUrls_(node, urls) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((value) => collectActionUrls_(value, urls));
    return;
  }
  Object.keys(node).forEach((key) => {
    const value = node[key];
    if ((key === "href" || key === "url" || key === "access_url") && typeof value === "string" && /^https?:\/\//i.test(value)) {
      urls.push(value);
    }
    if (value && typeof value === "object") collectActionUrls_(value, urls);
  });
}

function newsletterDateFrom_(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b(0?[1-9]|1[0-2])[.\/-](0?[1-9]|[12]\d|3[01])[.\/-](\d{2}|\d{4})\b/);
  if (match) {
    const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
    const month = Number(match[1]);
    const day = Number(match[2]);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function getSectionAdminData() {
  const sheet = sectionSheet_();
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, SECTION_HEADERS.length).getValues();
  const items = rows.map((row) => ({
    id: String(valueFrom_(row, SECTION_HEADERS, "Section ID")),
    newsletterId: String(valueFrom_(row, SECTION_HEADERS, "Newsletter ID")),
    newsletterDate: dateOnlyValue_(valueFrom_(row, SECTION_HEADERS, "Newsletter Date")),
    newsletterTitle: String(valueFrom_(row, SECTION_HEADERS, "Newsletter Title")),
    newsletterUrl: String(valueFrom_(row, SECTION_HEADERS, "Newsletter URL")),
    order: Number(valueFrom_(row, SECTION_HEADERS, "Section Order")) || 0,
    title: String(valueFrom_(row, SECTION_HEADERS, "Title")),
    summary: String(valueFrom_(row, SECTION_HEADERS, "Public Summary")),
    contentType: String(valueFrom_(row, SECTION_HEADERS, "Content Type")),
    grades: tagList_(valueFrom_(row, SECTION_HEADERS, "Grades")),
    categories: tagList_(valueFrom_(row, SECTION_HEADERS, "Categories")),
    start: adminDateValue_(valueFrom_(row, SECTION_HEADERS, "Start")),
    end: adminDateValue_(valueFrom_(row, SECTION_HEADERS, "End")),
    deadline: adminDateValue_(valueFrom_(row, SECTION_HEADERS, "Deadline")),
    allDay: valueFrom_(row, SECTION_HEADERS, "All Day") === true,
    location: String(valueFrom_(row, SECTION_HEADERS, "Location")),
    actionUrl: String(valueFrom_(row, SECTION_HEADERS, "Action URL")),
    status: String(valueFrom_(row, SECTION_HEADERS, "Status") || "Unreviewed"),
    publishedAt: isoValue_(valueFrom_(row, SECTION_HEADERS, "Published At")),
    notes: String(valueFrom_(row, SECTION_HEADERS, "Review Notes")),
  })).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate) || a.order - b.order);

  return {
    items,
    contentTypes: CONTENT_TYPES,
    gradeTags: GRADE_TAGS,
  };
}

function saveSectionAdmin(input) {
  if (!input || !input.id) throw new Error("Missing newsletter section ID.");
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  let shouldSyncCalendar = false;
  try {
    const sheet = sectionSheet_();
    if (sheet.getLastRow() < 2) throw new Error("No newsletter sections are available.");
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, SECTION_HEADERS.length);
    const rows = range.getValues();
    const rowIndex = rows.findIndex((row) => String(valueFrom_(row, SECTION_HEADERS, "Section ID")) === String(input.id));
    if (rowIndex < 0) throw new Error("That newsletter section could not be found.");
    const row = rows[rowIndex];
    const status = ["Unreviewed", "Approved", "Rejected"].includes(input.status) ? input.status : "Unreviewed";
    const title = cleanText_(input.title).slice(0, 180);
    const summary = cleanText_(input.summary).slice(0, 2000);
    const newsletterDate = newsletterDateFrom_(input.newsletterDate);
    let grades = Array.isArray(input.grades) ? input.grades.filter((grade) => GRADE_TAGS.includes(grade)) : [];
    if (grades.includes("all-school")) grades = ["all-school"];
    const categories = tagList_(input.categories).slice(0, 8);
    const contentType = CONTENT_TYPES.includes(input.contentType) ? input.contentType : "announcement";
    shouldSyncCalendar = contentType === "event" || Boolean(valueFrom_(row, SECTION_HEADERS, "Calendar Event ID"));
    const actionUrl = cleanText_(input.actionUrl).slice(0, 2000);
    if (actionUrl && !/^https?:\/\//i.test(actionUrl)) throw new Error("Action URL must begin with http:// or https://.");
    if (status === "Approved") {
      if (!newsletterDate) throw new Error("Add the newsletter date before approving this section.");
      if (!title) throw new Error("Add a public title before approving this section.");
      if (!grades.length) throw new Error("Select at least one grade before approving this section.");
      if (!categories.length) throw new Error("Add at least one category before approving this section.");
    }

    setValueFrom_(row, SECTION_HEADERS, "Newsletter Date", newsletterDate);
    setValueFrom_(row, SECTION_HEADERS, "Title", title);
    setValueFrom_(row, SECTION_HEADERS, "Public Summary", summary);
    setValueFrom_(row, SECTION_HEADERS, "Content Type", contentType);
    setValueFrom_(row, SECTION_HEADERS, "Grades", grades.join(","));
    setValueFrom_(row, SECTION_HEADERS, "Categories", categories.join(","));
    setValueFrom_(row, SECTION_HEADERS, "Start", cleanText_(input.start));
    setValueFrom_(row, SECTION_HEADERS, "End", cleanText_(input.end));
    setValueFrom_(row, SECTION_HEADERS, "Deadline", cleanText_(input.deadline));
    setValueFrom_(row, SECTION_HEADERS, "All Day", input.allDay === true);
    setValueFrom_(row, SECTION_HEADERS, "Location", cleanText_(input.location).slice(0, 300));
    setValueFrom_(row, SECTION_HEADERS, "Action URL", actionUrl);
    setValueFrom_(row, SECTION_HEADERS, "Status", status);
    setValueFrom_(row, SECTION_HEADERS, "Published At", status === "Approved" ? new Date() : "");
    setValueFrom_(row, SECTION_HEADERS, "Review Notes", status === "Approved" ? "Approved in the private section admin." : "Not visible on the public site.");
    sheet.getRange(rowIndex + 2, 1, 1, SECTION_HEADERS.length).setValues([row]);
  } finally {
    lock.releaseLock();
  }

  if (shouldSyncCalendar) publishCalendarRows_(sectionSheet_(), SECTION_HEADERS);
  return getSectionAdminData();
}

function publicSectionRows_() {
  const sheet = optionalSectionSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, SECTION_HEADERS.length)
    .getValues()
    .filter((row) => String(valueFrom_(row, SECTION_HEADERS, "Status")) === "Approved")
    .filter((row) => String(valueFrom_(row, SECTION_HEADERS, "Title")).trim())
    .filter((row) => dateOnlyValue_(valueFrom_(row, SECTION_HEADERS, "Newsletter Date")))
    .filter((row) => tagList_(valueFrom_(row, SECTION_HEADERS, "Grades")).length)
    .filter((row) => tagList_(valueFrom_(row, SECTION_HEADERS, "Categories")).length);
}

function sectionItemFromRow_(row) {
  const actionUrl = String(valueFrom_(row, SECTION_HEADERS, "Action URL") || "");
  const newsletterDate = dateOnlyValue_(valueFrom_(row, SECTION_HEADERS, "Newsletter Date"));
  const publishedAt = isoValue_(valueFrom_(row, SECTION_HEADERS, "Published At")) || new Date().toISOString();
  return {
    id: String(valueFrom_(row, SECTION_HEADERS, "Section ID")),
    title: String(valueFrom_(row, SECTION_HEADERS, "Title")).trim(),
    summary: String(valueFrom_(row, SECTION_HEADERS, "Public Summary")).trim(),
    contentType: String(valueFrom_(row, SECTION_HEADERS, "Content Type") || "announcement"),
    gradeTags: tagList_(valueFrom_(row, SECTION_HEADERS, "Grades")),
    categoryTags: tagList_(valueFrom_(row, SECTION_HEADERS, "Categories")).length ? tagList_(valueFrom_(row, SECTION_HEADERS, "Categories")) : ["Newsletter"],
    startAt: isoValue_(valueFrom_(row, SECTION_HEADERS, "Start")),
    endAt: isoValue_(valueFrom_(row, SECTION_HEADERS, "End")),
    deadlineAt: isoValue_(valueFrom_(row, SECTION_HEADERS, "Deadline")),
    location: String(valueFrom_(row, SECTION_HEADERS, "Location") || ""),
    actionUrl,
    actionLabel: actionLabelFor_(actionUrl),
    sourceUrl: String(valueFrom_(row, SECTION_HEADERS, "Newsletter URL")),
    sourceLabel: String(valueFrom_(row, SECTION_HEADERS, "Newsletter Title") || "School newsletter"),
    sourceNewsletterId: String(valueFrom_(row, SECTION_HEADERS, "Newsletter ID")),
    newsletterDate,
    createdAt: newsletterDate ? `${newsletterDate}T12:00:00.000Z` : publishedAt,
    updatedAt: publishedAt,
    publishedAt,
  };
}

function newsletterSummaries_(rows) {
  const byId = {};
  rows.forEach((row) => {
    const id = String(valueFrom_(row, SECTION_HEADERS, "Newsletter ID"));
    if (!id) return;
    if (!byId[id]) {
      byId[id] = {
        id,
        title: String(valueFrom_(row, SECTION_HEADERS, "Newsletter Title") || "School newsletter"),
        newsletterDate: dateOnlyValue_(valueFrom_(row, SECTION_HEADERS, "Newsletter Date")),
        sourceUrl: String(valueFrom_(row, SECTION_HEADERS, "Newsletter URL")),
        itemCount: 0,
        grades: [],
        status: "published",
        isDemo: false,
      };
    }
    byId[id].itemCount += 1;
    tagList_(valueFrom_(row, SECTION_HEADERS, "Grades")).forEach((grade) => {
      if (byId[id].grades.indexOf(grade) < 0) byId[id].grades.push(grade);
    });
  });
  return Object.keys(byId).map((id) => byId[id]).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));
}

function tagList_(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return values.map((item) => cleanText_(item)).filter((item, index, all) => item && all.indexOf(item) === index);
}

function adminDateValue_(value) {
  if (!value) return "";
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm");
  return String(value).slice(0, 16);
}

function dateOnlyValue_(value) {
  if (!value) return "";
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return newsletterDateFrom_(value);
}

function replaceClockTrigger_(handler) {
  ScriptApp.getProjectTriggers().filter((trigger) => trigger.getHandlerFunction() === handler).forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(15).create();
}

function queueSheet_() {
  const spreadsheet = SpreadsheetApp.openById(scriptProperty_("SPREADSHEET_ID"));
  const sheet = spreadsheet.getSheetByName(QUEUE_SHEET);
  if (!sheet) throw new Error(`Missing sheet: ${QUEUE_SHEET}. Run setupParentSite first.`);
  return sheet;
}

function sectionSheet_() {
  const sheet = optionalSectionSheet_();
  if (!sheet) throw new Error(`Missing sheet: ${SECTION_SHEET}. Run setupParentSite first.`);
  return sheet;
}

function optionalSectionSheet_() {
  const spreadsheet = SpreadsheetApp.openById(scriptProperty_("SPREADSHEET_ID"));
  return spreadsheet.getSheetByName(SECTION_SHEET);
}

function scriptProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error(`Missing script property ${name}. Run setupParentSite first.`);
  return value;
}

function column_(name) {
  return columnFrom_(HEADERS, name);
}

function columnFrom_(headers, name) {
  const index = headers.indexOf(name);
  if (index < 0) throw new Error(`Unknown column: ${name}`);
  return index + 1;
}

function value_(row, name) {
  return row[column_(name) - 1];
}

function setValue_(row, name, value) {
  row[column_(name) - 1] = value;
}

function valueFrom_(row, headers, name) {
  return row[columnFrom_(headers, name) - 1];
}

function setValueFrom_(row, headers, name, value) {
  row[columnFrom_(headers, name) - 1] = value;
}

function cleanSubject_(subject) {
  return String(subject || "").replace(/^(fwd?|re):\s*/gi, "").trim();
}

function cleanText_(value) {
  return decodeHtmlEntities_(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBody_(body) {
  const source = String(body || "").replace(/\r/g, "");
  const text = /<\/?[a-z][\s\S]*?>/i.test(source) ? htmlToText_(source) : decodeHtmlEntities_(source);
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 30000);
}

function publicSummary_(body) {
  const lines = cleanBody_(body).split("\n").map((line) => line.trim()).filter((line) => line && !/^(from|sent|to|subject):/i.test(line));
  return lines.join(" ").replace(/\s+/g, " ").slice(0, 700);
}

function inferContentType_(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  if (/newsletter|(?:summer|weekly|school) notes|smore\.com/.test(text)) return "announcement";
  if (/sign[ -]?up|volunteer|help needed/.test(text)) return "volunteer";
  if (/permission|form|registration/.test(text)) return "form";
  if (/deadline|due (by|on)|last day to/.test(text)) return "deadline";
  if (/calendar|concert|conference|mass|no school|half day|field trip|meeting|night|program/.test(text)) return "event";
  return "announcement";
}

function htmlToText_(html) {
  return decodeHtmlEntities_(String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/(?:p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " "));
}

function decodeHtmlEntities_(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };
  return String(value || "").replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(named, lower)) return named[lower];
    if (lower[0] !== "#") return match;
    const hexadecimal = lower.slice(0, 2) === "#x";
    const codePoint = Number.parseInt(lower.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch (error) {
      return match;
    }
  });
}

function preferredUrl_() {
  const source = Array.prototype.slice.call(arguments).filter(Boolean).join("\n");
  const matches = source.match(/https?:\/\/[^\s<>"']+/gi) || [];
  const candidates = [];
  matches.forEach((match) => {
    const normalized = normalizeUrl_(match);
    if (normalized && !isIgnoredUrl_(normalized) && candidates.indexOf(normalized) < 0) candidates.push(normalized);
  });
  return candidates.find(isSmoreUrl_) || candidates[0] || "";
}

function normalizeUrl_(value) {
  let normalized = decodeHtmlEntities_(String(value || "")).replace(/[\])},.;!?]+$/, "");
  const redirect = normalized.match(/[?&](?:url|u|target)=([^&]+)/i);
  if (redirect) {
    try {
      const unwrapped = decodeURIComponent(redirect[1]);
      if (/^https?:\/\//i.test(unwrapped)) normalized = unwrapped;
    } catch (error) {
      // Keep the original URL when a redirect parameter is malformed.
    }
  }
  return normalized;
}

function isIgnoredUrl_(url) {
  const lower = String(url || "").toLowerCase();
  return /renweb\.com\/rmt\/eo\.ashx/.test(lower)
    || /\/(?:unsubscribe|opt-?out|email-preferences|preferences)(?:[/?#]|$)/.test(lower)
    || /[?&](?:unsubscribe|optout)=/.test(lower)
    || /\.(?:gif|jpe?g|png|webp)(?:[?#]|$)/.test(lower);
}

function isSmoreUrl_(url) {
  return /^https?:\/\/(?:[a-z0-9-]+\.)*smore\.com(?:[/:?#]|$)/i.test(String(url || ""));
}

function isVolunteerSignupUrl_(url) {
  const match = String(url || "").match(/^https?:\/\/([^/?#]+)(\/[^?#]*)?/i);
  if (!match) return false;
  const hostname = match[1].toLowerCase().replace(/:\d+$/, "");
  const pathname = match[2] || "/";
  return hostname === "signupgenius.com"
    || hostname.endsWith(".signupgenius.com")
    || hostname === "forms.gle"
    || (hostname === "docs.google.com" && pathname.indexOf("/forms/") === 0);
}

function actionLabelFor_(url) {
  if (isSmoreUrl_(url)) return "Read newsletter";
  if (isVolunteerSignupUrl_(url)) return /signupgenius/i.test(String(url)) ? "Open signup" : "Open form";
  return "Open link";
}

function categoryTagsFor_(url) {
  return [isSmoreUrl_(url) ? "Newsletter" : "Forwarded school email"];
}

function asDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function dayAfter_(value) {
  const date = new Date(value);
  date.setDate(date.getDate() + 1);
  return date;
}

function isoValue_(value) {
  const date = asDate_(value);
  return date ? date.toISOString() : "";
}
