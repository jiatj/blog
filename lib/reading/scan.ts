import { loadReadingSites, saveArticles, shanghaiDate, type ReadingArticle, type ReadingSite } from "./store.ts";

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
      sourceName: site.name,
      sourceUrl: site.url,
      publishedAt: date.toISOString(),
      publishedDate: shanghaiDate(date)
    });
  }
  return articles;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "AIBuilderLabReading/2.0 (+https://aibuilderlab.dev)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 2_000_000) throw new Error("Response too large");
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("Response too large");
  return text;
}

function discoverFeedLinks(html: string, siteUrl: string): string[] {
  const links: string[] = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["'][^"']*alternate/i.test(tag) || !/\btype=["'](?:application\/(?:rss|atom)\+xml|text\/xml)/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = href && safeUrl(href, siteUrl);
    if (url) links.push(url);
  }
  return links;
}

export async function scanSite(site: ReadingSite): Promise<ReadingArticle[]> {
  const candidates: string[] = [];
  const page = await fetchText(site.url);
  if (/<(?:rss|feed)\b/i.test(page)) return parseFeed(page, site.url, site);
  candidates.push(...discoverFeedLinks(page, site.url));
  candidates.push(...["feed", "rss.xml", "atom.xml"].map((suffix) => new URL(suffix, site.url.endsWith("/") ? site.url : `${site.url}/`).href));
  for (const candidate of new Set(candidates)) {
    try {
      const xml = await fetchText(candidate);
      if (!/<(?:rss|feed)\b/i.test(xml)) continue;
      return parseFeed(xml, candidate, site);
    } catch {
      // A site may advertise a stale feed; try its next candidate.
    }
  }
  throw new Error("No supported RSS/Atom feed found");
}

export async function scanReadingSites(): Promise<{ scanned: number; saved: number; errors: string[] }> {
  const sites = loadReadingSites();
  let saved = 0;
  const errors: string[] = [];
  for (const site of sites) {
    try {
      saved += saveArticles(await scanSite(site));
    } catch (error) {
      errors.push(`${site.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { scanned: sites.length, saved, errors };
}
