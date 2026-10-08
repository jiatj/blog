export const siteConfig = {
  name: "AI Builder Lab",
  description: "AI Builder Lab 由贾铁军创建，分享 AI 应用开发、AI Coding、AI Agent 与项目实战中的真实产品、开发方法和交付经验。",
  url: "https://www.tiejunjia.com",
  author: "T.J. Jia",
  authorZh: "贾铁军",
  email: "jiatj@outlook.com",
  socialChannels: [
    {
      key: "wechat-official",
      labelZh: "公众号",
      labelEn: "Official Account",
      hintZh: "扫码关注",
      hintEn: "Scan to follow",
      ctaZh: "查看主页",
      ctaEn: "View page",
      href: "/contact/gongzhonghao256.png",
      qrSrc: "/contact/gongzhonghao256.png"
    },
    {
      key: "wechat-video",
      labelZh: "视频号",
      labelEn: "Video Channel",
      hintZh: "扫码进入",
      hintEn: "Scan to enter",
      ctaZh: "访问页面",
      ctaEn: "Visit page",
      href: "/contact/shipinhao256.png",
      qrSrc: "/contact/shipinhao256.png"
    },
    {
      key: "douyin",
      labelZh: "抖音号",
      labelEn: "Douyin",
      hintZh: "扫码进入",
      hintEn: "Scan to enter",
      ctaZh: "访问主页",
      ctaEn: "Visit page",
      href: "/contact/douyin256.png",
      qrSrc: "/contact/douyin256.png"
    }
  ],
  nav: [
    { href: "", key: "home" },
    { href: "/build", key: "build" },
    { href: "/courses", key: "courses" },
    { href: "/tools", key: "tools" }
  ],
  moreNav: [
    { href: "/blog", key: "blog" },
    { href: "/discover", key: "discover" },
    { href: "/about", key: "about" }
  ]
} as const;

export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
