import type { MetadataRoute } from "next";

import { getPosts, getTools } from "@/lib/content";
import { locales, siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = locales.flatMap((locale) =>
    ["", "/blog", "/tools", "/about"].map((path) => ({
      url: `${siteConfig.url}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7
    }))
  );

  const postEntries = await Promise.all(
    locales.map(async (locale) =>
      (await getPosts(locale)).map((post) => ({
        url: `${siteConfig.url}/${locale}/blog/${post.slug}`,
        lastModified: post.date ? new Date(post.date) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8
      }))
    )
  );

  const toolEntries = await Promise.all(
    locales.map(async (locale) =>
      (await getTools(locale)).map((tool) => ({
        url: `${siteConfig.url}/${locale}/tools/${tool.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.8
      }))
    )
  );

  return [...staticEntries, ...postEntries.flat(), ...toolEntries.flat()];
}
