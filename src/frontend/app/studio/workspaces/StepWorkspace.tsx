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
  const Workspace = workspaces[controller.activeWorkspaceId];
  return <Workspace controller={controller} />;
}
