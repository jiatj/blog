"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { type Locale } from "@/lib/site-config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNavigation } from "@/components/site-navigation";

type SiteShellProps = {
  locale: Locale;
  pathname: string;
  children: React.ReactNode;
};

export function SiteShell({ locale, pathname, children }: SiteShellProps) {
  const currentPath = usePathname() ?? pathname;
  const talknEntryUrl = process.env.NEXT_PUBLIC_TALKN_ENTRY_URL;
  let talknScriptUrl: string | null = null;
  try {
    if (talknEntryUrl) {
      const entry = new URL(talknEntryUrl);
      if (entry.protocol === "https:" || (entry.protocol === "http:" && entry.hostname === "localhost")) {
        talknScriptUrl = `${entry.origin}/embed.js`;
      }
    }
  } catch {
    // An invalid optional entry URL simply leaves the embed disabled.
  }

  const routeTone = useMemo(() => {
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "") || "/";

    if (normalizedPath.startsWith("/tools")) {
      return "route-tools";
    }

    if (normalizedPath.startsWith("/blog")) {
      return "route-blog";
    }

    if (normalizedPath.startsWith("/courses")) {
      return "route-blog";
    }

    if (normalizedPath.startsWith("/about")) {
      return "route-about";
    }

    if (normalizedPath.startsWith("/ai-builder-lab")) {
      return "route-abl";
    }

    return "route-home";
  }, [currentPath]);

  return (
    <div className="min-h-screen">
      <div className={`site-background ${routeTone}`} aria-hidden="true" />
      <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-11">
          <header className="sticky top-0 z-30">
            <div className="rounded-[var(--radius-header)] border border-[color:color-mix(in_srgb,var(--border-faint)_76%,transparent)] bg-[color:color-mix(in_srgb,var(--header-surface)_96%,transparent)] px-2 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-5">
              <div className="flex items-center justify-between gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="shrink-0">
                  <LogoMark locale={locale} />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="hidden items-center rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--pill-surface)_96%,transparent)] p-1 xl:flex">
                    <SiteNavigation key={currentPath} locale={locale} pathname={currentPath} />
                    <div className="h-4 w-px bg-[color:color-mix(in_srgb,var(--pill-border)_82%,transparent)]" />
                    <div className="ml-1 inline-flex items-center gap-0.5">
                      <LanguageSwitcher locale={locale} pathname={currentPath} />
                      <ThemeToggle locale={locale} />
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-[color:color-mix(in_srgb,var(--pill-border)_94%,transparent)] bg-[color:color-mix(in_srgb,var(--pill-surface)_96%,transparent)] p-1 xl:hidden">
                    <LanguageSwitcher locale={locale} pathname={currentPath} />
                    <ThemeToggle locale={locale} />
                  </div>
                </div>
              </div>
              <div className="mt-3 xl:hidden">
                <SiteNavigation compact key={currentPath} locale={locale} pathname={currentPath} />
              </div>
            </div>
          </header>
          {children}
          <footer className="border-t border-[var(--border-faint)] px-1 pb-10  text-center">
            <p className="mt-3 text-[0.78rem] uppercase tracking-[0.22em] text-[var(--muted-foreground-soft)]">
              &copy; AI Builder Lab
            </p>
            <p className="mt-2 text-[0.72rem] text-[var(--muted-foreground-soft)]">
              粤ICP备2026037329号-1
            </p>
          </footer>
        </div>
      </div>
      {talknScriptUrl && talknEntryUrl ? (
        <Script data-url={talknEntryUrl} src={talknScriptUrl} strategy="afterInteractive" />
      ) : null}
    </div>
  );
}
