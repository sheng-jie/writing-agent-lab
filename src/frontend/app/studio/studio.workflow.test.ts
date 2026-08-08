import { describe, expect, it } from "vitest";

import {
  createInitialWorkflow,
  canSelectWorkspace,
  getNextStageId,
  getStageAction,
  getWorkflowProgress,
  openWorkspace,
  proposeStageArtifact,
  resolveStageAcceptance,
  resetWorkflowFromStage,
  studioStageIds,
  updateStageArtifactDraft,
} from "./studio.workflow";

describe("Studio 写作工作流快照", () => {
  it("只定义六个正式阶段", () => {
    expect(studioStageIds).toEqual([
      "idea-capture",
      "topic-generation",
      "outline-planning",
      "drafting",
      "polishing",
      "image-planning",
    ]);
  });

  it("根据已确认阶段计算进度，而不是当前浏览位置", () => {
    const workflow = createInitialWorkflow();

    workflow.stages["idea-capture"].status = "accepted";
    workflow.stages["topic-generation"].status = "in-progress";

    expect(getWorkflowProgress(workflow)).toEqual({ acceptedCount: 1, percentage: 17 });
  });

  it("只有候选阶段产物可以开放下一步", () => {
    const workflow = createInitialWorkflow({ "idea-capture": { writingIntent: "写一篇文章" } });
    workflow.stages["idea-capture"].updatedAt = "2026-08-02T00:00:00.000Z";

    expect(getStageAction(workflow.stages["idea-capture"], false, true)).toMatchObject({
      kind: "blocked",
      label: "下一步",
    });
    workflow.stages["idea-capture"].proposal = { writingIntent: "写一篇文章" };
    expect(getStageAction(workflow.stages["idea-capture"], false, true)).toMatchObject({
      kind: "advance",
      label: "下一步",
    });
    expect(getStageAction(workflow.stages["idea-capture"], true, true)).toMatchObject({
      kind: "blocked",
      label: "下一步",
      hint: "Agent 处理完成后才能进入下一步。",
    });
  });

  it("生成候选写作意图后仍停留在捕捉想法阶段", () => {
    const workflow = createInitialWorkflow();
    const proposed = proposeStageArtifact(workflow, "idea-capture", {
      topic: "Agent 产品工程",
      audience: "独立开发者",
    }, "2026-08-08T00:00:00.000Z");

    expect(proposed.currentStageId).toBe("idea-capture");
    expect(proposed.stages["idea-capture"]).toMatchObject({
      status: "in-progress",
      draft: { topic: "Agent 产品工程", audience: "独立开发者" },
      proposal: { topic: "Agent 产品工程", audience: "独立开发者" },
      accepted: null,
      revision: 0,
    });
    expect(proposed.stages["topic-generation"].status).toBe("pending");
    expect(getWorkflowProgress(proposed)).toEqual({ acceptedCount: 0, percentage: 0 });
  });

  it("后续修正按字段合并并保留候选阶段产物", () => {
    const proposed = proposeStageArtifact(createInitialWorkflow(), "idea-capture", {
      topic: "旧主题",
      audience: "独立开发者",
    }, "2026-08-08T00:00:00.000Z");
    const updated = updateStageArtifactDraft(proposed, "idea-capture", {
      topic: "新主题",
    }, "2026-08-08T00:01:00.000Z");

    expect(updated.stages["idea-capture"].draft).toEqual({
      topic: "新主题",
      audience: "独立开发者",
    });
    expect(updated.stages["idea-capture"].proposal).toEqual({
      topic: "旧主题",
      audience: "独立开发者",
    });

    const regenerated = proposeStageArtifact(updated, "idea-capture", {
      coreViewpoint: "先闭环再扩展",
    }, "2026-08-08T00:02:00.000Z");
    expect(regenerated.stages["idea-capture"].proposal).toEqual({
      topic: "新主题",
      audience: "独立开发者",
      coreViewpoint: "先闭环再扩展",
    });
  });

  it("确认时固定当前草稿并原子进入选题生成", () => {
    const proposed = proposeStageArtifact(createInitialWorkflow(), "idea-capture", {
      topic: "旧主题",
      audience: "独立开发者",
    }, "2026-08-08T00:00:00.000Z");
    const updated = updateStageArtifactDraft(proposed, "idea-capture", { topic: "新主题" }, "2026-08-08T00:01:00.000Z");
    const accepted = resolveStageAcceptance(updated, "idea-capture", "confirm");

    expect(accepted.currentStageId).toBe("topic-generation");
    expect(accepted.stages["idea-capture"]).toMatchObject({
      status: "accepted",
      accepted: { topic: "新主题", audience: "独立开发者" },
      revision: 1,
    });
    expect(accepted.stages["topic-generation"].status).toBe("in-progress");
  });

  it("取消接受时保持工作流状态与产物不变", () => {
    const proposed = proposeStageArtifact(createInitialWorkflow(), "idea-capture", {
      topic: "Agent 产品工程",
      audience: "独立开发者",
    }, "2026-08-08T00:00:00.000Z");

    expect(resolveStageAcceptance(proposed, "idea-capture", "cancel")).toBe(proposed);
  });

  it("已接受阶段拒绝继续写入草稿或重复接受", () => {
    const proposed = proposeStageArtifact(createInitialWorkflow(), "idea-capture", {
      topic: "Agent 产品工程",
    }, "2026-08-08T00:00:00.000Z");
    const accepted = resolveStageAcceptance(proposed, "idea-capture", "confirm");

    expect(updateStageArtifactDraft(accepted, "idea-capture", { topic: "不应生效" }, "2026-08-08T00:01:00.000Z")).toBe(accepted);
    expect(resolveStageAcceptance(accepted, "idea-capture", "confirm")).toBe(accepted);
    expect(accepted.stages["idea-capture"].revision).toBe(1);
  });

  it("为 pending 和 accepted 阶段给出相应动作", () => {
    const workflow = createInitialWorkflow();
    workflow.stages["idea-capture"] = {
      ...workflow.stages["idea-capture"],
      draft: { writingIntent: "写一篇文章" },
      updatedAt: "2026-08-02T00:00:00.000Z",
    };
    expect(getStageAction(workflow.stages["topic-generation"])).toMatchObject({
      kind: "blocked",
      label: "下一步",
    });

    workflow.stages["idea-capture"].status = "accepted";
    expect(getStageAction(workflow.stages["idea-capture"])).toMatchObject({
      kind: "completed",
      label: "下一步",
    });
  });

  it("只允许进入当前阶段或已确认阶段", () => {
    const workflow = createInitialWorkflow();
    workflow.stages["idea-capture"].status = "accepted";
    workflow.stages["topic-generation"].status = "in-progress";
    workflow.currentStageId = "topic-generation";

    expect(canSelectWorkspace(workflow, "idea-capture")).toBe(true);
    expect(canSelectWorkspace(workflow, "topic-generation")).toBe(true);
    expect(canSelectWorkspace(workflow, "outline-planning")).toBe(false);
  });

  it("重置会清空当前及下游阶段，并回到当前阶段编辑", () => {
    const workflow = createInitialWorkflow();
    workflow.stages["idea-capture"] = {
      ...workflow.stages["idea-capture"],
      status: "accepted",
      draft: { writingIntent: "写一篇文章" },
      accepted: { writingIntent: "写一篇文章" },
    };
    workflow.stages["topic-generation"] = {
      ...workflow.stages["topic-generation"],
      status: "accepted",
      draft: { confirmedTopic: "确定选题" },
      accepted: { confirmedTopic: "确定选题" },
    };
    workflow.stages["outline-planning"] = {
      ...workflow.stages["outline-planning"],
      status: "in-progress",
      draft: { outline: ["章节一"] },
    };

    const reset = resetWorkflowFromStage(workflow, "topic-generation");

    expect(reset.currentStageId).toBe("topic-generation");
    expect(reset.stages["idea-capture"].status).toBe("accepted");
    expect(reset.stages["topic-generation"]).toMatchObject({ status: "in-progress", draft: null, accepted: null });
    expect(reset.stages["outline-planning"]).toMatchObject({ status: "pending", draft: null, accepted: null });
  });

  it("只在确认阶段后解析下一个正式阶段", () => {
    expect(getNextStageId("idea-capture")).toBe("topic-generation");
    expect(getNextStageId("polishing")).toBe("image-planning");
    expect(getNextStageId("image-planning")).toBeNull();
  });

  it("浏览其他工作区不会改变真实当前阶段或流程进度", () => {
    const workflow = createInitialWorkflow();
    const workspace = openWorkspace({ activeWorkspaceId: "idea-capture" }, "image-planning");

    expect(workspace.activeWorkspaceId).toBe("image-planning");
    expect(workflow.currentStageId).toBe("idea-capture");
    expect(getWorkflowProgress(workflow)).toEqual({ acceptedCount: 0, percentage: 0 });
  });

  it("上游写作意图变更会重置当前和所有下游阶段的状态和产物", () => {
    const workflow = createInitialWorkflow({
      "topic-generation": { confirmedTopic: "旧选题" },
      "outline-planning": { outline: ["旧大纲"] },
    });
    workflow.currentStageId = "outline-planning";
    workflow.stages["idea-capture"].status = "accepted";
    workflow.stages["topic-generation"].status = "accepted";
    workflow.stages["topic-generation"].accepted = { confirmedTopic: "旧选题" };
    workflow.stages["outline-planning"].status = "in-progress";

    const reset = resetWorkflowFromStage(workflow, "idea-capture");

    expect(reset.currentStageId).toBe("idea-capture");
    expect(reset.stages["idea-capture"]).toMatchObject({
      status: "in-progress",
      draft: null,
      accepted: null,
      revision: 0,
    });
    expect(reset.stages["topic-generation"]).toMatchObject({
      status: "pending",
      draft: null,
      accepted: null,
      revision: 0,
    });
    expect(reset.stages["outline-planning"]).toMatchObject({
      status: "pending",
      draft: null,
      accepted: null,
      revision: 0,
    });
  });
});
