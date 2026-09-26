"use client";

import Link from "next/link";
import { useState } from "react";
import type { Course, CoursePage } from "@/lib/courses/types";
import styles from "./course.module.css";

type Props = {
  slug: string;
  title: string;
  groups: Course["groups"];
  pages: Pick<CoursePage, "slug" | "title" | "kind">[];
  current: string;
};

export function CourseContents({ slug, title, groups, pages, current }: Props) {
  const [open, setOpen] = useState(false);
  const pageMap = new Map(pages.map((page) => [page.slug, page]));
  const entry = (id: string) => {
    const page = pageMap.get(id);
    return page ? (
      <Link
        key={id}
        prefetch={false}
        href={`/zh/courses/${slug}/${id}`}
        className={styles.contentsLink}
        aria-current={current === id ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        {page.title}
      </Link>
    ) : null;
  };
  const references = pages.filter((page) => page.kind === "reference");
  return (
    <aside className={styles.contents} data-open={open}>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-expanded={open}
        aria-controls="course-navigation"
        onClick={() => setOpen(!open)}
      >
        <span>课程目录</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <nav
        id="course-navigation"
        aria-label="课程目录"
        className={styles.contentsNav}
      >
        <Link
          prefetch={false}
          className={styles.contentsTitle}
          href={`/zh/courses/${slug}`}
        >
          {title}
        </Link>
        {groups.map((group) => {
          const ids = [
            ...(group.guide ? [group.guide] : []),
            ...group.lessons,
          ].filter((id) => pageMap.has(id));
          return ids.length ? (
            <div className={styles.contentsGroup} key={group.id}>
              <p>{group.title}</p>
              {ids.map(entry)}
            </div>
          ) : null;
        })}
        {references.length > 0 && (
          <div className={styles.contentsGroup}>
            <p>知识点 · 随时查阅</p>
            {references.map((page) => entry(page.slug))}
          </div>
        )}
        <Link prefetch={false} href="/zh/courses" className={styles.textLink}>
          全部课程 <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </aside>
  );
}
