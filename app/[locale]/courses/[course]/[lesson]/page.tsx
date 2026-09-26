import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourse } from "@/lib/courses/read";
import { courseSequence } from "@/lib/courses/store";
import { buildMetadata } from "@/lib/metadata";
import { CourseContents } from "@/components/courses/contents";
import { CourseBody } from "@/components/courses/body";
import { kindLabel } from "@/components/courses/shared";
import styles from "@/components/courses/course.module.css";

type Props = {
  params: Promise<{ locale: string; course: string; lesson: string }>;
};
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props) {
  const { course: slug, lesson } = await params;
  const course = await getCourse(slug);
  const page = course?.pages.find((page) => page.slug === lesson);
  return page && course
    ? buildMetadata({
        locale: "zh",
        title: `${page.title} · ${course.title}`,
        description: page.summary || course.summary,
        path: `/courses/${slug}/${lesson}`,
      })
    : {};
}
export default async function LessonPage({ params }: Props) {
  const { locale, course: slug, lesson } = await params;
  if (locale !== "zh")
    redirect(
      `/zh/courses/${encodeURIComponent(slug)}/${encodeURIComponent(lesson)}`,
    );
  const course = await getCourse(slug);
  const page = course?.pages.find((page) => page.slug === lesson);
  if (!course || !page) notFound();
  const sequence = courseSequence(course);
  const index = sequence.findIndex((item) => item.slug === lesson);
  const previous = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 ? sequence[index + 1] : null;
  const related = course.pages.filter((item) =>
    page.related?.includes(item.slug),
  );
  const referring =
    page.kind === "reference"
      ? course.pages.filter(
          (item) =>
            item.slug !== page.slug && item.related?.includes(page.slug),
        )
      : [];
  const link = (id: string) => `/zh/courses/${slug}/${id}`;
  return (
    <main className={styles.root}>
      <nav className={styles.breadcrumbs} aria-label="面包屑">
        <Link prefetch={false} href="/zh/courses">
          全部课程
        </Link>
        <span aria-hidden="true">/</span>
        <Link prefetch={false} href={`/zh/courses/${slug}`}>
          {course.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{page.title}</span>
      </nav>
      <div className={styles.reader}>
        <CourseContents
          key={page.slug}
          slug={slug}
          title={course.title}
          groups={course.groups}
          pages={course.pages.map(({ slug, title, kind }) => ({
            slug,
            title,
            kind,
          }))}
          current={lesson}
        />
        <article className={styles.article}>
          <header className={styles.articleHeader}>
            <div className={styles.articleMeta}>
              <span>
                {page.label && page.label !== kindLabel[page.kind]
                  ? `${page.label} / `
                  : ""}
                {kindLabel[page.kind]}
              </span>
              <span>
                更新于 <time dateTime={page.updated}>{page.updated}</time>
              </span>
            </div>
            <h1>{page.title}</h1>
            {page.summary && <p>{page.summary}</p>}
            {!!page.objectives?.length && (
              <div className={styles.objectives}>
                <strong>本节目标</strong>
                <ul>
                  {page.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </header>
          {page.headings.length > 2 && (
            <details className={styles.pageContents}>
              <summary>本页目录</summary>
              <ul>
                {page.headings
                  .filter((heading) => heading.depth === 2)
                  .map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${encodeURIComponent(heading.id)}`}>
                        {heading.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </details>
          )}
          <CourseBody key={page.slug} html={page.html} />
          {related.length > 0 && (
            <section className={styles.related}>
              <h2>相关知识点</h2>
              <div className={styles.relatedLinks}>
                {related.map((item) => (
                  <Link prefetch={false} key={item.slug} href={link(item.slug)}>
                    {item.title} ↗
                  </Link>
                ))}
              </div>
            </section>
          )}
          {referring.length > 0 && (
            <section className={styles.related}>
              <h2>使用这个知识点的讲义</h2>
              <div className={styles.relatedLinks}>
                {referring.map((item) => (
                  <Link prefetch={false} key={item.slug} href={link(item.slug)}>
                    {item.title} ↗
                  </Link>
                ))}
              </div>
            </section>
          )}
          <nav className={styles.pagination} aria-label="阅读导航">
            {previous ? (
              <Link prefetch={false} href={link(previous.slug)}>
                <small>← 上一节</small>
                {previous.title}
              </Link>
            ) : (
              <Link prefetch={false} href={`/zh/courses/${slug}`}>
                <small>← 返回</small>课程目录
              </Link>
            )}
            {next ? (
              <Link prefetch={false} href={link(next.slug)}>
                <small>下一节 →</small>
                {next.title}
              </Link>
            ) : previous ? (
              <Link prefetch={false} href={`/zh/courses/${slug}`}>
                <small>已到当前目录末尾</small>查看课程目录 →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
      </div>
    </main>
  );
}
