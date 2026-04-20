import { defaultLocale, type Locale } from "@/lib/site-config";

const dictionaries = {
  zh: {
    lang: "简体中文",
    switchLabel: "切换语言",
    home: {
      eyebrow: "Method over noise",
      title: "Build. Think. Ship.",
      intro: "一个关于构建、思考与持续交付的个人入口。",
      methodologyLink: "为什么是 Build. Think. Ship.",
      methodologyHref: "/blog/building-calm-ai-sites",
      projectsEyebrow: "Current focus",
      latestPosts: "最新文章",
      latestTools: "热点项目",
      viewAllPosts: "查看全部文章",
      viewAllTools: "更多项目",
      projectNote: "基于AI Navtive 创作的产品、工具和试验品"
    },
    nav: {
      tools: "项目",
      blog: "博客",
      about: "关于"
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
      title: "博客",
      description: "记录关于构建、方法、AI 工作流与长期创作系统的思考。",
      empty: "还没有可展示的文章。"
    },
    tools: {
      title: "项目",
      description: "我正在持续推进的工具、实验与轻量产品。",
      empty: "还没有可展示的项目。",
      status: "状态"
    },
    about: {
      title: "关于",
      intro: "你好，我是 T.J. Jia。我在 AI Native 语境下构建产品、重组流程，并持续把思考推进到真实交付。",
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
      eyebrow: "Method over noise",
      title: "Build. Think. Ship.",
      intro: "A personal entry point for building, thinking, and shipping over time.",
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
      tools: "Projects",
      blog: "Blog",
      about: "About"
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
      title: "Blog",
      description: "Writing on building, method, AI workflows, and long-term creative systems.",
      empty: "No published posts yet."
    },
    tools: {
      title: "Projects",
      description: "Active tools, experiments, and lightweight products I am building in public.",
      empty: "No published projects yet.",
      status: "Status"
    },
    about: {
      title: "About",
      intro: "Hi, I'm T.J. Jia. I build products in an AI-native environment, redesign workflows, and keep pushing thinking toward real delivery.",
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
