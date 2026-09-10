import { z } from "zod";

import { studioStageIds, type WritingWorkflowSnapshot } from "./studio.workflow";
import { stageArtifactSchemas } from "./studio.artifact-schemas";

export const studioProgressStorageKey = "flowdraft-studio-progress";
const studioProgressVersion = 2 as const;

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
    "idea-capture": stageRecordSchema(stageArtifactSchemas["idea-capture"]),
    "topic-generation": stageRecordSchema(stageArtifactSchemas["topic-generation"]),
    "outline-planning": stageRecordSchema(stageArtifactSchemas["outline-planning"]),
    drafting: stageRecordSchema(stageArtifactSchemas.drafting),
    polishing: stageRecordSchema(stageArtifactSchemas.polishing),
    "image-planning": stageRecordSchema(stageArtifactSchemas["image-planning"]),
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
