import Link from "next/link";
import type { CoursePage, PublishedCourse } from "@/lib/courses/types";
import styles from "./course.module.css";

export const kindLabel = {
  guide: "模块导读",
  lesson: "课堂讲义",
  reference: "知识点",
};
export function CourseStatus({ course }: { course: PublishedCourse }) {
  return (
    <span className={styles.status}>
      {course.state === "complete" ? "内容已齐" : "持续更新"}
    </span>
  );
}
export function LessonRow({
  course,
  page,
}: {
  course: string;
  page: CoursePage;
}) {
  return (
    <Link
      prefetch={false}
      href={`/zh/courses/${course}/${page.slug}`}
      className={styles.lessonRow}
    >
      <span className={styles.lessonLabel}>
        {page.label || kindLabel[page.kind]}
      </span>
      <span className={styles.lessonTitle}>
        {page.title}
        {page.summary && <small>{page.summary}</small>}
      </span>
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
