import { DraftingWorkspace } from "./drafting";
import { IdeaCaptureWorkspace } from "./idea-capture";
import { ImagePlanningWorkspace } from "./image-planning";
import { OutlinePlanningWorkspace } from "./outline-planning";
import { PolishingWorkspace } from "./polishing";
import { TopicGenerationWorkspace } from "./topic-generation";
import { createStageWorkspaceAdapter } from "./workspace.adapter";
import type { StudioController } from "../studio.controller";

type WorkspaceProps = { controller: StudioController };

export function StepWorkspace({ controller }: WorkspaceProps) {
  const stageId = controller.workspace.activeWorkspaceId;
  const stage = controller.workflow.snapshot.stages[stageId];
  const workspaceResetKey = `${stageId}:${stage.status}:${stage.revision}`;

  // 强制在阶段重置后重挂载当前工作区，确保 AgentPanel 会话历史与本地状态同步清空。
  switch (stageId) {
    case "idea-capture":
      return <IdeaCaptureWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
    case "topic-generation":
      return <TopicGenerationWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
    case "outline-planning":
      return <OutlinePlanningWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
    case "drafting":
      return <DraftingWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
    case "polishing":
      return <PolishingWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
    case "image-planning":
      return <ImagePlanningWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId)} />;
  }
}
