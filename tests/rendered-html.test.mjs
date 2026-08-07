import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished parent companion home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /St\. Martha Parent Companion/);
  assert.match(html, /Your school week/);
  assert.match(html, /Needs your attention/);
  assert.match(html, /All-school notices are always included/);
  assert.match(html, /unofficial, parent-created/i);
  assert.match(html, /Source:/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("all requested routes render", async () => {
  const routes = [
    ["/action", "Needs action"],
    ["/events", "Events"],
    ["/lunch", "Lunch menu"],
    ["/volunteer", "Volunteer"],
    ["/documents", "Documents &amp; links"],
    ["/handbook", "Handbook search"],
    ["/archive", "Newsletter archive"],
    ["/admin", "Admin review"],
  ];

  for (const [pathname, heading] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), new RegExp(heading, "i"), pathname);
  }
});
