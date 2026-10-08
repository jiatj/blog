import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";

import { renderMdx, getPostBySlug, getPosts, getContentLocales } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";
import { siteConfig, type Locale } from "@/lib/site-config";
import { articleData } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale, slug);

  if (!post) {
    return {};
  }

  return buildMetadata({
    locale,
    title: post.seoTitle ?? post.title ?? "",
    description: post.seoDescription ?? post.summary ?? "",
    path: `/blog/${slug}`,
    availableLocales: await getContentLocales("post", slug),
    type: "article",
    image: post.cover,
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date
  });
}

export default async function BlogDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  const content = await renderMdx(post.content);
  const tags = new Set((post.tags ?? []).map((tag) => tag.toLowerCase()));
  const related = (await getPosts(locale)).filter((item) => item.slug !== slug && item.tags?.some((tag) => tags.has(tag.toLowerCase()))).slice(0, 3);

  return (
    <main className="article-detail mx-auto w-full max-w-[60rem] pb-4">
      <JsonLd data={articleData({ locale, path: `/blog/${slug}`, title: post.title ?? "", summary: post.summary, date: post.date, updated: post.updated, cover: post.cover, tags: post.tags })} />
      <article className="min-w-0 rounded-[1.75rem] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--card-strong)_90%,transparent)] px-4 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-10 lg:px-12">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
          <time dateTime={post.date}>{formatDate(post.date ?? "", locale)}</time>
          {" · "}<Link href={`/${locale}/about`} className="hover:text-[var(--accent-ink)]">{locale === "zh" ? siteConfig.authorZh : siteConfig.author}</Link>
        </p>
        <h1 className="mt-3 text-[2rem] font-medium leading-[1.16] tracking-[-0.04em] sm:text-[2.4rem]">
          {post.title}
        </h1>
        <p className="mt-4 text-[0.98rem] leading-8 text-[var(--muted-foreground)]">
          {post.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(post.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[color:color-mix(in_srgb,var(--border-soft)_92%,transparent)] bg-[color:color-mix(in_srgb,var(--accent-soft)_62%,transparent)] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="prose mt-10 max-w-none">{content}</div>
        <nav aria-label={locale === "zh" ? "继续阅读" : "Continue reading"} className="mt-10 border-t border-[var(--border-soft)] pt-6 text-sm leading-7">
          {!!related.length && <><h2 className="font-medium">{locale === "zh" ? "相关文章" : "Related articles"}</h2><ul className="mt-2">{related.map((item) => <li key={item.slug}><Link className="text-[var(--accent-ink)]" href={`/${locale}/blog/${item.slug}`}>{item.title}</Link></li>)}</ul></>}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[var(--accent-ink)]">
            <Link href={`/${locale}/blog`}>{locale === "zh" ? "全部文章" : "All articles"}</Link>
            <Link href={`/${locale}/tools`}>{locale === "zh" ? "项目与实践" : "Projects and practice"}</Link>
            <Link href="/zh/courses">{locale === "zh" ? "项目实战课程" : "Hands-on courses (Chinese)"}</Link>
          </div>
        </nav>
      </article>
    </main>
  );
}
