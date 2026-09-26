# 课程编写与发布

课程通过文件维护，没有管理后台。流程：**整理学生版 → 检查 → 上传到服务器待发布目录 → 发布**。

## 1. 从模板开始

复制仓库的 `examples/courses/starter/`，修改 `course.json` 并替换正文。这是独立示例，不是正式 FDE 讲义，不会随构建自动发布。

```text
fde/
  course.json
  lessons/
    Module01.导读.md
    BK02.开发环境.md
    Unit06.Git.md
  assets/
    环境检查.png
    练习材料.zip
```

- 每门课程一个目录；可直接上传目录，不要求 ZIP。
- 所有内容页登记在 `course.json`，未登记文件不会自动发布。
- 图片和附件放在 `assets/`，可建子目录；不要放教师资料、密钥等非公开内容。
- 源文件可以使用中文名，网站网址由 `slug` 决定。发布后保持 slug 不变，改标题和目录顺序不会影响网址。

## 2. 目录配置

完整可用示例见 `examples/courses/starter/course.json`。只维护一份配置，不在 Markdown 中重复写 frontmatter。

| 字段 | 写法 |
| --- | --- |
| `version` / `locale` | 固定为 `1` / `"zh"` |
| `slug` | 如 `fde`；小写字母、数字、单连字符，最长 80 字符 |
| `title` / `summary` | 课程名称、一段简短介绍 |
| `status` | `published` 对外展示；`draft` 整课不展示 |
| `state` | `updating` 持续更新；`complete` 内容已齐，与学生进度无关 |
| `order` | 数字，越小越靠前 |
| `start` | 起始导读或讲义的 slug，公开课程必须指向已发布页 |
| `groups` | 模块数组：`id`、`title`、可选 `guide`、有序 `lessons` slug 数组 |
| `pages` | 所有内容页的数组，知识点也放在这里 |
| 可选课程字段 | `audience`、`preparation`、`outcomes` 字符串数组、`cover`（如 `assets/封面.png`） |

一个内容页的配置：

```json
{
  "slug": "bk02",
  "title": "开发环境",
  "kind": "lesson",
  "source": "lessons/BK02.开发环境.md",
  "status": "published",
  "updated": "2026-09-14",
  "label": "BK02",
  "summary": "准备并检查本次课程的开发环境。",
  "objectives": ["完成环境检查"],
  "related": ["unit-06"]
}
```

`kind` 有 `guide`（导读）、`lesson`（讲义）、`reference`（知识点）。`label`、`summary`、`objectives`、`related` 可省略；`related` 只能引用本课程知识点。导读和讲义必须各进入一次分组，知识点独立展示，不混入上下节顺序。只有一个模块时也保留一个分组即可。

草稿页仍须有有效源文件，但不会发布正文和附件；公开页不能链接或关联草稿。

## 3. Markdown 怎么写

页面标题由配置显示，正文从 `##` 开始。推荐结构：**准备 → 操作 → 检查结果 → 常见问题 → 本次交付**，按实际需要取舍。

````markdown
## 准备

准备一台电脑。

## 操作

```bash
node --version
```

![环境检查](../assets/环境检查.png)

[查看 Git 知识点](./Unit06.Git.md)
[跳到操作说明](./Unit06.Git.md#操作说明)
[下载练习](../assets/练习材料.zip)

## 检查结果

- [ ] 记录实际输出。
````

- 支持标准 Markdown、GFM 表格和任务清单；支持引用式链接。
- 内部链接必须是相对 `.md` 路径，会自动转换为网站网址；不能链接未登记、未发布的文档。
- 中文锚点保留中文；英文转小写，空格变 `-`，标点移除；重复标题依次加 `-1`、`-2`。以检查命令输出的锚点为准。
- 图片只使用本地 PNG/JPG/JPEG/WebP/GIF/AVIF。附件支持这些图片，以及 PDF/ZIP/TXT/CSV/JSON；单文件最多 50MB，总附件最多 200MB。PDF 等以下载方式提供。
- 不支持 MDX/JSX、HTML、Obsidian `[[双链]]`、嵌入文档、外部图片、符号链接；正文中的 `{}` 是普通文字，不执行代码。
- 先将幻灯片整理成学生阅读版：移除 frontmatter 和分页符，把必要解释移到正文，教师 `note:` 备注不可直接发布。普通 `---` 在网站上是分隔线，不会自动识别为分页。

## 4. 本地检查与预览

要求 **Node.js 24+**，在 portal 项目根目录执行：

```bash
npm ci
npm run course:check -- ./examples/courses/starter
npm run course:publish -- ./examples/courses/starter
npm run dev
```

打开 `http://localhost:3000/zh/courses`。`check` 只检查，不修改发布状态；输出每页网址与可用锚点，遇到错误会以非零状态退出。

默认发布到项目根的 `.course-data/`，该目录不进入 Git。发布示例仅用于本机体验；正式服务器上传你整理好的课程。

## 5. 上传与发布

首次上线需要先部署含课程功能的新代码并构建一次。此后更新课程无需重新构建或重启。

1. 在本地运行 `course:check`，修正报错。
2. 用现有 SFTP/SCP/服务器面板将**完整课程目录**上传到独立待发布位置，如 `/srv/portal-incoming/fde`，上传结束后再运行命令。不要直接覆盖 `.course-data` 或 `releases`。
3. 在服务器的 portal 项目根目录执行：

```bash
export COURSE_CONTENT_DIR=/srv/portal-course-data
npm run course:check -- /srv/portal-incoming/fde
npm run course:publish -- /srv/portal-incoming/fde
```

PowerShell 设置同一变量的写法：`$env:COURSE_CONTENT_DIR = 'D:\portal-data\courses'`。

**网站进程和发布命令必须使用同一个 `COURSE_CONTENT_DIR` 绝对路径。** CLI 读取进程环境变量，不自动加载 `.env`/`.env.local`。生产服务的环境变量配置位置取决于部署方式，当前项目尚未提供，需按服务器实际配置。

4. 刷新浏览器，检查课程首页、正文、图片、下载和 `/sitemap.xml`。已打开页面不会主动热更新，刷新后读取新版本。

发布会完整校验，再写新版本，最后切换指针。任何切换前错误都不影响旧版本。课程与站点地图使用动态读取，无需 webhook 或额外缓存刷新接口。

## 6. 更新、下架与恢复

- 更新：保持课程 slug，上传完整新目录后再次执行 publish。
- 下架单页：把其 status 改成 draft，并移除指向它的公开链接/关联；必要时调整 start。不会删除服务器旧版本。
- 下架整课：把课程 status 改成 draft 后发布。
- 回退上一版本：`npm run course:rollback -- fde`。再次执行会切回刚才的版本，操作前核对命令输出。
- 旧版本保留，供回退和旧页面的资源链接使用。已公开的附件不能视为秘密；下架不等于收回别人已经下载的副本。
- 异常退出留下 `.publish.lock` 时，先确认该课程没有发布进程，再手工移除该文件后重试。不要在发布运行中删锁。
- 定期备份整个 `COURSE_CONTENT_DIR`；当前不自动清理旧版本，需关注磁盘容量。

部署边界：V1 面向单个 Node 服务与持久化磁盘。不支持临时/只读文件系统；多实例或容器重建后的持久化需单独验证。首次上线必须检查重启后课程仍存在，以及新上传附件可以访问。
