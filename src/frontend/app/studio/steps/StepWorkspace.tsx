import { DraftingWorkspace } from "./DraftingWorkspace";
import { HumanizingWorkspace } from "./HumanizingWorkspace";
import { IdeaCaptureWorkspace } from "./IdeaCaptureWorkspace";
import { ImagePlanningWorkspace } from "./ImagePlanningWorkspace";
import { OutlinePlanningWorkspace } from "./OutlinePlanningWorkspace";
import { PolishingWorkspace } from "./PolishingWorkspace";
import { PublishingWorkspace } from "./PublishingWorkspace";
import { TopicGenerationWorkspace } from "./TopicGenerationWorkspace";
import type { StudioController, StudioStepId } from "../studio.types";

type WorkspaceProps = { controller: StudioController };
type Workspace = (props: WorkspaceProps) => React.JSX.Element;

const workspaces: Record<StudioStepId, Workspace> = {
  "idea-capture": IdeaCaptureWorkspace,
  "topic-generation": TopicGenerationWorkspace,
  "outline-planning": OutlinePlanningWorkspace,
  drafting: DraftingWorkspace,
  polishing: PolishingWorkspace,
  humanizing: HumanizingWorkspace,
  "image-planning": ImagePlanningWorkspace,
  publishing: PublishingWorkspace,
};

export function StepWorkspace({ controller }: WorkspaceProps) {
  const Workspace = workspaces[controller.activeStepId];
  return <Workspace controller={controller} />;
}
