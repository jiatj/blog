import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/cards";
import { SectionHeading } from "@/components/section-heading";
import { getPosts } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { locales, type Locale } from "@/lib/site-config";

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
    title: dict.blog.title,
    description: dict.blog.description,
    path: "/blog"
  });
}

export default async function BlogIndexPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const posts = await getPosts(locale);
  const dict = getDictionary(locale);

  return (
    <main className="space-y-10">
      <section className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--card-strong)_88%,transparent)] px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-12">
        <SectionHeading title={dict.blog.title} description={dict.blog.description} level="page" />
      </section>
      <section className="grid gap-5">
        {posts.length ? (
          posts.map((post) => <PostCard key={post.slug} locale={locale} post={post} />)
        ) : (
          <EmptyState message={dict.blog.empty} />
        )}
      </section>
    </main>
  );
}
