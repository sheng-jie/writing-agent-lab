import type { OutlineArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptOutlinePlanning: StageArtifactRule<OutlineArtifact> = (artifact) => {
  return artifact !== null && artifact.throughline.trim().length > 0 && artifact.sections.length > 0;
};