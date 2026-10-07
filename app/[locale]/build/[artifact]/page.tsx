import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtifactStatusLabel, OutputLink, Progress } from "@/components/build/shared";
import { NextLive } from "@/components/build/next-live";
import styles from "@/components/build/build.module.css";
import { getDictionary } from "@/lib/dictionary";
import { getBuildArtifact } from "@/lib/build/read";
import { buildDate, nextLive } from "@/lib/build/model";
import { buildMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: Locale; artifact: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, artifact } = await params; const a = await getBuildArtifact(locale, artifact);
  return a ? buildMetadata({ locale, title: a.title, description: a.summary, path: `/build/${a.id}` }) : {};
}
export default async function ArtifactPage({ params }: Props) {
  const { locale, artifact } = await params; const a = await getBuildArtifact(locale, artifact);
  if (!a) notFound();
  const d = getDictionary(locale).build; const now = Date.now();
  const active = a.roadmap.filter((s) => !s.archived); const current = a.roadmap.find((s) => s.id === a.currentStep);
  const outputs = a.logs.flatMap((log) => log.outputs.map((output) => ({ log, output })));
  return <main className={styles.page}>
    <Link className={styles.link} href={`/${locale}/build`}>← {d.backBuild}</Link>
    <header className={styles.hero}>
      <div><ArtifactStatusLabel status={a.status} locale={locale} /><h1 className={styles.title}>{a.title}</h1>
        {a.subtitle && <p className={styles.subtitle}>{a.subtitle}</p>}<p className={styles.intro}>{a.summary}</p></div>
      <div style={{ minWidth: "12rem" }}><Progress artifact={a} locale={locale} /></div>
    </header>
    <NextLive live={nextLive([a], now)} locale={locale} serverNow={now} />
    <nav className={styles.anchors} aria-label={d.contents}>
      {[["overview", d.overview], ["logs", d.logs], ["roadmap", d.roadmap], ["outputs", d.outputs]].map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
    </nav>
    <section id="overview" className={styles.section}>
      <h2 className={styles.sectionTitle}>{d.overview}</h2>
      <dl className={styles.overview}>{[[d.goal, a.goal], [d.why, a.why], [d.current, a.current], [d.next, a.next]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
      {current && <div className={styles.currentStep}><p className={styles.eyebrow}>{d.currentStep} · {String(active.findIndex((s) => s.id === current.id) + 1).padStart(2, "0")} / {String(active.length).padStart(2, "0")}</p>
        <h3>{current.title}</h3><Progress artifact={a} locale={locale} /></div>}
    </section>
    <section id="logs" className={styles.section}>
      <h2 className={styles.sectionTitle}>{d.logs}</h2>
      {a.logs.length ? a.logs.map((log) => <article key={log.id} className={styles.logRow}>
        <span className={styles.logNumber}>{d.logPrefix} {String(log.number).padStart(3, "0")}</span>
        <div><h3><Link href={`/${locale}/build/${a.id}/logs/${log.id}`}>{log.title}</Link></h3><p className={styles.rowText}>{log.summary}</p>
          <p className={styles.meta}>{d.step} · {a.roadmap.find((s) => s.id === log.roadmapStep)?.title}</p></div>
        <time dateTime={log.date}>{buildDate(log.date, locale)}</time>
      </article>) : <p className={styles.empty}>{d.emptyLogs}</p>}
    </section>
    <section id="roadmap" className={styles.section}>
      <h2 className={styles.sectionTitle}>{d.roadmap}</h2>
      <ol>{a.roadmap.map((s) => <li key={s.id} className={`${styles.step} ${s.archived ? styles.stepArchived : ""}`} data-status={s.status}>
        <span className={styles.stepMark} aria-hidden="true">{s.archived ? "—" : s.status === "DONE" ? "✓" : s.status === "DOING" ? "●" : "○"}</span>
        <span className={styles.stepNumber}>{s.archived ? "—" : String(active.findIndex((step) => step.id === s.id) + 1).padStart(2, "0")}</span>
        <span>{s.title}</span><small>{s.archived ? d.archived : d.stepStatuses[s.status]}</small>
      </li>)}</ol>
      {!a.roadmap.length && <p className={styles.empty}>{d.emptyRoadmap}</p>}
      {!!a.roadmapChanges.length && <details className={styles.history}><summary>{d.history} · {a.roadmapChanges.length}</summary>
        <ul>{a.roadmapChanges.map((c, i) => <li key={i}><time dateTime={c.date}>{buildDate(c.date, locale)}</time><span>{c.summary} · {a.roadmap.find((s) => s.id === c.stepId)?.title}</span></li>)}</ul>
      </details>}
    </section>
    <section id="outputs" className={styles.section}>
      <h2 className={styles.sectionTitle}>{d.outputs}</h2>
      {outputs.length ? <ul className={styles.outputs}>{outputs.map(({ log, output }, i) => <li key={i} className={styles.output}>
        <OutputLink output={output} locale={locale} artifactId={a.id} /><small><Link href={`/${locale}/build/${a.id}/logs/${log.id}`}>{d.logPrefix} {String(log.number).padStart(3, "0")}</Link></small>
      </li>)}</ul> : <p className={styles.empty}>{d.emptyOutputs}</p>}
    </section>
  </main>;
}
