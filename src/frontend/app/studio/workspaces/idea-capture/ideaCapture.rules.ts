import type { WritingIntentArtifact } from "../../studio.workflow";

export function canAcceptWritingIntent(artifact: WritingIntentArtifact | null) {
  return artifact !== null
    && [artifact.rawIdea, artifact.topic, artifact.audience, artifact.purpose, artifact.platform, artifact.coreViewpoint, artifact.contentBoundary]
      .every((value) => value.trim().length > 0);
}