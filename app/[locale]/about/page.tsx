import { AboutRichText } from "@/components/about-rich-text";
import { SectionHeading } from "@/components/section-heading";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig, locales, type Locale } from "@/lib/site-config";

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
    title: dict.about.title,
    description: dict.about.intro,
    path: "/about"
  });
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const primaryBlock = dict.about.blocks[0];
  const reasonBlock = dict.about.blocks[1];
  const contactBlock = dict.about.blocks[2];

  return (
    <main className="space-y-12 pb-8">
      <section className="overflow-hidden rounded-[1.95rem] border border-[color:color-mix(in_srgb,var(--border-soft)_90%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_92%,transparent)] shadow-[var(--shadow-soft)]">
        <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1.24fr)_minmax(18rem,0.76fr)] lg:px-12 lg:py-12">
          <div className="max-w-[42rem]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted-foreground-soft)]">
              About
            </p>
            <SectionHeading title={dict.about.title} description={dict.about.intro} level="page" />
          </div>
          <div className="grid content-end gap-5">
            <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border-faint)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_52%,transparent)] px-5 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--muted-foreground-soft)]">
                Focus
              </p>
              <p className="mt-3 text-[1.02rem] leading-8 text-[color:color-mix(in_srgb,var(--muted-foreground)_90%,var(--foreground))]">
                AI Native product building, low-noise publishing, and long-term systems that can be shipped steadily.
              </p>
            </div>
             
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.34fr)_minmax(18rem,0.82fr)] lg:items-start">
        <article className="rounded-[1.7rem] border border-[color:color-mix(in_srgb,var(--border-soft)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_94%,transparent)] p-7 shadow-[0_8px_20px_rgba(20,24,30,0.025)] sm:p-8 lg:min-h-[40rem]">
          <div className="grid gap-6 border-b border-[color:color-mix(in_srgb,var(--border-faint)_94%,transparent)] pb-6 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
            <h2 className="text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.25rem]">
              {primaryBlock.title}
            </h2>
            <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--muted-foreground-soft)] sm:text-right">
              Primary Focus
            </p>
          </div>
          <AboutRichText text={primaryBlock.text} className="mt-8 space-y-6" />
        </article>

        <div className="grid gap-6">
          <article className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--border-soft)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_94%,transparent)] p-5 shadow-[0_8px_20px_rgba(20,24,30,0.025)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[1.42rem] font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)] sm:text-[1.54rem]">
                {reasonBlock.title}
              </h2>
              <span className="pt-1 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
                Perspective
              </span>
            </div>
            <AboutRichText text={reasonBlock.text} className="mt-4 space-y-4" listVariant="compact" />
          </article>

          <article className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--border-soft)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--card-strong)_94%,transparent)] p-5 shadow-[0_8px_20px_rgba(20,24,30,0.025)] sm:p-6">
            <div className="flex items-end justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--border-faint)_94%,transparent)] pb-3.5">
              <h2 className="text-[1.45rem] font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)] sm:text-[1.58rem]">
                {locale === "zh" ? "我的自媒体" : "My Channels"}
              </h2>
              <span className="text-[0.66rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
                Access
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {siteConfig.socialChannels.map((channel) => (
                <a
                  key={channel.key}
                  className="group block rounded-[1.05rem] border border-[color:color-mix(in_srgb,var(--border-soft)_96%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_58%,transparent)] p-2.5 text-center transition hover:border-[color:color-mix(in_srgb,var(--border)_90%,transparent)]"
                  href={channel.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <img
                    alt={`${locale === "zh" ? channel.labelZh : channel.labelEn} QR code`}
                    className="mx-auto h-[5.1rem] w-[5.1rem] rounded-[0.75rem] border border-[color:color-mix(in_srgb,var(--border-faint)_96%,transparent)] bg-white object-cover"
                    height={82}
                    src={channel.qrSrc}
                    width={82}
                  />
                  <p className="mt-2 text-[0.74rem] leading-5 text-[var(--muted-foreground)]">
                    {locale === "zh" ? channel.labelZh : channel.labelEn}
                  </p>
                </a>
              ))}
            </div>
            <div className="mt-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border-soft)_96%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_58%,transparent)] px-4 py-3">
              <a
                className="inline-flex items-center gap-2 border-b border-[var(--link-underline)] pb-0.5 text-[0.92rem] leading-7 text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
                href={`mailto:${siteConfig.email}`}
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--muted-foreground-soft)]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m5 7 7 6 7-6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
                {siteConfig.email}
              </a>
            </div>
          </article>
        </div>
      </section>
   
    </main>
  );
}
