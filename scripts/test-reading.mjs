import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseFeed, parseJsonFeed, scanReadingSites, scanSite } from "../lib/reading/scan.ts";
import { getArticleDates, getArticlesByDate, getLatestArticleDate, loadReadingSites, previousShanghaiDate, saveArticles, shanghaiDate } from "../lib/reading/store.ts";

const fixture = mkdtempSync(path.join(tmpdir(), "abl-reading-"));
process.env.READING_DB_PATH = path.join(fixture, "reading.sqlite");
process.env.READING_SOURCES_FILE = path.join(fixture, "sources.json");

test.after(() => {
  if (path.dirname(fixture) === tmpdir() && path.basename(fixture).startsWith("abl-reading-")) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("JSON sources and RSS/Atom summaries enter SQLite by Shanghai day", () => {
  writeFileSync(process.env.READING_SOURCES_FILE, JSON.stringify({
    sources: [
      { name: "Example", url: "https://example.com/", feedUrl: "https://example.com/feed", focusArea: "AI Coding" },
      { name: "Disabled", url: "https://disabled.example/", enabled: false },
      { name: "Repeat", url: "https://example.com/" }
    ]
  }));
  assert.deepEqual(loadReadingSites(), [{
    name: "Example",
    url: "https://example.com/",
    feedUrl: "https://example.com/feed",
    focusArea: "AI Coding"
  }]);
  const site = loadReadingSites()[0];
  const rss = `<rss><channel><item><title><![CDATA[The &amp; test]]></title><link>https://example.com/a#section</link><description><![CDATA[<p>A useful &amp; short summary.</p>]]></description><pubDate>Fri, 25 Sep 2026 17:30:00 GMT</pubDate></item></channel></rss>`;
  const atom = `<feed><entry><title>Another</title><link rel="alternate" href="https://example.com/b" /><summary>Second summary</summary><published>2026-09-26T09:00:00+08:00</published></entry></feed>`;
  const articles = [...parseFeed(rss, site.feedUrl, site), ...parseFeed(atom, site.feedUrl, site)];
  assert.equal(articles.length, 2);
  assert.equal(articles[0].publishedDate, "2026-09-26");
  assert.equal(articles[0].url, "https://example.com/a");
  assert.equal(articles[0].title, "The & test");
  assert.equal(articles[0].summary, "A useful & short summary.");
  assert.equal(articles[0].focusArea, "AI Coding");
  saveArticles(articles);
  saveArticles(articles);
  const storedArticles = getArticlesByDate("2026-09-26");
  assert.equal(storedArticles.length, 2);
  assert.equal(Object.getPrototypeOf(storedArticles[0]), Object.prototype);
  assert.equal(getLatestArticleDate("2026-09-27"), "2026-09-26");
  assert.deepEqual(getArticleDates("2026-09"), ["2026-09-26"]);
  assert.equal(shanghaiDate("2026-09-25T16:00:00Z"), "2026-09-26");
  assert.equal(previousShanghaiDate(new Date("2026-09-28T00:30:00+08:00")), "2026-09-27");
});

test("JSON Feed items provide their original summary", () => {
  const site = { name: "JSON Feed", url: "https://example.com/", focusArea: "Products" };
  const articles = parseJsonFeed(JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    items: [{ title: "A JSON story", url: "/story", summary: "Feed summary", date_published: "2026-09-27T08:00:00+08:00" }]
  }), "https://example.com/feed.json", site);
  assert.equal(articles.length, 1);
  assert.equal(articles[0].summary, "Feed summary");
  assert.equal(articles[0].publishedDate, "2026-09-27");
});

test("Scanner discovers a site's RSS link and reads dated items", async () => {
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", request.url === "/feed.xml" ? "application/rss+xml" : "text/html");
    response.end(request.url === "/feed.xml"
      ? '<rss><channel><item><title>New story</title><link>https://example.com/story</link><description>Useful detail</description><pubDate>Sat, 26 Sep 2026 01:00:00 GMT</pubDate></item></channel></rss>'
      : '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head></html>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const site = { name: "Local feed", url: `http://127.0.0.1:${address.port}/`, focusArea: "Local" };
    const articles = await scanSite(site);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, "New story");
    assert.equal(articles[0].summary, "Useful detail");
    assert.equal(articles[0].publishedDate, "2026-09-26");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Daily scan saves only the requested Shanghai date", async () => {
  const server = createServer((_request, response) => {
    response.setHeader("Content-Type", "application/rss+xml");
    response.end('<rss><channel><item><title>Wanted</title><link>https://example.com/wanted</link><pubDate>Mon, 28 Sep 2026 01:00:00 GMT</pubDate></item><item><title>Other</title><link>https://example.com/other</link><pubDate>Tue, 29 Sep 2026 01:00:00 GMT</pubDate></item></channel></rss>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    writeFileSync(process.env.READING_SOURCES_FILE, JSON.stringify({
      sources: [{ name: "Daily", url: "https://example.com/", feedUrl: `http://127.0.0.1:${address.port}/feed`, focusArea: "Daily" }]
    }));
    const result = await scanReadingSites({ date: "2026-09-28" });
    assert.equal(result.saved, 1);
    assert.deepEqual(getArticlesByDate("2026-09-28").map((article) => article.title), ["Wanted"]);
    assert.equal(getArticlesByDate("2026-09-29").length, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("A network failure reports its URL and cause codes while another source is saved", async (t) => {
  const failedUrl = "https://failed.example/feed";
  writeFileSync(process.env.READING_SOURCES_FILE, JSON.stringify({
    sources: [
      { name: "Failed", url: "https://failed.example/", feedUrl: failedUrl, focusArea: "Failure" },
      { name: "Healthy", url: "https://healthy.example/", feedUrl: "https://healthy.example/feed", focusArea: "Healthy" }
    ]
  }));
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url === failedUrl) {
      throw new TypeError("fetch failed", { cause: new AggregateError([
        Object.assign(new Error("connect unreachable"), { code: "ENETUNREACH" }),
        Object.assign(new Error("connect timed out"), { code: "ETIMEDOUT" })
      ]) });
    }
    return new Response('<rss><channel><item><title>Healthy story</title><link>https://healthy.example/story</link><pubDate>Sun, 27 Sep 2026 01:00:00 GMT</pubDate></item></channel></rss>');
  });
  const result = await scanReadingSites({ date: "2026-09-27" });
  assert.equal(result.saved, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Failed: https:\/\/failed\.example\/feed: fetch failed/);
  assert.match(result.errors[0], /ENETUNREACH/);
  assert.match(result.errors[0], /ETIMEDOUT/);
  assert.ok(getArticlesByDate("2026-09-27").some((article) => article.title === "Healthy story"));
});
