import type { DraftArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptDrafting: StageArtifactRule<DraftArtifact> = (artifact) => {
  return artifact !== null && artifact.content.trim().length > 0;
};