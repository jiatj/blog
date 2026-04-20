import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { locales, type Locale } from "@/lib/site-config";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <SiteShell locale={locale as Locale} pathname={`/${locale}`}>
      {children}
    </SiteShell>
  );
}
