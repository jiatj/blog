import Link from "next/link";
import { notFound } from "next/navigation";
import { OutputLink } from "@/components/build/shared";
import styles from "@/components/build/build.module.css";
import { getDictionary } from "@/lib/dictionary";
import { getBuildArtifact, getBuildLocales } from "@/lib/build/read";
import { JsonLd } from "@/components/json-ld";
import { articleData } from "@/lib/structured-data";
import { buildDate } from "@/lib/build/model";
import { buildMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: Locale; artifact: string; log: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, artifact, log } = await params; const a = await getBuildArtifact(locale, artifact); const entry = a?.logs.find((l) => l.id === log);
  return a && entry ? buildMetadata({ locale, title: `${entry.title} · ${a.title}`, description: entry.summary, path: `/build/${a.id}/logs/${entry.id}`, availableLocales: await getBuildLocales(a.id, entry.id), type: "article", publishedTime: entry.date }) : {};
}
export default async function LogPage({ params }: Props) {
  const { locale, artifact, log } = await params; const a = await getBuildArtifact(locale, artifact);
  const entry = a?.logs.find((l) => l.id === log);
  if (!a || !entry) notFound();
  const d = getDictionary(locale).build; const index = a.logs.findIndex((l) => l.id === log);
  const previous = a.logs[index - 1]; const next = a.logs[index + 1];
  return <main className={`${styles.page} ${styles.logArticle}`}>
    <JsonLd data={articleData({ locale, path: `/build/${a.id}/logs/${entry.id}`, title: `${entry.title} · ${a.title}`, summary: entry.summary, date: entry.date })} />
    <Link className={styles.link} href={`/${locale}/build/${a.id}#logs`}>← {a.title}</Link>
    <article>
      <header className={styles.hero} style={{ gridTemplateColumns: "1fr" }}>
        <div><p className={styles.eyebrow}>{d.logPrefix} {String(entry.number).padStart(3, "0")}</p><h1 className={styles.title}>{entry.title}</h1>
          <div className={styles.meta}><time dateTime={entry.date}>{buildDate(entry.date, locale)}</time>
            <Link href={`/${locale}/build/${a.id}#roadmap`}>{d.step} · {a.roadmap.find((s) => s.id === entry.roadmapStep)?.title}</Link></div></div>
      </header>
      <section className={styles.section}><h2 className={styles.sectionTitle}>{d.goal}</h2><p className={styles.logText}>{entry.goal}</p></section>
      {!!entry.whatDid.length && <section className={styles.section}><h2 className={styles.sectionTitle}>{d.whatDid}</h2><ul className={styles.bullets}>{entry.whatDid.map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
      {[{ title: d.problems, items: entry.problems }, { title: d.decisions, items: entry.decisions }].map(({ title, items }) => items.length > 0 && <section key={title} className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2><ul className={styles.bullets}>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>)}
      <section className={styles.section}><h2 className={styles.sectionTitle}>{d.result}</h2><p className={styles.logText}>{entry.summary}</p></section>
      {!!entry.outputs.length && <section className={styles.section}><h2 className={styles.sectionTitle}>{d.outputs}</h2><ul className={styles.outputs}>
        {entry.outputs.map((output, i) => <li key={i}><OutputLink output={output} locale={locale} artifactId={a.id} /></li>)}
      </ul></section>}
      {entry.video && <section className={styles.section}><h2 className={styles.sectionTitle}>{d.video}</h2><a className={styles.link} href={entry.video} target="_blank" rel="noreferrer">{d.replay} ↗</a></section>}
    </article>
    <nav className={styles.sequence} aria-label={d.logSequence}>
      <span>{previous && <Link className={styles.link} href={`/${locale}/build/${a.id}/logs/${previous.id}`}>← {d.previous} · {previous.title}</Link>}</span>
      {next && <Link className={styles.link} href={`/${locale}/build/${a.id}/logs/${next.id}`}>{d.nextLog} · {next.title} →</Link>}
    </nav>
  </main>;
}
