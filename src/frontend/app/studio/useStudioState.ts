"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";

import { initialStudioProject, studioSteps } from "./studio.config";
import {
  canSelectWorkspace,
  createInitialWorkflow,
  getNextStageId,
  getStageAction,
  openWorkspace,
  resetWorkflowFromStage,
  studioStageIds,
  type StageArtifact,
  type StudioStageId,
} from "./studio.workflow";
import type { StudioConfirmation, StudioController, StudioProject, StudioUiState, WritingIntent } from "./studio.types";

const railStorageKey = "flowdraft-studio-rail";
const initialUiState: StudioUiState = {
  activeWorkspaceId: "idea-capture",
  collapsed: false,
  toast: { text: "", visible: false },
};

export function useStudioState(): StudioController {
  const [workflow, setWorkflow] = useState(() =>
    createInitialWorkflow({
      "topic-generation": { confirmedTopic: initialStudioProject.confirmedTopic },
      "outline-planning": { outline: initialStudioProject.outline },
      drafting: { draft: initialStudioProject.draft },
      polishing: { polishedDraft: initialStudioProject.polishedDraft },
      "image-planning": { imageBrief: initialStudioProject.imageBrief },
    }),
  );
  const [ui, setUi] = useState(initialUiState);
  const [project, setProject] = useState<StudioProject>(initialStudioProject);
  const [articleSaved, setArticleSaved] = useState(false);
  const [confirmation, setConfirmation] = useState<StudioConfirmation | null>(null);
  const toastTimer = useRef<number | null>(null);
  const agentResetRef = useRef<(() => void) | null>(null);
  const pendingConfirmationRef = useRef<(() => void) | null>(null);
  const activeStep = studioSteps.find((step) => step.id === ui.activeWorkspaceId) ?? studioSteps[0];
  const stageAction = getStageAction(workflow.stages[ui.activeWorkspaceId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setUi((current) => ({ ...current, collapsed: localStorage.getItem(railStorageKey) === "true" }));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const agentContext = useMemo(
    () => ({
      page: "studio-writing-workflow",
      activeWorkspace: activeStep.title,
      currentStage: studioSteps.find((step) => step.id === workflow.currentStageId)?.title ?? "未开始",
      workflow,
      writingIntent: project.writingIntent,
      constraints: {
        toolPolicy: activeStep.id === "idea-capture"
          ? "Use updateWritingIntent to maintain exactly these writing intent fields: rawIdea, topic, audience, purpose, platform, coreViewpoint, contentBoundary. Ask clarification questions when needed. Once all required fields are clear, call confirmWritingIntent and wait for the user to confirm."
          : "Use only tools registered by the active Studio workspace. Suggestions must not confirm a stage or advance the writing workflow.",
      },
    }),
    [activeStep.id, activeStep.title, project.writingIntent, workflow],
  );

  useAgentContext({
    description: "Current FlowDraft writing workflow snapshot. Browsing a workspace does not change the actual workflow stage or confirm an artifact.",
    value: agentContext,
  });

  function notify(text: string) {
    setUi((current) => ({ ...current, toast: { text, visible: true } }));
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setUi((current) => ({ ...current, toast: { ...current.toast, visible: false } }));
    }, 1800);
  }

  function toggleRail() {
    setUi((current) => {
      const collapsed = !current.collapsed;
      localStorage.setItem(railStorageKey, String(collapsed));
      return { ...current, collapsed };
    });
  }

  function updateProject(patch: Partial<StudioProject>) {
    const stagePatch = getActiveStageDraftPatch(ui.activeWorkspaceId, patch);
    if (stagePatch && workflow.stages[ui.activeWorkspaceId].status === "accepted") {
      notify("当前阶段已确认，请先重置后再修改");
      return;
    }

    setProject((current) => ({ ...current, ...patch }));
    if (stagePatch) updateStageDraft(ui.activeWorkspaceId, stagePatch);
  }

  function updateArtifact(stageId: StudioStageId, patch: Record<string, string>) {
    if (workflow.stages[stageId].status === "accepted") {
      notify("当前阶段已确认，请先重置后再修改");
      return;
    }

    setProject((current) => ({
      ...current,
      artifacts: {
        ...current.artifacts,
        [stageId]: { ...current.artifacts[stageId], ...patch },
      },
    }));
    updateStageDraft(stageId, patch);
  }

  function updateStageDraft(stageId: StudioStageId, patch: StageArtifact) {
    setWorkflow((current) => ({
      ...current,
      stages: {
        ...current.stages,
        [stageId]: {
          ...current.stages[stageId],
          draft: { ...current.stages[stageId].draft, ...patch },
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }

  function updateWritingIntent(patch: Partial<WritingIntent>) {
    const currentStage = workflow.stages["idea-capture"];
    if (currentStage.status === "accepted") {
      requestConfirmation("修改写作意图", "修改写作意图会清空选题、大纲、初稿、润色稿和配图稿。确认继续吗？", () => applyWritingIntentUpdate(patch));
      return false;
    }

    applyWritingIntentUpdate(patch);
    return true;
  }

  function applyWritingIntentUpdate(patch: Partial<WritingIntent>) {
    const currentStage = workflow.stages["idea-capture"];
    const nextIntent = {
      ...project.writingIntent,
      ...patch,
    };
    setProject((current) => ({ ...current, writingIntent: nextIntent }));
    if (currentStage.status === "accepted") {
      setWorkflow((current) => ({
        ...resetWorkflowFromStage(current, "idea-capture"),
        stages: {
          ...resetWorkflowFromStage(current, "idea-capture").stages,
          "idea-capture": { ...resetWorkflowFromStage(current, "idea-capture").stages["idea-capture"], draft: nextIntent },
        },
      }));
      notify("写作意图已更新，后续阶段已重置");
    } else {
      updateStageDraft("idea-capture", nextIntent);
    }
  }

  function confirmWritingIntent(patch: Partial<WritingIntent>) {
    const nextIntent = {
      ...project.writingIntent,
      ...patch,
    };
    setProject((current) => ({ ...current, writingIntent: nextIntent }));
    setWorkflow((current) => ({
      ...current,
      currentStageId: "topic-generation",
      stages: {
        ...current.stages,
        "idea-capture": { ...current.stages["idea-capture"], status: "accepted", draft: nextIntent, accepted: nextIntent, revision: current.stages["idea-capture"].revision + 1 },
        "topic-generation": current.stages["topic-generation"].status === "pending"
          ? { ...current.stages["topic-generation"], status: "in-progress" }
          : current.stages["topic-generation"],
      },
    }));
    notify("写作意图已确认，已可进入选题生成");
  }

  function registerAgentReset(reset: () => void) {
    agentResetRef.current = reset;
    return () => {
      if (agentResetRef.current === reset) agentResetRef.current = null;
    };
  }

  function requestConfirmation(title: string, description: string, onConfirm: () => void) {
    pendingConfirmationRef.current = onConfirm;
    setConfirmation({ title, description });
  }

  function confirmPendingAction() {
    const action = pendingConfirmationRef.current;
    pendingConfirmationRef.current = null;
    setConfirmation(null);
    action?.();
  }

  function cancelPendingAction() {
    pendingConfirmationRef.current = null;
    setConfirmation(null);
  }

  function restartIdeaCapture() {
    const hasDownstreamArtifacts = Object.values(workflow.stages).some((stage, index) => index > 0 && (stage.draft || stage.accepted));
    if (workflow.stages["idea-capture"].status === "accepted") {
      requestConfirmation("重新开始写作意图识别", hasDownstreamArtifacts ? "重新开始会清空选题、大纲、初稿、润色稿和配图稿。" : "当前写作意图识别结果将被清空。", applyRestartIdeaCapture);
      return false;
    }
    applyRestartIdeaCapture();
    return true;
  }

  function applyRestartIdeaCapture() {
    setProject((current) => ({ ...current, writingIntent: initialStudioProject.writingIntent }));
    setWorkflow((current) => ({
      ...resetWorkflowFromStage(current, "idea-capture"),
      stages: { ...resetWorkflowFromStage(current, "idea-capture").stages, "idea-capture": { ...resetWorkflowFromStage(current, "idea-capture").stages["idea-capture"], draft: null } },
    }));
    notify("已重新开始写作意图识别");
  }

  function selectWorkspace(stageId: StudioStageId) {
    if (!canSelectWorkspace(workflow, stageId)) {
      notify("请先完成前一阶段");
      return;
    }
    setUi((current) => ({ ...current, ...openWorkspace(current, stageId) }));
  }

  function goBack() {
    const index = studioSteps.findIndex((step) => step.id === ui.activeWorkspaceId);
    if (index > 0) selectWorkspace(studioSteps[index - 1].id);
  }

  function runStageAction() {
    const stageId = ui.activeWorkspaceId;
    const action = getStageAction(workflow.stages[stageId]);

    if (action.kind === "completed") {
      const nextStageId = getNextStageId(stageId);
      if (nextStageId) setUi((current) => ({ ...current, activeWorkspaceId: nextStageId }));
      return;
    }

    if (action.kind !== "advance") {
      notify("请先补齐当前阶段内容");
      return;
    }

    setWorkflow((current) => {
      const nextStageId = getNextStageId(stageId);
      return {
        ...current,
        currentStageId: nextStageId ?? stageId,
        stages: {
          ...current.stages,
          [stageId]: {
            ...current.stages[stageId],
            status: "accepted",
            accepted: current.stages[stageId].draft,
            revision: current.stages[stageId].revision + 1,
          },
          ...(nextStageId && current.stages[nextStageId].status === "pending"
            ? { [nextStageId]: { ...current.stages[nextStageId], status: "in-progress" } }
            : {}),
        },
      };
    });
    const nextStageId = getNextStageId(stageId);
    if (nextStageId) setUi((current) => ({ ...current, activeWorkspaceId: nextStageId }));
    notify(nextStageId ? "当前阶段已确认，已进入下一阶段" : "文章配图已确认，可以保存文章");
  }

  function resetStage() {
    const stageId = ui.activeWorkspaceId;
    const stage = workflow.stages[stageId];

    if (stage.status !== "accepted") {
      notify("仅已完成阶段可以重置");
      return;
    }

    const stageIndex = studioStageIds.indexOf(stageId);
    const hasDownstreamArtifacts = studioStageIds.slice(stageIndex + 1).some((id) => {
      const downstream = workflow.stages[id];
      return downstream.draft !== null || downstream.proposal !== null || downstream.accepted !== null;
    });

    if (hasDownstreamArtifacts) {
      requestConfirmation("重置当前阶段", "重置会清空当前及后续流程的全部产物。", () => applyStageReset(stageId));
      return;
    }

    applyStageReset(stageId);
  }

  function applyStageReset(stageId: StudioStageId) {
    agentResetRef.current?.();
    setWorkflow((current) => resetWorkflowFromStage(current, stageId));
    setProject((current) => clearProjectFromStage(current, stageId));
    setArticleSaved(false);
    selectWorkspace(stageId);
    notify("当前及后续流程产物已清空");
  }

  function saveArticle() {
    const finalStage = workflow.stages["image-planning"];
    if (finalStage.status !== "accepted") {
      notify("请先完成文章配图");
      return;
    }

    setArticleSaved(true);
    notify("文章已保存到本次会话中");
  }

  async function copyStage() {
    try {
      await navigator.clipboard.writeText(`《${project.title}》\n当前工作区：${activeStep.title}\n阶段状态：${workflow.stages[ui.activeWorkspaceId].status}`);
      notify("阶段内容已复制");
    } catch {
      notify("复制失败，请手动复制阶段内容");
    }
  }

  return {
    activeWorkspaceId: ui.activeWorkspaceId,
    activeStep,
    workflow,
    stageAction,
    ui,
    project,
    articleSaved,
    collapsed: ui.collapsed,
    toast: ui.toast,
    confirmation,
    selectWorkspace,
    toggleRail,
    updateProject,
    updateArtifact,
    updateWritingIntent,
    confirmWritingIntent,
    registerAgentReset,
    restartIdeaCapture,
    goBack,
    runStageAction,
    resetStage,
    saveArticle,
    copyStage,
    notify,
    confirmPendingAction,
    cancelPendingAction,
  };
}

function clearProjectFromStage(project: StudioProject, stageId: StudioStageId): StudioProject {
  const resetIndex = studioStageIds.indexOf(stageId);
  const fieldsByStage: Record<StudioStageId, (keyof StudioProject)[]> = {
    "idea-capture": ["writingIntent"],
    "topic-generation": ["confirmedTopic"],
    "outline-planning": ["outline"],
    drafting: ["draft"],
    polishing: ["polishedDraft"],
    "image-planning": ["imageBrief"],
  };
  const nextProject: StudioProject = { ...project, artifacts: { ...project.artifacts } };

  studioStageIds.slice(resetIndex).forEach((id) => {
    fieldsByStage[id].forEach((field) => {
      const value = project[field];
      if (typeof value === "string") nextProject[field] = "" as never;
      if (Array.isArray(value)) nextProject[field] = [] as never;
      if (field === "writingIntent") nextProject.writingIntent = initialStudioProject.writingIntent;
    });
    delete nextProject.artifacts[id];
  });

  return nextProject;
}

function getActiveStageDraftPatch(stageId: StudioStageId, patch: Partial<StudioProject>): StageArtifact | null {
  switch (stageId) {
    case "idea-capture":
      return patch.writingIntent === undefined ? null : patch.writingIntent;
    case "topic-generation":
      return patch.confirmedTopic === undefined ? null : { confirmedTopic: patch.confirmedTopic };
    case "outline-planning":
      return patch.outline === undefined ? null : { outline: patch.outline };
    case "drafting":
      return patch.draft === undefined ? null : { draft: patch.draft };
    case "polishing":
      return patch.polishedDraft === undefined ? null : { polishedDraft: patch.polishedDraft };
    case "image-planning":
      return patch.imageBrief === undefined ? null : { imageBrief: patch.imageBrief };
  }
}
