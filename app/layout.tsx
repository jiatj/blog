import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";

import { siteConfig } from "@/lib/site-config";
import { ThemeProvider } from "@/components/theme-provider";
import { BaiduPageViews } from "@/components/baidu-page-views";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: siteConfig.name }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsEnabled = process.env.NODE_ENV === "production";
  return (
    <html data-scroll-behavior="smooth" suppressHydrationWarning lang="zh-CN">
      <head>
        {analyticsEnabled ? (
          <Script id="baidu-tongji" strategy="beforeInteractive">
            {`var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?926416f5c40e7214d27178212a62edbd";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`}
          </Script>
        ) : null}
      </head>
      <body>
        {analyticsEnabled ? <Suspense fallback={null}><BaiduPageViews /></Suspense> : null}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
