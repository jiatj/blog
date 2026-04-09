# Portal

基于 `Next.js 16 + App Router` 的个人站点。

当前定位不是 SaaS 官网，而是一个以方法论、项目与文章为核心的个人入口：

- 首页先呈现 `Build. Think. Ship.`
- 然后展示当前重点项目
- 再展示最新文章
- 最后以轻量页脚收尾

内容全部来自本地 `MDX`，适合长期维护和静态部署。

## todo
1. 部署到正式系统后测试同步
2. 项目和有些页面没有完成。

## Tech Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `next-mdx-remote`
- `gray-matter`

## Run

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

本地启动生产环境：

```bash
npm run start
```

## Content Model

内容目录：

```text
content/
  posts/
    zh/
    en/
  tools/
    zh/
    en/
```

语言路由：

```text
/{locale}/...
```

目前支持：

- `zh`
- `en`

## Frontmatter

### Post

文章 frontmatter：

```md
---
title: Building Calm AI Sites
slug: building-calm-ai-sites
date: 2026-03-21
summary: 关于构建、节奏与长期交付的一篇文章。
tags:
  - AI
  - Writing
locale: zh
draft: false
seoTitle: Building Calm AI Sites
seoDescription: 关于构建、节奏与长期交付的一篇文章。
---
```

字段说明：

- `title`: 必填，文章标题
- `slug`: 必填，路由 slug
- `date`: 必填，发布日期
- `summary`: 必填，列表摘要
- `tags`: 可选，标签数组
- `locale`: 可选，默认取目录语言
- `draft`: 可选，`true` 时不会被展示
- `seoTitle`: 可选
- `seoDescription`: 可选

### Tool

项目 frontmatter：

```md
---
title: Prompt Workbench
slug: prompt-workbench
summary: 一个用于整理提示词、实验版本和调用片段的轻量工作台。
locale: zh
draft: false
toolStatus: Beta
logo: PW
homeActionLabel: 查看项目
homeFeatured: true
homeOrder: 1
toolUrl: https://example.com/prompt-workbench
repoUrl: https://github.com/example/prompt-workbench
seoTitle: Prompt Workbench
seoDescription: 一个用于提示词实验、版本记录和快速调用的轻量工具说明页。
---
```

字段说明：

- `title`: 必填，项目名称
- `slug`: 必填，路由 slug
- `summary`: 必填，卡片和列表摘要
- `locale`: 可选，默认取目录语言
- `draft`: 可选，`true` 时不会被展示
- `toolStatus`: 可选，默认值为 `Live`
- `toolUrl`: 可选，项目外链；没有时不会显示右下角入口
- `repoUrl`: 可选，源码地址
- `logo`: 可选，项目卡 logo 区域显示的短文本或标识
- `homeActionLabel`: 可选，首页/项目卡主动作文案，例如 `查看项目`、`试试`
- `homeFeatured`: 可选，是否优先作为首页重点项目
- `homeOrder`: 可选，首页项目排序，数值越小越靠前
- `seoTitle`: 可选
- `seoDescription`: 可选

## Display Rules

### Home

首页信息顺序：

1. Hero 方法论
2. 当前重点项目
3. 最新文章
4. 轻量页脚

首页项目区规则：

- 最多显示 3 个项目
- 优先按 `homeFeatured` 和 `homeOrder` 排序
- 优先表现为 `1 个主卡 + 2 个次卡`
- 项目名称来自 frontmatter 的 `title`
- logo 位置统一，内容来自 `logo`
- 项目外链只有在 `toolUrl` 存在时才显示

### Tools Page

项目页规则：

- 使用卡片式布局
- 桌面端每行 3 列
- 卡片样式与首页项目卡保持一致
- 项目名称、摘要、动作入口都由 frontmatter 驱动
- 外链只有在 `toolUrl` 存在时才显示

## Sorting

文章排序：

- 按 `date` 倒序

项目排序：

1. `homeFeatured: true` 的项目优先
2. 再按 `homeOrder` 升序
3. 未设置 `homeOrder` 的项目默认排在后面

## Validation Rules

内容读取层会做这些校验：

- `title`、`slug`、`summary` 必须存在
- 文章必须有 `date`
- `tags` 必须是字符串数组
- 同一语言目录内 `slug` 不能重复

相关实现见：

- [lib/content.ts](D:/idea-workspace/portal/lib/content.ts)

## Content Sync Rules

如果文档不是直接放到 `content/` 目录，而是先提交到 GitHub 或 Gitee，再由 `portal` 自动同步，那么需要额外遵守下面的规范。

### 适用范围

只有本次 push 中新增或修改的 `.md` / `.mdx` 文件会进入同步流程。
删除的 `.md` / `.mdx` 文件也会进入删除同步流程。

以下文件不会进入站点内容目录：

- 不是 `.md` 或 `.mdx`
- frontmatter 没有 `syncToPortal: true`
- `draft: true`
- frontmatter 缺少必填字段
- 路径不在 `CONTENT_SYNC_ALLOWED_PREFIXES` 白名单内

