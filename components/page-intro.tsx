import type { ReactNode } from "react";
import { SectionHeading } from "@/components/section-heading";

type Section = "build" | "courses" | "tools" | "blog" | "discover" | "about";

const motifs: Record<Section, ReactNode> = {
  build: <><path d="m80 32 42 24v48l-42 24-42-24V56Z" /><path d="m38 56 42 24 42-24M80 80v48M59 44l42 24v24" /><path d="M19 79h12m98 0h12M80 13v12m0 110v12" opacity=".4" /></>,
  courses: <><path d="M80 46c-14-10-30-13-49-9v74c19-4 35-1 49 9 14-10 30-13 49-9V37c-19-4-35-1-49 9Z" /><path d="M80 46v74M44 56c9-1 17 1 24 5m-24 13c9-1 17 1 24 5m24-18c7-4 15-6 24-5m-24 23c7-4 15-6 24-5" /><path d="M40 124c14-1 28 2 40 10 12-8 26-11 40-10" opacity=".4" /></>,
  tools: <><rect x="31" y="31" width="42" height="42" rx="9" /><rect x="87" y="87" width="42" height="42" rx="9" /><rect x="31" y="87" width="42" height="42" rx="9" opacity=".5" /><path d="M88 52h40m-20-20v40M45 52h14m-7-7v14M100 108h16" /></>,
  blog: <><path d="M101 33H40v96h80V80M54 91h26m-26 15h47M69 77l4-20 40-40 16 16-40 40Z" /><path d="m104 26 16 16M73 57l16 16" /><path d="M30 49H20m10 15H15m125 36h-10" opacity=".4" /></>,
  discover: <><circle cx="80" cy="80" r="49" /><circle cx="80" cy="80" r="59" opacity=".3" /><path d="m103 57-14 32-32 14 14-32Z" /><path d="m71 71 18 18M80 31v10m49 39h-10m-39 49v-10M31 80h10" /><circle cx="80" cy="80" r="3" fill="currentColor" stroke="none" /></>,
  about: <><circle cx="80" cy="59" r="18" /><path d="M44 116v-8c0-16 16-28 36-28s36 12 36 28v8" /><circle cx="80" cy="80" r="58" opacity=".3" /><circle cx="127" cy="46" r="7" fill="var(--surface)" /><path d="M21 80h11m48 58v-11" opacity=".5" /></>,
};

export function PageIntro({ section, title, description, eyebrow, children }: {
  section: Section;
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-intro" data-section={section}>
      <div className="page-intro-copy">
        <SectionHeading description={description} eyebrow={eyebrow} level="page" title={title} />
        {children}
      </div>
      <svg aria-hidden="true" className="page-motif" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 160 160">
        {motifs[section]}
      </svg>
    </header>
  );
}
