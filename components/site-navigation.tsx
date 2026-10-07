"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDictionary } from "@/lib/dictionary";
import { siteConfig, type Locale } from "@/lib/site-config";

export function SiteNavigation({ locale, pathname, compact = false }: {
  locale: Locale;
  pathname: string;
  compact?: boolean;
}) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const isActive = (href: string) => href === ""
    ? pathname === `/${locale}`
    : pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);
  const items = compact ? siteConfig.nav : [...siteConfig.nav, ...siteConfig.moreNav];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const renderLink = (item: (typeof siteConfig.nav | typeof siteConfig.moreNav)[number], dropdown = false) => (
    <Link
      aria-current={isActive(item.href) ? "page" : undefined}
      className={dropdown ? "site-nav-dropdown-link" : "site-nav-link"}
      href={`/${item.key === "courses" ? "zh" : locale}${item.href}`}
      key={item.key}
      onClick={() => setOpen(false)}
      prefetch={item.key === "courses" ? false : undefined}
    >
      {dict.nav[item.key]}
    </Link>
  );

  return (
    <nav
      aria-label={locale === "zh" ? "主导航" : "Main navigation"}
      className={`site-nav ${compact ? "site-nav-compact" : "site-nav-desktop"}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      ref={root}
    >
      {items.map((item) => renderLink(item))}
      {compact ? (
        <div className="site-nav-more">
          <button
            aria-controls="mobile-more-navigation"
            aria-expanded={open}
            className="site-nav-link site-nav-more-trigger"
            data-active={siteConfig.moreNav.some((item) => isActive(item.href)) || undefined}
            onClick={() => setOpen(!open)}
            ref={trigger}
            type="button"
          >
            {dict.nav.more}
            <svg aria-hidden="true" fill="none" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </button>
          <div className="site-nav-dropdown" hidden={!open} id="mobile-more-navigation">
            {siteConfig.moreNav.map((item) => renderLink(item, true))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
