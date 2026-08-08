export const studioStageIds = [
  "idea-capture",
  "topic-generation",
  "outline-planning",
  "drafting",
  "polishing",
  "image-planning",
] as const;

export type StudioStageId = (typeof studioStageIds)[number];

export type StageStatus = "pending" | "in-progress" | "accepted";

export type StageArtifactValue = string | number | boolean | null | StageArtifact | StageArtifactValue[];

export interface StageArtifact {
  [key: string]: StageArtifactValue;
}

export type StageRecord = {
  status: StageStatus;
  draft: StageArtifact | null;
  proposal: StageArtifact | null;
  accepted: StageArtifact | null;
  revision: number;
  updatedAt: string | null;
  upstreamRevision: number | null;
};

export type WritingWorkflowSnapshot = {
  currentStageId: StudioStageId;
  stages: Record<StudioStageId, StageRecord>;
};

export type StudioWorkspaceState = {
  activeWorkspaceId: StudioStageId;
};

export type StageAction =
  | { kind: "blocked"; label: "下一步"; hint: string }
  | { kind: "advance"; label: "下一步"; hint: string }
  | { kind: "completed"; label: "下一步"; hint: string };

function createStageRecord(status: StageStatus): StageRecord {
  return {
    status,
    draft: null,
    proposal: null,
    accepted: null,
    revision: 0,
    updatedAt: null,
    upstreamRevision: null,
  };
}

export function createInitialWorkflow(initialDrafts: Partial<Record<StudioStageId, StageArtifact>> = {}): WritingWorkflowSnapshot {
  return {
    currentStageId: "idea-capture",
    stages: Object.fromEntries(
      studioStageIds.map((stageId) => {
        const stage = createStageRecord(stageId === "idea-capture" ? "in-progress" : "pending");
        stage.draft = initialDrafts[stageId] ?? null;
        return [stageId, stage];
      }),
    ) as Record<StudioStageId, StageRecord>,
  };
}

export function openWorkspace(state: StudioWorkspaceState, stageId: StudioStageId): StudioWorkspaceState {
  return { ...state, activeWorkspaceId: stageId };
}

export function getWorkflowProgress(workflow: WritingWorkflowSnapshot) {
  const acceptedCount = studioStageIds.filter((stageId) => workflow.stages[stageId].status === "accepted").length;

  return {
    acceptedCount,
    percentage: Math.round((acceptedCount / studioStageIds.length) * 100),
  };
}

export function getNextStageId(stageId: StudioStageId): StudioStageId | null {
  const index = studioStageIds.indexOf(stageId);
  return studioStageIds[index + 1] ?? null;
}

export function canSelectWorkspace(workflow: WritingWorkflowSnapshot, stageId: StudioStageId) {
  return stageId === workflow.currentStageId || workflow.stages[stageId].status === "accepted";
}

export function resetWorkflowFromStage(workflow: WritingWorkflowSnapshot, stageId: StudioStageId): WritingWorkflowSnapshot {
  const resetIndex = studioStageIds.indexOf(stageId);

  return {
    ...workflow,
    currentStageId: stageId,
    stages: Object.fromEntries(
      studioStageIds.map((id, index) => {
        if (index < resetIndex) return [id, workflow.stages[id]];

        return [id, createStageRecord(id === stageId ? "in-progress" : "pending")];
      }),
    ) as Record<StudioStageId, StageRecord>,
  };
}

export function updateStageArtifactDraft(
  workflow: WritingWorkflowSnapshot,
  stageId: StudioStageId,
  patch: StageArtifact,
  updatedAt: string,
): WritingWorkflowSnapshot {
  const stage = workflow.stages[stageId];
  if (stage.status === "accepted") return workflow;

  return {
    ...workflow,
    stages: {
      ...workflow.stages,
      [stageId]: {
        ...stage,
        draft: { ...stage.draft, ...patch },
        updatedAt,
      },
    },
  };
}

export function proposeStageArtifact(
  workflow: WritingWorkflowSnapshot,
  stageId: StudioStageId,
  artifact: StageArtifact,
  updatedAt: string,
): WritingWorkflowSnapshot {
  const updated = updateStageArtifactDraft(workflow, stageId, artifact, updatedAt);
  const stage = updated.stages[stageId];

  return {
    ...updated,
    stages: {
      ...updated.stages,
      [stageId]: {
        ...stage,
        proposal: stage.draft,
      },
    },
  };
}

export function acceptStageArtifact(workflow: WritingWorkflowSnapshot, stageId: StudioStageId): WritingWorkflowSnapshot {
  const stage = workflow.stages[stageId];
  if (stage.status === "accepted" || stage.proposal === null) return workflow;
  const nextStageId = getNextStageId(stageId);

  return {
    ...workflow,
    currentStageId: nextStageId ?? stageId,
    stages: {
      ...workflow.stages,
      [stageId]: {
        ...stage,
        status: "accepted",
        accepted: stage.draft,
        revision: stage.revision + 1,
      },
      ...(nextStageId && workflow.stages[nextStageId].status === "pending"
        ? { [nextStageId]: { ...workflow.stages[nextStageId], status: "in-progress" as const } }
        : {}),
    },
  };
}

export function resolveStageAcceptance(
  workflow: WritingWorkflowSnapshot,
  stageId: StudioStageId,
  decision: "cancel" | "confirm",
): WritingWorkflowSnapshot {
  return decision === "confirm" ? acceptStageArtifact(workflow, stageId) : workflow;
}

export function getStageAction(stage: StageRecord, agentRunning = false, candidateRequired = false): StageAction {
  switch (stage.status) {
    case "pending":
      return { kind: "blocked", label: "下一步", hint: "请先完成前一阶段。" };
    case "in-progress":
      if (agentRunning && hasStageContent(stage, candidateRequired)) {
        return { kind: "blocked", label: "下一步", hint: "Agent 处理完成后才能进入下一步。" };
      }
      return hasStageContent(stage, candidateRequired)
        ? { kind: "advance", label: "下一步", hint: "完成当前内容后，即可确认并继续。" }
        : { kind: "blocked", label: "下一步", hint: "请先完成当前阶段内容。" };
    case "accepted":
      return { kind: "completed", label: "下一步", hint: "当前阶段已确认；如需修改，请先重置。" };
  }
}

function hasStageContent(stage: StageRecord, candidateRequired: boolean) {
  const artifact = candidateRequired ? stage.proposal : stage.draft;
  return stage.updatedAt !== null && Object.values(artifact ?? {}).some(hasArtifactContent);
}

function hasArtifactContent(value: StageArtifactValue): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (value === null) return false;
  if (Array.isArray(value)) return value.some(hasArtifactContent);
  return Object.values(value).some(hasArtifactContent);
}

export function getStageStateLabel(status: StageStatus) {
  switch (status) {
    case "pending":
      return "未开始";
    case "in-progress":
      return "进行中";
    case "accepted":
      return "已确认";
  }
}
