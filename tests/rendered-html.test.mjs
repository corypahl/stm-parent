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
  assert.match(html, /Coming up/);
  assert.match(html, /On the calendar/);
  assert.match(html, /Latest school newsletter/);
  assert.match(html, /Summer Notes 7\/28\/26/);
  assert.match(html, /https:\/\/secure\.smore\.com\/n\/zk12p\?embed=1/);
  assert.doesNotMatch(html, /No newsletter sections have been approved yet/);
  assert.doesNotMatch(html, /home-hero|Needs your attention|At a glance|Weekly overview|official school hours/);
  assert.doesNotMatch(html, /Good to know|Parent service organization|Explore opportunities|cta-panel/);
  assert.match(html, /Source: St\. Martha 2026–27 Academic Calendar/);
  assert.doesNotMatch(html, /Sample: back-to-school family night/);
  assert.doesNotMatch(html, /Grade Filter|grade-chip|All-school notices are always included/);
  assert.match(html, />Sign Ups<\/a>/);
  assert.match(html, />Newsletters<\/a>/);
  assert.match(html, /href="(?:\/stm-parent)?\/sign-ups\.html"[^>]*>Sign Ups<\/a>/);
  assert.match(html, /href="(?:\/stm-parent)?\/newsletters\.html"[^>]*>Newsletters<\/a>/);
  assert.doesNotMatch(html, /href="(?:\/stm-parent)?\/(?:volunteer|archive)\.html"/);
  assert.doesNotMatch(html, />Volunteer<\/a>|>Archive<\/a>/);
  assert.match(html, /unofficial, parent-created/i);
  assert.match(html, /Source:/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("exports every requested route", async () => {
  const routes = [
    ["action", "Needs action"],
    ["events", "Academic calendar"],
    ["calendar", "Academic calendar"],
    ["staff", "Contacts"],
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
  assert.match(signUpsHtml, /Meet the Miracles RSVP &amp; Volunteer Sign UP/);
  assert.match(signUpsHtml, /https:\/\/forms\.gle\/pHZuPKCD2GW1aNp66/);
  assert.doesNotMatch(signUpsHtml, /No signup form links were found/);
  assert.doesNotMatch(signUpsHtml, /About parent involvement|20 hours|10 hours|per family|Prototype content/);

  const newslettersHtml = await readRoute("newsletters");
  assert.match(newslettersHtml, /<h1>Newsletters<\/h1>/);
  assert.match(newslettersHtml, /Browse every Smore newsletter in the school-updates inbox/);
  assert.match(newslettersHtml, /Summer Notes 7\/28\/26/);
  assert.match(newslettersHtml, /Open Smore/);
  assert.match(newslettersHtml, /Searchable text/);
  assert.match(newslettersHtml, /Text version/);
  assert.match(newslettersHtml, /Search newsletters/);
  assert.doesNotMatch(newslettersHtml, /<iframe\b/);
  assert.doesNotMatch(newslettersHtml, /Sample News Notes|Prototype content/);

  assert.doesNotMatch(newslettersHtml, /\breview\b|\bapprove\b|grade tag/i);
});

test("stores searchable native and OCR newsletter text with extracted signup links", async () => {
  const newsletters = JSON.parse(await readFile(new URL("../app/data/google-newsletters.json", import.meta.url), "utf8"));
  assert.equal(newsletters[0].textStatus, "available");
  assert.ok(newsletters[0].ocrImageCount > 0);
  assert.match(newsletters[0].textContent, /District Code Update/);
  assert.match(newsletters[0].textContent, /Summer Office Hours/);
  assert.equal(newsletters[0].signups[0].url, "https://forms.gle/pHZuPKCD2GW1aNp66");
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
  assert.match(await readRoute("calendar"), /Updated July 29, 2026/i);
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
