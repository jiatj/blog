"use client";

import Link from "next/link";

import type { Locale } from "@/lib/site-config";

type LogoMarkProps = {
  locale: Locale;
};

export function LogoMark({ locale }: LogoMarkProps) {
  return (
    <Link
      aria-label="T.J. Jia home"
      className="inline-flex items-center"
      href={`/${locale}`}
    >
      <span className="inline-flex items-center gap-3.5">
        <svg
          aria-hidden="true"
          className="h-10 w-10 sm:h-11 sm:w-11"
          viewBox="0 0 96 96"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="6"
            y="6"
            width="84"
            height="84"
            rx="24"
            fill="var(--accent)"
            opacity="0.86"
          />
          <rect
            x="6.5"
            y="6.5"
            width="83"
            height="83"
            rx="23.5"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
          />
          <path
            d="M22 28H58V37.4H45.2V69H34.8V37.4H22V28Z"
            fill="#f6f3ee"
          />
          <path
            d="M63.1 28H73.5V56.6C73.5 60.8 72.4 64.2 70.2 66.8C67.4 70.1 63.3 72.1 57.9 72.8L56.8 64.5C59.9 63.9 62.1 62.9 63.5 61.4C64.6 60.1 65.2 58.3 65.2 56V28H63.1Z"
            fill="#f6f3ee"
          />
          <circle cx="76.7" cy="68.2" r="3.8" fill="#f6f3ee" />
        </svg>
        <span className="hidden sm:flex sm:flex-col">
          <span className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--muted-foreground-soft)_90%,var(--foreground))]">
            T.J. Jia
          </span>
          <span className="text-[1.08rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Build. Think. Ship.
          </span>
        </span>
      </span>
    </Link>
  );
}
