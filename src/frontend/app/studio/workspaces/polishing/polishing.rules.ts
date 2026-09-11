import type { PolishedDraftArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptPolishing: StageArtifactRule<PolishedDraftArtifact> = (artifact) => {
  return artifact !== null && artifact.content.trim().length > 0;
};