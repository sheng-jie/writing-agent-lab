"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { stageArtifactSchemas } from "../studio.artifact-schemas";

import type { StageWorkspaceAdapter } from "./workspace.adapter";
import type { StageArtifactMap, StudioStageId } from "../studio.workflow";

const toolConfigs = {
  "topic-generation": { name: "generateTopicCandidates", description: "Generate the complete topic candidate list. Leave selectedCandidateId empty until the user chooses." },
  "outline-planning": { name: "generateWritingOutline", description: "Generate the complete writing outline with throughline, section tasks, and material gaps." },
  drafting: { name: "generateArticleDraft", description: "Generate the complete first draft." },
  polishing: { name: "generatePolishedDraft", description: "Generate the complete polished draft." },
  "image-planning": { name: "generateIllustratedDraft", description: "Generate the complete illustrated draft with final title, content, and illustration plan." },
} as const;

type GeneratedStageId = Exclude<keyof typeof stageArtifactSchemas, "idea-capture">;

export function StudioStepCopilotTools<K extends GeneratedStageId>({ workspace }: {
  workspace: StageWorkspaceAdapter<K>;
}) {
  const { agentId } = workspace;
  const stageId = workspace.step.id as K;
  const config = toolConfigs[stageId];
  const parameters = stageArtifactSchemas[stageId] as unknown as import("zod").ZodType<StageArtifactMap[K]>;

  useFrontendTool(
    {
      name: config.name,
      agentId,
      description: config.description,
      parameters,
      handler: async (artifact: StageArtifactMap[K]) => {
        const generated = workspace.generateArtifact(artifact);
        return { ok: generated, stage: workspace.step.title };
      },
    },
    [agentId, stageId, workspace],
  );

  return null;
}
