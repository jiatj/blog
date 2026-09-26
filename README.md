# Portal

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
- 不再把 `build + restart` 作为正式发布机制

课程模块的完整写作、目录与手工发布规范见 [课程编写与发布](doc/courses.md)。课程没有管理后台，使用文件与 CLI 维护。

## Development Guide

- 使用 Node.js 24+（课程 CLI 直接运行 TypeScript），在项目根目录执行 `npm ci`。
- 启动：`npm run dev`；默认访问 `http://localhost:3000`。
- 类型检查：`npx tsc --noEmit`；课程测试：`npm run test:courses`；构建：`npm run build`。
- 生产模式验收：先 `npm run start -- --port 3100`，另一个终端运行 `npm run test:courses:http -- http://localhost:3100`。仅针对本机测试服务；会创建并清理独立临时测试课程。
- 当前 `npm run lint` 沿用旧的 `next lint` 配置，不作为本次验证命令；修复 lint 配置为 TODO。
- 体验课程示例：`npm run course:check -- ./examples/courses/starter`，再执行 `npm run course:publish -- ./examples/courses/starter`，访问 `/zh/courses`。
- `.course-data/` 为本地发布数据；原始示例位于 `examples/courses/`。正式 FDE 材料需整理后单独上传。

## Release Guide

1. 首次部署课程功能：`npm ci` → `npm run test:courses` → `npx tsc --noEmit` → `npm run build` → `npm run start`。
2. 为网站服务与发布命令配置相同的 `COURSE_CONTENT_DIR` 绝对路径，使用持久化可写磁盘；不要把数据放在会随部署替换的代码目录中。
3. 将完整课程文件夹手工上传到独立待发布目录；在项目根执行 `npm run course:check -- <课程目录>`，通过后执行 `npm run course:publish -- <课程目录>`。课程更新无需重启。
4. 验证课程目录、讲义、手机布局、明暗主题、图片下载及 `/sitemap.xml`；检查服务重启后课程仍可访问。
5. 内容回退：`npm run course:rollback -- <课程slug>`；备份整个课程数据目录。代码发布的服务管理、反向代理和代码回滚命令：TODO，仓库尚未提供部署配置。

CLI 不自动读取 `.env` 文件，生产环境变量需在运行命令的 shell 中设置。博客与项目仍沿用下文的 ingest 链路。

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
public/
  posts/
  tools/
```

- `content/` 放 portal 可直接消费的最终 `.mdx` 文件
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
