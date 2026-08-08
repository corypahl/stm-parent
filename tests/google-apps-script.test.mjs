import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../automation/google-apps-script/Code.gs", import.meta.url), "utf8");
const adminSource = await readFile(new URL("../automation/google-apps-script/Admin.html", import.meta.url), "utf8");
const context = vm.createContext({ console });
vm.runInContext(`${source}\nthis.__testHelpers = {
  PUBLIC_FEED_VERSION,
  actionLabelFor_,
  categoryTagsFor_,
  cleanBody_,
  inferContentType_,
  isVolunteerSignupUrl_,
  newsletterDateFrom_,
  parseSmoreNewsletterHtml_,
  preferredUrl_,
  publicSummary_,
};`, context);

const helpers = context.__testHelpers;

const summerNotesBody = `<html><head><meta charset="iso-8859-1"></head><body>
  <p><strong>Good afternoon,</strong></p>
  <p><strong>Please click the link below to read our Summer News Notes. This includes important back to school information including:</strong></p>
  <ul>
    <li><strong>Important upcoming dates to remember</strong></li>
    <li><strong>Supply List</strong></li>
    <li><strong>New Lunch Ordering Process Information</strong></li>
    <li><strong>Summer Packet information</strong></li>
  </ul>
  <p><a href="https://app.smore.com/n/zk12p"><span>SUMMER NOTES 07.28.26</span></a></p>
  <img width="1" height="1" src="http://renweb.com/RMT/EO.ashx?D=LANSING-DIO&amp;S=123" />
</body></html>`;

test("cleans HTML-mislabeled email bodies into a readable review summary", () => {
  const cleaned = helpers.cleanBody_(summerNotesBody);
  const summary = helpers.publicSummary_(summerNotesBody);

  assert.match(cleaned, /Good afternoon,/);
  assert.match(cleaned, /• Important upcoming dates to remember/);
  assert.match(cleaned, /SUMMER NOTES 07\.28\.26/);
  assert.doesNotMatch(cleaned, /<\/?(?:html|p|strong|li|a)\b/i);
  assert.doesNotMatch(summary, /<[^>]+>|renweb\.com/i);
});

test("prefers the Smore newsletter and rejects tracking URLs", () => {
  assert.equal(helpers.preferredUrl_(summerNotesBody), "https://app.smore.com/n/zk12p");
  assert.equal(helpers.actionLabelFor_("https://app.smore.com/n/zk12p"), "Read newsletter");
  assert.deepEqual([...helpers.categoryTagsFor_("https://app.smore.com/n/zk12p")], ["Newsletter"]);
});

test("keeps newsletters as announcements even when their text mentions other actions", () => {
  assert.equal(
    helpers.inferContentType_("Summer Notes 7/28/26", "Volunteer sign-up and important upcoming dates"),
    "announcement",
  );
});

test("falls back to a normal public link when no newsletter is present", () => {
  const body = [
    "http://renweb.com/RMT/EO.ashx?D=school&S=123",
    "Details: https://st-martha.org/school/events.",
  ].join("\n");

  assert.equal(helpers.preferredUrl_(body), "https://st-martha.org/school/events");
  assert.equal(helpers.actionLabelFor_("https://st-martha.org/school/events"), "Open link");
  assert.deepEqual([...helpers.categoryTagsFor_("https://st-martha.org/school/events")], ["Forwarded school email"]);
});

test("publishes a visible feed version so empty deployments can be verified", () => {
  assert.equal(helpers.PUBLIC_FEED_VERSION, 3);
  assert.match(source, /JSON\.stringify\(\{ version: PUBLIC_FEED_VERSION,/);
  assert.match(source, /items, newsletters/);
});

test("splits structured Smore content into individually reviewable sections", () => {
  const blocks = [];
  for (let index = 1; index <= 14; index += 1) {
    blocks.push({ _t: "misc.separator", _id: `separator-${index}` });
    blocks.push({
      _t: "text.paragraph",
      title: `Section ${index} title`,
      content: [{ c: [`Section ${index} summary`], t: "p" }],
    });
    if (index === 6) {
      blocks.push({ _t: "button", text: "Volunteer", cta: { url: "https://www.signupgenius.com/go/example" } });
    }
  }
  const content = { header: { title: "SUMMER NOTES", subtitle: "07.28.26" }, blocks };
  const html = `<script>newsletter:{js_content:${JSON.stringify(JSON.stringify(content))}}</script>`;
  const newsletter = helpers.parseSmoreNewsletterHtml_(html, "https://app.smore.com/n/zk12p", "Fallback title");

  assert.equal(newsletter.id, "smore-zk12p");
  assert.equal(newsletter.title, "SUMMER NOTES");
  assert.equal(newsletter.date, "2026-07-28");
  assert.equal(newsletter.sections.length, 14);
  assert.equal(newsletter.sections[0].title, "Section 1 title");
  assert.match(newsletter.sections[0].summary, /Section 1 summary/);
  assert.equal(newsletter.sections[5].actionUrl, "https://www.signupgenius.com/go/example");
});

test("recognizes newsletter dates and supported volunteer form URLs", () => {
  assert.equal(helpers.newsletterDateFrom_("07.28.26"), "2026-07-28");
  assert.equal(helpers.newsletterDateFrom_("not a date"), "");
  assert.equal(helpers.isVolunteerSignupUrl_("https://forms.gle/example"), true);
  assert.equal(helpers.isVolunteerSignupUrl_("https://docs.google.com/forms/d/e/example/viewform"), true);
  assert.equal(helpers.isVolunteerSignupUrl_("https://docs.google.com/document/d/example"), false);
});

test("ships a private section editor with explicit approval controls", () => {
  assert.match(adminSource, /Newsletter section review/);
  assert.match(adminSource, /Unreviewed sections stay private/);
  assert.match(adminSource, /Approved/);
  assert.match(adminSource, /Select at least one grade|name="grades"/);
  assert.match(source, /String\(valueFrom_\(row, SECTION_HEADERS, "Status"\)\) === "Approved"/);
});

test("keeps empty spreadsheet rows empty and labels Gmail only after a successful write", () => {
  const processInboxSource = source.slice(source.indexOf("function processInbox()"), source.indexOf("function publishApproved()"));

  assert.match(source, /function compactDataRows_/);
  assert.match(source, /requireCheckbox\(\)\.build\(\)/);
  assert.doesNotMatch(source, /insertCheckboxes\(/);
  assert.ok(processInboxSource.indexOf(".setValues(rows)") < processInboxSource.indexOf("threadsToLabel.forEach"));
});
