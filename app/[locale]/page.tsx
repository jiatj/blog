import Link from "next/link";

import { HomeProjectCard } from "@/components/cards";
import { EmptyState } from "@/components/empty-state";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { getPosts, getTools } from "@/lib/content";
import { locales, type Locale } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return buildMetadata({
    locale,
    title: dict.home.title,
    description: dict.home.intro,
    path: ""
  });
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[33rem] lg:mx-0 lg:max-w-[36rem]">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_20%_20%,rgba(137,161,187,0.16),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--border-soft)_94%,transparent)] bg-[linear-gradient(145deg,rgba(28,36,44,0.94),rgba(20,25,30,0.92))] px-4 py-5 shadow-[var(--shadow)] sm:px-5 sm:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "18px 18px"
          }}
        />
        <div className="absolute inset-y-0 left-0 w-12 bg-[linear-gradient(90deg,rgba(20,25,30,0.82),transparent)]" />
        <div className="absolute inset-y-0 right-0 w-12 bg-[linear-gradient(270deg,rgba(20,25,30,0.9),transparent)]" />

        <div className="relative grid gap-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[clamp(2.5rem,6.5vw,3.85rem)] font-semibold leading-[0.82] tracking-[-0.08em] text-[rgba(214,224,234,0.13)]">
            <span>AI</span>
            <span className="justify-self-end">AI</span>
            <span className="translate-x-3">AI</span>
            <span className="justify-self-end -translate-x-2">AI</span>
            <span>AI</span>
            <span className="justify-self-end">AI</span>
          </div>

          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            fill="none"
            viewBox="0 0 640 520"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M42 407C128 369 147 267 214 238C265 216 304 248 359 220C424 187 442 94 598 80"
              stroke="rgba(197,210,223,0.28)"
              strokeDasharray="6 10"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
            <path
              d="M40 409C123 372 156 281 220 247C275 218 313 245 367 219C441 183 486 103 598 80"
              stroke="url(#hero-path)"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M38 410C126 378 181 323 225 270C270 217 317 247 372 224C440 195 492 118 600 84"
              stroke="rgba(255,255,255,0.18)"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <circle cx="40" cy="409" fill="rgba(197,210,223,0.92)" r="5" />
            <circle cx="221" cy="247" fill="rgba(197,210,223,0.84)" r="4" />
            <circle cx="367" cy="219" fill="rgba(197,210,223,0.84)" r="4" />
            <circle cx="598" cy="80" fill="rgba(197,210,223,0.96)" r="5" />
            <defs>
              <linearGradient id="hero-path" x1="40" x2="598" y1="409" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(210,220,230,0.88)" />
                <stop offset="0.48" stopColor="rgba(144,164,185,0.96)" />
                <stop offset="1" stopColor="rgba(210,220,230,0.66)" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative mt-[8.6rem] flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(197,210,223,0.7)] sm:mt-[9.8rem]">
            <span>AI as context</span>
            <span>Judgment as path</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const [posts, tools] = await Promise.all([getPosts(locale), getTools(locale)]);
  const featuredTools = tools.slice(0, 3);
  const [primaryTool, ...secondaryTools] = featuredTools;

  return (
    <main className="space-y-24 pb-6 sm:space-y-28">
      <section className="rounded-[2rem] border border-[color:color-mix(in_srgb,var(--border-soft)_88%,transparent)] bg-[color:color-mix(in_srgb,var(--hero-surface)_96%,transparent)] px-6 py-8 shadow-[var(--shadow)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,33rem)_minmax(24rem,1fr)] lg:items-center lg:gap-10">
          <div className="max-w-[31rem]">
            <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[var(--muted-foreground-soft)]">
              {dict.home.eyebrow}
            </p>
            <h1 className="mt-5 text-[clamp(3.8rem,8vw,6.2rem)] font-semibold leading-[0.9] tracking-[-0.07em] text-[var(--foreground)]">
              {dict.home.title}
            </h1>
            <p className="mt-6 max-w-[24rem] text-[1.03rem] leading-8 text-[var(--muted-foreground)] sm:text-[1.08rem]">
              {dict.home.intro}
            </p>
            <Link
              className="mt-10 inline-flex items-center gap-2 border-b border-[color:color-mix(in_srgb,var(--accent)_32%,transparent)] pb-1 text-sm font-medium text-[color:color-mix(in_srgb,var(--foreground)_94%,var(--accent-ink))] transition hover:gap-3 hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
              href={`/${locale}${dict.home.methodologyHref}`}
            >
              {dict.home.methodologyLink}
              <span aria-hidden="true" className="text-[0.9em]">
                &gt;
              </span>
            </Link>
          </div>
          <div className="w-full lg:flex lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-[34rem]">
            <p className="text-[0.66rem] uppercase tracking-[0.28em] text-[var(--muted-foreground-soft)]">
              {dict.home.projectsEyebrow}
            </p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[2.1rem]">
              {dict.home.latestTools}
            </h2>
            <p className="mt-3 text-[0.98rem] leading-7 text-[var(--muted-foreground)]">{dict.home.projectNote}</p>
          </div>
          <Link
            className="inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
            href={`/${locale}/tools`}
          >
            {dict.home.viewAllTools} {"->"}
          </Link>
        </div>

        {featuredTools.length ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-stretch">
            {primaryTool ? <HomeProjectCard featured locale={locale} tool={primaryTool} /> : null}
            <div className="grid gap-4">
              {secondaryTools.length ? (
                secondaryTools.map((tool) => <HomeProjectCard key={tool.slug} locale={locale} tool={tool} />)
              ) : (
                <div className="rounded-[1.6rem] border border-[var(--border-faint)] bg-[color:color-mix(in_srgb,var(--card)_82%,transparent)] p-6 text-[0.95rem] leading-7 text-[var(--muted-foreground)]">
                  {dict.tools.empty}
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState message={dict.tools.empty} />
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr] lg:gap-12">
        <div className="pt-1">
          <p className="text-[0.66rem] uppercase tracking-[0.28em] text-[var(--muted-foreground-soft)]">
            {dict.common.latest}
          </p>
          <h2 className="mt-2 text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.04em]">
            {dict.home.latestPosts}
          </h2>
        </div>
        <div className="space-y-7">
          {posts.length ? (
            posts.slice(0, 3).map((post) => (
              <article
                key={post.slug}
                className="border-t border-[var(--border-faint)] pt-7 first:border-t-0 first:pt-0"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
                  {formatDate(post.date ?? "", locale)}
                </p>
                <h3 className="mt-3 text-[1.45rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[1.6rem]">
                  {post.title}
                </h3>
                <p className="mt-3 max-w-[42rem] text-[1rem] leading-8 text-[color:color-mix(in_srgb,var(--muted-foreground)_92%,var(--foreground))]">
                  {post.summary}
                </p>
                <Link
                  className="mt-4 inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
                  href={`/${locale}/blog/${post.slug}`}
                >
                  {dict.common.readArticle} {"->"}
                </Link>
              </article>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">{dict.blog.empty}</p>
          )}

          <Link
            className="inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
            href={`/${locale}/blog`}
          >
            {dict.home.viewAllPosts} {"->"}
          </Link>
        </div>
      </section>
    </main>
  );
}
