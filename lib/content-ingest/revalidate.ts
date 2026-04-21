import { revalidatePath } from "next/cache";

import type { InvalidationRecord } from "./types";

function detailPath(record: InvalidationRecord) {
  return record.type === "post"
    ? `/${record.locale}/blog/${record.slug}`
    : `/${record.locale}/tools/${record.slug}`;
}

export function collectRevalidatePaths(records: InvalidationRecord[]) {
  const paths = new Set<string>(["/zh", "/en", "/zh/blog", "/en/blog", "/zh/tools", "/en/tools"]);

  for (const record of records) {
    paths.add(detailPath(record));
  }

  return [...paths];
}

export function revalidateIngestPaths(records: InvalidationRecord[]) {
  const paths = collectRevalidatePaths(records);

  for (const routePath of paths) {
    revalidatePath(routePath);
  }

  return paths;
}
