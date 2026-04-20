export const siteConfig = {
  name: "T.J. Jia",
  description: "T.J. Jia · Build. Think. Ship.",
  url: "https://aibuilderlab.dev",
  author: "T.J. Jia",
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
      href: "https://example.com/wechat-official",
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
      href: "https://example.com/wechat-video",
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
      href: "https://example.com/douyin",
      qrSrc: "/contact/douyin256.png"
    }
  ],
  nav: [
    { href: "/tools", key: "tools" },
    { href: "/blog", key: "blog" },
    { href: "/about", key: "about" }
  ]
} as const;

export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
