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

export type WritingIntentArtifact = {
  rawIdea: string;
  topic: string;
  audience: string;
  purpose: string;
  platform: string;
  coreViewpoint: string;
  contentBoundary: string;
};

export type TopicCandidate = {
  id: string;
  title: string;
  audience: string;
  coreViewpoint: string;
  angle: string;
  excludedContent: string;
};

export type TopicGenerationArtifact = {
  candidates: TopicCandidate[];
  selectedCandidateId: string;
};

export type OutlineSection = {
  title: string;
  task: string;
  materialGap: string;
};

export type OutlineArtifact = {
  throughline: string;
  sections: OutlineSection[];
};

export type DraftArtifact = { content: string };
export type PolishedDraftArtifact = { content: string };
export type Illustration = { placement: string; purpose: string; prompt: string; url: string };
export type ImagePlanningArtifact = { title: string; content: string; illustrations: Illustration[] };

export type StageArtifactMap = {
  "idea-capture": WritingIntentArtifact;
  "topic-generation": TopicGenerationArtifact;
  "outline-planning": OutlineArtifact;
  drafting: DraftArtifact;
  polishing: PolishedDraftArtifact;
  "image-planning": ImagePlanningArtifact;
};

export type StageArtifact = StageArtifactMap[StudioStageId];

export type StageRecord<TArtifact extends StageArtifact = StageArtifact> = {
  status: StageStatus;
  artifact: TArtifact | null;
  generatedAt: string | null;
  revision: number;
  updatedAt: string | null;
  upstreamRevision: number | null;
};

export type WritingWorkflowSnapshot = {
  currentStageId: StudioStageId;
  status: "active" | "completed";
  articleId: string | null;
  stages: { [K in StudioStageId]: StageRecord<StageArtifactMap[K]> };
};

export type StageAction =
  | { kind: "blocked"; label: "下一步"; hint: string }
  | { kind: "advance"; label: "下一步"; hint: string }
  | { kind: "completed"; label: "下一步"; hint: string };

export type WorkflowCommandFor<K extends StudioStageId> =
  | { type: "propose-artifact"; stageId: K; artifact: StageArtifactMap[K]; updatedAt: string }
  | { type: "update-artifact"; stageId: K; patch: Partial<StageArtifactMap[K]>; updatedAt: string };

export type WorkflowCommand =
  | { [K in StudioStageId]: WorkflowCommandFor<K> }[StudioStageId]
  | { type: "accept-stage"; stageId: StudioStageId; complete: boolean }
  | { type: "reset-stage"; stageId: StudioStageId }
  | { type: "complete-workflow"; articleId: string };

export type WorkflowCommandRejection =
  | "workflow-completed"
  | "stage-not-editable"
  | "stage-not-in-progress"
  | "stage-artifact-incomplete"
  | "stage-already-accepted"
  | "stage-not-accepted"
  | "upstream-stage-incomplete"
  | "image-planning-not-accepted";

export type WorkflowCommandResult =
  | { ok: true; workflow: WritingWorkflowSnapshot }
  | { ok: false; reason: WorkflowCommandRejection };

function createStageRecord(status: StageStatus): StageRecord {
  return {
    status,
    artifact: null,
    generatedAt: null,
    revision: 0,
    updatedAt: null,
    upstreamRevision: null,
  };
}

export function createInitialWorkflow(): WritingWorkflowSnapshot {
  return {
    currentStageId: "idea-capture",
    status: "active",
    articleId: null,
    stages: Object.fromEntries(
      studioStageIds.map((stageId) => {
        const stage = createStageRecord(stageId === "idea-capture" ? "in-progress" : "pending");
        return [stageId, stage];
      }),
    ) as WritingWorkflowSnapshot["stages"],
  };
}

