export type CoursePage = {
  slug: string;
  title: string;
  kind: "guide" | "lesson" | "reference";
  source: string;
  status: "draft" | "published";
  updated: string;
  summary?: string;
  label?: string;
  objectives?: string[];
  related?: string[];
};

export type Course = {
  version: 1;
  slug: string;
  title: string;
  summary: string;
  locale: "zh";
  status: "draft" | "published";
  state: "updating" | "complete";
  order: number;
  start: string;
  audience?: string;
  preparation?: string;
  outcomes?: string[];
  cover?: string;
  groups: { id: string; title: string; guide?: string; lessons: string[] }[];
  pages: CoursePage[];
};

export type Heading = { id: string; title: string; depth: number };
export type PublishedPage = CoursePage & { html: string; headings: Heading[] };
export type PublishedCourse = Omit<Course, "pages"> & {
  revision: string;
  publishedAt: string;
  pages: PublishedPage[];
  assets: string[];
};
