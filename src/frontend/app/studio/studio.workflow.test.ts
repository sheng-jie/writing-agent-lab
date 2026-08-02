import { describe, expect, it } from "vitest";

import {
  createInitialWorkflow,
  canSelectWorkspace,
  getNextStageId,
  getStageAction,
  getWorkflowProgress,
  openWorkspace,
  resetWorkflowFromStage,
  studioStageIds,
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

  it("为三种阶段状态给出相应的可执行动作", () => {
    const workflow = createInitialWorkflow({ "idea-capture": { writingIntent: "写一篇文章" } });
    workflow.stages["idea-capture"].updatedAt = "2026-08-02T00:00:00.000Z";

    expect(getStageAction(workflow.stages["idea-capture"])).toMatchObject({
      kind: "advance",
      label: "下一步",
    });
    workflow.stages["idea-capture"].draft = null;
    expect(getStageAction(workflow.stages["idea-capture"])).toMatchObject({
      kind: "blocked",
      label: "下一步",
    });
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
});
