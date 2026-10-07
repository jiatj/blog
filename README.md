# AI Builder Lab Portal

当前版本为 2.0。1.0 基线保存在 Git 标签 `v1.0.0`；文章、项目和课程沿用原有 URL 与发布方式，新增「发现」页及本地 SQLite 阅读归档。

`portal` 是一个基于 `Next.js 16 + App Router` 的个人站点。

当前内容发布链路已经从：

`webhook 写文件 + 依赖整站重构`

调整为：

`ingest 导入 + 资源同步 + 路径改写 + on-demand revalidate`

这意味着：

- 写作侧继续保持自包含内容单元
- 图片继续使用标准 Markdown 相对路径
- `portal` 在 ingest 时完成资源复制和路径改写
- 发布成功后，首页 / 列表 / 详情页会按路径失效缓存
- 首页、博客及项目列表/详情按请求读取 `content/` 中的最终 Markdown，直接新增或修改文件后刷新页面即可，无需重新构建或重启；已打开的页面不会自动推送更新。
- 不再把 `build + restart` 作为正式发布机制

文章和项目图片仍放在 `public/posts/{slug}/...`、`public/tools/{slug}/...`，正文 URL 使用 `/posts/...`、`/tools/...`（没有 `public`，且 `posts` 有 s）。生产服务启动后新增的图片由资源读取接口兜底，无需再次重启；支持 PNG、JPEG、WebP、GIF、AVIF、SVG、ICO，缺失图片返回 404 且不缓存。此代码修复首次部署需要 build 并重启服务，之后上传图片只需刷新页面。

课程模块的完整写作、目录与手工发布规范见 [课程编写与发布](doc/courses.md)。课程没有管理后台，使用文件与 CLI 维护。

## Development Guide

- 导航：宽屏（1280px 起）显示首页、造物、课程、项目、文章、发现、关于；手机、平板和窄屏显示首页、造物、课程、项目、更多，展开更多可进入文章、发现、关于。语言与主题保留在导航右侧，课程仍只提供中文。
- 栏目页头：共用 `components/page-intro.tsx` 的装饰 SVG 与轻微配色；首页沿用原有图案。栏目标题统一使用站点字体；文章详情最大宽度为 60rem，手机减少内边距。
- 导航与阅读人工验收：检查 320/390/768/1280px、中英文和深浅主题；更多能点击开关、点击外部关闭、Escape 关闭并回到按钮，跳转后关闭；确认无整页横向滚动，正文和图表可读。

- 造物栏目：`/zh/build`、`/en/build`，作品 → 路线图 → 造物日志 → 产出文件。内容和示例预览见 [造物维护说明](doc/build.md)。
- 造物校验：`npm run build:check -- ./examples/build`；回归测试：`npm run test:build`。默认真实内容目录为 `content/build/`，也可用 `BUILD_CONTENT_DIR` 指向独立持久目录。示例不默认发布，AI 整理结果由作者审核后发布。
- 造物生产验收：构建后执行 `node scripts/smoke-build.mjs`，自动启动独立本地测试端口，用临时内容检查中英文页面、草稿 404、sitemap 和启动后发布/下载更新，不修改正式内容。

