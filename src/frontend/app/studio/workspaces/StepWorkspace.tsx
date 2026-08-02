import { DraftingWorkspace } from "./drafting";
import { IdeaCaptureWorkspace } from "./idea-capture";
import { ImagePlanningWorkspace } from "./image-planning";
import { OutlinePlanningWorkspace } from "./outline-planning";
import { PolishingWorkspace } from "./polishing";
import { TopicGenerationWorkspace } from "./topic-generation";
import type { StudioController } from "../studio.types";
import type { StudioStageId } from "../studio.workflow";

type WorkspaceProps = { controller: StudioController };
type Workspace = (props: WorkspaceProps) => React.JSX.Element;

const workspaces: Record<StudioStageId, Workspace> = {
  "idea-capture": IdeaCaptureWorkspace,
  "topic-generation": TopicGenerationWorkspace,
  "outline-planning": OutlinePlanningWorkspace,
  drafting: DraftingWorkspace,
  polishing: PolishingWorkspace,
  "image-planning": ImagePlanningWorkspace,
};

export function StepWorkspace({ controller }: WorkspaceProps) {
  const stageId = controller.activeWorkspaceId;
  const stage = controller.workflow.stages[stageId];
  const Workspace = workspaces[stageId];
  const workspaceResetKey = `${stageId}:${stage.status}:${stage.revision}`;

  // 强制在阶段重置后重挂载当前工作区，确保 AgentPanel 会话历史与本地状态同步清空。
  return <Workspace key={workspaceResetKey} controller={controller} />;
}
