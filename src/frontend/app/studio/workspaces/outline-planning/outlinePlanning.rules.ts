import type { OutlineArtifact } from "../../studio.workflow";

export function canAcceptOutlinePlanning(artifact: OutlineArtifact | null) {
  return artifact !== null && artifact.throughline.trim().length > 0 && artifact.sections.length > 0;
}