- 使用 Node.js 24+（课程 CLI 直接运行 TypeScript），在项目根目录执行 `npm ci`。
- 开发启动：`npm run dev`，默认访问 `http://localhost:3006`。生产启动 `npm run start` 与 `npm run prod` 默认使用 3000 端口；临时覆盖可追加 `-- --port <端口>` 到 `dev` 或 `start` 命令。
- 类型检查：`npx tsc --noEmit`；课程测试：`npm run test:courses`；构建：`npm run build`。
- 图片读取回归：`node --test scripts/test-content-assets.mjs`；构建后运行 `node scripts/smoke-content-assets.mjs`，验证同一生产进程启动后新增、替换图片即时生效。
- 生产模式验收：先 `npm run start -- --port 3100`，另一个终端运行 `npm run test:courses:http -- http://localhost:3100`。仅针对本机测试服务；会创建并清理独立临时测试课程。
- 当前 `npm run lint` 沿用旧的 `next lint` 配置，不作为本次验证命令；修复 lint 配置为 TODO。
- 体验课程示例：`npm run course:check -- ./examples/courses/starter`，再执行 `npm run course:publish -- ./examples/courses/starter`，访问 `/zh/courses`。
- `.course-data/` 为本地发布数据；原始示例位于 `examples/courses/`。正式 FDE 材料需整理后单独上传。
- 项目级本地数据默认放在 `.portal-data/`；也可用 `PORTAL_DATA_DIR` 指向一个持久化绝对路径。旧的 `.reading-data/` 仍兼容读取，但不建议继续作为新数据目录。
- 发现页来源维护在 `config/reading-sources.json`，只接入带可靠发布时间的 RSS、Atom 或 JSON Feed。执行 `npm run reading:scan` 会收集上海时区前一日文章；手工补采使用 `npm run reading:scan -- --date 2026-09-27`。
- 来源可用 `READING_SOURCES_FILE` 覆盖。每项包含 `name`、`url`、`feedUrl` 和 `focusArea`；摘要直接使用 Feed 原摘要，不抓取或复制正文。
- 阅读归档测试：`npm run test:reading`。默认 SQLite 文件为 `.portal-data/reading/reading.sqlite`；页面默认展示不晚于昨日的最近一次收录，收藏和删除只保存在当前浏览器。

## Release Guide

### 构建并打包代码

在开发机执行（Node.js 24+，系统需有 `tar`；Windows 10/11 通常自带）：

```bash
npm ci
npm run build
npm run pack
```

输出为 `dist/portal-2.0.0-<UTC时间>.tar.gz`，上传这一个文件即可。`pack` 只打包已有生产构建，缺少构建时会报错，不会自动重新 build。修改代码或 `NEXT_PUBLIC_*` 后必须重新构建；打包期间不要同时运行 build 或发布内容。

| 包内内容 | 用途 |
| --- | --- |
| `.next/`（排除开发产物、构建缓存、诊断日志等） | 已构建的页面、服务端程序和前端资源 |
| `public/` | 图片等静态资源 |
| `.course-data/`（存在时加入，不含 `.publish.lock`） | 本机已发布课程、资源和历史版本；不存在时提示并跳过 |
| `package.json`、`package-lock.json`、`next.config.ts`、`tsconfig.json` | 安装目标服务器的依赖、启动配置 |
| `config/reading-sources.json`、`lib/courses/`、`lib/reading/`、`lib/build/` 及对应脚本 | 服务器上的课程发布、阅读采集和造物校验 |
| `.env.example`、README 和内容发布文档 | 配置模板与运维说明 |

不包含整个 `content/`（文章、项目 Markdown 及同步清单）、本机 `node_modules`、真实 `.env*`、`.git`、阅读数据库、原始课程示例。打包不会删除本地内容。依赖在目标服务器安装，避免直接搬运 Windows 原生依赖。首次部署需通过下文的 ingest 流程单独发布内容；日常升级沿用服务器已有内容。

课程只打包项目根目录的 `.course-data/`，不会自动读取外部 `COURSE_CONTENT_DIR`。首次迁移时，未配置该变量的服务会直接读取解压后的 `.course-data/`；若配置了该变量，应将课程快照复制到对应的持久化目录。日常升级继续使用服务器现有课程数据，不要用包内快照覆盖，避免丢失更新或回退版本。

### 上传并启动

服务器需要 Node.js 24+ 和 npm。下面将包名、发布目录替换为实际值；Linux 和 Windows PowerShell 均可使用这些命令：

```bash
mkdir portal-release
tar -xzf portal-2.0.0-<UTC时间>.tar.gz -C portal-release
cd portal-release
npm ci --omit=dev
# 按 .env.example 配置服务器环境变量或 .env.local 后启动
npm run start
```

发布默认端口为 3000；可用 `npm run start -- --port 3100` 覆盖。包内没有完整应用源码，不用于重新 build。课程和阅读 CLI 不自动加载 `.env.local`，其变量需要在 shell 或服务配置中设置。

每次解压到新目录，不要直接覆盖线上目录。包内不含 `content/`，启动前必须将服务器最新的内容目录复制或链接到新发布目录的 `content/`，否则文章和项目列表为空。同时保留服务器最新的 `public/posts/`、`public/tools/`，并备份课程和阅读数据库，防止本地快照覆盖线上新内容。同步清单包含绝对路径，跨目录迁移需重新通过 ingest 建立清单；旧清单只留在原目录用于回滚。`COURSE_CONTENT_DIR` 和 `PORTAL_DATA_DIR` 应指向发布目录之外的持久化绝对路径。

