import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inboxWorkflowUrl = new URL("../.github/workflows/inbox.yml", import.meta.url);
const deployWorkflowUrl = new URL("../.github/workflows/cloudfront.yml", import.meta.url);

test("checks the school inbox hourly during weekday daytime hours", async () => {
  const workflow = await readFile(inboxWorkflowUrl, "utf8");

  assert.match(workflow, /name: Check school inbox/);
  assert.match(workflow, /cron: "0 8-20 \* \* 1-5"/);
  assert.match(workflow, /timezone: "America\/Detroit"/);
  assert.match(workflow, /for attempt in 1 2 3/);
  assert.match(workflow, /npm run sync:google/);
});

test("commits changed inbox content and dispatches a separate deployment", async () => {
  const workflow = await readFile(inboxWorkflowUrl, "utf8");

  assert.match(workflow, /contents: write/);
  assert.match(workflow, /git commit -m "Sync school inbox \[skip ci\]"/);
  assert.match(workflow, /gh workflow run cloudfront\.yml --ref main/);
});

test("keeps CloudFront deployment independent from inbox availability", async () => {
  const workflow = await readFile(deployWorkflowUrl, "utf8");

  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /npm run sync:google|GOOGLE_CALENDAR_ICS_URL|Sync, OCR, and index inbox newsletters/);
  assert.match(workflow, /npm run test:unit/);
  assert.match(workflow, /aws s3 sync dist\/client/);
});
