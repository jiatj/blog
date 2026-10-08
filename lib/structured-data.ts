import { pageUrl, seoDate } from "@/lib/metadata";
import { siteConfig, type Locale } from "@/lib/site-config";

export function authorData(locale: Locale) {
  return {
    "@type": "Person",
    "@id": `${siteConfig.url}/#author`,
    name: locale === "zh" ? siteConfig.authorZh : siteConfig.author,
    alternateName: locale === "zh" ? siteConfig.author : siteConfig.authorZh,
    url: pageUrl(locale, "/about")
  };
}

export function articleData({ locale, path, title, summary, date, updated, cover, tags }: {
  locale: Locale; path: string; title: string; summary?: string; date?: string; updated?: string; cover?: string; tags?: string[];
}) {
  const url = pageUrl(locale, path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: title,
    description: summary,
    url,
    mainEntityOfPage: url,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: seoDate(date),
    dateModified: seoDate(updated ?? date),
    author: authorData(locale),
    publisher: authorData(locale),
    ...(cover ? { image: new URL(cover, siteConfig.url).toString() } : {}),
    ...(tags?.length ? { keywords: tags.join(", ") } : {})
  };
}
