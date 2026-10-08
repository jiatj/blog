import Link from "next/link";
import { redirect } from "next/navigation";
import { getCourses } from "@/lib/courses/read";
import { buildMetadata } from "@/lib/metadata";
import { CourseStatus } from "@/components/courses/shared";
import { PageIntro } from "@/components/page-intro";
import styles from "@/components/courses/course.module.css";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  locale: "zh",
  title: "AI 应用开发教程与项目实战课程",
  description: "通过 AI Builder Lab 的公开讲义与练习，学习 AI 编程、AI 应用开发与项目实战，围绕真实问题一步步完成自己的作品。",
  path: "/courses",
  availableLocales: ["zh"],
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
      <PageIntro section="courses" title="从听课，到项目实战。" description="学习 AI 编程与 AI 应用开发，围绕真实问题，一步步完成自己的作品。" eyebrow="Learn by building" />
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
