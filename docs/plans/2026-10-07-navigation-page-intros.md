# 导航与栏目页头 Implementation Plan

**Goal:** 移动端固定五个入口，增加克制的栏目图案，统一栏目标题并改善文章阅读宽度。

**Architecture:** 沿用现有 Next.js / React / CSS；导航配置分主入口与次入口，移动端点击展开次入口。共用 SVG 图案与页头组件，不引入图片服务或依赖。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind CSS 4。

## 已确定的设计

- 移动端：首页、造物、课程、项目、更多；更多包含文章、发现、关于。
- 宽屏桌面显示全部七个入口；平板与窄桌面采用同样的五入口布局，避免英文拥挤。
- 语言与主题保留原位；更多支持点击、外部点击、Escape、键盘及导航后关闭。
- 栏目主页采用同一套线条 SVG 与轻微色差，手机缩小图案；首页沿用已有 HeroVisual。
- 造物与其他栏目使用同一字体及标题尺度；文章详情上限 48rem → 60rem，减少手机卡片内边距。
- 不修改内容、URL、课程中文限制、数据、部署配置；保留当前未提交工作。

## 实施与验证

1. 修改 `lib/site-config.ts`、`lib/dictionary.ts`、`components/site-shell.tsx`，实现响应式导航与展开状态。
2. 新建 `components/page-intro.tsx`，接入造物、课程、项目、文章、发现、关于主页；在 `app/globals.css` 定义图案和共用标题样式。
3. 修改文章详情宽度；同步 `README.md` 的导航与人工验收说明。
4. 执行 `npx tsc --noEmit`、`npm run build`；浏览器检查手机、平板、桌面、中英文、深浅主题、更多关闭行为、正文宽度与横向溢出。

## 风险与人工验收

- 文章行长增加，需作者确认阅读舒适度。
- 触屏和键盘交互、英文导航、深色图案需实机复核。
- 本次仅本地修改与验证，未部署。

## 本次修改文件

- 导航：`lib/site-config.ts`、`lib/dictionary.ts`、`components/site-navigation.tsx`（新增）、`components/site-shell.tsx`。
- 页头：`components/page-intro.tsx`（新增）、`components/section-heading.tsx`、`components/build/build.module.css`、`app/globals.css`。
- 栏目主页：`app/[locale]/build/page.tsx`、`app/[locale]/courses/page.tsx`、`app/[locale]/tools/page.tsx`、`app/[locale]/blog/page.tsx`、`app/[locale]/discover/page.tsx`、`app/[locale]/about/page.tsx`。
- 阅读：`app/[locale]/blog/[slug]/page.tsx`。
- 文档：`README.md`、本计划（新增）。

## 验证记录

- `npx tsc --noEmit` 通过。
- 最终 `npm run build` 通过（Windows 沙箱拒绝路径访问后，在正常权限下构建成功）；`git diff --check` 通过。
- 浏览器检查 320px 英文、390px 手机、768px 平板、1280px 桌面；已检查页面无整页横向溢出。
- 更多：Escape 关闭并回到按钮、外部点击关闭、选择文章/发现/关于后关闭；课程保持跳转中文。
- 深浅主题正常；造物与课程手机标题均使用站点字体和 35.2px 字号。
- 桌面文章容器实测 960px，正文约 863px；390px 视口下正文约 309px。
- 真实手机 Safari/Chrome 与文章加宽后的长文阅读舒适度仍需人工确认。
