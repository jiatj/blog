import type { Artifact, BuildLocale, LiveEntry, RoadmapStep } from "./types.ts";

export const isId = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const isOutputPath = (value: string) => value.startsWith("outputs/") &&
  value.split("/").every((part) => !!part && part !== "." && part !== ".." && !/[\\:%?#<>|*\x00-\x1f\x7f]/.test(part) && !/[. ]$/.test(part));

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function parseArtifact(value: unknown, source = "artifact.json"): Artifact {
  const fail = (message: string): never => { throw new Error(`${source}: ${message}`); };
  const obj = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v)
    ? v as Record<string, unknown> : fail("预期对象");
  const str = (v: unknown, field: string): string => typeof v === "string" && v.trim() ? v.trim() : fail(`${field} 必须为非空文本`);
  const optional = (v: unknown, field: string) => v === undefined ? undefined : str(v, field);
  const id = (v: unknown, field: string) => { const s = str(v, field); return isId(s) ? s : fail(`${field} 必须为小写字母、数字和连字符`); };
  const list = (v: unknown, field: string): unknown[] => v === undefined ? [] : Array.isArray(v) ? v : fail(`${field} 必须为数组`);
  const texts = (v: unknown, field: string) => list(v, field).map((s) => str(s, field));
  const one = <T extends string>(v: unknown, choices: readonly T[], field: string): T => choices.includes(v as T) ? v as T : fail(`${field} 只能为 ${choices.join(" / ")}`);
  const integer = (v: unknown, field: string, minimum = 0): number => typeof v === "number" && Number.isSafeInteger(v) && v >= minimum ? v : fail(`${field} 必须为不小于 ${minimum} 的整数`);
  const date = (v: unknown) => {
    const s = str(v, "date");
    const d = new Date(`${s}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : fail("date 必须为有效 YYYY-MM-DD");
  };
  const timestamp = (v: unknown) => {
    const s = str(v, "直播时间");
    date(s.slice(0, 10));
    return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(s) && Number.isFinite(Date.parse(s)) ? s : fail("直播时间必须为带时区的 ISO 时间，例如 2026-10-08T20:00:00+08:00");
  };
  const url = (v: unknown): string | undefined => v === undefined ? undefined : httpsUrl(str(v, "URL")) ? str(v, "URL") : fail("外部链接必须为无账号密码的 HTTPS URL");
  const unique = <T>(items: T[], key: (item: T) => string | number, field: string) => {
    if (new Set(items.map(key)).size !== items.length) fail(`${field} 不得重复`);
  };
  const raw = obj(value);
  const roadmap: RoadmapStep[] = list(raw.roadmap, "roadmap").map((v) => {
    const step = obj(v);
    if (step.archived !== undefined && typeof step.archived !== "boolean") fail("archived 必须为布尔值");
    return { id: id(step.id, "step.id"), title: str(step.title, "step.title"), status: one(step.status, ["PENDING", "DOING", "DONE"] as const, "step.status"), order: integer(step.order, "step.order"), archived: step.archived === true };
  }).sort((a, b) => a.order - b.order);
  unique(roadmap, (s) => s.id, "步骤 ID");
  unique(roadmap, (s) => s.order, "步骤顺序");
  if (roadmap.filter((s) => !s.archived && s.status === "DOING").length > 1) fail("最多一个进行中的步骤");
  const stepRef = (v: unknown) => { const s = id(v, "步骤引用"); return roadmap.some((step) => step.id === s) ? s : fail(`步骤不存在: ${s}`); };
  const currentStep = raw.currentStep === undefined ? undefined : stepRef(raw.currentStep);
  if (currentStep && roadmap.find((s) => s.id === currentStep)?.archived) fail("当前步骤不得为已归档步骤");
  const logs = list(raw.logs, "logs").map((v) => {
    const log = obj(v);
    return {
      id: id(log.id, "log.id"), number: integer(log.number, "log.number", 1), title: str(log.title, "log.title"),
      date: date(log.date), publishState: one(log.publishState, ["draft", "published"] as const, "log.publishState"),
      roadmapStep: stepRef(log.roadmapStep), goal: str(log.goal, "log.goal"), summary: str(log.summary, "log.summary"),
      whatDid: texts(log.whatDid, "whatDid"), problems: texts(log.problems, "problems"), decisions: texts(log.decisions, "decisions"),
      outputs: list(log.outputs, "outputs").map((o) => {
        const output = obj(o); const href = str(output.href, "output.href");
        if (!httpsUrl(href) && !isOutputPath(href)) fail("产出链接必须为 HTTPS 或 outputs/ 下的相对文件路径");
        return { label: str(output.label, "output.label"), href };
      }), video: url(log.video)
    };
  }).sort((a, b) => a.number - b.number);
  unique(logs, (l) => l.id, "日志 ID");
  unique(logs, (l) => l.number, "日志序号");
  const roadmapChanges = list(raw.roadmapChanges, "roadmapChanges").map((v) => {
    const c = obj(v);
    return { date: date(c.date), stepId: stepRef(c.stepId), summary: str(c.summary, "change.summary") };
  }).sort((a, b) => b.date.localeCompare(a.date));
  const liveSessions = list(raw.liveSessions, "liveSessions").map((v) => {
    const live = obj(v); const startsAt = timestamp(live.startsAt); const endsAt = timestamp(live.endsAt);
    if (Date.parse(endsAt) <= Date.parse(startsAt)) fail("直播结束时间必须晚于开始时间");
    const roadmapStep = stepRef(live.roadmapStep);
    const status = one(live.status, ["scheduled", "completed", "cancelled"] as const, "live.status");
    if (status === "scheduled" && roadmap.find((s) => s.id === roadmapStep)?.archived) fail("已归档步骤不得预告直播");
    return { id: id(live.id, "live.id"), title: str(live.title, "live.title"), roadmapStep, startsAt, endsAt, status, url: url(live.url) };
  });
  unique(liveSessions, (l) => l.id, "直播 ID");
  return {
    id: id(raw.id, "artifact.id"), title: str(raw.title, "title"), subtitle: optional(raw.subtitle, "subtitle"),
    summary: str(raw.summary, "summary"), status: one(raw.status, ["IDEA", "BUILDING", "PAUSED", "SHIPPED"] as const, "status"),
    publishState: one(raw.publishState, ["draft", "published"] as const, "publishState"), order: integer(raw.order ?? 0, "order"),
    goal: str(raw.goal, "goal"), why: str(raw.why, "why"), current: str(raw.current, "current"), next: str(raw.next, "next"),
    currentStep, roadmap, roadmapChanges, logs, liveSessions
  };
}

export function publicArtifact(artifact: Artifact): Artifact {
  return { ...artifact, logs: artifact.logs.filter((l) => l.publishState === "published") };
}

export function buildProgress(artifact: Artifact) {
  const steps = artifact.roadmap.filter((s) => !s.archived);
  const completed = steps.filter((s) => s.status === "DONE").length;
  return { completed, total: steps.length, percent: steps.length ? Math.round(completed / steps.length * 100) : 0 };
}

export function nextLive(artifacts: Artifact[], now = Date.now()): LiveEntry | null {
  return artifacts.filter((a) => a.publishState === "published").flatMap((a) => a.liveSessions
    .filter((s) => s.status === "scheduled" && Date.parse(s.endsAt) > now)
    .map((s) => ({ ...s, artifactId: a.id, artifactTitle: a.title })))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0] ?? null;
}

export function outputUrl(locale: BuildLocale, artifactId: string, href: string) {
  return isOutputPath(href) ? `/build-assets/${locale}/${artifactId}/${href.split("/").map(encodeURIComponent).join("/")}` : href;
}

export function buildDate(value: string, locale: BuildLocale, withTime = false) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "short", day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  }).format(new Date(withTime ? value : `${value}T00:00:00+08:00`));
}
