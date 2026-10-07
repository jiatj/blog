import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Include runtime files and maintenance CLIs, never the entire checkout.
const entries = [
  ".next", "public", "config/reading-sources.json",
  "lib/courses", "lib/reading", "lib/build", "scripts/course.mjs", "scripts/reading.mjs", "scripts/build.mjs",
  "scripts/install-reading-task.ps1", "package.json", "package-lock.json",
  "next.config.ts", "tsconfig.json", ".env.example", "README.md",
  "doc/courses.md", "doc/build.md", "doc/content-sync.md", "doc/content-model.md", "doc/content-ingest-sample.md",
];
const excludes = [
  ".next/cache", ".next/dev", ".next/diagnostics", ".next/build", ".next/types",
  ".next/trace", ".next/trace-build",
  ".publish.lock",
  ".env", ".env.local", ".env.*.local", ".env.production", ".env.development", ".env.test",
  ".git", "*.sqlite", "*.sqlite-*", "*.log",
];

function runTar(args) {
  const result = spawnSync("tar", args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error?.code === "ENOENT") {
    throw new Error("未找到 tar，请安装 tar 后重试（Windows 10/11 通常自带）。");
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`tar 执行失败，退出码 ${result.status}`);
}

try {
  if (process.argv.length > 2) throw new Error("用法：npm run build，然后 npm run pack（无需参数）。");
  for (const required of [".next/BUILD_ID", ".next/required-server-files.json", ".next/server", ".next/static"]) {
    try {
      await fs.access(path.join(root, required));
    } catch {
      throw new Error(`缺少生产构建 ${required}，请先执行 npm run build。`);
    }
  }
  for (const entry of entries) await fs.access(path.join(root, entry));
  try {
    const courseData = await fs.stat(path.join(root, ".course-data"));
    if (!courseData.isDirectory()) throw new Error(".course-data 必须是目录。");
    entries.push(".course-data");
    console.log("已加入 .course-data（课程内容、资源及历史版本，不含发布锁）。");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.log("未找到 .course-data，跳过本地课程数据。");
  }
  runTar(["--version"]);
  const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const version = String(pkg.version).replace(/[^a-zA-Z0-9._-]/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `portal-${version}-${timestamp}.tar.gz`;
  const outputDir = path.join(root, "dist");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, filename);
  // Failed archives remain visibly incomplete.
  const partialPath = `${outputPath}.partial`;
  runTar(["-czf", partialPath, ...excludes.map((entry) => `--exclude=${entry}`), ...entries]);
  await fs.rename(partialPath, outputPath);
  const { size } = await fs.stat(outputPath);
  console.log(`\n发布包：${outputPath}\n大小：${(size / 1024 / 1024).toFixed(2)} MiB`);
  console.log("服务器：解压到新目录 → 配置环境变量 → npm ci --omit=dev → npm run start");
  console.log("需要 Node.js 24+。本包使用现有 build；修改代码或 NEXT_PUBLIC_* 后请重新 build。");
  console.log("不含 content/、node_modules、真实 .env、阅读数据库和同步状态；请单独保留服务器数据。");
  console.log(".course-data 为本机课程快照；首次迁移可用，日常升级不要覆盖线上课程数据。");
  console.log("public/ 按现状打包；启动前请将服务器已有 content/ 接入新发布目录，首次部署需单独发布内容。");
} catch (error) {
  console.error(`打包失败：${error.message}`);
  process.exitCode = 1;
}
