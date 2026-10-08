import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/cards";
import { PageIntro } from "@/components/page-intro";
import { getPosts } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return buildMetadata({
    locale,
    title: dict.blog.seoTitle,
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
      <PageIntro section="blog" title={dict.blog.title} description={dict.blog.description} eyebrow="Articles / Notes" />
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
