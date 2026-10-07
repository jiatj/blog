"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/dictionary";
import { buildDate } from "@/lib/build/model";
import type { BuildLocale, LiveEntry } from "@/lib/build/types";
import styles from "./build.module.css";

export function NextLive({ live, locale, serverNow }: { live: LiveEntry | null; locale: BuildLocale; serverNow: number }) {
  const router = useRouter(); const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const refresh = () => { setNow(Date.now()); router.refresh(); };
    const timer = window.setInterval(refresh, 60_000);
    const expires = live ? window.setTimeout(refresh, Math.max(0, Math.min(Date.parse(live.endsAt) - Date.now() + 50, 2_147_483_647))) : undefined;
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); window.clearTimeout(expires); document.removeEventListener("visibilitychange", onVisible); };
  }, [live?.id, live?.endsAt, router]);
  const d = getDictionary(locale).build;
  if (!live || Date.parse(live.endsAt) <= now) return null;
  const isNow = Date.parse(live.startsAt) <= now;
  return <aside className={styles.live} aria-label={isNow ? d.liveWindow : d.nextLive}>
    <div><p className={styles.eyebrow}>{isNow ? d.liveWindow : d.nextLive}</p>
      <h2 className={styles.liveTitle}>{live.title}</h2>
      <p><Link href={`/${locale}/build/${live.artifactId}`}>{live.artifactTitle}</Link></p>
      <p><time dateTime={live.startsAt}>{buildDate(live.startsAt, locale, true)}</time> · {d.timezone}</p>
    </div>
    {live.url && <a className={styles.link} href={live.url} target="_blank" rel="noreferrer">{d.liveEntry}<span aria-hidden="true">↗</span></a>}
  </aside>;
}
