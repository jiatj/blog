"use client";

import type { Locale } from "@/lib/site-config";
import { useThemeMode } from "@/components/theme-provider";

type ThemeToggleProps = {
  locale: Locale;
};

export function ThemeToggle({ locale }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useThemeMode();

  if (!mounted) {
    return (
      <span className="flex h-8 w-8 rounded-[var(--radius-pill)] border border-transparent bg-transparent" />
    );
  }

  const isDark = theme === "dark";
  const label =
    locale === "zh"
      ? "\u5207\u6362\u660e\u6697\u4e3b\u9898"
      : "Toggle light and dark theme";

  return (
    <button
      aria-label={label}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] border transition ${
        isDark
          ? "border-[var(--pill-border)] bg-[var(--pill-surface-active)] text-[var(--accent-ink)]"
          : "border-transparent text-[var(--pill-text)] hover:border-[var(--pill-border)] hover:bg-[var(--pill-surface-active)] hover:text-[var(--pill-text-strong)]"
      }`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={label}
      type="button"
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" fill="currentColor" r="4" />
          <path
            d="M12 2.75V5.25M12 18.75V21.25M21.25 12H18.75M5.25 12H2.75M18.54 5.46L16.77 7.23M7.23 16.77L5.46 18.54M18.54 18.54L16.77 16.77M7.23 7.23L5.46 5.46"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.72 3.27A9 9 0 1 0 20.73 14.7a.75.75 0 0 0-.94-.95 7.5 7.5 0 0 1-9.55-9.54.75.75 0 0 0-.95-.94 8.98 8.98 0 0 0 5.43 0Z" />
        </svg>
      )}
    </button>
  );
}
