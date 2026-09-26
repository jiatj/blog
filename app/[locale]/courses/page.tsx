import Link from "next/link";
import { redirect } from "next/navigation";
import { getCourses } from "@/lib/courses/read";
import { buildMetadata } from "@/lib/metadata";
import { CourseStatus } from "@/components/courses/shared";
import styles from "@/components/courses/course.module.css";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  locale: "zh",
  title: "课程",
  description: "围绕真实问题动手实践，按自己的节奏阅读与学习。",
  path: "/courses",
});

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if ((await params).locale !== "zh") redirect("/zh/courses");
  const courses = await getCourses();
  return (
    <main className={styles.root}>
      <header className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>Learn by building</span>
          <h1><span>从听课，</span><span>到项目实战。</span></h1>
          <p>
            围绕真实问题，一步步完成自己的作品。</p>
        </div>
        
      </header>
      <div className={styles.sectionLabel}>
        <span>课程目录</span>
        <span>{courses.length} 门课程 · 中文</span>
      </div>
      {courses.map((course, index) => (
        <article key={course.slug} className={styles.courseRow}>
          <span className={styles.number}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <CourseStatus course={course} />
            <h2>
              <Link prefetch={false} href={`/zh/courses/${course.slug}`}>
                {course.title}
              </Link>
            </h2>
            <p className={styles.description}>{course.summary}</p>
          </div>
          <div className={styles.rowMeta}>
            <span>
              {course.pages.filter((page) => page.kind !== "reference").length}{" "}
              篇讲义 / 导读
              <br />
              {
                course.pages.filter((page) => page.kind === "reference").length
              }{" "}
              个知识点
            </span>
            <Link
              prefetch={false}
              className={styles.textLink}
              href={`/zh/courses/${course.slug}`}
            >
              查看课程 <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      ))}
      {!courses.length && (
        <div className={styles.empty}>
          <h2>课程正在整理中</h2>
          <p>讲义与练习公开后，会在这里列出。</p>
        </div>
      )}
    </main>
  );
}
