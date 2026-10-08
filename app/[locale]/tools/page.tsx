import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { HomeProjectCard } from "@/components/cards";
import { getTools } from "@/lib/content";
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
    title: dict.tools.seoTitle,
    description: dict.tools.description,
    path: "/tools"
  });
}

export default async function ToolsIndexPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const tools = await getTools(locale);
  const dict = getDictionary(locale);

  return (
    <main className="space-y-10">
      <PageIntro section="tools" title={dict.tools.title} description={dict.tools.description} eyebrow="Projects / Experiments" />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tools.length ? (
          tools.map((tool) => <HomeProjectCard key={tool.slug} locale={locale} tool={tool} />)
        ) : (
          <EmptyState message={dict.tools.empty} />
        )}
      </section>
    </main>
  );
}
