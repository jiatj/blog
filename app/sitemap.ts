import type { MetadataRoute } from "next";

import { getPosts, getTools } from "@/lib/content";
import { getCourses } from "@/lib/courses/read";
import { readBuildArtifacts } from "@/lib/build/read";
import { locales, type Locale } from "@/lib/site-config";
import { languageAlternates, pageUrl, seoDate } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  type Entry = { locale: Locale; path: string; lastModified?: string };
  const [contentEntries, courses] = await Promise.all([
    Promise.all(locales.map(async (locale): Promise<Entry[]> => {
      const [posts, tools, artifacts] = await Promise.all([getPosts(locale), getTools(locale), readBuildArtifacts(locale)]);
      return [
        ...["", "/build", "/blog", "/tools", "/discover", "/about"].map((path) => ({ locale, path })),
        ...posts.map((post) => ({ locale, path: `/blog/${post.slug}`, lastModified: seoDate(post.updated ?? post.date) })),
        ...tools.map((tool) => ({ locale, path: `/tools/${tool.slug}`, lastModified: seoDate(tool.updated) })),
        ...artifacts.flatMap((artifact) => [
          { locale, path: `/build/${artifact.id}` },
          ...artifact.logs.map((log) => ({ locale, path: `/build/${artifact.id}/logs/${log.id}`, lastModified: seoDate(log.date) }))
        ])
      ];
    })),
    getCourses()
  ]);
  const entries: Entry[] = [
    ...contentEntries.flat(),
    { locale: "zh", path: "/ai-builder-lab" },
    { locale: "zh", path: "/courses" },
    ...courses.flatMap((course): Entry[] => [
      { locale: "zh", path: `/courses/${course.slug}`, lastModified: seoDate(course.publishedAt) },
      ...course.pages.map((page): Entry => ({ locale: "zh", path: `/courses/${course.slug}/${page.slug}`, lastModified: seoDate(page.updated) }))
    ])
  ];
  const languages = new Map<string, Locale[]>();
  for (const entry of entries) languages.set(entry.path, [...(languages.get(entry.path) ?? []), entry.locale]);
  return entries.map((entry) => ({
    url: pageUrl(entry.locale, entry.path),
    lastModified: entry.lastModified,
    alternates: { languages: languageAlternates(entry.path, languages.get(entry.path)) }
  }));
}
