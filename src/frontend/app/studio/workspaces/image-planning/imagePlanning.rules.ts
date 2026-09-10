import type { ImagePlanningArtifact } from "../../studio.workflow";

export function canAcceptImagePlanning(artifact: ImagePlanningArtifact | null) {
  return artifact !== null && artifact.title.trim().length > 0 && artifact.content.trim().length > 0;
}