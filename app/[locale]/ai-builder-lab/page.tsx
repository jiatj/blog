import Link from "next/link";

import { buildMetadata } from "@/lib/metadata";
import { locales, siteConfig, type Locale } from "@/lib/site-config";

import styles from "./page.module.css";

const directionCards = [
  ["01", "刷题已不够", "中考高考不再只是重复刷题，更看重理解、应用、表达与创新。"],
  ["02", "多一条新路径", "科技特长生不是唯一答案，但 AI、编程、智能体与赛事，让孩子在主赛道外多一个选择，多一份成功的可能。"],
  ["03", "升学终点是就业", "升学的终极目标是未来就业。AI 正在成为未来学习、工作与竞争力的重要底层能力。"]
];

const statements = [
  "不是多学几个 AI 工具，而是形成解决问题的能力",
  "不是让 AI 替孩子完成作业，而是让孩子学会与 AI 协作",
  "不是短期热闹，而是沉淀作品、能力和选择权"
];

const abilities = [
  ["AI 思维", "把问题拆开，把任务推进。", "对孩子，是更强的问题解决力；对未来，是人机协作时代的基础能力。", "01"],
  ["审美力", "AI 工具平权后，审美成为稀缺竞争力。", "审美不仅提高生活质量，也决定作品表达、个人气质与未来职业价值的上限。", "02"],
  ["判断力", "不盲从 AI，才能真正使用 AI。", "孩子需要判断信息真假、方案优劣、风险边界与价值取舍。判断力，是 AI 时代最重要的安全感。", "03"]
];

const process = ["真实任务", "提出问题", "AI 协作", "动手创造", "老师点评", "优化作品", "展示交付"];

const backing = [
  ["Stanford HAI", "AI 已经进入学生学习现场"],
  ["UNESCO", "学生应成为负责任的 AI 使用者与共创者"],
  ["OECD / AILit", "AI 素养正在成为中小学能力框架"],
  ["Khanmigo / MIT Day of AI", "AI 教育正在从工具走向能力与引导"]
];

const outcomes = ["AI 海报", "视觉故事卡", "互动网页", "小游戏", "AI 学习助手", "智能体项目", "机器人 / 硬件作品", "个人作品集"];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return buildMetadata({
    locale: "zh",
    title: "面向未来的 AI 原生教育",
    description: "AI Builder Lab 提出能力三角模型，培养孩子的 AI 思维、审美力和判断力，让孩子在真实项目中学习、创造与交付。",
    path: "/ai-builder-lab",
    availableLocales: ["zh"]
  });
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <p>{eyebrow}</p>
      <h2>{children}</h2>
    </div>
  );
}

function AbilityTriangle() {
  return (
    <div className={styles.triangleWrap} aria-label="ABL 能力三角：AI 思维、审美力与判断力">
      <svg className={styles.triangleSvg} viewBox="0 0 600 560" role="img">
        <defs>
          <linearGradient id="triangle-line" x1="0" x2="1">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset=".5" stopColor="#2563eb" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
          <radialGradient id="triangle-center">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#edf4ff" />
          </radialGradient>
        </defs>
        <path className={styles.orbit} d="M300 35C420 37 550 190 535 328C520 466 386 535 232 510C78 485 38 335 91 205C144 75 180 33 300 35Z" />
        <path className={styles.triangleLine} d="M300 88 95 452 505 452Z" />
        <circle className={styles.centerCircle} cx="300" cy="330" r="92" />
        <text className={styles.centerMain} x="300" y="322" textAnchor="middle">ABL 能力三角</text>
        <text className={styles.centerSub} x="300" y="353" textAnchor="middle">ABILITY TRIANGLE</text>
        <g className={styles.node}>
          <circle cx="300" cy="88" r="61" />
          <text x="300" y="82" textAnchor="middle">AI 思维</text>
          <text className={styles.nodeSub} x="300" y="109" textAnchor="middle">会提问 · 会拆解 · 会协作</text>
        </g>
        <g className={styles.node}>
          <circle cx="95" cy="452" r="61" />
          <text x="95" y="446" textAnchor="middle">审美力</text>
          <text className={styles.nodeSub} x="95" y="473" textAnchor="middle">懂好坏 · 有表达 · 有品味</text>
        </g>
        <g className={styles.node}>
          <circle cx="505" cy="452" r="61" />
          <text x="505" y="446" textAnchor="middle">判断力</text>
          <text className={styles.nodeSub} x="505" y="473" textAnchor="middle">辨信息 · 做取舍 · 负责任</text>
        </g>
      </svg>
    </div>
  );
}

