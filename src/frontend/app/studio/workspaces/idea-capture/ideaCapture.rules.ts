import type { WritingIntentArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptWritingIntent: StageArtifactRule<WritingIntentArtifact> = (artifact) => {
  return artifact !== null
    && [artifact.rawIdea, artifact.topic, artifact.audience, artifact.purpose, artifact.platform, artifact.coreViewpoint, artifact.contentBoundary]
      .every((value) => value.trim().length > 0);
};