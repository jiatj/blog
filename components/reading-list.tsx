"use client";

import { useEffect, useState } from "react";
import type { ReadingArticle } from "@/lib/reading/store";

const favoriteKey = "abl-reading-favorites-v2";
const hiddenKey = "abl-reading-hidden-v2";

function loadSet(key: string): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function ReadingList({ articles, locale }: { articles: ReadingArticle[]; locale: "zh" | "en" }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    setFavorites(loadSet(favoriteKey));
    setHidden(loadSet(hiddenKey));
  }, []);

  function update(key: string, current: Set<string>, setValue: (next: Set<string>) => void, url: string) {
    const next = new Set(current);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    localStorage.setItem(key, JSON.stringify([...next]));
    setValue(next);
  }

  const visible = articles.filter((article) => !hidden.has(article.url) && (!onlyFavorites || favorites.has(article.url)));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border-faint)] pb-4">
        <span className="text-sm text-[var(--muted-foreground)]">{locale === "zh" ? `${visible.length} 篇文章` : `${visible.length} articles`}</span>
        <button className="text-sm font-medium text-[var(--accent-ink)] hover:underline" onClick={() => setOnlyFavorites(!onlyFavorites)} type="button">
          {onlyFavorites ? (locale === "zh" ? "显示全部" : "Show all") : (locale === "zh" ? "只看收藏" : "Favorites only")}
        </button>
      </div>
      {visible.length ? visible.map((article) => (
        <article className="border-b border-[var(--border-faint)] py-6 first:pt-1" key={article.url}>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground-soft)]">
            <span className="font-semibold text-[var(--accent-ink)]">{article.sourceName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" })}</time>
          </div>
          <h2 className="text-xl font-semibold leading-snug tracking-[-0.03em]">
            <a className="transition hover:text-[var(--accent-ink)]" href={article.url} rel="noopener noreferrer" target="_blank">{article.title} <span aria-hidden="true" className="text-base font-normal text-[var(--muted-foreground-soft)]">↗</span></a>
          </h2>
          <div className="mt-4 flex gap-5 text-sm text-[var(--muted-foreground)]">
            <button aria-pressed={favorites.has(article.url)} className="hover:text-[var(--accent-ink)]" onClick={() => update(favoriteKey, favorites, setFavorites, article.url)} type="button">
              {favorites.has(article.url) ? (locale === "zh" ? "已收藏 ★" : "Saved ★") : (locale === "zh" ? "收藏 ☆" : "Save ☆")}
            </button>
            <button className="hover:text-[var(--foreground)]" onClick={() => update(hiddenKey, hidden, setHidden, article.url)} type="button">
              {locale === "zh" ? "删除" : "Remove"}
            </button>
          </div>
        </article>
      )) : <p className="py-12 text-sm text-[var(--muted-foreground)]">{locale === "zh" ? "这一天还没有文章。" : "No articles for this day."}</p>}
    </div>
  );
}
