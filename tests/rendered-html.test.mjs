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
  assert.match(html, /School updates/);
  assert.match(html, /No newsletter sections have been approved yet/);
  assert.doesNotMatch(html, /home-hero|Needs your attention|At a glance|Weekly overview|official school hours/);
  assert.doesNotMatch(html, /Good to know|Parent service organization|Explore opportunities|cta-panel/);
  assert.match(html, /Source: St\. Martha 2026–27 Academic Calendar/);
  assert.doesNotMatch(html, /Sample: back-to-school family night/);
  assert.match(html, /All-school notices are always included/);
  assert.match(html, /Grade Filter/);
  assert.match(html, />Pre-K<\/button>/);
  assert.match(html, />1st<\/button>/);
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
    ["volunteer", "Volunteer"],
    ["documents", "Documents &amp; links"],
    ["handbook", "Handbook search"],
    ["archive", "Newsletter archive"],
    ["admin", "Admin review"],
  ];

  for (const [pathname, heading] of routes) {
    assert.match(await readRoute(pathname), new RegExp(heading, "i"), pathname);
  }

  const calendarHtml = await readRoute("calendar");
  assert.match(calendarHtml, /Subscribe with Google/);
  assert.match(calendarHtml, /stm\.parent\.updates%40gmail\.com\/public\/basic\.ics/);

  const volunteerHtml = await readRoute("volunteer");
  assert.match(volunteerHtml, /Current SignUpGenius and Google Forms opportunities from the latest school newsletter/);
  assert.match(volunteerHtml, /No volunteer signups were included in the latest newsletter for the selected grades/);
  assert.doesNotMatch(volunteerHtml, /About parent involvement|20 hours|10 hours|per family|Prototype content/);

  const archiveHtml = await readRoute("archive");
  assert.match(archiveHtml, /Previous newsletters will appear here after a newer issue is published/);
  assert.doesNotMatch(archiveHtml, /Sample News Notes|Prototype content/);

  const adminHtml = await readRoute("admin");
  assert.match(adminHtml, /Open the private section admin from Google Sheets/);
  assert.match(adminHtml, /Parent Site.*Open section admin/);
  assert.doesNotMatch(adminHtml, /non-functional preview|No data is being imported yet|Sample News Notes/);
});

test("publishes the source handbook and calendar PDFs", async () => {
  await access(new URL("documents/2025-26-st-martha-handbook.pdf", outputRoot));
  await access(new URL("documents/2026-27-academic-calendar.pdf", outputRoot));
  const calendarImport = await readFile(new URL("documents/st-martha-2026-27-calendar.ics", outputRoot), "utf8");
  assert.match(calendarImport, /^BEGIN:VCALENDAR/);
  assert.match(calendarImport, /BEGIN:VEVENT/);

  assert.match(await readRoute("handbook"), /33 content pages/i);
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
