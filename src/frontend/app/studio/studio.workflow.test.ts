import { describe, expect, it } from "vitest";

import {
  canSelectWorkspace,
  completeWorkflow,
  createInitialWorkflow,
  getNextStageId,
  getStageAction,
  getWorkflowProgress,
  openWorkspace,
  proposeStageArtifact,
  resolveStageAcceptance,
  resetWorkflowFromStage,
  studioStageIds,
  updateStageArtifactDraft,
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
  return resolveStageAcceptance(
    proposeStageArtifact(createInitialWorkflow(), "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z"),
    "idea-capture",
    "confirm",
  );
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
    const generated = proposeStageArtifact(
      createInitialWorkflow(),
      "idea-capture",
      writingIntent,
      "2026-08-08T00:00:00.000Z",
    );

    expect(generated.stages["idea-capture"]).toEqual({
      status: "in-progress",
      artifact: writingIntent,
      generatedAt: "2026-08-08T00:00:00.000Z",
      revision: 0,
      updatedAt: "2026-08-08T00:00:00.000Z",
      upstreamRevision: null,
    });
    expect(getStageAction(generated.stages["idea-capture"], false, true).kind).toBe("advance");
    expect(getStageAction(generated.stages["idea-capture"], true, true).kind).toBe("blocked");
  });

  it("局部修正更新同一个 artifact 并保留生成事实", () => {
    const generated = proposeStageArtifact(createInitialWorkflow(), "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z");
    const updated = updateStageArtifactDraft(generated, "idea-capture", { topic: "可演进的 Agent 产品工程" }, "2026-08-08T00:01:00.000Z");

    expect(updated.stages["idea-capture"].artifact).toEqual({ ...writingIntent, topic: "可演进的 Agent 产品工程" });
    expect(updated.stages["idea-capture"].generatedAt).toBe("2026-08-08T00:00:00.000Z");
  });

  it("未经过完整生成动作的局部草稿不能接受", () => {
    const updated = updateStageArtifactDraft(createInitialWorkflow(), "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z");

    expect(getStageAction(updated.stages["idea-capture"], false, true).kind).toBe("blocked");
    expect(resolveStageAcceptance(updated, "idea-capture", "confirm")).toBe(updated);
  });

  it("接受当前 artifact 并原子进入下一阶段", () => {
    const generated = proposeStageArtifact(createInitialWorkflow(), "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z");
    const accepted = resolveStageAcceptance(generated, "idea-capture", "confirm");

    expect(accepted.currentStageId).toBe("topic-generation");
    expect(accepted.stages["idea-capture"]).toMatchObject({ status: "accepted", artifact: writingIntent, revision: 1 });
    expect(accepted.stages["topic-generation"].status).toBe("in-progress");
    expect(getWorkflowProgress(accepted)).toEqual({ acceptedCount: 1, percentage: 17 });
  });

  it("取消接受不改变工作流", () => {
    const generated = proposeStageArtifact(createInitialWorkflow(), "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z");
    expect(resolveStageAcceptance(generated, "idea-capture", "cancel")).toBe(generated);
  });

  it("重置清空当前及下游 artifact 并保留上游", () => {
    const ideaAccepted = acceptIdeaCapture();
    const topicsGenerated = proposeStageArtifact(ideaAccepted, "topic-generation", {
      candidates: [{ id: "topic-1", title: "Agent 产品工程", audience: "独立开发者", coreViewpoint: "先闭环", angle: "开发顺序", excludedContent: "模型训练" }],
      selectedCandidateId: "topic-1",
    }, "2026-08-08T00:01:00.000Z");
    const topicsAccepted = resolveStageAcceptance(topicsGenerated, "topic-generation", "confirm");
    const reset = resetWorkflowFromStage(topicsAccepted, "topic-generation");

    expect(reset.stages["idea-capture"].status).toBe("accepted");
    expect(reset.stages["idea-capture"].artifact).toEqual(writingIntent);
    expect(reset.stages["topic-generation"]).toMatchObject({ status: "in-progress", artifact: null, generatedAt: null });
    expect(reset.stages["outline-planning"]).toMatchObject({ status: "pending", artifact: null, generatedAt: null });
  });

  it("选题列表生成后必须形成确定选题才能接受", () => {
    const ideaAccepted = acceptIdeaCapture();
    const generated = proposeStageArtifact(ideaAccepted, "topic-generation", {
      candidates: [{ id: "topic-1", title: "Agent 产品工程", audience: "独立开发者", coreViewpoint: "先闭环", angle: "开发顺序", excludedContent: "模型训练" }],
      selectedCandidateId: "",
    }, "2026-08-08T00:01:00.000Z");

    expect(getStageAction(generated.stages["topic-generation"], false, true, "topic-generation").kind).toBe("blocked");
    expect(resolveStageAcceptance(generated, "topic-generation", "confirm")).toBe(generated);

    const selected = updateStageArtifactDraft(generated, "topic-generation", { selectedCandidateId: "topic-1" }, "2026-08-08T00:02:00.000Z");
    expect(getStageAction(selected.stages["topic-generation"], false, true, "topic-generation").kind).toBe("advance");
  });

  it("只有当前阶段和已接受阶段可以浏览", () => {
    const workflow = acceptIdeaCapture();
    expect(canSelectWorkspace(workflow, "idea-capture")).toBe(true);
    expect(canSelectWorkspace(workflow, "topic-generation")).toBe(true);
    expect(canSelectWorkspace(workflow, "outline-planning")).toBe(false);
  });

  it("文章形成后工作流结束且拒绝重置", () => {
    let workflow = createInitialWorkflow();
    workflow = proposeStageArtifact(workflow, "idea-capture", writingIntent, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "idea-capture", "confirm");
    workflow = proposeStageArtifact(workflow, "topic-generation", { candidates: [{ id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" }], selectedCandidateId: "topic-1" }, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "topic-generation", "confirm");
    workflow = proposeStageArtifact(workflow, "outline-planning", { throughline: "主线", sections: [{ title: "开场", task: "提出问题", materialGap: "" }] }, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "outline-planning", "confirm");
    workflow = proposeStageArtifact(workflow, "drafting", { content: "初稿" }, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "drafting", "confirm");
    workflow = proposeStageArtifact(workflow, "polishing", { content: "润色稿" }, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "polishing", "confirm");
    workflow = proposeStageArtifact(workflow, "image-planning", { title: "定稿标题", content: "定稿正文", illustrations: [] }, "2026-08-08T00:00:00.000Z");
    workflow = resolveStageAcceptance(workflow, "image-planning", "confirm");

    const completed = completeWorkflow(workflow, "article-1");
    expect(completed).toMatchObject({ status: "completed", articleId: "article-1" });
    expect(resetWorkflowFromStage(completed, "idea-capture")).toBe(completed);
  });

  it("浏览位置不改变当前阶段", () => {
    const workflow = createInitialWorkflow();
    const workspace = openWorkspace({ activeWorkspaceId: "idea-capture" }, "image-planning");
    expect(workspace.activeWorkspaceId).toBe("image-planning");
    expect(workflow.currentStageId).toBe("idea-capture");
  });

  it("解析正式阶段顺序", () => {
    expect(getNextStageId("idea-capture")).toBe("topic-generation");
    expect(getNextStageId("polishing")).toBe("image-planning");
    expect(getNextStageId("image-planning")).toBeNull();
  });
});