上线手工检查：首页、博客及项目列表/详情、图片、课程、发现页和 `/sitemap.xml`，以及服务重启后的数据。Windows 构建到 Linux 的最终运行需在目标服务器验收；如遇平台相关构建问题，在 Linux 构建后重新打包。回滚时切回保留的旧发布目录和配置，避免用旧包覆盖新数据；实际进程管理/反向代理命令仍为 TODO。

### 内容及数据发布

造物内容需要单独上传 `zh/{作品ID}/artifact.json`、`en/{作品ID}/artifact.json` 和相应 `outputs/` 文件。推荐 `BUILD_CONTENT_DIR` 指向发布目录外的持久化绝对路径，代码升级时沿用此目录。先执行 `npm run build:check -- <内容根目录>`，再发布完整文件；无需重启。代码包不包含造物内容或示例，但包含校验 CLI 和维护文档。上线检查造物列表、详情、日志、下载和 `/sitemap.xml`；内容回滚使用备份文件，不用旧代码包覆盖新内容。

1. 首次部署课程功能：`npm ci` → `npm run test:courses` → `npx tsc --noEmit` → `npm run build` → `npm run start`。
2. 为网站服务与发布命令配置相同的 `COURSE_CONTENT_DIR` 绝对路径，使用持久化可写磁盘；不要把数据放在会随部署替换的代码目录中。
3. 将完整课程文件夹手工上传到独立待发布目录；在项目根执行 `npm run course:check -- <课程目录>`，通过后执行 `npm run course:publish -- <课程目录>`。课程更新无需重启。
4. 验证课程目录、讲义、手机布局、明暗主题、图片下载及 `/sitemap.xml`；检查服务重启后课程仍可访问。
5. 内容回退：`npm run course:rollback -- <课程slug>`；备份整个课程数据目录。代码发布的服务管理、反向代理和代码回滚命令：TODO，仓库尚未提供部署配置。
6. 发现页上线：优先配置 `PORTAL_DATA_DIR` 为持久化可写磁盘上的项目级数据根，或配置 `READING_SOURCES_FILE` / `READING_DB_PATH`。在持有 SQLite 数据文件的同一台机器上每天执行 `npm run reading:scan`；Windows 可运行 `npm run reading:task:install -- -At 08:00` 安装每日任务。Linux/macOS 使用系统 cron，部署命令与工作目录按服务器实际路径配置。备份 SQLite 文件。
7. 如需 Talkn 公开助手，将 `NEXT_PUBLIC_TALKN_ENTRY_URL` 设为实际公开入口 URL 后重新构建。受保护的 Talkn 入口需要票据接口，不能直接用于此脚本；公开入口与部署地址尚未提供，因此默认不加载。

CLI 不自动读取 `.env` 文件，生产环境变量需在运行命令的 shell 中设置。博客与项目仍沿用下文的 ingest 链路。

发现页只收集 Feed 中带发布时间的文章标题、原摘要、方向、日期和链接，不复制原文。没有 Feed 的普通网页不接入；单个来源失败不会覆盖其他来源的已有数据，但命令会返回失败状态供调度器告警。SQLite 为单实例本地文件，不适合无持久磁盘或多实例共享写入的部署。

采集日志中的 `saved` 表示本次保存数量，部分来源失败时其他来源仍会保存。网络错误会显示失败地址及底层错误码；在服务器上用 `curl -IL --max-time 20 '<失败地址>'` 排查。`node:sqlite` 的实验性提示不表示采集失败；`lib/reading/package.json` 将阅读模块声明为 ESM，无需修改根目录的模块类型。

### 常用启动命令

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run start
```

## Portal 目录

```text
content/
  posts/
    zh/
    en/
  tools/
    zh/
    en/
  build/
    zh/
    en/
public/
  posts/
  tools/
```

- `content/posts/`、`content/tools/` 放 portal 可直接消费的最终 Markdown 文件；`content/build/` 放独立的作品 JSON 和产出文件
- `public/` 放 ingest 复制过来的静态资源

## 写作侧约定

写作侧采用“每篇内容一个目录”的自包含结构，例如：

```text
vault/
  posts/
    zh/
      why-build-think-ship/
        why-build-think-ship.md
        cover.png
        images/
          fig-1.png
