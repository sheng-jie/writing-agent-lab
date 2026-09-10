"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import type { StudioController } from "../studio.controller";
import type { StageArtifactMap, StudioStageId } from "../studio.workflow";

const topicCandidateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  audience: z.string().min(1),
  coreViewpoint: z.string().min(1),
  angle: z.string().min(1),
  excludedContent: z.string(),
});
const artifactSchemas = {
  "topic-generation": z.object({ candidates: z.array(topicCandidateSchema).min(2), selectedCandidateId: z.string() }),
  "outline-planning": z.object({
    throughline: z.string().min(1),
    sections: z.array(z.object({ title: z.string().min(1), task: z.string().min(1), materialGap: z.string() })).min(1),
  }),
  drafting: z.object({ content: z.string().min(1) }),
  polishing: z.object({ content: z.string().min(1) }),
  "image-planning": z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    illustrations: z.array(z.object({ placement: z.string().min(1), purpose: z.string().min(1), prompt: z.string().min(1), url: z.string() })),
  }),
} satisfies { [K in Exclude<StudioStageId, "idea-capture">]: z.ZodType<StageArtifactMap[K]> };

const toolConfigs = {
  "topic-generation": { name: "generateTopicCandidates", description: "Generate the complete topic candidate list. Leave selectedCandidateId empty until the user chooses." },
  "outline-planning": { name: "generateWritingOutline", description: "Generate the complete writing outline with throughline, section tasks, and material gaps." },
  drafting: { name: "generateArticleDraft", description: "Generate the complete first draft." },
  polishing: { name: "generatePolishedDraft", description: "Generate the complete polished draft." },
  "image-planning": { name: "generateIllustratedDraft", description: "Generate the complete illustrated draft with final title, content, and illustration plan." },
} as const;

type GeneratedStageId = keyof typeof artifactSchemas;

export function StudioStepCopilotTools<K extends GeneratedStageId>({ stageId, agentId, controller }: {
  stageId: K;
  agentId: string;
  controller: StudioController;
}) {
  const config = toolConfigs[stageId];
  const parameters = artifactSchemas[stageId] as unknown as z.ZodType<StageArtifactMap[K]>;

  useFrontendTool(
    {
      name: config.name,
      agentId,
      description: config.description,
      parameters,
      handler: async (artifact: StageArtifactMap[K]) => {
        const generated = controller.workflow.generateStageArtifact(stageId, artifact);
        return { ok: generated, stage: controller.workspace.activeStep.title };
      },
    },
    [agentId, controller, stageId],
  );

  return null;
}
