import { DraftingWorkspace } from "./DraftingWorkspace";
import { IdeaCaptureWorkspace } from "./IdeaCaptureWorkspace";
import { ImagePlanningWorkspace } from "./ImagePlanningWorkspace";
import { OutlinePlanningWorkspace } from "./OutlinePlanningWorkspace";
import { PolishingWorkspace } from "./PolishingWorkspace";
import { TopicGenerationWorkspace } from "./TopicGenerationWorkspace";
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
