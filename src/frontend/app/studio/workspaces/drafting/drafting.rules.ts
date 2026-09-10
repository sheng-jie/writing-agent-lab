import type { DraftArtifact } from "../../workflow/studio-workflow";

export function canAcceptDrafting(artifact: DraftArtifact | null) {
  return artifact !== null && artifact.content.trim().length > 0;
}