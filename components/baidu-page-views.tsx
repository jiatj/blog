"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    _hmt?: Array<[string, ...unknown[]]>;
  }
}

// hm.js records the initial visit; report subsequent App Router navigations.
export function BaiduPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.pathname + window.location.search;
    if (previousUrl.current === null) {
      previousUrl.current = url;
      return;
    }
    if (previousUrl.current === url) return;
    window._hmt = window._hmt || [];
    window._hmt.push(["_trackPageview", url]);
    previousUrl.current = url;
  }, [pathname, searchParams]);

  return null;
}