export default async function AiBuilderLabPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.brand}>ABL · AI Builder Lab</p>
          <h1>
            <span>不只是教孩子使用 AI 工具，</span>
            <strong>而是建立孩子的</strong>
            <em>能力三角</em>
          </h1>
          <p className={styles.formula}>AI 思维 × 审美力 × 判断力</p>
          <p className={styles.heroNote}>我们关注的，不只是孩子会不会用工具，而是能不能提出问题、做出作品、判断选择。</p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href={`mailto:${siteConfig.email}?subject=预约 ABL 体验课`}>预约体验课</a>
            <a className={styles.secondaryButton} href="#system">了解课程体系</a>
          </div>
        </div>
        <AbilityTriangle />
      </section>

      <section className={styles.lightPanel}>
        <SectionTitle eyebrow="EDUCATION DIRECTION">AI 符合中国教育的终极方向</SectionTitle>
        <div className={styles.threeGrid}>
          {directionCards.map(([number, title, text]) => (
            <article className={styles.directionCard} key={title}>
              <span>{number}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="ABL VIEWPOINT">我们关注的，不只是会不会用工具</SectionTitle>
        <div className={styles.statements}>
          {statements.map((statement, index) => <article key={statement}><span>0{index + 1}</span><p>{statement}</p></article>)}
        </div>
      </section>

      <section id="system">
        <SectionTitle eyebrow="ABILITY TRIANGLE">为什么是这三个能力？</SectionTitle>
        <div className={styles.abilityGrid}>
          {abilities.map(([title, lead, text, number]) => (
            <article key={title}>
              <span>{number}</span><h3>{title}</h3><strong>{lead}</strong><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.processSection}>
        <SectionTitle eyebrow="LEARNING METHOD">Build. Think. Ship.</SectionTitle>
        <p className={styles.sectionIntro}>我们用 Build. Think. Ship. 训练能力三角</p>
        <div className={styles.process}>
          {process.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
        </div>
        <p className={styles.processNote}>AI 是教练，不是答案机器；老师负责方向、审美和边界。</p>
      </section>

      <section>
        <SectionTitle eyebrow="GLOBAL PERSPECTIVE">全球 AI 教育，也在走向能力框架</SectionTitle>
        <div className={styles.backingGrid}>
          {backing.map(([name, text]) => <article key={name}><strong>{name}</strong><p>{text}</p></article>)}
        </div>
      </section>

      <section className={styles.lightPanel}>
        <SectionTitle eyebrow="REAL OUTCOMES">孩子最终能做出什么？</SectionTitle>
        <div className={styles.outcomesGrid}>
          {outcomes.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></article>)}
        </div>
        <p className={styles.outcomesNote}>每个孩子，都应该拥有自己的 AI 作品集。</p>
      </section>

      <section className={styles.cta}>
        <p>START WITH A REAL PROJECT</p>
        <h2>从一次真实作品开始，体验未来学习方式</h2>
        <span>适合重视长期能力、真实创造与未来竞争力的家庭。</span>
        <div className={styles.actions}>
          <a className={styles.primaryButton} href={`mailto:${siteConfig.email}?subject=预约 ABL 体验课`}>预约体验课</a>
          <a className={styles.secondaryButton} href={`mailto:${siteConfig.email}?subject=咨询 ABL 教育`}>微信咨询</a>
          <Link className={styles.secondaryButton} href={`/${locale}/about`}>了解课程路径</Link>
        </div>
        <small>AI Builder Lab</small>
      </section>
    </main>
  );
}
