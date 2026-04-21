# Portal

`portal` 是一个基于 `Next.js 16 + App Router` 的个人站点。

当前内容发布链路已经从“webhook 写文件 + 依赖整站重构”调整为：

`ingest 导入 + 资源同步 + 路径改写 + on-demand revalidate`

这意味着：

- 写作侧继续保持自包含内容单元
- 图片继续使用标准 Markdown 相对路径
- `portal` 在 ingest 时完成资源复制和路径改写
- 发布成功后，首页 / 列表 / 详情页会按路径失效缓存
- 不再把 `build + restart` 作为正式发布机制

## Run

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

`content/` 放 portal 可直接消费的最终 `.mdx` 文件。  
`public/` 放 ingest 复制过来的静态资源。

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
