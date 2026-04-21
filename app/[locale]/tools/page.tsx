import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { HomeProjectCard } from "@/components/cards";
import { getTools } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { locales, type Locale } from "@/lib/site-config";

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
    title: dict.tools.title,
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
      <section className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--card-strong)_88%,transparent)] px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-12">
        <SectionHeading title={dict.tools.title} description={dict.tools.description} level="page" />
      </section>
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
