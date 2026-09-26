import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourse } from "@/lib/courses/read";
import { buildMetadata } from "@/lib/metadata";
import { CourseStatus, LessonRow } from "@/components/courses/shared";
import styles from "@/components/courses/course.module.css";

type Props = { params: Promise<{ locale: string; course: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props) {
  const course = await getCourse((await params).course);
  return course
    ? buildMetadata({
        locale: "zh",
        title: course.title,
        description: course.summary,
        path: `/courses/${course.slug}`,
      })
    : {};
}
export default async function CoursePage({ params }: Props) {
  const { locale, course: slug } = await params;
  if (locale !== "zh") redirect(`/zh/courses/${encodeURIComponent(slug)}`);
  const course = await getCourse(slug);
  if (!course) notFound();
  const pageMap = new Map(course.pages.map((page) => [page.slug, page]));
  const references = course.pages.filter((page) => page.kind === "reference");
  return (
    <main className={styles.root}>
      <nav className={styles.breadcrumbs} aria-label="面包屑">
        <Link prefetch={false} href="/zh/courses">
          全部课程
        </Link>
        <span aria-hidden="true">/</span>
        <span>{course.title}</span>
      </nav>
      <header className={styles.hero}>
        <div>
          <CourseStatus course={course} />
          <h1>{course.title}</h1>
          <p className={styles.description}>{course.summary}</p>
          <Link
            prefetch={false}
            className={styles.primary}
            href={`/zh/courses/${slug}/${course.start}`}
          >
            从这里开始 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className={styles.heroDetails}>
          {course.cover && (
            <img src={course.cover} alt="" className={styles.cover} />
          )}
          <dl>
            {course.audience && (
              <>
                <dt>适合谁</dt>
                <dd>{course.audience}</dd>
              </>
            )}
            {course.preparation && (
              <>
                <dt>开始前准备</dt>
                <dd>{course.preparation}</dd>
              </>
            )}
            <dt>学习方式</dt>
            <dd>按目录实践 · 随时查阅知识点</dd>
          </dl>
        </div>
      </header>
      {!!course.outcomes?.length && (
        <section className={styles.outcomes}>
          <h2>你将完成</h2>
          <ul>
            {course.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </section>
      )}
      <section
        className={styles.curriculum}
        aria-labelledby="curriculum-heading"
      >
        <h2 id="curriculum-heading" className={styles.sectionHeading}>
          课程目录
        </h2>
        {course.groups.map((group, index) => {
          const pages = [
            ...(group.guide ? [group.guide] : []),
            ...group.lessons,
          ].flatMap((id) => (pageMap.has(id) ? [pageMap.get(id)!] : []));
          return (
            pages.length > 0 && (
              <section key={group.id} className={styles.group}>
                <div className={styles.groupTitle}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{group.title}</h3>
                </div>
                {pages.map((page) => (
                  <LessonRow key={page.slug} course={slug} page={page} />
                ))}
              </section>
            )
          );
        })}
        {references.length > 0 && (
          <section className={styles.references}>
            <h2 className={styles.sectionHeading}>随时查阅的知识点</h2>
            <div className={styles.referenceGrid}>
              {references.map((page) => (
                <LessonRow key={page.slug} course={slug} page={page} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
