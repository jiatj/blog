import Link from "next/link";

import { formatDate } from "@/lib/utils";
import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/site-config";
import type { PostEntry, ToolEntry } from "@/lib/content";

export function PostCard({ post, locale }: { post: PostEntry; locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--pill-border)] bg-[color:color-mix(in_srgb,var(--card)_86%,transparent)] p-6 transition hover:border-[var(--pill-border-strong)] hover:bg-[color:color-mix(in_srgb,var(--card-strong)_88%,transparent)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground-soft)]">
        {formatDate(post.date ?? "", locale)}
      </p>
      <h2 className="mt-4 text-[1.7rem] font-semibold leading-[1.18] tracking-[-0.035em]">
        {post.title}
      </h2>
      <p className="mt-3 text-[1rem] leading-8 text-[var(--muted-foreground)]">{post.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(post.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="rounded-[var(--radius-pill)] border border-[var(--pill-border)] bg-[var(--pill-surface-active)] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent-ink)]"
          >
            {tag}
          </span>
        ))}
      </div>
      <Link
        className="mt-7 inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
        href={`/${locale}/blog/${post.slug}`}
      >
        {dict.common.readArticle}
      </Link>
    </article>
  );
}

export function ToolCard({ tool, locale }: { tool: ToolEntry; locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <article className="rounded-[var(--radius-card)] border border-[color:color-mix(in_srgb,var(--pill-border)_92%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_86%,transparent)] p-5 sm:p-5.5 transition hover:border-[var(--pill-border-strong)] hover:bg-[color:color-mix(in_srgb,var(--card-strong)_92%,transparent)]">
      <div className="max-w-[42rem]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[1.42rem] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[1.62rem]">
            {tool.title}
          </h2>
          {tool.toolStatus ? (
            <span className="inline-flex rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border-strong)_86%,transparent)] bg-[var(--pill-surface-active)] px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--accent-ink)]">
              {tool.toolStatus}
            </span>
          ) : null}
        </div>
        <p className="mt-2.5 max-w-[38rem] text-[0.98rem] leading-7 text-[var(--muted-foreground)]">
          {tool.summary}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[color:color-mix(in_srgb,var(--border-faint)_92%,transparent)] pt-3 text-[0.92rem]">
        <Link
          className="inline-flex items-center rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--border)_42%,transparent)] px-3 py-1.5 font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
          href={`/${locale}/tools/${tool.slug}`}
        >
          {dict.common.viewProject} {"->"}
        </Link>
        {tool.toolUrl ? (
          <a
            className="inline-flex items-center border-b border-transparent pb-0.5 text-[var(--muted-foreground)] transition hover:border-[var(--link-underline)] hover:text-[var(--foreground)]"
            href={tool.toolUrl}
            rel="noreferrer"
            target="_blank"
          >
            {dict.common.openProject}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function HomeProjectCard({
  tool,
  locale,
  featured = false
}: {
  tool: ToolEntry;
  locale: Locale;
  featured?: boolean;
}) {
  const dict = getDictionary(locale);
  const actionLabel = tool.homeActionLabel ?? dict.common.viewProject;
  const toolTitle = tool.title ?? "Project";
  const logoLabel = tool.logo ?? toolTitle.slice(0, 2).toUpperCase();
  const liveLabel = locale === "zh" ? "登陆" : "Launch";

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--border-soft)_92%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_90%,transparent)] transition duration-300 hover:border-[var(--pill-border-strong)] hover:bg-[color:color-mix(in_srgb,var(--card-strong)_96%,transparent)] ${
        featured ? "min-h-[23rem] p-7 sm:p-8" : "min-h-[15rem] p-6"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(137,161,187,0.12),transparent_34%)] opacity-80" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-2)_80%,transparent)] text-[0.85rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
            {logoLabel}
          </div>
          {tool.toolStatus ? (
            <span className="inline-flex rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border-strong)_86%,transparent)] px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {tool.toolStatus}
            </span>
          ) : null}
        </div>

        <div className={featured ? "mt-10 max-w-[28rem]" : "mt-7 max-w-[22rem]"}>
          <h3
            className={`font-semibold tracking-[-0.04em] text-[var(--foreground)] ${
              featured ? "text-[2rem] leading-[1.02] sm:text-[2.35rem]" : "text-[1.4rem] leading-[1.08]"
            }`}
          >
            {toolTitle}
          </h3>
          <p
            className={`text-[var(--muted-foreground)] ${
              featured ? "mt-4 max-w-[24rem] text-[1rem] leading-8" : "mt-3 text-[0.98rem] leading-7"
            }`}
          >
            {tool.summary}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-8">
          <Link
            className="inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
            href={`/${locale}/tools/${tool.slug}`}
          >
            {actionLabel} {"->"}
          </Link>
          {tool.toolUrl ? (
            <a
              className="text-[0.78rem] uppercase tracking-[0.16em] text-[var(--muted-foreground-soft)] transition group-hover:text-[var(--muted-foreground)]"
              href={tool.toolUrl}
              rel="noreferrer"
              target="_blank"
            >
              {liveLabel}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
