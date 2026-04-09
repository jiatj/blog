# Markdown 同步方案

## 目标

当你把 Markdown/MDX 文档提交到 GitHub 或 Gitee 时，`portal` 通过 webhook 接收推送事件，只同步符合条件的文档，并根据 frontmatter 自动写入站点内容目录：

- 文章：`content/posts/{locale}/`
- 项目：`content/tools/{locale}/`

这样可以做到：

- 不是所有 md 文件都上传
- 文档写在哪个源仓库目录都可以
- 最终仍然复用 `portal` 现有的内容读取逻辑

## 推荐链路

1. 在 GitHub 或 Gitee 配置 webhook，指向：

```text
POST /api/content/sync
```

2. 每次 push 后，`portal` 接收 webhook。
3. `portal` 只处理本次提交里新增、修改、删除的 `.md/.mdx` 文件。
4. `portal` 通过仓库 API 拉取这些文件的最新内容。
5. 解析 frontmatter。
6. 满足条件才落盘到 `content/`。

## Frontmatter 约定

只有同时满足以下条件的文件才会同步：

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

项目类型示例：

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

字段说明：

- `syncToPortal: true`：不是 `true` 就跳过
- `contentType: post | tool`：决定写入 `posts` 还是 `tools`
- `locale: zh | en`：决定语言目录
- `slug`：决定目标文件名
- `date`：`post` 必填
- `draft: true`：即使提交了，也会跳过

## 白名单目录限制

可以通过环境变量限制允许同步的源目录：

```env
CONTENT_SYNC_ALLOWED_PREFIXES=docs/posts,docs/tools,notes/publish
```

规则：

- 不配置时，不限制目录
- 配置后，只有前缀命中的路径才会参与同步或删除
- 不在白名单中的文件会返回 `skipped`

推荐把仓库里“允许发布”的文档集中在少数目录下，再通过这个变量做约束。

## 已实现接口

接口文件：

- [route.ts](D:/idea-workspace/portal/app/api/content/sync/route.ts)
- [content-sync.ts](D:/idea-workspace/portal/lib/content-sync.ts)

支持三种调用方式：

### 1. GitHub webhook

- 识别 `x-github-event`
- 从 push payload 提取变更文件
- 用 `GITHUB_CONTENT_TOKEN` 调 GitHub Contents API 拉取文件内容

### 2. Gitee webhook

- 识别 `x-gitee-event`
- 从 push payload 提取变更文件
- 用 `GITEE_CONTENT_TOKEN` 调 Gitee Contents API 拉取文件内容

### 3. 手工调用

可以直接 POST：

```json
{
  "provider": "manual",
  "files": [
    {
      "path": "docs/my-post.md",
      "content": "---\ntitle: Demo\nslug: demo\nsummary: demo\nlocale: zh\ncontentType: post\nsyncToPortal: true\ndate: 2026-03-27\n---\nHello"
    }
  ],
  "deletedPaths": []
}
```

删除测试示例：

```json
{
  "provider": "manual",
  "deletedPaths": ["docs/my-post.md"]
}
```

## 环境变量

建议配置：

```env
CONTENT_SYNC_SECRET=your-shared-secret
GITHUB_CONTENT_TOKEN=github-personal-access-token
GITEE_CONTENT_TOKEN=gitee-personal-access-token
CONTENT_SYNC_ALLOWED_PREFIXES=docs/posts,docs/tools
```

说明：

- `CONTENT_SYNC_SECRET`：
  - 手工调用时走 `x-portal-secret`
  - GitHub 可走 `x-hub-signature-256`
  - Gitee 可走 `x-gitee-token`
- `GITHUB_CONTENT_TOKEN`：用于读取 GitHub 仓库文件内容
- `GITEE_CONTENT_TOKEN`：用于读取 Gitee 仓库文件内容
- `CONTENT_SYNC_ALLOWED_PREFIXES`：允许进入同步流程的源目录前缀，逗号分隔

## 目标路径规则

- `contentType: post` -> `content/posts/{locale}/{slug}.md|mdx`
- `contentType: tool` -> `content/tools/{locale}/{slug}.md|mdx`

扩展名沿用源文件扩展名。

## 删除同步规则

系统会维护一个本地 manifest：

```text
content/.sync-manifest.json
```

作用：

- 记录 `源文件路径 -> 目标文件路径`
- 处理删除同步
- 处理 `slug`、`locale`、`contentType` 变化时的旧文件清理

删除逻辑：

1. webhook 收到删除事件
2. 根据源文件路径查 manifest
3. 找到映射后删除目标文件
4. 同时清理 manifest 记录

如果 manifest 中不存在对应记录，则返回 `not_found`，不会误删其他文件。

## GitHub webhook 配置示例

仓库路径：

```text
Settings -> Webhooks -> Add webhook
```

建议填写：

- Payload URL: `https://your-domain.com/api/content/sync`
- Content type: `application/json`
- Secret: 与 `CONTENT_SYNC_SECRET` 保持一致
- Events: `Just the push event`
- Active: 开启

说明：

- webhook 用来通知 `portal`
- 文件正文由 `portal` 再通过 GitHub Contents API 拉取
- 所以服务端必须配置 `GITHUB_CONTENT_TOKEN`

## Gitee webhook 配置示例

仓库路径：

```text
管理 -> WebHooks -> 添加
```

建议填写：

- URL: `https://your-domain.com/api/content/sync`
- 密钥: 与 `CONTENT_SYNC_SECRET` 保持一致
- 触发事件: `Push`
- 内容格式: `json`
- 状态: 启用

说明：

- webhook 负责推送变更通知
- 文件正文由 `portal` 再通过 Gitee Contents API 拉取
- 所以服务端必须配置 `GITEE_CONTENT_TOKEN`

## 本地测试脚本

已添加脚本：

```bash
npm run test:content-sync
```

默认行为：

- 向 `http://localhost:3000/api/content/sync` 发起手工同步请求
- 提交一篇演示用 `post`

常见用法：

```bash
npm run dev
npm run test:content-sync
npm run test:content-sync -- --dry-run
npm run test:content-sync -- --path docs/posts/demo.md --slug demo
npm run test:content-sync -- --delete --path docs/posts/demo.md
```

如启用了密钥：

```bash
$env:CONTENT_SYNC_SECRET="your-shared-secret"
```

## 注意事项

### 1. 持久化部署

当前实现会直接写本地文件系统，所以更适合：

- 自建 Node 服务
- 云主机 / Docker / PM2

如果部署在 Vercel 这类无持久化文件系统环境，这种“写本地目录”的方式不能长期保存，建议改成：

- 写对象存储
- 写数据库
- 或反向提交到内容仓库

### 2. manifest 是运行时状态

`content/.sync-manifest.json` 是运行时生成的映射文件，用于删除和迁移清理。
建议不要手工编辑它。

如果你需要，也可以下一步补：

- 审核状态字段
- 同步审计日志
- 更严格的仓库白名单
- 后台手工重试入口

## 推荐落地方式

推荐优先级：

1. `portal` 实现 webhook 接口和分流逻辑
2. GitHub/Gitee 只负责 push 通知
3. frontmatter 控制是否同步、同步到哪里

这是对你当前项目改动最小、维护成本最低的方案。
