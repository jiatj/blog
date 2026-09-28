# Daily Reading Discovery Implementation Plan

**Goal:** 每天收集上海时区前一日发布的关注来源文章，将标题、原始摘要、方向、来源和链接写入发现页 SQLite。

**Architecture:** 继续使用现有文件配置、Node CLI 和本地 SQLite。采集层只支持 RSS、Atom 与 JSON Feed；来源级方向替代关键词过滤，没有可靠 Feed 的来源不进入配置。系统调度器只调用 CLI，不进入 Next.js 请求链路。

**Tech Stack:** Node.js 24、TypeScript、`node:sqlite`、Next.js 16。

---

1. 扩展来源配置和 SQLite 字段，兼容旧 `sites.md` 与旧数据库。
2. 提取 Feed 摘要、方向并只保存目标日期文章。
3. 让发现页默认展示最近一次不晚于昨日的归档。
4. 增加 Windows 每日任务安装脚本和运行文档。
5. 用阅读模块测试、TypeScript 检查和生产构建验证。

