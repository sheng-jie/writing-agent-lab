import type { PolishedDraftArtifact } from "../../workflow/studio-workflow";

export function canAcceptPolishing(artifact: PolishedDraftArtifact | null) {
  return artifact !== null && artifact.content.trim().length > 0;
}