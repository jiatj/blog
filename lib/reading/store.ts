import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ReadingSite = { name: string; url: string };
export type ReadingArticle = {
  url: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  publishedDate: string;
};

const localDataDir = path.join(/* turbopackIgnore: true */ process.cwd(), ".reading-data");

function dataPath(envName: string, filename: string) {
  const configuredPath = process.env[envName];
  return configuredPath
    ? path.resolve(/* turbopackIgnore: true */ configuredPath)
    : path.join(localDataDir, filename);
}

export function loadReadingSites(): ReadingSite[] {
  let markdown: string;
  try {
    markdown = readFileSync(dataPath("READING_SITES_FILE", "sites.md"), "utf8");
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
    sites.push({ name: match[1].trim(), url: url.href });
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

export function openReadingDb(): DatabaseSync {
  const file = dataPath("READING_DB_PATH", "reading.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      url TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      published_date TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS articles_published_date ON articles(published_date);
  `);
  return db;
}

export function saveArticles(articles: ReadingArticle[]): number {
  if (!articles.length) return 0;
  const db = openReadingDb();
  try {
    const insert = db.prepare(`
      INSERT INTO articles (url, title, source_name, source_url, published_at, published_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        published_at = excluded.published_at,
        published_date = excluded.published_date
    `);
    db.exec("BEGIN");
    for (const article of articles) {
      insert.run(article.url, article.title, article.sourceName, article.sourceUrl, article.publishedAt, article.publishedDate);
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
    return (db.prepare(`
      SELECT url, title, source_name AS sourceName, source_url AS sourceUrl,
             published_at AS publishedAt, published_date AS publishedDate
      FROM articles WHERE published_date = ? ORDER BY published_at DESC, title
    `).all(date) as ReadingArticle[]);
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
