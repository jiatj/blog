import Link from "next/link";
import type { Metadata } from "next";
import { ReadingList } from "@/components/reading-list";
import { getArticleDates, getArticlesByDate, loadReadingSites, shanghaiDate } from "@/lib/reading/store";
import { locales, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "zh" ? "发现" : "Discover" };
}

function monthOffset(month: string, amount: number) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function validDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export default async function DiscoverPage({
  params, searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const today = shanghaiDate(new Date());
  const date = validDate(query.date) ? query.date : today;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : date.slice(0, 7);
  const first = new Date(`${month}-01T00:00:00Z`);
  const firstDay = (first.getUTCDay() + 6) % 7;
  const totalDays = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const [articles, articleDates] = [getArticlesByDate(date), new Set(getArticleDates(month))];
  const sites = loadReadingSites();
  const weekdays = locale === "zh" ? ["一", "二", "三", "四", "五", "六", "日"] : ["M", "T", "W", "T", "F", "S", "S"];
  const base = `/${locale}/discover`;

  return (
    <main className="pb-12">
      <section className="mb-10 border-b border-[var(--border-soft)] pb-9 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-ink)]">DISCOVER / READING</p>
        <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-tight tracking-[-0.055em]">
          {locale === "zh" ? "找回深度阅读的习惯。" : "Make room for deeper reading."}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)]">
          {locale === "zh" ? "从我关注的网站收集新文章，按日期安静地读。" : "Recent articles from sites I follow, organized by day."}
        </p>
      </section>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <section aria-label={locale === "zh" ? "每日文章" : "Daily articles"}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-ink)]">{date === today ? (locale === "zh" ? "今日精选" : "TODAY'S PICKS") : (locale === "zh" ? "文章归档" : "ARCHIVE")}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{date}</h2>
            </div>
            {date !== today ? <Link className="text-sm text-[var(--accent-ink)] hover:underline" href={base}>{locale === "zh" ? "回到今天 →" : "Today →"}</Link> : null}
          </div>
          <ReadingList articles={articles} locale={locale} />
        </section>
        <aside className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-[var(--card)] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{locale === "zh" ? "阅读日历" : "Calendar"}</h2>
              <div className="flex items-center gap-3 text-sm">
                <Link aria-label="Previous month" href={`${base}?date=${date}&month=${monthOffset(month, -1)}`}>‹</Link>
                <span className="min-w-20 text-center">{month}</span>
                <Link aria-label="Next month" href={`${base}?date=${date}&month=${monthOffset(month, 1)}`}>›</Link>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekdays.map((day, index) => <span className="pb-2 text-[var(--muted-foreground-soft)]" key={index}>{day}</span>)}
              {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: totalDays }, (_, index) => {
                const day = `${month}-${String(index + 1).padStart(2, "0")}`;
                return <Link aria-current={day === date ? "date" : undefined} className={`rounded-lg py-2 transition hover:bg-[var(--accent-soft)] ${day === date ? "bg-[var(--accent)] font-semibold text-white" : articleDates.has(day) ? "font-semibold text-[var(--accent-ink)]" : "text-[var(--muted-foreground)]"}`} href={`${base}?date=${day}`} key={day}>{index + 1}</Link>;
              })}
            </div>
            <p className="mt-4 text-xs text-[var(--muted-foreground-soft)]">{locale === "zh" ? "蓝色日期有已收录文章" : "Blue dates have articles"}</p>
          </section>
          <section className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold">{locale === "zh" ? "我的网址" : "My sites"}</h2>
            {sites.length ? <ul className="mt-4 space-y-3">{sites.map((site) => <li key={site.url}><a className="text-sm text-[var(--muted-foreground)] hover:text-[var(--accent-ink)]" href={site.url} rel="noopener noreferrer" target="_blank">{site.name} ↗</a></li>)}</ul> : <p className="mt-3 text-sm text-[var(--muted-foreground)]">{locale === "zh" ? "网址清单上传后显示在这里。" : "Sites appear here after upload."}</p>}
          </section>
        </aside>
      </div>
    </main>
  );
}
