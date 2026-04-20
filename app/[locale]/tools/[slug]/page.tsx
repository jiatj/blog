import { notFound } from "next/navigation";

import { getToolBySlug, getTools, renderMdx } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { locales, type Locale } from "@/lib/site-config";

export async function generateStaticParams() {
  const all = await Promise.all(locales.map(async (locale) => ({ locale, tools: await getTools(locale) })));
  return all.flatMap(({ locale, tools }) => tools.map((tool) => ({ locale, slug: tool.slug ?? "" })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tool = await getToolBySlug(locale, slug);

  if (!tool) {
    return {};
  }

  return buildMetadata({
    locale,
    title: tool.seoTitle ?? tool.title ?? "",
    description: tool.seoDescription ?? tool.summary ?? "",
    path: `/tools/${slug}`
  });
}

export default async function ToolDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tool = await getToolBySlug(locale, slug);
  const dict = getDictionary(locale);

  if (!tool) {
    notFound();
  }

  const content = await renderMdx(tool.content);

  return (
    <main className="mx-auto w-full max-w-[58rem]">
      <article className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--card-strong)_90%,transparent)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[34rem]">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
              {tool.toolStatus ?? dict.tools.status}
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[1.16] tracking-[-0.04em] sm:text-[2.35rem]">
              {tool.title}
            </h1>
            <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-8 text-[var(--muted-foreground)]">
              {tool.summary}
            </p>
          </div>
          {tool.toolUrl ? (
            <a
              className="inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
              href={tool.toolUrl}
              rel="noreferrer"
              target="_blank"
            >
              {dict.common.openProject} {"->"}
            </a>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-[0.84rem] text-[var(--muted-foreground)]">
          {tool.repoUrl ? (
            <a
              className="border-b border-transparent pb-0.5 transition hover:border-[var(--link-underline)] hover:text-[var(--foreground)]"
              href={tool.repoUrl}
              rel="noreferrer"
              target="_blank"
            >
              {dict.common.sourceCode}
            </a>
          ) : null}
        </div>
        <div className="prose mt-10 max-w-[42rem]">{content}</div>
      </article>
    </main>
  );
}
