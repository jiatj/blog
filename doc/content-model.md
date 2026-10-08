# Content Model Decision

这是当前 V1 的正式内容建模决定，供后续写作和扩展使用。

造物使用独立模型：作品包含路线图、造物日志、路线图变更和直播预告；日志包含产出文件与可选视频。默认目录为 `content/build/{zh|en}/{作品ID}/artifact.json`，可用 `BUILD_CONTENT_DIR` 指向持久目录。作品和日志通过 `publishState` 控制公开，日志关联稳定步骤 ID；产出文件位于作品 `outputs/` 目录。此模型不复用 post/tool frontmatter，也不接入其 ingest API。字段、校验、示例及手工发布见 [造物规范](./build.md)。

课程使用独立模型：每门课程一个 `course.json`，正文位于 `lessons/`，附件位于 `assets/`。发布后存入 `COURSE_CONTENT_DIR` 的版本目录，由当前版本指针读取，不复用 post/tool 的 frontmatter 或导入规则。具体格式、编写与手工发布步骤见 [课程规范](./courses.md)。

## 1. 目录结构

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
```

这样设计的原因：

- 与 locale 路由直接对齐
- 便于从 Obsidian 手动同步
- 结构足够简单，后续 AI 修改成本低

## 2. Frontmatter 规则

### Post

必填：

- `title`
- `slug`
- `date`
- `summary`

选填：

- `tags`
- `locale`
- `draft`
- `cover`
- `seoTitle`
- `seoDescription`
- `updated`（真实修改日期，用于结构化数据和 sitemap）

### Tool

必填：

- `title`
- `slug`
- `summary`

选填：

- `locale`
- `draft`
- `toolStatus`
- `toolUrl`
- `repoUrl`
- `cover`
- `seoTitle`
- `seoDescription`
- `updated`（真实修改日期，用于 sitemap）

SEO 约定：`seoTitle` / `seoDescription` 只覆盖搜索和分享展示，不改正文标题与摘要；未填时自动回退。`cover` 用作分享图，无封面时使用站点 `/og`。同 slug 的已发布中英文内容互相声明 hreflang，草稿不声明、不进入 sitemap。文章详情按共同标签推荐最多三篇已发布文章；不要为了内链随意添加不相关标签。

## 3. 决策说明

### 为什么首页/About 不走 Markdown

V1 阶段首页和 About 是站点结构的一部分，而不是内容系统的一部分。
把它们先放在代码配置里，更稳定，也更容易统一中英文和 SEO。

### 为什么 `toolStatus` 不做强枚举

当前它只承担轻量展示作用，不值得引入严格状态机。
默认允许自由文本，但代码里会在缺省时回退为 `Live`。

### 为什么不强推封面图

V1 的重点是发布链路和可读性，不是视觉资产管理。
因此 `cover`、OG 图和复杂 MDX 组件都先保持可选。
