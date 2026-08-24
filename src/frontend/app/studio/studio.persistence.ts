import { z } from "zod";

import { studioStageIds, type WritingWorkflowSnapshot } from "./studio.workflow";

export const studioProgressStorageKey = "flowdraft-studio-progress";
const studioProgressVersion = 2 as const;

const writingIntentSchema = z.object({
  rawIdea: z.string(),
  topic: z.string(),
  audience: z.string(),
  purpose: z.string(),
  platform: z.string(),
  coreViewpoint: z.string(),
  contentBoundary: z.string(),
});
const topicCandidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  audience: z.string(),
  coreViewpoint: z.string(),
  angle: z.string(),
  excludedContent: z.string(),
});
const artifactSchemas = {
  "idea-capture": writingIntentSchema,
  "topic-generation": z.object({ candidates: z.array(topicCandidateSchema), selectedCandidateId: z.string() }),
  "outline-planning": z.object({
    throughline: z.string(),
    sections: z.array(z.object({ title: z.string(), task: z.string(), materialGap: z.string() })),
  }),
  drafting: z.object({ content: z.string() }),
  polishing: z.object({ content: z.string() }),
  "image-planning": z.object({
    title: z.string(),
    content: z.string(),
    illustrations: z.array(z.object({ placement: z.string(), purpose: z.string(), prompt: z.string(), url: z.string() })),
  }),
} as const;

function stageRecordSchema(artifactSchema: z.ZodType) {
  return z.object({
    status: z.enum(["pending", "in-progress", "accepted"]),
    artifact: artifactSchema.nullable(),
    generatedAt: z.string().nullable(),
    revision: z.number().int().nonnegative(),
    updatedAt: z.string().nullable(),
    upstreamRevision: z.number().int().nonnegative().nullable(),
  });
}

const workflowSchema = z.object({
  currentStageId: z.enum(studioStageIds),
  status: z.enum(["active", "completed"]),
  articleId: z.string().nullable(),
  stages: z.object({
    "idea-capture": stageRecordSchema(artifactSchemas["idea-capture"]),
    "topic-generation": stageRecordSchema(artifactSchemas["topic-generation"]),
    "outline-planning": stageRecordSchema(artifactSchemas["outline-planning"]),
    drafting: stageRecordSchema(artifactSchemas.drafting),
    polishing: stageRecordSchema(artifactSchemas.polishing),
    "image-planning": stageRecordSchema(artifactSchemas["image-planning"]),
  }),
});
const snapshotSchema = z.object({
  version: z.literal(studioProgressVersion),
  savedAt: z.string(),
  workflow: workflowSchema,
  activeWorkspaceId: z.enum(studioStageIds),
  agentMessages: z.record(z.string(), z.array(z.unknown())),
});

export type StudioProgressSnapshot = {
  version: typeof studioProgressVersion;
  savedAt: string;
  workflow: WritingWorkflowSnapshot;
  activeWorkspaceId: (typeof studioStageIds)[number];
  agentMessages: Record<string, unknown[]>;
};

export function loadStudioProgress(): StudioProgressSnapshot | null {
  if (typeof window === "undefined") return null;

  const serialized = window.localStorage.getItem(studioProgressStorageKey);
  if (serialized === null) return null;

  const progress = parseStudioProgress(serialized);
  if (progress) return progress;

  window.localStorage.removeItem(studioProgressStorageKey);
  return null;
}

export function parseStudioProgress(serialized: string): StudioProgressSnapshot | null {
  try {
    const result = snapshotSchema.safeParse(JSON.parse(serialized));
    return result.success ? result.data as StudioProgressSnapshot : null;
  } catch {
    return null;
  }
}

export function saveStudioProgress(snapshot: Omit<StudioProgressSnapshot, "version" | "savedAt">) {
  window.localStorage.setItem(studioProgressStorageKey, JSON.stringify({
    ...snapshot,
    version: studioProgressVersion,
    savedAt: new Date().toISOString(),
  } satisfies StudioProgressSnapshot));
}

export function clearStudioProgress() {
  window.localStorage.removeItem(studioProgressStorageKey);
}
