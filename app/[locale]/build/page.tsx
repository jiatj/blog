import { ArtifactRow } from "@/components/build/shared";
import { NextLive } from "@/components/build/next-live";
import { PageIntro } from "@/components/page-intro";
import styles from "@/components/build/build.module.css";
import { getDictionary } from "@/lib/dictionary";
import { readBuildArtifacts } from "@/lib/build/read";
import { nextLive } from "@/lib/build/model";
import { buildMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params; const d = getDictionary(locale).build;
  return buildMetadata({ locale, title: d.title, description: d.description, path: "/build" });
}
export default async function BuildPage({ params }: Props) {
  const { locale } = await params; const d = getDictionary(locale).build;
  const artifacts = await readBuildArtifacts(locale); const now = Date.now();
  return <main className={styles.page}>
    <PageIntro section="build" title={d.hero} description={d.description} eyebrow={`AI Builder Lab / ${d.title}`}>
      <div className={`${styles.index} mt-6`}><p><strong>{String(artifacts.filter((a) => a.status === "BUILDING").length).padStart(2, "0")}</strong>{d.statuses.BUILDING}</p>
        <p><strong>{String(artifacts.filter((a) => a.status === "SHIPPED").length).padStart(2, "0")}</strong>{d.statuses.SHIPPED}</p></div>
    </PageIntro>
    <NextLive live={nextLive(artifacts, now)} locale={locale} serverNow={now} />
    <section className={styles.section} aria-labelledby="artifacts-title">
      <h2 id="artifacts-title" className={styles.sectionTitle}>{d.artifacts}</h2>
      {artifacts.length ? artifacts.map((a) => <ArtifactRow key={a.id} artifact={a} locale={locale} />) : <p className={styles.empty}>{d.empty}</p>}
    </section>
  </main>;
}
