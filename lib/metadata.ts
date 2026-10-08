import type { Metadata } from "next";

import { locales, siteConfig, type Locale } from "@/lib/site-config";

type MetaInput = {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  availableLocales?: readonly Locale[];
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function pageUrl(locale: Locale, path: string) {
  return new URL(`/${locale}${path}`, siteConfig.url).toString();
}

export function languageAlternates(path: string, availableLocales: readonly Locale[] = locales) {
  return Object.fromEntries(availableLocales.map((locale) => [locale === "zh" ? "zh-CN" : "en", pageUrl(locale, path)]));
}

export function seoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function buildMetadata({ locale, title, description, path, availableLocales = locales, image, type = "website", publishedTime, modifiedTime }: MetaInput): Metadata {
  const url = pageUrl(locale, path);
  const fullTitle = `${title} | ${siteConfig.name}`;
  const images = image ? [{ url: new URL(image, siteConfig.url).toString(), alt: title }] : [{ url: `${siteConfig.url}/og`, width: 1200, height: 630, alt: siteConfig.name }];

  return {
    title: { absolute: fullTitle },
    description,
    authors: [{ name: locale === "zh" ? siteConfig.authorZh : siteConfig.author, url: pageUrl(locale, "/about") }],
    alternates: {
      canonical: url,
      languages: languageAlternates(path, availableLocales)
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type,
      ...(type === "article" ? { publishedTime: seoDate(publishedTime), modifiedTime: seoDate(modifiedTime), authors: [pageUrl(locale, "/about")] } : {}),
      images,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      siteName: siteConfig.name
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images
    }
  };
}
