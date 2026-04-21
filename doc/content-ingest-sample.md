# Content Ingest Sample

## 最小 post 样例

写作侧：

```text
posts/zh/why-build-think-ship/
  why-build-think-ship.md
  cover.png
  images/
    fig-1.png
```

源 Markdown：

```md
---
title: Why Build Think Ship
slug: why-build-think-ship
type: post
locale: zh
status: published
date: 2026-04-21
updated: 2026-04-21
cover: ./cover.png
summary: 一篇关于构建、判断与交付的文章。
---

![示意图](./images/fig-1.png)
```

## 预期 portal 输出

内容文件：

```text
content/posts/zh/why-build-think-ship.mdx
```

静态资源：

```text
public/posts/why-build-think-ship/cover.png
public/posts/why-build-think-ship/images/fig-1.png
```

正文改写结果：

```md
![示意图](/posts/why-build-think-ship/images/fig-1.png)
```

frontmatter 改写结果：

```yaml
cover: /posts/why-build-think-ship/cover.png
```

## 错误场景

### 1. 缺少 frontmatter 字段

例如缺少 `updated`：

```text
Frontmatter "updated" is required in posts/zh/why-build-think-ship/why-build-think-ship.md
```

### 2. cover 不存在

```text
Asset "cover.png" could not be loaded for posts/zh/why-build-think-ship/why-build-think-ship.md: ...
```

### 3. 正文图片不存在

```text
Asset "images/fig-1.png" could not be loaded for posts/zh/why-build-think-ship/why-build-think-ship.md: ...
```

### 4. type 非法

```text
Frontmatter "type" must be "post" or "tool" in posts/zh/why-build-think-ship/why-build-think-ship.md
```

### 5. locale 非法

```text
Unsupported locale "jp" in posts/jp/why-build-think-ship/why-build-think-ship.md
```

### 6. slug 与目录或文件名不一致

目录不一致：

```text
Frontmatter "slug" must match parent directory "why-build-think-ship" in ...
```

文件名不一致：

```text
Source file name "article" must match slug "why-build-think-ship" in ...
```
