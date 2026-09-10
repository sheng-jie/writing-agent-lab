import type { TopicGenerationArtifact } from "../../studio.workflow";

export function canAcceptTopicGeneration(artifact: TopicGenerationArtifact | null) {
  return artifact !== null
    && artifact.candidates.length >= 2
    && artifact.candidates.some((candidate) => candidate.id === artifact.selectedCandidateId);
}