export function executeWorkflowCommand(
  workflow: WritingWorkflowSnapshot,
  command: WorkflowCommand,
): WorkflowCommandResult {
  switch (command.type) {
    case "propose-artifact":
      if (workflow.status === "completed") return { ok: false, reason: "workflow-completed" };
      if (workflow.stages[command.stageId].status !== "in-progress") {
        return { ok: false, reason: "stage-not-in-progress" };
      }
      return {
        ok: true,
        workflow: proposeStageArtifact(workflow, command.stageId, command.artifact, command.updatedAt),
      };
    case "update-artifact":
      if (workflow.status === "completed") return { ok: false, reason: "workflow-completed" };
      if (workflow.stages[command.stageId].status === "accepted") {
        return { ok: false, reason: "stage-not-editable" };
      }
      return {
        ok: true,
        workflow: updateStageArtifactDraft(workflow, command.stageId, command.patch, command.updatedAt),
      };
    case "accept-stage": {
      if (workflow.status === "completed") return { ok: false, reason: "workflow-completed" };
      const stage = workflow.stages[command.stageId];
      if (stage.status === "accepted") return { ok: false, reason: "stage-already-accepted" };
      if (stage.generatedAt === null || !command.complete) {
        return { ok: false, reason: "stage-artifact-incomplete" };
      }
      return { ok: true, workflow: acceptStageArtifact(workflow, command.stageId) };
    }
    case "reset-stage": {
      if (workflow.status === "completed") return { ok: false, reason: "workflow-completed" };
      if (workflow.stages[command.stageId].status !== "accepted") {
        return { ok: false, reason: "stage-not-accepted" };
      }
      return { ok: true, workflow: resetWorkflowFromStage(workflow, command.stageId) };
    }
    case "complete-workflow":
      if (workflow.status === "completed") return { ok: false, reason: "workflow-completed" };
      if (workflow.stages["image-planning"].status !== "accepted") {
        return { ok: false, reason: "image-planning-not-accepted" };
      }
      return { ok: true, workflow: completeWorkflow(workflow, command.articleId) };
  }
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

function resetWorkflowFromStage(workflow: WritingWorkflowSnapshot, stageId: StudioStageId): WritingWorkflowSnapshot {
  if (workflow.status === "completed") return workflow;
  const resetIndex = studioStageIds.indexOf(stageId);

  return {
    ...workflow,
    currentStageId: stageId,
    stages: Object.fromEntries(
      studioStageIds.map((id, index) => {
        if (index < resetIndex) return [id, workflow.stages[id]];

        return [id, createStageRecord(id === stageId ? "in-progress" : "pending")];
      }),
    ) as WritingWorkflowSnapshot["stages"],
  };
}

function updateStageArtifactDraft<K extends StudioStageId>(
  workflow: WritingWorkflowSnapshot,
  stageId: K,
  patch: Partial<StageArtifactMap[K]>,
  updatedAt: string,
): WritingWorkflowSnapshot {
  const stage = workflow.stages[stageId];
  if (workflow.status === "completed" || stage.status === "accepted") return workflow;

  return {
    ...workflow,
    stages: {
      ...workflow.stages,
      [stageId]: {
        ...stage,
        artifact: { ...stage.artifact, ...patch },
        updatedAt,
      },
    } as WritingWorkflowSnapshot["stages"],
  };
}

function proposeStageArtifact<K extends StudioStageId>(
  workflow: WritingWorkflowSnapshot,
  stageId: K,
  artifact: StageArtifactMap[K],
  updatedAt: string,
): WritingWorkflowSnapshot {
  const stage = workflow.stages[stageId];
  if (workflow.status === "completed" || stage.status !== "in-progress") return workflow;

  return {
    ...workflow,
    stages: {
      ...workflow.stages,
      [stageId]: {
        ...stage,
        artifact,
        generatedAt: updatedAt,
        updatedAt,
      },
    } as WritingWorkflowSnapshot["stages"],
  };
}

function acceptStageArtifact(workflow: WritingWorkflowSnapshot, stageId: StudioStageId): WritingWorkflowSnapshot {
  const stage = workflow.stages[stageId];
  if (stage.status === "accepted" || stage.generatedAt === null) return workflow;
  const nextStageId = getNextStageId(stageId);

  return {
    ...workflow,
    currentStageId: nextStageId ?? stageId,
    stages: {
      ...workflow.stages,
      [stageId]: {
        ...stage,
        status: "accepted",
        revision: stage.revision + 1,
      },
      ...(nextStageId && workflow.stages[nextStageId].status === "pending"
        ? { [nextStageId]: { ...workflow.stages[nextStageId], status: "in-progress" as const } }
        : {}),
    },
  };
}

export function getStageAction(stage: StageRecord, agentRunning = false, candidateRequired = false, stageComplete = false): StageAction {
  switch (stage.status) {
    case "pending":
      return { kind: "blocked", label: "下一步", hint: "请先完成前一阶段。" };
    case "in-progress":
      if (agentRunning && hasStageContent(stage, candidateRequired, stageComplete)) {
        return { kind: "blocked", label: "下一步", hint: "Agent 处理完成后才能进入下一步。" };
      }
      return hasStageContent(stage, candidateRequired, stageComplete)
        ? { kind: "advance", label: "下一步", hint: "完成当前内容后，即可确认并继续。" }
        : { kind: "blocked", label: "下一步", hint: "请先完成当前阶段内容。" };
    case "accepted":
      return { kind: "completed", label: "下一步", hint: "当前阶段已确认；如需修改，请先重置。" };
  }
}

function hasStageContent(stage: StageRecord, candidateRequired: boolean, stageComplete: boolean) {
  if (candidateRequired && stage.generatedAt === null) return false;
  return stage.updatedAt !== null && stage.artifact !== null && stageComplete;
}

function completeWorkflow(workflow: WritingWorkflowSnapshot, articleId: string): WritingWorkflowSnapshot {
  if (workflow.status === "completed" || workflow.stages["image-planning"].status !== "accepted") return workflow;
  return { ...workflow, status: "completed", articleId };
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
