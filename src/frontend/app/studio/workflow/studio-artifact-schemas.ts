import { z } from "zod";

import type { StageArtifactMap, StudioStageId } from "./studio-workflow";

const writingIntentSchema = z.object({
  rawIdea: z.string().min(1),
  topic: z.string().min(1),
  audience: z.string().min(1),
  purpose: z.string().min(1),
  platform: z.string().min(1),
  coreViewpoint: z.string().min(1),
  contentBoundary: z.string().min(1),
});

const topicCandidateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  audience: z.string().min(1),
  coreViewpoint: z.string().min(1),
  angle: z.string().min(1),
  excludedContent: z.string(),
});

export const stageArtifactSchemas = {
  "idea-capture": writingIntentSchema,
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
} satisfies { [K in StudioStageId]: z.ZodType<StageArtifactMap[K]> };