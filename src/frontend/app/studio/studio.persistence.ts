import { z } from "zod";

import { studioStageIds, type WritingWorkflowSnapshot } from "./studio.workflow";
import type { StudioProject } from "./studio.types";

export const studioProgressStorageKey = "flowdraft-studio-progress";
const studioProgressVersion = 1 as const;

const stageArtifactValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(stageArtifactValueSchema),
    z.record(z.string(), stageArtifactValueSchema),
  ]),
);
const stageArtifactSchema = z.record(z.string(), stageArtifactValueSchema);
const stageRecordSchema = z.object({
  status: z.enum(["pending", "in-progress", "accepted"]),
  draft: stageArtifactSchema.nullable(),
  proposal: stageArtifactSchema.nullable(),
  accepted: stageArtifactSchema.nullable(),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().nullable(),
  upstreamRevision: z.number().int().nonnegative().nullable(),
});
const workflowSchema = z.object({
  currentStageId: z.enum(studioStageIds),
  stages: z.object(Object.fromEntries(studioStageIds.map((id) => [id, stageRecordSchema])) as Record<(typeof studioStageIds)[number], typeof stageRecordSchema>),
});
const writingIntentSchema = z.object({
  rawIdea: z.string(),
  topic: z.string(),
  audience: z.string(),
  purpose: z.string(),
  platform: z.string(),
  coreViewpoint: z.string(),
  contentBoundary: z.string(),
});
const projectSchema = z.object({
  title: z.string(),
  writingIntent: writingIntentSchema,
  confirmedTopic: z.string(),
  outline: z.array(z.string()),
  draft: z.string(),
  polishedDraft: z.string(),
  imageBrief: z.string(),
  artifacts: z.partialRecord(z.enum(studioStageIds), z.record(z.string(), z.string())),
});
const snapshotSchema = z.object({
  version: z.literal(studioProgressVersion),
  savedAt: z.string(),
  workflow: workflowSchema,
  project: projectSchema,
  activeWorkspaceId: z.enum(studioStageIds),
  articleSaved: z.boolean(),
  agentMessages: z.record(z.string(), z.array(z.unknown())),
});

export type StudioProgressSnapshot = {
  version: typeof studioProgressVersion;
  savedAt: string;
  workflow: WritingWorkflowSnapshot;
  project: StudioProject;
  activeWorkspaceId: (typeof studioStageIds)[number];
  articleSaved: boolean;
  agentMessages: Record<string, unknown[]>;
};

export function loadStudioProgress(): StudioProgressSnapshot | null {
  if (typeof window === "undefined") return null;

  const serialized = window.localStorage.getItem(studioProgressStorageKey);
  if (serialized === null) return null;

  try {
    const progress = parseStudioProgress(serialized);
    if (progress) return progress;
  } catch {
    // Invalid snapshots are discarded as a whole below.
  }

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