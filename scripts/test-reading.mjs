import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseFeed, scanSite } from "../lib/reading/scan.ts";
import { getArticleDates, getArticlesByDate, loadReadingSites, saveArticles, shanghaiDate } from "../lib/reading/store.ts";

const fixture = mkdtempSync(path.join(tmpdir(), "abl-reading-"));
process.env.READING_DB_PATH = path.join(fixture, "reading.sqlite");
process.env.READING_SITES_FILE = path.join(fixture, "sites.md");

test("Markdown site list and RSS/Atom articles enter SQLite by Shanghai day", () => {
  try {
    writeFileSync(process.env.READING_SITES_FILE, "# 我的网址\n- [Example](https://example.com/)\n- [Repeat](https://example.com/)\n");
    assert.deepEqual(loadReadingSites(), [{ name: "Example", url: "https://example.com/" }]);
    const site = loadReadingSites()[0];
    const rss = `<rss><channel><item><title><![CDATA[The &amp; test]]></title><link>https://example.com/a#section</link><pubDate>Fri, 25 Sep 2026 17:30:00 GMT</pubDate></item></channel></rss>`;
    const atom = `<feed><entry><title>Another</title><link rel="alternate" href="https://example.com/b" /><published>2026-09-26T09:00:00+08:00</published></entry></feed>`;
    const articles = [...parseFeed(rss, site.url, site), ...parseFeed(atom, site.url, site)];
    assert.equal(articles.length, 2);
    assert.equal(articles[0].publishedDate, "2026-09-26");
    assert.equal(articles[0].url, "https://example.com/a");
    assert.equal(articles[0].title, "The & test");
    saveArticles(articles);
    saveArticles(articles);
    assert.equal(getArticlesByDate("2026-09-26").length, 2);
    assert.deepEqual(getArticleDates("2026-09"), ["2026-09-26"]);
    assert.equal(shanghaiDate("2026-09-25T16:00:00Z"), "2026-09-26");
  } finally {
    if (path.dirname(fixture) === tmpdir() && path.basename(fixture).startsWith("abl-reading-")) {
      rmSync(fixture, { recursive: true, force: true });
    }
  }
});

test("Scanner discovers a site's RSS link and reads dated items", async () => {
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", request.url === "/feed.xml" ? "application/rss+xml" : "text/html");
    response.end(request.url === "/feed.xml"
      ? '<rss><channel><item><title>New story</title><link>https://example.com/story</link><pubDate>Sat, 26 Sep 2026 01:00:00 GMT</pubDate></item></channel></rss>'
      : '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head></html>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const site = { name: "Local feed", url: `http://127.0.0.1:${server.address().port}/` };
    const articles = await scanSite(site);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, "New story");
    assert.equal(articles[0].publishedDate, "2026-09-26");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