```

规则：

- 正文文件名必须等于 `slug`
- 图片放在当前内容目录内
- Markdown 使用标准格式，不使用 Obsidian wiki 语法
- 图片与封面都使用相对路径

正确示例：

```md
![封面](./cover.png)
![示意图](./images/fig-1.png)
```

不要使用：

```md
![[cover.png]]
```

## ingest frontmatter 规则

ingest 至少要求这些字段：

```yaml
title: Why Build Think Ship
slug: why-build-think-ship
type: post
locale: zh
status: published
date: 2026-04-21
updated: 2026-04-21
cover: ./cover.png
summary: ...
```

说明：

- `type`: `post` 或 `tool`
- `status`: ingest 必填。`published` 会落为 `draft: false`，其他值会落为 `draft: true`
- `cover`: 必须是本地相对路径，例如 `./cover.png`
- `date` / `updated`: 支持 YAML 日期和字符串日期

## tool 扩展字段

tool 除了 ingest 必填字段，还可以使用这些展示字段：

```yaml
toolStatus: Beta
toolUrl: https://example.com/tool
repoUrl: https://github.com/example/tool
logo: ST
homeActionLabel: 查看项目
homeFeatured: true
homeOrder: 1
seoTitle: Settle
seoDescription: 一个工具说明页
```

说明：

- `toolStatus`: 工具状态文案
- `toolUrl`: 工具外链；项目页和卡片入口会用到
- `repoUrl`: 源码链接
- `logo`: 项目卡 logo 区域显示文本
- `homeActionLabel`: 首页 / tools 卡片动作文案
- `homeFeatured`: 首页是否优先展示
- `homeOrder`: 首页排序
- `seoTitle` / `seoDescription`: SEO 字段

## ingest 发布链路

`/api/content/sync` 负责：

1. 校验 webhook 签名
2. 从 GitHub / Gitee / manual payload 读取源 Markdown
3. 校验 frontmatter
4. 发现 `cover` 与正文中的本地图片引用
5. 将资源复制到 `public/posts/{slug}` 或 `public/tools/{slug}`
6. 将相对路径改写为网站路径
7. 将最终内容写入 `content/posts/{locale}/{slug}.mdx` 或 `content/tools/{locale}/{slug}.mdx`
8. 对首页 / 列表 / 详情页执行 `revalidatePath`

更多细节见：

- [content-sync.md](/D:/idea-workspace/portal/doc/content-sync.md)
- [content-ingest-sample.md](/D:/idea-workspace/portal/doc/content-ingest-sample.md)

## 环境变量

```env
CONTENT_SYNC_SECRET=your-shared-secret
GITHUB_CONTENT_TOKEN=github-fine-grained-token
GITEE_CONTENT_TOKEN=gitee-token
CONTENT_SYNC_ALLOWED_PREFIXES=posts,tools
```

说明：

- `CONTENT_SYNC_SECRET`: webhook 验签密钥
- `GITHUB_CONTENT_TOKEN`: 让 portal 读取 GitHub 仓库内容
- `GITEE_CONTENT_TOKEN`: 让 portal 读取 Gitee 仓库内容
- `CONTENT_SYNC_ALLOWED_PREFIXES`: 白名单前缀

GitHub fine-grained token 最少需要：

- Repository access: 目标写作仓库
- Repository permissions: `Contents: Read-only`

## 手工调试 ingest

最小 dry-run 请求：

```json
{
  "provider": "manual",
  "dryRun": true,
  "files": [
    {
      "path": "posts/zh/why-build-think-ship/why-build-think-ship.md",
      "content": "---\ntitle: Why Build Think Ship\nslug: why-build-think-ship\ntype: post\nlocale: zh\nstatus: published\ndate: 2026-04-21\nupdated: 2026-04-21\ncover: ./cover.png\nsummary: demo\n---\n\n![示意图](./images/fig-1.png)\n"
    }
  ]
}
```

如果要在 manual 模式下连资源一起测，可以额外传：

```json
{
  "attachments": [
    {
      "path": "posts/zh/why-build-think-ship/cover.png",
      "contentBase64": "..."
    }
  ]
}
```
