import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inboxWorkflowUrl = new URL("../.github/workflows/inbox.yml", import.meta.url);
const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);
const cloudFrontWorkflowUrl = new URL("../.github/workflows/cloudfront.yml", import.meta.url);

test("checks the school inbox hourly during weekday daytime hours", async () => {
  const workflow = await readFile(inboxWorkflowUrl, "utf8");

  assert.match(workflow, /name: Check school inbox/);
  assert.match(workflow, /cron: "0 8-20 \* \* 1-5"/);
  assert.match(workflow, /timezone: "America\/Detroit"/);
  assert.match(workflow, /for attempt in 1 2 3/);
  assert.match(workflow, /npm run sync:google/);
  assert.match(workflow, /npm run calendar:generate/);
});

test("commits changed inbox content and dispatches a separate deployment", async () => {
  const workflow = await readFile(inboxWorkflowUrl, "utf8");

  assert.match(workflow, /contents: write/);
  assert.match(workflow, /git commit -m "Sync school inbox \[skip ci\]"/);
  assert.match(workflow, /public\/documents\/st-martha-2026-27-calendar\.ics/);
  assert.match(workflow, /gh workflow run pages\.yml --ref main/);
  assert.match(workflow, /vars\.AWS_DEPLOY_ROLE_ARN != ''/);
  assert.match(workflow, /inbox-diagnostics-/);
});

test("deploys committed content to Pages without contacting the inbox", async () => {
  const workflow = await readFile(pagesWorkflowUrl, "utf8");

  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /npm run sync:google|GOOGLE_CALENDAR_ICS_URL|Sync, OCR, and index inbox newsletters/);
  assert.match(workflow, /DEPLOY_TARGET: github-pages/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /Verify expected newsletter is in the export/);
  assert.match(workflow, /Verify published newsletter/);
  assert.match(workflow, /pages-diagnostics-/);
});

test("keeps the future CloudFront deployment independent from inbox availability", async () => {
  const workflow = await readFile(cloudFrontWorkflowUrl, "utf8");

  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /npm run sync:google|GOOGLE_CALENDAR_ICS_URL|Sync, OCR, and index inbox newsletters/);
  assert.match(workflow, /npm run test:unit/);
  assert.match(workflow, /aws s3 sync dist\/client/);
});
