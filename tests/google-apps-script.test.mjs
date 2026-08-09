import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../automation/google-apps-script/Code.gs", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../automation/google-apps-script/appsscript.json", import.meta.url), "utf8"));
const context = vm.createContext({ console });
vm.runInContext(`${source}\nthis.__testHelpers = {
  PUBLIC_FEED_VERSION,
  canonicalSmoreUrl_,
  cleanSubject_,
  latestNewsletterFromArchive_,
  newsletterArchiveFromEmailRecords_,
  newsletterDateFrom_,
  smoreLinkTitle_,
  smoreUrlsFrom_,
};`, context);

const helpers = context.__testHelpers;

const summerNotesHtml = `<html><body>
  <p>Please click below to read our Summer News Notes.</p>
  <p><a href="https://app.smore.com/n/zk12p"><span>SUMMER NOTES 07.28.26</span></a></p>
  <img src="http://renweb.com/RMT/EO.ashx?D=LANSING-DIO&amp;S=123" />
</body></html>`;

test("publishes a feed version dedicated to automatic inbox newsletters", () => {
  assert.equal(helpers.PUBLIC_FEED_VERSION, 6);
  assert.match(source, /GmailApp\.search\("in:inbox"/);
  assert.match(source, /latestNewsletter,\s*newsletters,\s*items: \[\]/);
  assert.doesNotMatch(source, /Review Queue|Newsletter Sections|Status.*Approved|gradeTags|categoryTags/);
});

test("keeps only public Smore newsletter links from email content", () => {
  assert.deepEqual(
    [...helpers.smoreUrlsFrom_(summerNotesHtml, "Tracking https://example.com/private")],
    ["https://app.smore.com/n/zk12p"],
  );
  assert.equal(helpers.canonicalSmoreUrl_("https://secure.smore.com/n/ZK12P?embed=1"), "https://app.smore.com/n/zk12p");
  assert.equal(helpers.canonicalSmoreUrl_("https://example.com/n/zk12p"), "");
  assert.equal(helpers.smoreLinkTitle_(summerNotesHtml), "SUMMER NOTES 07.28.26");
});

test("includes every inbox Smore issue and picks the latest newsletter date", () => {
  const records = [
    {
      id: "newer-email",
      receivedAt: "2026-08-07T20:00:00Z",
      subject: "Fwd: NEWS NOTES 06/02/26",
      plainBody: "Read https://app.smore.com/n/older",
      htmlBody: "",
    },
    {
      id: "older-email-with-newer-issue",
      receivedAt: "2026-08-01T20:00:00Z",
      subject: "FW: Summer Notes 7/28/26",
      plainBody: "",
      htmlBody: summerNotesHtml,
    },
    {
      id: "not-a-newsletter",
      receivedAt: "2026-08-08T20:00:00Z",
      subject: "School reminder 8/8/26",
      plainBody: "Private family message https://st-martha.org/school",
      htmlBody: "",
    },
  ];

  const archive = helpers.newsletterArchiveFromEmailRecords_(records);
  const latest = helpers.latestNewsletterFromArchive_(archive);

  assert.deepEqual([...archive].map((newsletter) => newsletter.id), ["smore-zk12p", "smore-older"]);
  assert.deepEqual({ ...latest }, {
    id: "smore-zk12p",
    title: "Summer Notes 7/28/26",
    newsletterDate: "2026-07-28",
    sourceUrl: "https://app.smore.com/n/zk12p",
  });
  assert.equal(archive[1].newsletterDate, "2026-06-02");
  assert.doesNotMatch(JSON.stringify(archive), /Private family message|receivedAt|plainBody|htmlBody/i);
});

test("deduplicates repeated forwards of the same Smore issue", () => {
  const archive = helpers.newsletterArchiveFromEmailRecords_([
    {
      receivedAt: "2026-08-01T20:00:00Z",
      subject: "Summer Notes 7/28/26",
      plainBody: "https://app.smore.com/n/zk12p",
      htmlBody: "",
    },
    {
      receivedAt: "2026-08-02T20:00:00Z",
      subject: "Fwd: Summer Notes 7/28/26",
      plainBody: "https://secure.smore.com/n/zk12p?embed=1",
      htmlBody: "",
    },
  ]);

  assert.equal(archive.length, 1);
  assert.equal(archive[0].id, "smore-zk12p");
});

test("uses newsletter text for the date and received date only as a fallback", () => {
  const fromLinkText = helpers.newsletterArchiveFromEmailRecords_([{
    receivedAt: "2026-08-01T20:00:00Z",
    subject: "Fwd: Summer information",
    plainBody: "",
    htmlBody: summerNotesHtml,
  }]);
  const fromReceivedDate = helpers.newsletterArchiveFromEmailRecords_([{
    receivedAt: "2026-08-03T20:00:00Z",
    subject: "Weekly newsletter",
    plainBody: "https://app.smore.com/n/no-date",
    htmlBody: "",
  }]);

  assert.equal(fromLinkText[0].newsletterDate, "2026-07-28");
  assert.equal(fromReceivedDate[0].newsletterDate, "2026-08-03");
  assert.equal(helpers.newsletterDateFrom_("NEWS NOTES 06.02.26"), "2026-06-02");
  assert.equal(helpers.cleanSubject_("Fwd: RE: Summer Notes"), "Summer Notes");
});

test("requests the documented GmailApp and trigger-management permissions", () => {
  assert.deepEqual(manifest.oauthScopes, [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/script.scriptapp",
  ]);
});