### 同步 Frontmatter

同步文档除了原有内容字段外，还需要声明是否同步、同步到哪一类内容：

文章示例：

```md
---
title: AI 网站内容同步
slug: ai-site-sync
summary: 用 webhook 把 Markdown 自动同步到 portal
locale: zh
contentType: post
syncToPortal: true
date: 2026-03-27
---
```

项目示例：

```md
---
title: Prompt Workbench
slug: prompt-workbench
summary: 提示词工作台
locale: zh
contentType: tool
syncToPortal: true
---
```

字段要求：

- `syncToPortal`: 必填，且必须为 `true`
- `contentType`: 必填，取值只能是 `post` 或 `tool`
- `title`: 必填
- `slug`: 必填；如果未写，会退回文件名，但建议始终显式填写
- `summary`: 必填
- `locale`: 选填，当前支持 `zh` / `en`，未填默认 `zh`
- `date`: `post` 必填
- `draft`: 选填，为 `true` 时跳过同步

### 目标目录

- `contentType: post` -> `content/posts/{locale}/{slug}.md|mdx`
- `contentType: tool` -> `content/tools/{locale}/{slug}.md|mdx`

扩展名会沿用源文件本身的 `.md` 或 `.mdx`。

### 删除同步

当源仓库里的同步文档被删除时，`portal` 会根据 `content/.sync-manifest.json` 中记录的映射关系删除对应目标文件。

这意味着：

- 已同步过的文档，后续删除时会自动删除站点侧文件
- 如果 `slug` 或 `contentType` 变了，旧目标文件也会被自动清理
- 如果源文件从未成功同步过，删除事件会返回 `not_found`，不会误删其他内容

### 白名单目录

可以通过环境变量限制只有特定目录下的文档允许进入同步流程：

```env
CONTENT_SYNC_ALLOWED_PREFIXES=docs/posts,docs/tools,notes/publish
```

规则说明：

- 为空时，默认不限制目录
- 配了之后，只有位于这些目录下的 `.md/.mdx` 才会处理
- 不在白名单内的文件会被标记为 `skipped`

### 接口与部署说明

同步入口：

- [route.ts](D:/idea-workspace/portal/app/api/content/sync/route.ts)

分流与落盘逻辑：

- [content-sync.ts](D:/idea-workspace/portal/lib/content-sync.ts)

完整方案说明：

- [content-sync.md](D:/idea-workspace/portal/doc/content-sync.md)

### GitHub Webhook 配置示例

在 GitHub 仓库中进入：

```text
Settings -> Webhooks -> Add webhook
```

建议配置：

- Payload URL: `https://your-domain.com/api/content/sync`
- Content type: `application/json`
- Secret: 与 `CONTENT_SYNC_SECRET` 保持一致
- Which events would you like to trigger this webhook: `Just the push event`
- Active: 勾选

服务端环境变量示例：

```env
CONTENT_SYNC_SECRET=your-shared-secret
GITHUB_CONTENT_TOKEN=github-personal-access-token
CONTENT_SYNC_ALLOWED_PREFIXES=docs/posts,docs/tools
```

`GITHUB_CONTENT_TOKEN` 需要至少具备读取目标仓库内容的权限。

### Gitee Webhook 配置示例

在 Gitee 仓库中进入：

```text
管理 -> WebHooks -> 添加
```

建议配置：

- URL: `https://your-domain.com/api/content/sync`
- 密钥: 与 `CONTENT_SYNC_SECRET` 保持一致
- 触发事件: `Push`
- 内容类型: `json`
- 启用 WebHook: 打开

服务端环境变量示例：

```env
CONTENT_SYNC_SECRET=your-shared-secret
GITEE_CONTENT_TOKEN=gitee-personal-access-token
CONTENT_SYNC_ALLOWED_PREFIXES=docs/posts,docs/tools
```

### 本地测试脚本

本地先启动项目：

```bash
npm run dev
```

再执行手工同步测试：

```bash
npm run test:content-sync
```

常用参数示例：

```bash
npm run test:content-sync -- --dry-run
npm run test:content-sync -- --path docs/posts/demo.md --slug demo
npm run test:content-sync -- --delete --path docs/posts/demo.md
```

如果接口启用了密钥校验，可以先设置：

```bash
$env:CONTENT_SYNC_SECRET="your-shared-secret"
```

## Project Structure

```text
app/                App Router 页面
components/         页面与卡片组件
content/            本地 MDX 内容
lib/                内容读取、metadata、i18n、站点配置
public/             静态资源
doc/                设计和需求文档
```

## Deployment

可直接部署到支持 Next.js 的平台，例如 Vercel。

常用配置：

- Install Command: `npm install`
- Build Command: `npm run build`
- Start Command: `npm run start`

## Notes

- 这是一个内容驱动站点，不依赖数据库
- 新增项目或文章时，优先先补完整 frontmatter
- 如果首页展示顺序不对，先检查 `homeFeatured` 和 `homeOrder`
