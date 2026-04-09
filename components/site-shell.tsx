"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { getDictionary } from "@/lib/dictionary";
import { siteConfig, type Locale } from "@/lib/site-config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";

type SiteShellProps = {
  locale: Locale;
  pathname: string;
  children: React.ReactNode;
};

export function SiteShell({ locale, pathname, children }: SiteShellProps) {
  const dict = getDictionary(locale);
  const currentPath = usePathname() ?? pathname;

  const routeTone = useMemo(() => {
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "") || "/";

    if (normalizedPath.startsWith("/tools")) {
      return "route-tools";
    }

    if (normalizedPath.startsWith("/blog")) {
      return "route-blog";
    }

    if (normalizedPath.startsWith("/about")) {
      return "route-about";
    }

    return "route-home";
  }, [currentPath]);

  const isActive = (href: string) =>
    href === "/"
      ? currentPath === `/${locale}`
      : currentPath === `/${locale}${href}` || currentPath.startsWith(`/${locale}${href}/`);

  return (
    <div className="min-h-screen">
      <div className={`site-background ${routeTone}`} aria-hidden="true" />
      <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-11">
          <header className="sticky top-0 z-30">
            <div className="rounded-[var(--radius-header)] border border-[color:color-mix(in_srgb,var(--border-faint)_76%,transparent)] bg-[color:color-mix(in_srgb,var(--header-surface)_96%,transparent)] px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-5">
              <div className="flex items-center justify-between gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="shrink-0">
                  <LogoMark locale={locale} />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="hidden items-center rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--pill-surface)_96%,transparent)] p-1 sm:flex">
                    <nav className="flex items-center gap-1 pr-1.5">
                      {siteConfig.nav.map((item) => (
                        <Link
                          key={item.key}
                          className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[0.96rem] font-medium transition ${
                            isActive(item.href)
                              ? "border border-[var(--pill-border-strong)] bg-[var(--pill-surface-active)] text-[var(--pill-text-strong)]"
                              : "border border-transparent text-[color:color-mix(in_srgb,var(--pill-text)_88%,var(--foreground))] hover:bg-[var(--pill-surface-active)] hover:text-[var(--pill-text-strong)]"
                          }`}
                          href={`/${locale}${item.href}`}
                        >
                          {dict.nav[item.key as keyof typeof dict.nav]}
                        </Link>
                      ))}
                    </nav>
                    <div className="h-4 w-px bg-[color:color-mix(in_srgb,var(--pill-border)_82%,transparent)]" />
                    <div className="ml-1 inline-flex items-center gap-0.5">
                      <LanguageSwitcher locale={locale} pathname={pathname} />
                      <ThemeToggle locale={locale} />
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--pill-surface)_96%,transparent)] p-1 sm:hidden">
                    <LanguageSwitcher locale={locale} pathname={pathname} />
                    <ThemeToggle locale={locale} />
                  </div>
                </div>
              </div>
              <div className="mt-3 sm:hidden">
                <nav className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--pill-surface)_96%,transparent)] p-1">
                  {siteConfig.nav.map((item) => (
                    <Link
                      key={item.key}
                      className={`flex-1 rounded-[var(--radius-pill)] border px-4 py-2 text-center text-[0.96rem] font-medium transition ${
                        isActive(item.href)
                          ? "border-[var(--pill-border-strong)] bg-[var(--pill-surface-active)] text-[var(--pill-text-strong)]"
                          : "border-transparent text-[color:color-mix(in_srgb,var(--pill-text)_88%,var(--foreground))] hover:bg-[var(--pill-surface-active)] hover:text-[var(--pill-text-strong)]"
                      }`}
                      href={`/${locale}${item.href}`}
                    >
                      {dict.nav[item.key as keyof typeof dict.nav]}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>
          {children}
          <footer className="border-t border-[var(--border-faint)] px-1 pb-10 pt-10 text-center">
            <p className="text-[1.08rem] font-medium tracking-[-0.03em] text-[color:color-mix(in_srgb,var(--foreground)_92%,var(--muted-foreground))]">
              Build. Think. Ship.
            </p>
            <p className="mt-3 text-[0.78rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
              &copy; T.J. JIA
            </p>
            <p className="mt-2 text-[0.72rem] text-[var(--muted-foreground-soft)]">
              粤ICP备2026037329号-1
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
