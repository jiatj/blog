import type { Metadata } from "next";

import { siteConfig, type Locale } from "@/lib/site-config";

type MetaInput = {
  locale: Locale;
  title: string;
  description: string;
  path: string;
};

export function buildMetadata({ locale, title, description, path }: MetaInput): Metadata {
  const url = new URL(`/${locale}${path}`, siteConfig.url).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      siteName: siteConfig.name
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}
