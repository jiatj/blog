import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { buildProgress, outputUrl } from "@/lib/build/model";
import type { Artifact, ArtifactStatus, BuildLocale, Output } from "@/lib/build/types";
import styles from "./build.module.css";

export function ArtifactStatusLabel({ status, locale }: { status: ArtifactStatus; locale: BuildLocale }) {
  return <span className={styles.status} data-status={status}><span className={styles.dot} aria-hidden="true" />{getDictionary(locale).build.statuses[status]}</span>;
}

export function Progress({ artifact, locale }: { artifact: Artifact; locale: BuildLocale }) {
  const p = buildProgress(artifact); const d = getDictionary(locale).build;
  if (!p.total) return <div className={styles.progressLine}><span>{d.progress}</span><span>{d.progressPending}</span></div>;
  return <div className={styles.progress}>
    <div className={styles.progressLine}><span>{d.progress}</span><span>{p.percent}% · {p.completed}/{p.total}</span></div>
    <progress value={p.percent} max={100} aria-label={`${d.progress}: ${p.completed}/${p.total}`} />
  </div>;
}

export function ArtifactRow({ artifact: a, locale }: { artifact: Artifact; locale: BuildLocale }) {
  const d = getDictionary(locale).build;
  return <article className={styles.row}>
    <div><ArtifactStatusLabel status={a.status} locale={locale} /><br />
      <Link className={styles.rowTitle} href={`/${locale}/build/${a.id}`}>{a.title}</Link>
      {a.subtitle && <p className={styles.subtitle}>{a.subtitle}</p>}
      <p className={styles.rowText}>{a.summary}</p>
    </div>
    <div><Progress artifact={a} locale={locale} /><span className={styles.next}>{d.next} · {a.next}</span></div>
  </article>;
}

export function OutputLink({ output, locale, artifactId }: { output: Output; locale: BuildLocale; artifactId: string }) {
  const local = output.href.startsWith("outputs/");
  return <a className={styles.link} href={outputUrl(locale, artifactId, output.href)} target={local ? undefined : "_blank"} rel={local ? undefined : "noreferrer"}>
    {output.label}<span aria-hidden="true">{local ? "↓" : "↗"}</span>
  </a>;
}
