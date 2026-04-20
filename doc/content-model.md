# Content Model Decision

这是当前 V1 的正式内容建模决定，供后续写作和扩展使用。

## 1. 目录结构

```text
content/
  posts/
    zh/
    en/
  tools/
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
