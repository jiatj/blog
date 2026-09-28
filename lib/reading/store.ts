import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ReadingSite = {
  name: string;
  url: string;
  feedUrl?: string;
  focusArea: string;
};
export type ReadingArticle = {
  url: string;
  title: string;
  summary: string;
  focusArea: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  publishedDate: string;
};

const localPortalDataDir = process.env.PORTAL_DATA_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.PORTAL_DATA_DIR)
  : path.join(/* turbopackIgnore: true */ process.cwd(), ".portal-data");
const localReadingDataDir = path.join(localPortalDataDir, "reading");
const legacyReadingDataDir = path.join(/* turbopackIgnore: true */ process.cwd(), ".reading-data");

function defaultReadingPath(filename: string) {
  const currentPath = path.join(localReadingDataDir, filename);
  const legacyPath = path.join(legacyReadingDataDir, filename);
  return existsSync(legacyPath) && !existsSync(currentPath) ? legacyPath : currentPath;
}

function dataPath(envName: string, filename: string) {
  const configuredPath = process.env[envName];
  return configuredPath
    ? path.resolve(/* turbopackIgnore: true */ configuredPath)
    : defaultReadingPath(filename);
}

function readingSourcesPath() {
  const configuredPath = process.env.READING_SOURCES_FILE || process.env.READING_SITES_FILE;
  if (configuredPath) return path.resolve(/* turbopackIgnore: true */ configuredPath);
  const jsonPath = defaultReadingPath("sources.json");
  if (existsSync(jsonPath)) return jsonPath;
  const markdownPath = defaultReadingPath("sites.md");
  if (existsSync(markdownPath)) return markdownPath;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "config", "reading-sources.json");
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function loadReadingSites(): ReadingSite[] {
  let markdown: string;
  try {
    const file = readingSourcesPath();
    const source = readFileSync(file, "utf8");
    if (path.extname(file).toLowerCase() === ".json") {
      const parsed = JSON.parse(source) as { sources?: unknown } | unknown[];
      const entries = Array.isArray(parsed) ? parsed : parsed.sources;
      if (!Array.isArray(entries)) throw new Error("Reading sources JSON must contain a sources array");
      const seen = new Set<string>();
      return entries.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const value = entry as Record<string, unknown>;
        const url = httpUrl(value.url);
        const feedUrl = value.feedUrl === undefined ? undefined : httpUrl(value.feedUrl);
        if (value.enabled === false || !url || (value.feedUrl !== undefined && !feedUrl) || typeof value.name !== "string" || seen.has(url)) return [];
        seen.add(url);
        return [{
          name: value.name.trim(),
          url,
          ...(feedUrl ? { feedUrl } : {}),
          focusArea: typeof value.focusArea === "string" ? value.focusArea.trim() : ""
        }];
      });
    }
    markdown = source;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const sites: ReadingSite[] = [];
  const seen = new Set<string>();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*$/);
    if (!match) continue;
    const url = new URL(match[2]);
    if (url.username || url.password || seen.has(url.href)) continue;
    seen.add(url.href);
    sites.push({ name: match[1].trim(), url: url.href, focusArea: "" });
  }
  return sites;
}

export function shanghaiDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid date");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function previousShanghaiDate(now = new Date()): string {
  return shanghaiDate(new Date(now.valueOf() - 24 * 60 * 60 * 1000));
}

export function openReadingDb(): DatabaseSync {
  const file = dataPath("READING_DB_PATH", "reading.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      url TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      focus_area TEXT NOT NULL DEFAULT '',
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      published_date TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS articles_published_date ON articles(published_date);
  `);
  const columns = new Set((db.prepare("PRAGMA table_info(articles)").all() as { name: string }[]).map((column) => column.name));
  if (!columns.has("summary")) db.exec("ALTER TABLE articles ADD COLUMN summary TEXT NOT NULL DEFAULT ''");
  if (!columns.has("focus_area")) db.exec("ALTER TABLE articles ADD COLUMN focus_area TEXT NOT NULL DEFAULT ''");
  return db;
}

export function saveArticles(articles: ReadingArticle[]): number {
  if (!articles.length) return 0;
  const db = openReadingDb();
  try {
    const insert = db.prepare(`
      INSERT INTO articles (url, title, summary, focus_area, source_name, source_url, published_at, published_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        focus_area = excluded.focus_area,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        published_at = excluded.published_at,
        published_date = excluded.published_date
    `);
    db.exec("BEGIN");
    for (const article of articles) {
      insert.run(article.url, article.title, article.summary, article.focusArea, article.sourceName, article.sourceUrl, article.publishedAt, article.publishedDate);
    }
    db.exec("COMMIT");
    return articles.length;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

export function getArticlesByDate(date: string): ReadingArticle[] {
  const db = openReadingDb();
  try {
    const rows = db.prepare(`
      SELECT url, title, summary, focus_area AS focusArea, source_name AS sourceName, source_url AS sourceUrl,
             published_at AS publishedAt, published_date AS publishedDate
      FROM articles WHERE published_date = ? ORDER BY published_at DESC, title
    `).all(date) as ReadingArticle[];
    return rows.map((row) => ({
      url: row.url,
      title: row.title,
      summary: row.summary,
      focusArea: row.focusArea,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      publishedAt: row.publishedAt,
      publishedDate: row.publishedDate
    }));
  } finally {
    db.close();
  }
}

export function getLatestArticleDate(onOrBefore: string): string | null {
  const db = openReadingDb();
  try {
    const row = db.prepare("SELECT MAX(published_date) AS date FROM articles WHERE published_date <= ?").get(onOrBefore) as { date: string | null };
    return row.date;
  } finally {
    db.close();
  }
}

export function getArticleDates(month: string): string[] {
  const db = openReadingDb();
  try {
    return (db.prepare("SELECT DISTINCT published_date AS date FROM articles WHERE published_date LIKE ?").all(`${month}-%`) as { date: string }[])
      .map((row) => row.date);
  } finally {
    db.close();
  }
}
