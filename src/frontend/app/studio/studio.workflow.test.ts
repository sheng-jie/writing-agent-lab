import { describe, expect, it } from "vitest";

import {
  createInitialWorkflow,
  executeWorkflowCommand,
  getNextStageId,
  getStageAction,
  getWorkflowProgress,
  studioStageIds,
  type WritingIntentArtifact,
} from "./studio.workflow";

const writingIntent: WritingIntentArtifact = {
  rawIdea: "想写 Agent 产品工程",
  topic: "Agent 产品工程",
  audience: "独立开发者",
  purpose: "帮助读者形成开发顺序",
  platform: "微信公众号",
  coreViewpoint: "先闭环再扩展",
  contentBoundary: "不讨论模型训练",
};

function acceptIdeaCapture() {
  const generated = executeWorkflowCommand(createInitialWorkflow(), { type: "propose-artifact", stageId: "idea-capture", artifact: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
  if (!generated.ok) throw new Error(generated.reason);
  const accepted = executeWorkflowCommand(generated.workflow, { type: "accept-stage", stageId: "idea-capture", complete: true });
  if (!accepted.ok) throw new Error(accepted.reason);
  return accepted.workflow;
}

describe("当前写作工作流", () => {
  it("从六个空阶段开始，只有捕捉想法处于进行中", () => {
    const workflow = createInitialWorkflow();

    expect(studioStageIds).toEqual([
      "idea-capture",
      "topic-generation",
      "outline-planning",
      "drafting",
      "polishing",
      "image-planning",
    ]);
    expect(workflow.status).toBe("active");
    expect(workflow.stages["idea-capture"]).toMatchObject({ status: "in-progress", artifact: null });
    expect(workflow.stages["topic-generation"]).toMatchObject({ status: "pending", artifact: null });
  });

  it("完整生成写入唯一 artifact 并开放下一步", () => {
    const result = executeWorkflowCommand(createInitialWorkflow(), { type: "propose-artifact", stageId: "idea-capture", artifact: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
    if (!result.ok) throw new Error(result.reason);
    const generated = result.workflow;

    expect(generated.stages["idea-capture"]).toEqual({
      status: "in-progress",
      artifact: writingIntent,
      generatedAt: "2026-08-08T00:00:00.000Z",
      revision: 0,
      updatedAt: "2026-08-08T00:00:00.000Z",
      upstreamRevision: null,
    });
    expect(getStageAction(generated.stages["idea-capture"], false, true, true).kind).toBe("advance");
    expect(getStageAction(generated.stages["idea-capture"], true, true, true).kind).toBe("blocked");
  });

  it("局部修正更新同一个 artifact 并保留生成事实", () => {
    const proposed = executeWorkflowCommand(createInitialWorkflow(), { type: "propose-artifact", stageId: "idea-capture", artifact: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
    if (!proposed.ok) throw new Error(proposed.reason);
    const updatedResult = executeWorkflowCommand(proposed.workflow, { type: "update-artifact", stageId: "idea-capture", patch: { topic: "可演进的 Agent 产品工程" }, updatedAt: "2026-08-08T00:01:00.000Z" });
    if (!updatedResult.ok) throw new Error(updatedResult.reason);
    const updated = updatedResult.workflow;

    expect(updated.stages["idea-capture"].artifact).toEqual({ ...writingIntent, topic: "可演进的 Agent 产品工程" });
    expect(updated.stages["idea-capture"].generatedAt).toBe("2026-08-08T00:00:00.000Z");
  });

  it("未经过完整生成动作的局部草稿不能接受", () => {
    const result = executeWorkflowCommand(createInitialWorkflow(), { type: "update-artifact", stageId: "idea-capture", patch: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
    if (!result.ok) throw new Error(result.reason);
    const updated = result.workflow;

    expect(getStageAction(updated.stages["idea-capture"], false, true, false).kind).toBe("blocked");
    const acceptance = executeWorkflowCommand(updated, { type: "accept-stage", stageId: "idea-capture", complete: false });
    expect(acceptance).toEqual({ ok: false, reason: "stage-artifact-incomplete" });
  });

  it("接受当前 artifact 并原子进入下一阶段", () => {
    const proposed = executeWorkflowCommand(createInitialWorkflow(), { type: "propose-artifact", stageId: "idea-capture", artifact: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
    if (!proposed.ok) throw new Error(proposed.reason);
    const acceptedResult = executeWorkflowCommand(proposed.workflow, { type: "accept-stage", stageId: "idea-capture", complete: true });
    if (!acceptedResult.ok) throw new Error(acceptedResult.reason);
    const accepted = acceptedResult.workflow;

    expect(accepted.currentStageId).toBe("topic-generation");
    expect(accepted.stages["idea-capture"]).toMatchObject({ status: "accepted", artifact: writingIntent, revision: 1 });
    expect(accepted.stages["topic-generation"].status).toBe("in-progress");
    expect(getWorkflowProgress(accepted)).toEqual({ acceptedCount: 1, percentage: 17 });
  });

  it("取消接受不改变工作流", () => {
    const result = executeWorkflowCommand(createInitialWorkflow(), { type: "propose-artifact", stageId: "idea-capture", artifact: writingIntent, updatedAt: "2026-08-08T00:00:00.000Z" });
    if (!result.ok) throw new Error(result.reason);
    expect(result.workflow).toEqual(result.workflow);
  });

  it("重置清空当前及下游 artifact 并保留上游", () => {
    const ideaAccepted = acceptIdeaCapture();
    const topicsResult = executeWorkflowCommand(ideaAccepted, { type: "propose-artifact", stageId: "topic-generation", artifact: {
      candidates: [{ id: "topic-1", title: "Agent 产品工程", audience: "独立开发者", coreViewpoint: "先闭环", angle: "开发顺序", excludedContent: "模型训练" }],
      selectedCandidateId: "topic-1",
    }, updatedAt: "2026-08-08T00:01:00.000Z" });
    if (!topicsResult.ok) throw new Error(topicsResult.reason);
    const topicsAcceptedResult = executeWorkflowCommand(topicsResult.workflow, { type: "accept-stage", stageId: "topic-generation", complete: true });
    if (!topicsAcceptedResult.ok) throw new Error(topicsAcceptedResult.reason);
    const resetResult = executeWorkflowCommand(topicsAcceptedResult.workflow, { type: "reset-stage", stageId: "topic-generation" });
    if (!resetResult.ok) throw new Error(resetResult.reason);
    const reset = resetResult.workflow;

    expect(reset.stages["idea-capture"].status).toBe("accepted");
    expect(reset.stages["idea-capture"].artifact).toEqual(writingIntent);
    expect(reset.stages["topic-generation"]).toMatchObject({ status: "in-progress", artifact: null, generatedAt: null });
    expect(reset.stages["outline-planning"]).toMatchObject({ status: "pending", artifact: null, generatedAt: null });
  });

  it("选题列表生成后必须形成确定选题才能接受", () => {
    const ideaAccepted = acceptIdeaCapture();
    const generatedResult = executeWorkflowCommand(ideaAccepted, { type: "propose-artifact", stageId: "topic-generation", artifact: {
      candidates: [{ id: "topic-1", title: "Agent 产品工程", audience: "独立开发者", coreViewpoint: "先闭环", angle: "开发顺序", excludedContent: "模型训练" }],
      selectedCandidateId: "",
    }, updatedAt: "2026-08-08T00:01:00.000Z" });
    if (!generatedResult.ok) throw new Error(generatedResult.reason);
    const generated = generatedResult.workflow;

    expect(getStageAction(generated.stages["topic-generation"], false, true, false).kind).toBe("blocked");
    expect(executeWorkflowCommand(generated, { type: "accept-stage", stageId: "topic-generation", complete: false })).toEqual({ ok: false, reason: "stage-artifact-incomplete" });

    const selectedResult = executeWorkflowCommand(generated, { type: "update-artifact", stageId: "topic-generation", patch: { selectedCandidateId: "topic-1" }, updatedAt: "2026-08-08T00:02:00.000Z" });
    if (!selectedResult.ok) throw new Error(selectedResult.reason);
    const selected = selectedResult.workflow;
    expect(getStageAction(selected.stages["topic-generation"], false, true, true).kind).toBe("advance");
  });

  it("只有当前阶段和已接受阶段可以浏览", () => {
    const workflow = acceptIdeaCapture();
    expect(workflow.currentStageId).toBe("topic-generation");
    expect(workflow.stages["topic-generation"].status).toBe("in-progress");
    expect(workflow.stages["outline-planning"].status).toBe("pending");
  });

  it("文章形成后工作流结束且拒绝重置", () => {
    let workflow = createInitialWorkflow();
    for (const [stageId, artifact] of [
      ["idea-capture", writingIntent],
      ["topic-generation", { candidates: [{ id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" }], selectedCandidateId: "topic-1" }],
      ["outline-planning", { throughline: "主线", sections: [{ title: "开场", task: "提出问题", materialGap: "" }] }],
      ["drafting", { content: "初稿" }],
      ["polishing", { content: "润色稿" }],
      ["image-planning", { title: "定稿标题", content: "定稿正文", illustrations: [] }],
    ] as const) {
      const proposed = executeWorkflowCommand(workflow, { type: "propose-artifact", stageId, artifact, updatedAt: "2026-08-08T00:00:00.000Z" } as never);
      if (!proposed.ok) throw new Error(proposed.reason);
      const accepted = executeWorkflowCommand(proposed.workflow, { type: "accept-stage", stageId, complete: true });
      if (!accepted.ok) throw new Error(accepted.reason);
      workflow = accepted.workflow;
    }

    const completedResult = executeWorkflowCommand(workflow, { type: "complete-workflow", articleId: "article-1" });
    if (!completedResult.ok) throw new Error(completedResult.reason);
    const completed = completedResult.workflow;
    expect(completed).toMatchObject({ status: "completed", articleId: "article-1" });
    expect(executeWorkflowCommand(completed, { type: "reset-stage", stageId: "idea-capture" })).toEqual({ ok: false, reason: "workflow-completed" });
  });

  it("浏览位置不改变当前阶段", () => {
    const workflow = createInitialWorkflow();
    const activeWorkspaceId = "image-planning";
    expect(activeWorkspaceId).toBe("image-planning");
    expect(workflow.currentStageId).toBe("idea-capture");
  });

  it("解析正式阶段顺序", () => {
    expect(getNextStageId("idea-capture")).toBe("topic-generation");
    expect(getNextStageId("polishing")).toBe("image-planning");
    expect(getNextStageId("image-planning")).toBeNull();
  });
});
