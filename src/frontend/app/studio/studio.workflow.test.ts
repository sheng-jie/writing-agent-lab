import { describe, expect, it } from "vitest";

import {
  createInitialWorkflow,
  getNextStageId,
  getStageAction,
  getWorkflowProgress,
  openWorkspace,
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

  it("为不同阶段状态给出相应的可执行动作", () => {
    const workflow = createInitialWorkflow();

    expect(getStageAction(workflow.stages["idea-capture"])).toMatchObject({
      kind: "submit-for-review",
      label: "提交审阅",
    });
    expect(getStageAction(workflow.stages["topic-generation"])).toMatchObject({
      kind: "blocked",
      label: "等待前一步确认",
    });

    workflow.stages["idea-capture"].status = "ready-for-review";
    expect(getStageAction(workflow.stages["idea-capture"])).toMatchObject({
      kind: "accept",
      label: "确认当前产物",
    });
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
