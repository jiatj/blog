import path from "node:path";
import fs from "node:fs/promises";
import { readBuildArtifacts, readBuildOutput, buildContentRoot } from "../lib/build/read.ts";
import { isOutputPath } from "../lib/build/model.ts";

try {
  if (process.argv.length > 3) throw new Error("用法：npm run build:check -- [内容根目录]");
  const root = process.argv[2] ? path.resolve(process.argv[2]) : buildContentRoot();
  if (process.argv[2] && !(await fs.stat(root)).isDirectory()) throw new Error("内容根目录必须为目录");
  let count = 0;
  for (const locale of ["zh", "en"]) {
    const artifacts = await readBuildArtifacts(locale, root, true);
    for (const a of artifacts) {
      // Draft metadata is validated, but only published outputs must be available.
      if (a.publishState === "published") for (const log of a.logs.filter((l) => l.publishState === "published")) {
        for (const o of log.outputs.filter((o) => isOutputPath(o.href))) {
          if (!await readBuildOutput(locale, a.id, o.href, root)) throw new Error(`${locale}/${a.id}: 公开产出文件不存在: ${o.href}`);
        }
      }
      console.log(`${locale}/${a.id}: ${a.publishState}, ${a.logs.length} 篇日志，${a.roadmap.length} 个步骤`);
      count++;
    }
  }
  console.log(`造物校验通过：${count} 个作品；目录 ${root}${count ? "" : "（无作品）"}`);
} catch (error) {
  console.error(`造物校验失败：${error.message}`);
  process.exitCode = 1;
}
