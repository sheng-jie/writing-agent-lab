import type { PolishedDraftArtifact } from "../../studio.workflow";

export function canAcceptPolishing(artifact: PolishedDraftArtifact | null) {
  return artifact !== null && artifact.content.trim().length > 0;
}