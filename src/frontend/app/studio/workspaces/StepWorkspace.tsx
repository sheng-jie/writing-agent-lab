import { DraftingWorkspace } from "./drafting";
import { IdeaCaptureWorkspace } from "./idea-capture";
import { ImagePlanningWorkspace } from "./image-planning";
import { OutlinePlanningWorkspace } from "./outline-planning";
import { PolishingWorkspace } from "./polishing";
import { TopicGenerationWorkspace } from "./topic-generation";
import { createStageWorkspaceAdapter } from "./stageWorkspace.adapter";
import type { StudioController } from "../types/studio-controller";

type WorkspaceProps = { controller: StudioController };

export function StepWorkspace({ controller }: WorkspaceProps) {
  const stageId = controller.workspace.activeWorkspaceId;
  const workspaceResetKey = `${stageId}:${controller.progress.resetKey}`;
  const reportComplete = (complete: boolean) => {
    controller.workflow.reportStageComplete(stageId, complete);
  };

  // 仅由工作台统一发起的重置信号触发工作区重挂载，避免状态变化与重置语义分散。
  switch (stageId) {
    case "idea-capture":
      return <IdeaCaptureWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
    case "topic-generation":
      return <TopicGenerationWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
    case "outline-planning":
      return <OutlinePlanningWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
    case "drafting":
      return <DraftingWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
    case "polishing":
      return <PolishingWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
    case "image-planning":
      return <ImagePlanningWorkspace key={workspaceResetKey} workspace={createStageWorkspaceAdapter(controller, stageId, reportComplete)} />;
  }
}
