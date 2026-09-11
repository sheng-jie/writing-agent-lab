import type { TopicGenerationArtifact } from "../../workflow/studio-workflow";
import type { StageArtifactRule } from "../stage-artifact-rule";

export const canAcceptTopicGeneration: StageArtifactRule<TopicGenerationArtifact> = (artifact) => {
  return artifact !== null
    && artifact.candidates.length >= 2
    && artifact.candidates.some((candidate) => candidate.id === artifact.selectedCandidateId);
};