# 造物内容维护

造物记录作品如何从想法成为真实产物。`Artifact` 是作品，`Roadmap` 是路线图，`Build Log` 是造物日志，`Outputs` 是产出文件。视频和直播回放是日志附件。

## V1 内容与规则

- 路由：`/{zh|en}/build` → `/build/{作品ID}` → `/build/{作品ID}/logs/{日志ID}`。
- 默认内容根目录是 `content/build/`；`BUILD_CONTENT_DIR` 可指向独立持久目录，目录下必须直接包含 `zh/`、`en/`。
- 每个语言、每个作品独立维护：`zh/{作品ID}/artifact.json`，文件需 UTF-8，最大 2 MiB。中文和英文作品 ID、日志 ID 建议一致。没有翻译时对应语言页面返回 404，不自动翻译。
- 作品状态为 `IDEA / BUILDING / PAUSED / SHIPPED`；与是否公开独立，作品和日志用 `publishState: draft / published` 控制发布。草稿不会进入页面、文件下载和 sitemap。
- 作品必填 `id,title,summary,status,publishState,goal,why,current,next`。`subtitle,currentStep` 可选，`order` 默认为 0。下面各数组可为空。
- `roadmap[]`：`id,title,status,order`；状态为 `PENDING / DOING / DONE`，ID、顺序均不得重复，最多一个进行中的步骤。`currentStep` 引用稳定 ID。调整顺序不改 ID；取消步骤设 `archived: true`，保留历史，不删除被引用的步骤。
- 进度按未取消步骤的完成数计算，四舍五入为整数百分比。它表示步骤完成比例，不是工时或质量；新增步骤可能使比例下降。没有有效步骤时显示“待规划”。`SHIPPED` 状态由作者确认，不因比例为 100% 自动修改。
- `roadmapChanges[]`：`date,stepId,summary`，作者维护新增、修改、取消说明。当前不会自动比对历史文件或生成变更。
- `logs[]`：`id,number,title,date,publishState,roadmapStep,goal,summary` 必填；`whatDid,problems,decisions` 为文本数组，`outputs` 为 `{label,href}` 数组，`video` 为可选 HTTPS 回放链接。`summary` 是实际结果。按不重复的正整数 `number` 顺序阅读，日志必须引用已有步骤。内容为纯文本，不执行 HTML/MDX。
- `liveSessions[]`：`id,title,roadmapStep,startsAt,endsAt,status`；`url` 可选。状态为 `scheduled / completed / cancelled`，时间必须带时区，如 `2026-10-08T20:00:00+08:00`。首页展示未过预定结束时间的最早预告。页面每分钟及回到前台时刷新，当前预告结束时立即刷新；没有预告时隐藏。直播时段标签只说明预定时间，不代表平台已确认开播；实际结束/取消由作者维护。回放写入对应日志。
- 草稿关联和日期也必须合法，避免草稿公开时产生断链。AI 可以在站外整理日志，作者核对后发布；V1 没有 AI API、管理后台或自动发布。

## 写作与发布

可复制 `examples/build/zh/desktop-ai-employee/artifact.json` 作为模板。示例只是演示，标题和正文标明“示例”，其进度、成果和日期不是实际业务事实；**不要整目录直接发布到正式站点**。

```text
content/build/
  zh/
    desktop-ai-employee/
      artifact.json
      outputs/
        spec-v1.txt
  en/
    desktop-ai-employee/
      artifact.json
      outputs/
        spec-v1.txt
```

先将作品或日志设置为 `draft`，填入真实记录，校验后再改成 `published`。产出文件只支持本作品 `outputs/` 内的相对路径或 HTTPS 外链；本地文件最大 64 MiB，更大文件请使用外链。仅公开日志引用的文件允许下载，符号链接和越界路径不支持；本地文件一律作为附件下载，缺失返回 404。

```bash
# CLI 不加载 .env，需要在 shell 设置 BUILD_CONTENT_DIR，或显式传入目录
npm run build:check -- ./content/build
npm run test:build
npx tsc --noEmit
npm run build
# 构建后：临时内容、独立端口的生产 HTTP 验收
node scripts/smoke-build.mjs
```

发布时先上传文件，再用完整的临时 JSON 校验后重命名替换 `artifact.json`，避免读到半写入文件。页面按请求读取，刷新可看到修改，内容无需重新 build。已打开的直播区域会自动检查更新；日志正文不会自动推送更新。删除公开文件前先更新引用；取消步骤保留 ID 和历史记录。

生产代码包不含 `content/`，也不包含示例内容。首次部署需另行上传作品目录，建议 `BUILD_CONTENT_DIR` 指向发布目录之外的持久存储；升级沿用该目录，回滚代码不覆盖内容。回滚内容使用作者保留的文件备份。本模块不接入现有 post/tool ingest API。

## 本地示例预览

PowerShell 中显式启用示例目录（仅当前进程环境，不修改正式内容）：

```powershell
$env:BUILD_CONTENT_DIR = (Resolve-Path ./examples/build).Path
npm run dev
# http://localhost:3006/zh/build 或 /en/build
# 停止服务后清除：Remove-Item Env:BUILD_CONTENT_DIR
```

手工验收：手机和桌面导航、明暗主题、中英文列表/详情/日志、前后篇、路线图历史、中文文件名下载；直播到期/取消后切换、无直播隐藏、草稿直接访问 404、内容更新无需重启、生产持久目录和文件权限。
