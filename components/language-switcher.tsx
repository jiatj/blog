import Link from "next/link";

import type { Locale } from "@/lib/site-config";

type LanguageSwitcherProps = {
  locale: Locale;
  pathname: string;
};

export function LanguageSwitcher({ locale, pathname }: LanguageSwitcherProps) {
  const nextLocale = locale === "zh" ? "en" : "zh";
  const normalizedPath = pathname.replace(/^\/(zh|en)/, "") || "";

  return (
    <Link
      className="inline-flex h-8 items-center rounded-[var(--radius-pill)] border border-transparent px-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[color:color-mix(in_srgb,var(--pill-text)_88%,var(--foreground))] transition hover:border-[var(--pill-border)] hover:bg-[var(--pill-surface-active)] hover:text-[var(--pill-text-strong)]"
      href={`/${nextLocale}${normalizedPath}`}
    >
      {nextLocale.toUpperCase()}
    </Link>
  );
}
