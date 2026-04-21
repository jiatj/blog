import { notFound } from "next/navigation";

import { renderMdx, getPostBySlug, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";
import { locales, type Locale } from "@/lib/site-config";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const all = await Promise.all(locales.map(async (locale) => ({ locale, posts: await getPosts(locale) })));
  return all.flatMap(({ locale, posts }) => posts.map((post) => ({ locale, slug: post.slug ?? "" })));
}

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
    path: `/blog/${slug}`
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

  return (
    <main className="mx-auto w-full max-w-[58rem] px-1 pb-4">
      <article className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--card-strong)_90%,transparent)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-9 sm:py-10">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
          {formatDate(post.date ?? "", locale)}
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-[1.16] tracking-[-0.04em] sm:text-[2.4rem]">
          {post.title}
        </h1>
        <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-8 text-[var(--muted-foreground)]">
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
        <div className="prose mt-10 max-w-[42rem]">{content}</div>
      </article>
    </main>
  );
}
