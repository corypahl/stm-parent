const QUEUE_SHEET = "Review Queue";
const CALENDAR_ID = "stm.parent.updates@gmail.com";
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

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Parent Site")
    .addItem("Run setup", "setupParentSite")
    .addItem("Check inbox now", "processInbox")
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
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#711b34").setFontColor("white");
  sheet.setColumnWidth(column_("Private Email Body"), 440);
  sheet.setColumnWidth(column_("Public Summary"), 360);
  sheet.setColumnWidth(column_("Title"), 260);
  sheet.getRange(2, column_("Content Type"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["announcement", "event", "deadline", "action", "volunteer", "signup", "form", "other"], true).build(),
  );
  sheet.getRange(2, column_("Status"), Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Review", "Approved", "Rejected", "Remove"], true).build(),
  );
  sheet.getRange(2, column_("All Day"), Math.max(sheet.getMaxRows() - 1, 1), 1).insertCheckboxes();

  replaceClockTrigger_("processInbox");
  replaceClockTrigger_("publishApproved");
  GmailApp.getUserLabelByName("ParentSiteProcessed") || GmailApp.createLabel("ParentSiteProcessed");
  console.log(`Review queue ready: ${spreadsheet.getUrl()}`);
  return spreadsheet.getUrl();
}

function processInbox() {
  const sheet = queueSheet_();
  const existingIds = new Set(
    sheet.getLastRow() < 2
      ? []
      : sheet.getRange(2, column_("Message ID"), sheet.getLastRow() - 1, 1).getValues().flat().map(String),
  );
  const rows = [];
  const processedLabel = GmailApp.getUserLabelByName("ParentSiteProcessed") || GmailApp.createLabel("ParentSiteProcessed");

  for (const thread of GmailApp.search("in:inbox newer_than:90d", 0, 100)) {
    let addedFromThread = false;
    for (const message of thread.getMessages()) {
      if (existingIds.has(message.getId())) continue;
      const body = cleanBody_(message.getPlainBody());
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
        firstUrl_(body),
        "Review",
        "",
        "",
        "Review the title, summary, dates, grades, links, and privacy before approving.",
      ]);
      existingIds.add(message.getId());
      addedFromThread = true;
    }
    if (addedFromThread) thread.addLabel(processedLabel);
  }

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    sheet.getRange(sheet.getLastRow() - rows.length + 1, column_("All Day"), rows.length, 1).insertCheckboxes().setValue(true);
  }
  console.log(`Added ${rows.length} new message(s) to the review queue.`);
}

function publishApproved() {
  const sheet = queueSheet_();
  if (sheet.getLastRow() < 2) return;
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length);
  const rows = range.getValues();
  const calendar = CalendarApp.getCalendarById(scriptProperty_("CALENDAR_ID"));
  if (!calendar) throw new Error("The configured Google Calendar could not be opened.");

  rows.forEach((row) => {
    const status = String(value_(row, "Status"));
    const existingEventId = String(value_(row, "Calendar Event ID") || "");
    if (status === "Remove" && existingEventId) {
      const existing = calendar.getEventById(existingEventId);
      if (existing) existing.deleteEvent();
      setValue_(row, "Calendar Event ID", "");
      setValue_(row, "Published At", "");
      return;
    }
    if (status !== "Approved") return;

    const contentType = String(value_(row, "Content Type"));
    const start = asDate_(value_(row, "Start"));
    if (contentType === "event" && start) {
      const allDay = value_(row, "All Day") === true;
      const suppliedEnd = asDate_(value_(row, "End"));
      const title = String(value_(row, "Title"));
      const description = [value_(row, "Public Summary"), value_(row, "Action URL")].filter(Boolean).join("\n\n");
      const location = String(value_(row, "Location") || "");
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
      setValue_(row, "Calendar Event ID", event.getId());
    }
    setValue_(row, "Published At", new Date());
  });

  range.setValues(rows);
  console.log("Approved rows synchronized.");
}

function doGet() {
  const sheet = queueSheet_();
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const items = rows
    .filter((row) => String(value_(row, "Status")) === "Approved")
    .map((row) => ({
      id: String(value_(row, "Message ID")),
      title: String(value_(row, "Title")).trim(),
      summary: String(value_(row, "Public Summary")).trim(),
      contentType: String(value_(row, "Content Type") || "announcement"),
      gradeTags: String(value_(row, "Grades") || "all-school").split(",").map((value) => value.trim()).filter(Boolean),
      categoryTags: ["Forwarded school email"],
      startAt: isoValue_(value_(row, "Start")),
      endAt: isoValue_(value_(row, "End")),
      location: String(value_(row, "Location") || ""),
      actionUrl: String(value_(row, "Action URL") || ""),
      sourceUrl: "https://st-martha.org/school",
      createdAt: isoValue_(value_(row, "Received At")),
      updatedAt: isoValue_(value_(row, "Published At")) || new Date().toISOString(),
      publishedAt: isoValue_(value_(row, "Published At")) || new Date().toISOString(),
    }))
    .filter((item) => item.title);

  return ContentService
    .createTextOutput(JSON.stringify({ updatedAt: new Date().toISOString(), items }))
    .setMimeType(ContentService.MimeType.JSON);
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

function scriptProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error(`Missing script property ${name}. Run setupParentSite first.`);
  return value;
}

function column_(name) {
  const index = HEADERS.indexOf(name);
  if (index < 0) throw new Error(`Unknown column: ${name}`);
  return index + 1;
}

function value_(row, name) {
  return row[column_(name) - 1];
}

function setValue_(row, name, value) {
  row[column_(name) - 1] = value;
}

function cleanSubject_(subject) {
  return String(subject || "").replace(/^(fwd?|re):\s*/gi, "").trim();
}

function cleanBody_(body) {
  return String(body || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 30000);
}

function publicSummary_(body) {
  const lines = body.split("\n").map((line) => line.trim()).filter((line) => line && !/^(from|sent|to|subject):/i.test(line));
  return lines.join(" ").replace(/\s+/g, " ").slice(0, 700);
}

function inferContentType_(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  if (/sign[ -]?up|volunteer|help needed/.test(text)) return "volunteer";
  if (/permission|form|registration/.test(text)) return "form";
  if (/deadline|due (by|on)|last day to/.test(text)) return "deadline";
  if (/calendar|concert|conference|mass|no school|half day|field trip|meeting|night|program/.test(text)) return "event";
  return "announcement";
}

function firstUrl_(body) {
  const match = body.match(/https?:\/\/[^\s<>]+/i);
  return match ? match[0].replace(/[),.;]+$/, "") : "";
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
