import type { MetadataRoute } from "next";

import { getPosts, getTools } from "@/lib/content";
import { getCourses } from "@/lib/courses/read";
import { readBuildArtifacts } from "@/lib/build/read";
import { locales, siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = locales.flatMap((locale) =>
    ["", "/build", "/ai-builder-lab", "/blog", "/tools", "/discover", "/about"].map((path) => ({
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

  const courses = await getCourses();
  const buildEntries = await Promise.all(locales.map(async (locale) =>
    (await readBuildArtifacts(locale)).flatMap((artifact) => [
      { url: `${siteConfig.url}/${locale}/build/${artifact.id}`, changeFrequency: "weekly" as const, priority: 0.8 },
      ...artifact.logs.map((log) => ({ url: `${siteConfig.url}/${locale}/build/${artifact.id}/logs/${log.id}`, changeFrequency: "monthly" as const, priority: 0.7 }))
    ])
  ));
  const courseEntries = courses.flatMap((course) => [
    { url: `${siteConfig.url}/zh/courses/${course.slug}`, lastModified: new Date(course.publishedAt) },
    ...course.pages.map((page) => ({ url: `${siteConfig.url}/zh/courses/${course.slug}/${page.slug}`, lastModified: new Date(page.updated) }))
  ]);
  return [...staticEntries, ...postEntries.flat(), ...toolEntries.flat(), ...buildEntries.flat(), { url: `${siteConfig.url}/zh/courses` }, ...courseEntries];
}
