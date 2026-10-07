import { loadReadingSites, previousShanghaiDate, saveArticles, shanghaiDate, type ReadingArticle, type ReadingSite } from "./store.ts";

function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const point = code[0].toLowerCase() === "x" ? Number.parseInt(code.slice(1), 16) : Number(code);
      return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, entity: string) => ({
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " "
    })[entity as "amp"])
    .trim();
}

function field(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<(?:[\\w-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function summary(value: string): string {
  const clean = decodeXml(value).replace(/\s+/g, " ");
  if (clean.length <= 360) return clean;
  const clipped = clean.slice(0, 357);
  const wordBoundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, wordBoundary > 280 ? wordBoundary : 357).trimEnd()}...`;
}

function safeUrl(value: string, base: string): string | null {
  try {
    const url = new URL(value, base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function parseFeed(xml: string, feedUrl: string, site: ReadingSite): ReadingArticle[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  const articles: ReadingArticle[] = [];
  for (const [, kind, block] of blocks.slice(0, 50)) {
    const title = field(block, "title").replace(/\s+/g, " ").slice(0, 300);
    const atomLinks = [...block.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
    const preferredLink = atomLinks.find((tag) => /\brel=["']alternate["']/i.test(tag)) || atomLinks.find((tag) => !/\brel=["']self["']/i.test(tag));
    const atomLink = preferredLink?.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const rawLink = kind.toLowerCase() === "entry" ? atomLink || field(block, "link") : field(block, "link");
    const url = safeUrl(rawLink, feedUrl);
    const rawDate = field(block, "pubDate") || field(block, "published") || field(block, "updated") || field(block, "date");
    const date = new Date(rawDate);
    if (!title || !url || Number.isNaN(date.valueOf())) continue;
    articles.push({
      url,
      title,
      summary: summary(field(block, "description") || field(block, "summary") || field(block, "encoded") || field(block, "content")),
      focusArea: site.focusArea,
      sourceName: site.name,
      sourceUrl: site.url,
      publishedAt: date.toISOString(),
      publishedDate: shanghaiDate(date)
    });
  }
  return articles;
}

export function parseJsonFeed(text: string, feedUrl: string, site: ReadingSite): ReadingArticle[] {
  const payload = JSON.parse(text) as { items?: unknown[] };
  if (!Array.isArray(payload.items)) return [];
  return payload.items.slice(0, 50).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const title = typeof value.title === "string" ? value.title.replace(/\s+/g, " ").trim().slice(0, 300) : "";
    const url = safeUrl(String(value.url || value.external_url || ""), feedUrl);
    const date = new Date(String(value.date_published || value.date_modified || ""));
    if (!title || !url || Number.isNaN(date.valueOf())) return [];
    const rawSummary = [value.summary, value.content_text, value.content_html].find((candidate) => typeof candidate === "string") as string | undefined;
    return [{
      url,
      title,
      summary: summary(rawSummary || ""),
      focusArea: site.focusArea,
      sourceName: site.name,
      sourceUrl: site.url,
      publishedAt: date.toISOString(),
      publishedDate: shanghaiDate(date)
    }];
  });
}

function errorDetails(error: unknown, depth = 0): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error as Error & { code?: unknown }).code;
  const message = typeof code === "string" ? `${code}: ${error.message}` : error.message || error.name;
  if (depth >= 3) return message;
  const causes = error instanceof AggregateError ? error.errors : error.cause ? [error.cause] : [];
  const details = causes.map((cause: unknown) => errorDetails(cause, depth + 1)).join("; ");
  return details ? `${message} (${details})` : message;
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "AIBuilderLabReading/2.0 (+https://aibuilderlab.dev)", Accept: "application/rss+xml, application/atom+xml, application/feed+json, application/json, application/xml, text/xml, text/html" },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
        continue;
      }
      const length = Number(response.headers.get("content-length") || 0);
      if (length > 2_000_000) throw new Error("Response too large");
      const text = await response.text();
      if (text.length > 2_000_000) throw new Error("Response too large");
      return text;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`${url}: ${errorDetails(lastError)}`);
}

function discoverFeedLinks(html: string, siteUrl: string): string[] {
  const links: string[] = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["'][^"']*alternate/i.test(tag) || !/\btype=["'](?:application\/(?:rss|atom)\+xml|application\/feed\+json|text\/xml)/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = href && safeUrl(href, siteUrl);
    if (url) links.push(url);
  }
  return links;
}

export async function scanSite(site: ReadingSite): Promise<ReadingArticle[]> {
  if (site.feedUrl) {
    const feed = await fetchText(site.feedUrl);
    if (/^\s*\{/.test(feed)) return parseJsonFeed(feed, site.feedUrl, site);
    if (/<(?:rss|feed)\b/i.test(feed)) return parseFeed(feed, site.feedUrl, site);
    throw new Error("Configured feed URL is not RSS, Atom, or JSON Feed");
  }
  const candidates: string[] = [];
  const page = await fetchText(site.url);
  if (/<(?:rss|feed)\b/i.test(page)) return parseFeed(page, site.url, site);
  candidates.push(...discoverFeedLinks(page, site.url));
  candidates.push(...["feed", "rss.xml", "atom.xml", "feed.json"].map((suffix) => new URL(suffix, site.url.endsWith("/") ? site.url : `${site.url}/`).href));
  for (const candidate of new Set(candidates)) {
    try {
      const xml = await fetchText(candidate);
      if (/^\s*\{/.test(xml)) return parseJsonFeed(xml, candidate, site);
      if (/<(?:rss|feed)\b/i.test(xml)) return parseFeed(xml, candidate, site);
    } catch {
      // A site may advertise a stale feed; try its next candidate.
    }
  }
  throw new Error("No supported RSS/Atom feed found");
}

export async function scanReadingSites(options: { date?: string } = {}): Promise<{ date: string; scanned: number; saved: number; errors: string[] }> {
  const sites = loadReadingSites();
  const date = options.date || previousShanghaiDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Scan date must use YYYY-MM-DD");
  let saved = 0;
  const errors: string[] = [];
  const results = await Promise.all(sites.map(async (site) => {
    try {
      return { articles: (await scanSite(site)).filter((article) => article.publishedDate === date) };
    } catch (error) {
      return { error: `${site.name}: ${error instanceof Error ? error.message : String(error)}` };
    }
  }));
  for (const result of results) {
    if (result.error) errors.push(result.error);
    else saved += saveArticles(result.articles || []);
  }
  return { date, scanned: sites.length, saved, errors };
}
