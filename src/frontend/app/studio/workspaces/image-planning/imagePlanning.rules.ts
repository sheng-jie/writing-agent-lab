import type { ImagePlanningArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptImagePlanning: StageArtifactRule<ImagePlanningArtifact> = (artifact) => {
  return artifact !== null && artifact.title.trim().length > 0 && artifact.content.trim().length > 0;
};