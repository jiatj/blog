import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { parseArtifact, publicArtifact, buildProgress, nextLive, outputUrl } from "../lib/build/model.ts";
import { readBuildArtifacts, readBuildOutput } from "../lib/build/read.ts";

const exampleRoot = path.resolve("examples/build");
const original = JSON.parse(await fs.readFile(path.join(exampleRoot, "zh/desktop-ai-employee/artifact.json"), "utf8"));
const clone = () => structuredClone(original);
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "portal-build-test-"));
  await fs.cp(exampleRoot, root, { recursive: true });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return { root, save: (a) => fs.writeFile(path.join(root, "zh/desktop-ai-employee/artifact.json"), JSON.stringify(a)) };
}

test("中英文示例合法，草稿日志从公开模型中剔除", async () => {
  for (const locale of ["zh", "en"]) {
    const artifacts = await readBuildArtifacts(locale, exampleRoot);
    assert.equal(artifacts.length, 4);
    const a = artifacts.find((a) => a.id === "desktop-ai-employee");
    assert.deepEqual(a.logs.map((l) => l.id), ["define-v1", "concept-design"]);
    assert.equal(buildProgress(a).percent, 25);
  }
});

test("调整顺序保留日志引用，取消步骤不计进度，新增步骤可降低进度", () => {
  const a = clone(); a.roadmap[0].order = 99; a.roadmap[1].archived = true;
  const parsed = parseArtifact(a);
  assert.equal(parsed.logs[0].roadmapStep, "define");
  assert.equal(parsed.roadmap.at(-1).id, "define");
  assert.deepEqual(buildProgress(parsed), { completed: 1, total: 7, percent: 14 });
  a.roadmap.push({ id: "new-step", title: "New step", status: "PENDING", order: 98 });
  assert.equal(buildProgress(parseArtifact(a)).percent, 13);
});

test("空路线图进度为零，完成步骤不自动标记作品已交付", () => {
  const a = parseArtifact(clone()); a.roadmap = [];
  assert.equal(buildProgress(a).percent, 0);
  a.roadmap = [{ id: "one", title: "One", status: "DONE", order: 1, archived: false }];
  assert.equal(buildProgress(a).percent, 100); assert.equal(a.status, "BUILDING");
});

test("重复 ID/序号、断链、非法日期和状态被拒绝", () => {
  const mutations = [
    [(a) => a.roadmap.push({ ...a.roadmap[0] }), /步骤 ID 不得重复/],
    [(a) => a.roadmap[1].order = a.roadmap[0].order, /步骤顺序 不得重复/],
    [(a) => a.logs[1].number = 1, /日志序号 不得重复/],
    [(a) => a.logs[0].roadmapStep = "deleted", /步骤不存在/],
    [(a) => a.roadmapChanges[0].stepId = "deleted", /步骤不存在/],
    [(a) => a.currentStep = "deleted", /步骤不存在/],
    [(a) => a.roadmap[2].archived = true, /当前步骤不得/],
    [(a) => a.roadmap[3].status = "DOING", /最多一个/],
    [(a) => a.logs[0].date = "2026-02-30", /有效 YYYY-MM-DD/],
    [(a) => a.status = "LIVE", /status 只能/],
    [(a) => a.publishState = "yes", /publishState 只能/],
    [(a) => a.liveSessions[0].startsAt = "2026-10-08T20:00:00", /带时区/],
    [(a) => a.liveSessions[0].endsAt = a.liveSessions[0].startsAt, /结束时间必须晚于/]
  ];
  for (const [mutate, message] of mutations) { const a = clone(); mutate(a); assert.throws(() => parseArtifact(a), message); }
});

test("直播到期切换，取消、结束和草稿作品不展示", () => {
  const a = parseArtifact(clone()); const before = Date.parse("2026-10-08T19:00:00+08:00");
  assert.equal(nextLive([a], before).id, "first-model");
  assert.equal(nextLive([a], Date.parse("2026-10-08T21:00:00+08:00")).id, "print-check");
  a.liveSessions[0].status = "completed";
  assert.equal(nextLive([a], before).id, "print-check");
  a.liveSessions[1].status = "cancelled";
  assert.equal(nextLive([a], before), null);
  a.liveSessions[0].status = "scheduled"; a.publishState = "draft";
  assert.equal(nextLive([a], before), null);
});

test("不安全 URL 和路径被拒绝，中文文件路径被编码", () => {
  for (const href of ["javascript:alert(1)", "http://example.com", "https://user:pass@example.com", "outputs/../secret", "outputs/%2e%2e/secret", "outputs/a\\secret", "outputs/a:secret", "/absolute.txt"]) {
    const a = clone(); a.logs[0].outputs[0].href = href; assert.throws(() => parseArtifact(a), /产出链接/);
  }
  const a = clone(); a.logs[0].video = "javascript:alert(1)"; assert.throws(() => parseArtifact(a), /HTTPS/);
  assert.equal(outputUrl("zh", "demo", "outputs/说明.txt"), "/build-assets/zh/demo/outputs/%E8%AF%B4%E6%98%8E.txt");
});

test("只能读取公开日志引用的文件，草稿和越界不可读取，缺失返回 null", async (t) => {
  const f = await fixture(t);
  assert.match((await readBuildOutput("zh", original.id, "outputs/spec-v1.txt", f.root)).data.toString(), /页面演示/);
  await fs.writeFile(path.join(f.root, "zh/desktop-ai-employee/outputs/private.txt"), "private");
  for (const href of ["outputs/private.txt", "artifact.json", "outputs/../artifact.json"]) assert.equal(await readBuildOutput("zh", original.id, href, f.root), null);
  const a = clone(); a.logs[0].outputs[0].href = "outputs/missing.txt"; await f.save(a);
  assert.equal(await readBuildOutput("zh", original.id, "outputs/missing.txt", f.root), null);
  a.publishState = "draft"; await f.save(a);
  assert.equal(await readBuildOutput("zh", original.id, "outputs/spec-v1.txt", f.root), null);
  assert.equal((await readBuildArtifacts("zh", f.root)).some((a) => a.id === original.id), false);
});

test("内容和文件修改立即可见；损坏 JSON 不静默返回空列表", async (t) => {
  const f = await fixture(t); const a = clone(); a.title = "Updated title"; await f.save(a);
  assert.equal((await readBuildArtifacts("zh", f.root))[0].title, "Updated title");
  await fs.writeFile(path.join(f.root, "zh/desktop-ai-employee/outputs/spec-v1.txt"), "Updated output");
  assert.equal((await readBuildOutput("zh", original.id, "outputs/spec-v1.txt", f.root)).data.toString(), "Updated output");
  await fs.writeFile(path.join(f.root, "zh/desktop-ai-employee/artifact.json"), "{ broken");
  await assert.rejects(readBuildArtifacts("zh", f.root), SyntaxError);
});

test("不存在根返回空列表；目录名与作品 ID 不符时拒绝", async (t) => {
  const f = await fixture(t); assert.deepEqual(await readBuildArtifacts("zh", path.join(f.root, "not-created")), []);
  const a = clone(); a.id = "wrong-id"; await f.save(a);
  await assert.rejects(readBuildArtifacts("zh", f.root), /ID 必须等于目录名/);
});

test("公开模型不包含草稿标题和文件引用", () => {
  assert.doesNotMatch(JSON.stringify(publicArtifact(parseArtifact(clone()))), /private-draft|private.txt|未公开的草稿/);
});
