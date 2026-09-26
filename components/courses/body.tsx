"use client";

import { useEffect, useRef } from "react";
import styles from "./course.module.css";

export function CourseBody({ html }: { html: string }) {
  const root = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const wrappers: HTMLDivElement[] = [];
    root.current?.querySelectorAll("pre").forEach((pre) => {
      const wrapper = document.createElement("div");
      wrapper.className = "course-code";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "course-copy";
      button.textContent = "复制代码";
      button.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent ?? "");
          button.textContent = "已复制";
          if (status.current) status.current.textContent = "代码已复制";
        } catch {
          button.textContent = "请选中代码复制";
          if (status.current)
            status.current.textContent = "自动复制不可用，请选中代码手工复制";
        }
      };
      pre.replaceWith(wrapper);
      wrapper.append(button, pre);
      wrappers.push(wrapper);
    });
    return () => {
      for (const wrapper of wrappers) {
        const pre = wrapper.querySelector("pre");
        if (pre) wrapper.replaceWith(pre);
      }
    };
  }, [html]);
  return (
    <>
      <div
        ref={root}
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <span
        ref={status}
        className={styles.srOnly}
        role="status"
        aria-live="polite"
      />
    </>
  );
}
