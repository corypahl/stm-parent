import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);

async function readRoute(pathname = "") {
  const path = pathname ? `${pathname}.html` : "index.html";
  return readFile(new URL(path, outputRoot), "utf8");
}

test("exports the finished parent companion home", async () => {
  const html = await readRoute();
  assert.match(html, /St\. Martha School/);
  assert.match(html, /Unofficial Parent Site/);
  assert.match(html, /Coming Up/);
  assert.match(html, /<h2>Coming Up[\s\S]*?<h2>Sign Ups[\s\S]*?<h2>Latest News/);
  assert.match(html, /Latest News/);
  assert.doesNotMatch(html, /On the calendar|School updates|Latest school newsletter/);
  assert.match(html, /<span class="eyebrow">Latest issue<\/span>/);
  assert.match(html, /https:\/\/secure\.smore\.com\/n\/[a-z0-9-]+\?embed=1/);
  assert.doesNotMatch(html, /No newsletter sections have been approved yet/);
  assert.doesNotMatch(html, /home-hero|Needs your attention|At a glance|Weekly overview|official school hours/);
  assert.doesNotMatch(html, /Good to know|Parent service organization|Explore opportunities|cta-panel/);
  assert.match(html, /Sources: St\. Martha 2026–27 Academic Calendar and upcoming dates extracted from school newsletters/);
  assert.doesNotMatch(html, /Sample: back-to-school family night/);
  assert.doesNotMatch(html, /Grade Filter|grade-chip|All-school notices are always included/);
  assert.doesNotMatch(html, /calendar-category|<span class="badge[^>]*">(?:School day|No school|Family event|Faith|Academic)<\/span>/);
  assert.match(html, /<h2>Sign Ups/);
  assert.match(html, /Newsletter form|No signup form links were found in the latest newsletter/);
  assert.match(html, />Newsletters<\/a>/);
  assert.doesNotMatch(html, /href="(?:\/stm-parent)?\/sign-ups\.html"[^>]*>Sign Ups<\/a>/);
  assert.match(html, /href="(?:\/stm-parent)?\/newsletters\.html"[^>]*>Newsletters<\/a>/);
  assert.match(html, /href="(?:\/stm-parent)?\/lunch\.html"[^>]*>Lunch<\/a>/);
  assert.match(html, /href="(?:\/stm-parent)?\/directory\.html"[^>]*>Directory<\/a>/);
  assert.match(html, />Home<\/a>.*>Newsletters<\/a>.*>Events<\/a>.*>Lunch<\/a>.*>Handbook<\/a>.*>Directory<\/a>/s);
  assert.doesNotMatch(html, /href="(?:\/stm-parent)?\/(?:volunteer|archive)\.html"/);
  assert.doesNotMatch(html, /href="(?:\/stm-parent)?\/staff\.html"[^>]*>Directory<\/a>/);
  assert.doesNotMatch(html, />Volunteer<\/a>|>Archive<\/a>/);
  assert.match(html, /unofficial, parent-created/i);
  assert.match(html, /Sources?:/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("exports every requested route", async () => {
  const routes = [
    ["action", "Needs action"],
    ["events", "Academic calendar"],
    ["calendar", "Academic calendar"],
    ["directory", "Directory"],
    ["staff", "Directory"],
    ["lunch", "Lunch menu"],
    ["sign-ups", "Sign Ups"],
    ["volunteer", "Sign Ups"],
    ["documents", "Documents &amp; links"],
    ["handbook", "Parent &amp; student handbook"],
    ["newsletters", "Newsletters"],
    ["archive", "Newsletters"],
  ];

  for (const [pathname, heading] of routes) {
    assert.match(await readRoute(pathname), new RegExp(heading, "i"), pathname);
  }

  const calendarHtml = await readRoute("calendar");
  assert.match(calendarHtml, /Subscribe with Google/);
  assert.match(calendarHtml, /stm\.parent\.updates%40gmail\.com\/public\/basic\.ics/);
  assert.match(calendarHtml, /school newsletters/);
  assert.doesNotMatch(calendarHtml, /calendar-category|<span class="badge/);

  const lunchHtml = await readRoute("lunch");
  assert.match(lunchHtml, /May 2026/);
  assert.match(lunchHtml, /21(?:<!-- -->)? dated entries/);
  assert.match(lunchHtml, /Fish sticks/);
  assert.match(lunchHtml, /Tacos with beef &amp; cheese/);
  assert.match(lunchHtml, /No hot lunch/);
  assert.match(lunchHtml, /https:\/\/app\.smore\.com\/n\/reb6y/);
  assert.doesNotMatch(lunchHtml, /Sample:|demonstration data|Prototype content|Source placeholder/i);

  const signUpsHtml = await readRoute("sign-ups");
  assert.match(signUpsHtml, /<h1>Sign Ups<\/h1>/);
  assert.match(signUpsHtml, /extracted automatically from the latest school newsletter/);
  assert.match(signUpsHtml, /Newsletter form|No signup form links were found in the latest newsletter/);
  assert.doesNotMatch(signUpsHtml, /About parent involvement|20 hours|10 hours|per family|Prototype content/);

  const newslettersHtml = await readRoute("newsletters");
  assert.match(newslettersHtml, /<h1>Newsletters<\/h1>/);
  assert.match(newslettersHtml, /Browse every Smore newsletter in the school-updates inbox/);
  assert.match(newslettersHtml, /Summer Notes 7\/28\/26/);
  assert.match(newslettersHtml, />Read here<\/button>/);
  assert.match(newslettersHtml, />Text version<\/button>/);
  assert.match(newslettersHtml, />Open Smore<\/a>/);
  assert.match(newslettersHtml, /Search newsletters/);
  assert.doesNotMatch(newslettersHtml, /<iframe\b/);
  assert.doesNotMatch(newslettersHtml, /<span class="badge|Searchable text|>Latest<\/span>|>Archived<\/span>|Read original|Close original|Close text/);
  assert.doesNotMatch(newslettersHtml, /Sample News Notes|Prototype content/);

  assert.doesNotMatch(newslettersHtml, /\breview\b|\bapprove\b|grade tag/i);

  const handbookHtml = await readRoute("handbook");
  assert.equal((handbookHtml.match(/<table\b/g) || []).length, 6);
  assert.match(handbookHtml, /<caption>Staff roster<\/caption>/);
  assert.match(handbookHtml, /How daily tardiness adds up over a school year/);
  assert.match(handbookHtml, /Severe physical aggression consequences by grade level/);
  assert.match(handbookHtml, /Rough play and unsafe physical contact consequences by grade level/);
  assert.match(handbookHtml, /Discriminatory or offensive language consequences by grade level/);
  assert.match(handbookHtml, /<caption>Fee schedule<\/caption>/);
  assert.equal((handbookHtml.match(/class="uniform-guide-card"/g) || []).length, 4);
  assert.match(handbookHtml, /class="handbook-acknowledgment"/);
  assert.match(handbookHtml, /mailto:apatton@st-martha\.org/);
  assert.doesNotMatch(handbookHtml, /The following items must be The following items must be/);
});

test("stores searchable native and OCR newsletter text with extracted signup links", async () => {
  const newsletters = JSON.parse(await readFile(new URL("../app/data/google-newsletters.json", import.meta.url), "utf8"));
  assert.ok(newsletters.length > 0);
  assert.ok(newsletters.some((newsletter) => newsletter.textStatus === "available" && newsletter.textContent.length > 100));
  assert.ok(newsletters.some((newsletter) => newsletter.ocrImageCount > 0));
  assert.ok(newsletters.some((newsletter) => newsletter.textSections.length > 0));
  assert.ok(newsletters.flatMap((newsletter) => newsletter.signups).some((signup) => /(?:forms\.gle|signupgenius\.com)/i.test(signup.url)));
});

test("publishes the source handbook and calendar PDFs", async () => {
  await access(new URL("documents/2025-26-st-martha-handbook.pdf", outputRoot));
  await access(new URL("documents/2026-27-academic-calendar.pdf", outputRoot));
  const calendarImport = await readFile(new URL("documents/st-martha-2026-27-calendar.ics", outputRoot), "utf8");
  assert.match(calendarImport, /^BEGIN:VCALENDAR/);
  assert.match(calendarImport, /BEGIN:VEVENT/);

  const handbookHtml = await readRoute("handbook");
  assert.match(handbookHtml, /33 content pages/i);
  assert.match(handbookHtml, /22 sections/i);
  assert.match(handbookHtml, /All students are expected to attend school regularly/i);
  assert.match(handbookHtml, /Food Allergies, Intolerances, and Nut Restrictions/i);
  assert.match(handbookHtml, /The complete handbook wording is reproduced below/i);
  assert.doesNotMatch(handbookHtml, /Handbook summary|parent-friendly summaries/i);
  assert.match(await readRoute("calendar"), /Checked during every site update/i);
  assert.match(await readRoute("directory"), /Verified August 7, 2026/i);
  assert.match(await readRoute("staff"), /Verified August 7, 2026/i);
});

test("includes the GitHub Pages no-Jekyll marker", async () => {
  await access(new URL(".nojekyll", outputRoot));
});

test("places the referenced stylesheet at the deployed artifact path", async () => {
  const html = await readRoute();
  const stylesheet = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/i)?.[1];
  assert.ok(stylesheet, "exported HTML must reference a stylesheet");

  const deploymentPrefix = "/stm-parent/";
  assert.ok(stylesheet.startsWith(deploymentPrefix), "stylesheet URL must include the Pages base path");

  const artifactPath = stylesheet.slice(deploymentPrefix.length);
  await access(new URL(artifactPath, outputRoot));
});
