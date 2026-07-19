export const studioStageIds = [
  "idea-capture",
  "topic-generation",
  "outline-planning",
  "drafting",
  "polishing",
  "image-planning",
] as const;

export type StudioStageId = (typeof studioStageIds)[number];

export type StageStatus =
  | "locked"
  | "in-progress"
  | "ready-for-review"
  | "accepted"
  | "needs-revision"
  | "stale";

export type StageArtifact = Record<string, string | string[]>;

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
  | { kind: "blocked"; label: "等待前一步确认"; hint: string }
  | { kind: "submit-for-review"; label: "提交审阅"; hint: string }
  | { kind: "accept"; label: "确认当前产物"; hint: string }
  | { kind: "reopen"; label: "重新编辑"; hint: string }
  | { kind: "revise"; label: "处理待补项"; hint: string }
  | { kind: "review-stale"; label: "检查旧版产物"; hint: string };

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
        const stage = createStageRecord(stageId === "idea-capture" ? "in-progress" : "locked");
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

export function getStageAction(stage: StageRecord): StageAction {
  switch (stage.status) {
    case "locked":
      return { kind: "blocked", label: "等待前一步确认", hint: "确认前一阶段产物后才能继续。" };
    case "in-progress":
      return { kind: "submit-for-review", label: "提交审阅", hint: "完成当前草稿后，提交给自己审阅确认。" };
    case "ready-for-review":
      return { kind: "accept", label: "确认当前产物", hint: "确认后，该产物会成为下一阶段的输入。" };
    case "accepted":
      return { kind: "reopen", label: "重新编辑", hint: "已确认产物可回看或重新打开。" };
    case "needs-revision":
      return { kind: "revise", label: "处理待补项", hint: "补齐当前阶段缺口后再提交审阅。" };
    case "stale":
      return { kind: "review-stale", label: "检查旧版产物", hint: "该产物基于旧版上游内容，需要重新检查。" };
  }
}

export function getStageStateLabel(status: StageStatus) {
  switch (status) {
    case "locked":
      return "等待前一步";
    case "in-progress":
      return "进行中";
    case "ready-for-review":
      return "待确认";
    case "accepted":
      return "已确认";
    case "needs-revision":
      return "需补充";
    case "stale":
      return "需检查";
  }
}
