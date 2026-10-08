import { defaultLocale, type Locale } from "@/lib/site-config";

const dictionaries = {
  zh: {
    lang: "简体中文",
    switchLabel: "切换语言",
    home: {
      eyebrow: "AI Builder Lab / 公开造物",
      title: "把想法，做出来。",
      intro: "分享 AI 应用开发、AI Coding 与 AI 项目实战中的文章、产品和实验。记录判断，公开过程，持续交付。",
      seoTitle: "AI 应用开发、AI Coding 与项目实战",
      methodologyLink: "了解我的方法",
      methodologyHref: "/blog/building-calm-ai-sites",
      projectsEyebrow: "当前关注",
      latestPosts: "最新文章",
      latestTools: "项目与实验",
      viewAllPosts: "查看全部文章",
      viewAllTools: "更多项目",
      projectNote: "持续构建中的产品、工具和实验项目。"
    },
    nav: {
      home: "首页",
      build: "造物",
      abl: "ABL教育",
      courses: "课程",
      tools: "项目",
      blog: "文章",
      discover: "发现",
      more: "更多",
      about: "关于"
    },
    build: {
      title: "造物", hero: "把想法变成真实的东西。",
      description: "公开记录设计、构建、失败、修改和最终交付。看一个想法，如何一步步成为真实的作品。",
      artifacts: "作品", overview: "概览", logs: "造物日志", roadmap: "路线图", outputs: "产出文件",
      goal: "目标", why: "缘由", current: "当前进展", next: "下一步", currentStep: "当前步骤", progress: "进度", progressPending: "待规划",
      nextLive: "下次直播", liveWindow: "直播时段", liveEntry: "直播入口", timezone: "北京时间",
      step: "步骤", archived: "已取消", history: "路线图变更", logPrefix: "日志",
      whatDid: "完成的工作", problems: "遇到的问题", decisions: "关键决策", result: "结果", video: "视频", replay: "观看回放",
      backBuild: "全部作品", contents: "作品章节", previous: "上一篇", nextLog: "下一篇", logSequence: "按顺序阅读日志",
      empty: "还没有公开的作品。真实的构建记录将在这里逐步展开。", emptyLogs: "还没有公开的造物日志。",
      emptyRoadmap: "路线图尚未确定。", emptyOutputs: "还没有公开的产出文件。",
      statuses: { IDEA: "构想中", BUILDING: "构建中", PAUSED: "已暂停", SHIPPED: "已交付" },
      stepStatuses: { PENDING: "待开始", DOING: "进行中", DONE: "已完成" }
    },
    common: {
      backHome: "返回首页",
      readArticle: "阅读全文",
      viewProject: "查看项目",
      openProject: "打开项目",
      sourceCode: "查看源码",
      latest: "最近更新",
      noContent: "暂无内容",
      drafted: "草稿未展示",
      theme: "主题",
      light: "浅色",
      dark: "深色",
      system: "跟随系统"
    },
    blog: {
      title: "文章",
      description: "分享 AI Coding、AI Agent、Skill、Context 管理和 AI Native 产品开发中的实践、判断与交付经验。",
      seoTitle: "AI Coding、AI Agent 与产品开发文章",
      empty: "还没有可展示的文章。"
    },
    tools: {
      title: "项目",
      description: "展示 AI 应用开发中的工具、实验与轻量产品，记录真实使用场景、设计方法和交付成果。",
      seoTitle: "AI 应用项目、工具与实验",
      empty: "还没有可展示的项目。",
      status: "状态"
    },
    about: {
      title: "关于",
      intro: "你好，我是贾铁军（T.J. Jia），AI Builder Lab 的创建者。我实践 AI 应用开发、AI Coding 与 AI Native 产品构建，分享真实项目与交付经验。",
      seoTitle: "关于贾铁军（T.J. Jia）",
      blocks: [
        {
          title: "我在做什么",
          text: "1. <b>AI Builder Lab</b>：持续实验 AI Native 方法、工具栈与 SOP。\n2. 工具与轻量产品：围绕真实需求搭建可复用的工作流基础设施。\n3. 长期写作项目：把问题、经验与实践整理成可持续生长的内容系统。\n4. <b>This Is Dongbei</b>：记录并表达真实的东北文化与生活。"
        },
        {
          title: "为什么做这个站",
          text: "1. 在信息过载的环境里，仍需要一个可以沉静思考的地方。\n2. AI 越普及，人的判断、思考与分辨能力越珍贵。\n3. 当表达越来越相似，保留自己的审美、尺度与语气就更重要。"
        },
        {
          title: "联系",
          text: "如果你想交流产品、内容系统或 AI Native 工作流，可以通过公开渠道联系我。"
        }
      ]
    }
  },
  en: {
    lang: "English",
    switchLabel: "Switch language",
    home: {
      eyebrow: "AI Builder Lab / Build in public",
      title: "Make ideas real.",
      intro: "Articles, products, and experiments in AI application development, AI coding, and hands-on projects—shared as they are built.",
      seoTitle: "AI Application Development, AI Coding and Hands-on Projects",
      methodologyLink: "Read the essay",
      methodologyHref: "/blog/building-calm-ai-sites",
      projectsEyebrow: "Current focus",
      latestPosts: "Latest posts",
      latestTools: "Current projects",
      viewAllPosts: "See all posts",
      viewAllTools: "More projects",
      projectNote: "Projects are evidence of the method, not the headline."
    },
    nav: {
      home: "Home",
      build: "Build",
      abl: "ABL Education",
      courses: "Courses",
      tools: "Projects",
      blog: "Blog",
      discover: "Discover",
      more: "More",
      about: "About"
    },
    build: {
      title: "Build", hero: "Make ideas real.",
      description: "Follow how things get built. A public record of design, building, failures, revisions, and delivery.",
      artifacts: "Artifacts", overview: "Overview", logs: "Build Log", roadmap: "Roadmap", outputs: "Outputs",
      goal: "Goal", why: "Why", current: "Current", next: "Next", currentStep: "Current step", progress: "Progress", progressPending: "Not planned yet",
      nextLive: "Next live", liveWindow: "Scheduled live window", liveEntry: "Live entry", timezone: "Beijing time",
      step: "Step", archived: "Cancelled", history: "Roadmap changes", logPrefix: "Build",
      whatDid: "What I did", problems: "Problems", decisions: "Decisions", result: "Result", video: "Video", replay: "Watch replay",
      backBuild: "All artifacts", contents: "Artifact sections", previous: "Previous", nextLog: "Next", logSequence: "Read logs in order",
      empty: "No public artifacts yet. Real build records will unfold here.", emptyLogs: "No public build logs yet.",
      emptyRoadmap: "The roadmap is still taking shape.", emptyOutputs: "No public outputs yet.",
      statuses: { IDEA: "Idea", BUILDING: "Building", PAUSED: "Paused", SHIPPED: "Shipped" },
      stepStatuses: { PENDING: "Pending", DOING: "In progress", DONE: "Completed" }
    },
    common: {
      backHome: "Back to home",
      readArticle: "Read article",
      viewProject: "View project",
      openProject: "Open project",
      sourceCode: "Source code",
      latest: "Latest",
      noContent: "No content yet",
      drafted: "Draft content is hidden",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System"
    },
    blog: {
      title: "Articles",
      description: "Practical writing on AI coding, AI agents, skills, context management, and shipping AI-native products.",
      seoTitle: "Articles on AI Coding, AI Agents and Product Development",
      empty: "No published posts yet."
    },
    tools: {
      title: "Projects",
      description: "AI application projects, tools, and lightweight products, with real use cases, design decisions, and delivery outcomes.",
      seoTitle: "AI Application Projects, Tools and Experiments",
      empty: "No published projects yet.",
      status: "Status"
    },
    about: {
      title: "About",
      intro: "Hi, I'm T.J. Jia (贾铁军), creator of AI Builder Lab. I share hands-on experience in AI application development, AI coding, and shipping AI-native products.",
      seoTitle: "About T.J. Jia",
      blocks: [
        {
          title: "What I build",
          text: "1. <b>AI Builder Lab</b>: ongoing experiments around AI-native methods, tool stacks, and SOPs.\n2. Tools and lightweight products: reusable workflow infrastructure built around real needs.\n3. A long-running writing project: turning problems, experience, and practice into a growing content system.\n4. <b>This Is Dongbei</b>: documenting and expressing the real culture and everyday life of Northeast China."
        },
        {
          title: "Why this site exists",
          text: "1. In an age of overload, we still need a place where thinking can stay quiet.\n2. The more abundant AI becomes, the more valuable human judgment and discernment become.\n3. As expression grows more similar, preserving one's own taste, pacing, and voice matters more."
        },
        {
          title: "Contact",
          text: "If you want to talk about products, content systems, or AI-native workflows, feel free to reach out through the public channels."
        }
      ]
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
