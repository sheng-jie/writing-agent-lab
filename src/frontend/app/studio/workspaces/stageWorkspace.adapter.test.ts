import { describe, expect, it, vi } from "vitest";

import { createStageWorkspaceAdapter } from "./stageWorkspace.adapter";
import type { StudioController } from "../types/studio-controller";
import { createInitialWorkflow, type StageArtifactMap, type StudioStageId } from "../workflow/studio-workflow";

function createController(): StudioController {
  const workflow = createInitialWorkflow();

  return {
    workflow: {
      snapshot: workflow,
      stageAction: { kind: "blocked", label: "下一步", hint: "" },
      reportStageArtifact: vi.fn(),
      articleSaved: false,
      getStageArtifact: <K extends StudioStageId>(stageId: K) => workflow.stages[stageId].artifact as StageArtifactMap[K] | null,
      runStageAction: vi.fn(),
      resetStage: vi.fn(),
      saveArticle: vi.fn(async () => undefined),
      startNewWorkflow: vi.fn(),
    },
    workspace: {
      activeWorkspaceId: "topic-generation",
      activeStep: { id: "topic-generation", title: "选题生成", icon: "题", description: "", hint: "", missing: "", wordTarget: "" },
      selectWorkspace: vi.fn(),
      goBack: vi.fn(),
    },
    progress: {
      agentRunning: false,
      agentDraftActive: false,
      saveWarning: null,
      externalProgressAvailable: false,
      agentMessagesRestoreKey: 3,
      resetKey: 7,
      setAgentRunning: vi.fn(),
      setAgentDraftActive: vi.fn(),
      registerAgentReset: vi.fn(() => vi.fn()),
      getAgentMessages: vi.fn(() => []),
      updateAgentMessages: vi.fn(),
      loadExternalProgress: vi.fn(),
    },
    ui: {
      collapsed: false,
      toast: { text: "", visible: false },
      confirmation: null,
      toggleRail: vi.fn(),
      notify: vi.fn(),
      confirmPendingAction: vi.fn(),
      cancelPendingAction: vi.fn(),
    },
  };
}

describe("阶段工作区 adapter", () => {
  it("把领域命令和 Agent 会话绑定到当前阶段", () => {
    const controller = createController();
    const workspace = createStageWorkspaceAdapter(controller, "topic-generation");
    const artifact: StageArtifactMap["topic-generation"] = {
      candidates: [{ id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" }],
      selectedCandidateId: "topic-1",
    };

    workspace.reportArtifact({ ...artifact, selectedCandidateId: "topic-1" }, true);
    workspace.agent.getMessages();
    workspace.agent.updateMessages([{ id: "m1", role: "user", content: "旧对话" }]);

    expect("stageId" in workspace).toBe(false);
    expect(controller.workflow.reportStageArtifact).toHaveBeenCalledWith("topic-generation", { ...artifact, selectedCandidateId: "topic-1" }, true);
    expect(controller.progress.getAgentMessages).toHaveBeenCalledWith("studioTopicAgent");
    expect(controller.progress.updateAgentMessages).toHaveBeenCalledWith("studioTopicAgent", [{ id: "m1", role: "user", content: "旧对话" }]);
    expect(workspace.agentId).toBe("studioTopicAgent");
    expect(workspace.agent.restoreKey).toBe(3);
  });
});