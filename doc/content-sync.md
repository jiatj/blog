# Content Ingest

## 目标

`portal` 的正式发布链路是：

`ingest 导入 + 资源同步 + 路径改写 + on-demand revalidate`

不是：

`webhook 写文件 + build + restart`

## ingest 输入

逻辑上，ingest 需要拿到：

- `type`: `post` | `tool`
- `locale`
- `slug`
- 原始 Markdown
- 当前内容目录中的附件文件

在当前实现里：

- GitHub / Gitee webhook 先把 push 事件发给 `/api/content/sync`
- portal 再按变更路径主动回源读取 Markdown 与附件
- manual 模式可直接提交 Markdown 和附件

## 写作侧结构

```text
posts/
  zh/
    why-build-think-ship/
      why-build-think-ship.md
      cover.png
      images/
        fig-1.png
```

要求：

- 每篇内容一个目录
- 文件名必须等于 `slug`
- 图片与正文在同一个内容单元内
- Markdown 使用相对路径

## 最终输出

### post

```text
content/posts/zh/why-build-think-ship.mdx
public/posts/why-build-think-ship/cover.png
public/posts/why-build-think-ship/images/fig-1.png
```

### tool

```text
content/tools/zh/prompt-workbench.mdx
public/tools/prompt-workbench/cover.png
```

## 模块划分

### 1. frontmatter 校验

文件：

- [frontmatter.ts](/D:/idea-workspace/portal/lib/content-ingest/frontmatter.ts)

职责：

- 解析 frontmatter
- 校验必填字段
- 校验路径结构与 `slug`
- 计算 portal 目标路径

### 2. 资源发现

文件：

- [assets.ts](/D:/idea-workspace/portal/lib/content-ingest/assets.ts)

v1 只处理：

- `cover`
- Markdown 图片 `![alt](...)`
- HTML `<img src="...">`

只接受本地相对路径，例如：

- `./cover.png`
- `./images/fig-1.png`

不处理：

- `http://...`
- `https://...`
- `/posts/...`
- `data:...`
- 自定义 JSX / MDX 组件里的 `src`

### 3. 资源复制

文件：

- [assets.ts](/D:/idea-workspace/portal/lib/content-ingest/assets.ts)

规则：

- `post` 复制到 `public/posts/{slug}/...`
- `tool` 复制到 `public/tools/{slug}/...`
- 保留原内容单元中的子目录结构
- 每次 upsert 前先清空当前内容单元的目标资源目录，避免陈旧资源残留

### 4. 路径改写

文件：

- [rewrite.ts](/D:/idea-workspace/portal/lib/content-ingest/rewrite.ts)

规则：

- `./cover.png` -> `/posts/{slug}/cover.png`
- `./images/fig-1.png` -> `/posts/{slug}/images/fig-1.png`
- `tool` 同理改成 `/tools/{slug}/...`

frontmatter `cover` 与正文图片都会在 ingest 时改写。  
页面层不再做相对路径转换。

### 5. 内容落盘

文件：

- [persist.ts](/D:/idea-workspace/portal/lib/content-ingest/persist.ts)

规则：

- `post` -> `content/posts/{locale}/{slug}.mdx`
- `tool` -> `content/tools/{locale}/{slug}.mdx`
- manifest 同步维护：
  - 内容文件路径
  - 资源目录路径
  - 类型 / 语言 / slug

### 6. 发布失效

文件：

- [revalidate.ts](/D:/idea-workspace/portal/lib/content-ingest/revalidate.ts)

ingest 成功后会主动失效：

- `/zh`
- `/en`
- `/zh/blog`
- `/en/blog`
- `/zh/tools`
- `/en/tools`
- 以及当前内容对应的详情页

## 页面层说明

以下页面保持读取 portal 最终内容文件：

- 首页文章区
- blog 列表页
- blog 详情页
- tools 列表页
- tools 详情页

它们现在带有 `revalidate = 3600`，并依赖 ingest 后的 `revalidatePath` 生效。  
这意味着：

- 不需要把相对路径转换逻辑塞进页面层
- 不再要求每次发文都 `build + restart`

## 错误处理

这些场景会返回明确错误，不静默吞掉：

1. frontmatter 缺少必填字段
2. `cover` 不是本地相对路径
3. `cover` 指向的文件不存在
4. 正文图片指向的文件不存在
5. `type` 非法
6. `locale` 非法
7. `slug` 与目录或文件名不一致
8. provider token 无法读取源仓库内容

manifest 删除逻辑不会误删其他内容：  
只有 manifest 中有记录的 source path，才会执行 portal 侧删除。
