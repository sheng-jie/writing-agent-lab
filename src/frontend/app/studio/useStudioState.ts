"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentMessage } from "@/components/agent/useAgentChat";

import { initialStudioProject, studioAgentByStage, studioSteps } from "./studio.config";
import {
  clearStudioProgress,
  loadStudioProgress,
  parseStudioProgress,
  saveStudioProgress,
  studioProgressStorageKey,
  type StudioProgressSnapshot,
} from "./studio.persistence";
import {
  canSelectWorkspace,
  createInitialWorkflow,
  getNextStageId,
  getStageAction,
  openWorkspace,
  proposeStageArtifact,
  resolveStageAcceptance,
  resetWorkflowFromStage,
  studioStageIds,
  type StageArtifact,
  type StudioStageId,
  updateStageArtifactDraft,
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
  const [agentRunning, setAgentRunning] = useState(false);
  const [confirmation, setConfirmation] = useState<StudioConfirmation | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [agentDraftActive, setAgentDraftActive] = useState(false);
  const [externalProgress, setExternalProgress] = useState<StudioProgressSnapshot | null>(null);
  const [agentMessagesRestoreKey, setAgentMessagesRestoreKey] = useState(0);
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Record<string, AgentMessage[]>>({});
  const toastTimer = useRef<number | null>(null);
  const agentResetRef = useRef<(() => void) | null>(null);
  const pendingConfirmationRef = useRef<(() => boolean | void) | null>(null);
  const skipNextSaveRef = useRef(false);
  const activeStep = studioSteps.find((step) => step.id === ui.activeWorkspaceId) ?? studioSteps[0];
  const externallyBusyRef = useRef(false);
  externallyBusyRef.current = agentRunning || agentDraftActive;
  const stageAction = progressHydrated
    ? getStageAction(
        workflow.stages[ui.activeWorkspaceId],
        agentRunning,
        ui.activeWorkspaceId === "idea-capture",
      )
    : { kind: "blocked" as const, label: "下一步" as const, hint: "正在恢复上次进度。" };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hadStoredProgress = localStorage.getItem(studioProgressStorageKey) !== null;
      const progress = loadStudioProgress();
      if (progress) {
        setWorkflow(progress.workflow);
        setProject(progress.project);
        setArticleSaved(progress.articleSaved);
        setAgentMessages(progress.agentMessages as Record<string, AgentMessage[]>);
      }
      setUi((current) => ({
        ...current,
        activeWorkspaceId: progress?.activeWorkspaceId ?? current.activeWorkspaceId,
        collapsed: localStorage.getItem(railStorageKey) === "true",
        toast: !progress && hadStoredProgress
          ? { text: "上次进度无法恢复，已重新开始", visible: true }
          : current.toast,
      }));
      setProgressHydrated(true);
      setAgentMessagesRestoreKey((current) => current + 1);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== studioProgressStorageKey || event.newValue === null) return;
      const progress = parseStudioProgress(event.newValue);
      if (!progress) return;

      if (externallyBusyRef.current) {
        setExternalProgress(progress);
        return;
      }

      applyProgress(progress);
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!progressHydrated || workflow.stages["idea-capture"].status !== "accepted") return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      try {
        saveStudioProgress({
          workflow,
          project,
          activeWorkspaceId: ui.activeWorkspaceId,
          articleSaved,
          agentMessages,
        });
        setSaveWarning(null);
      } catch {
        setSaveWarning("当前修改尚未保存");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [agentMessages, articleSaved, progressHydrated, project, ui.activeWorkspaceId, workflow]);

  function notify(text: string) {
    setUi((current) => ({ ...current, toast: { text, visible: true } }));
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setUi((current) => ({ ...current, toast: { ...current.toast, visible: false } }));
    }, 1800);
  }

  function applyProgress(progress: StudioProgressSnapshot) {
    skipNextSaveRef.current = true;
    setWorkflow(progress.workflow);
    setProject(progress.project);
    setArticleSaved(progress.articleSaved);
    setAgentMessages(progress.agentMessages as Record<string, AgentMessage[]>);
    setAgentMessagesRestoreKey((current) => current + 1);
    setUi((current) => ({ ...current, activeWorkspaceId: progress.activeWorkspaceId }));
    setExternalProgress(null);
    setSaveWarning(null);
  }

  function loadExternalProgress() {
    if (externalProgress) applyProgress(externalProgress);
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
    setWorkflow((current) => updateStageArtifactDraft(current, stageId, patch, new Date().toISOString()));
  }

  function updateWritingIntent(patch: Partial<WritingIntent>) {
    const currentStage = workflow.stages["idea-capture"];
    if (currentStage.status === "accepted") {
      notify("写作意图已确认，请重新开始后再修改");
      return false;
    }

    applyWritingIntentUpdate(patch);
    return true;
  }

  function applyWritingIntentUpdate(patch: Partial<WritingIntent>) {
    const nextIntent = {
      ...project.writingIntent,
      ...patch,
    };
    setProject((current) => ({ ...current, writingIntent: nextIntent }));
    updateStageDraft("idea-capture", nextIntent);
  }

  function proposeWritingIntent(patch: Partial<WritingIntent>) {
    const nextIntent = {
      ...project.writingIntent,
      ...patch,
    };
    setProject((current) => ({ ...current, writingIntent: nextIntent }));
    setWorkflow((current) => proposeStageArtifact(current, "idea-capture", nextIntent, new Date().toISOString()));
    notify("结构化写作意图已生成，可以继续修正");
  }

  function registerAgentReset(reset: () => void) {
    agentResetRef.current = reset;
    return () => {
      if (agentResetRef.current === reset) agentResetRef.current = null;
    };
  }

  function getAgentMessages(agentId: string) {
    return progressHydrated ? agentMessages[agentId] ?? [] : undefined;
  }

  function updateAgentMessages(agentId: string, messages: AgentMessage[]) {
    if (!progressHydrated) return;
    setAgentMessages((current) => current[agentId] === messages ? current : { ...current, [agentId]: messages });
  }

  function requestConfirmation(title: string, description: string, onConfirm: () => boolean | void) {
    pendingConfirmationRef.current = onConfirm;
    setConfirmation({ title, description });
  }

  function confirmPendingAction() {
    const action = pendingConfirmationRef.current;
    if (action?.() === false) return;
    pendingConfirmationRef.current = null;
    setConfirmation(null);
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
    clearStudioProgress();
    setAgentMessages({});
    setAgentMessagesRestoreKey((current) => current + 1);
    agentResetRef.current?.();
    setProject((current) => clearProjectFromStage(current, "idea-capture"));
    setWorkflow((current) => {
      return resetWorkflowFromStage(current, "idea-capture");
    });
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
    const action = getStageAction(workflow.stages[stageId], agentRunning, stageId === "idea-capture");

    if (action.kind === "completed") {
      const nextStageId = getNextStageId(stageId);
      if (nextStageId) setUi((current) => ({ ...current, activeWorkspaceId: nextStageId }));
      return;
    }

    if (action.kind !== "advance") {
      notify("请先补齐当前阶段内容");
      return;
    }

    if (agentRunning) {
      notify("Agent 处理完成后才能进入下一步");
      return;
    }

    if (stageId === "idea-capture") {
      const intent = project.writingIntent;
      requestConfirmation(
        "确认写作意图并进入选题生成",
        `确认后，捕捉想法阶段将锁定并进入选题生成。写作主题：${intent.topic || "未填写"}；目标读者：${intent.audience || "未填写"}；核心观点：${intent.coreViewpoint || "未填写"}。`,
        () => {
          const acceptedWorkflow = resolveStageAcceptance(workflow, stageId, "confirm");
          try {
            saveStudioProgress({
              workflow: acceptedWorkflow,
              project,
              activeWorkspaceId: "topic-generation",
              articleSaved,
              agentMessages,
            });
            setSaveWarning(null);
          } catch {
            setSaveWarning("进度保存失败，尚未进入下一阶段");
            return false;
          }
          setWorkflow(acceptedWorkflow);
          setUi((current) => ({ ...current, activeWorkspaceId: "topic-generation" }));
          notify("写作意图已确认，已进入选题生成");
          return true;
        },
      );
      return;
    }

    setWorkflow((current) => {
      return resolveStageAcceptance(current, stageId, "confirm");
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
    const resetIndex = studioStageIds.indexOf(stageId);
    const resetAgentIds = new Set(studioStageIds.slice(resetIndex).map((id) => studioAgentByStage[id]));

    setAgentMessages((current) => Object.fromEntries(
      Object.entries(current).filter(([agentId]) => !resetAgentIds.has(agentId)),
    ));
    setAgentMessagesRestoreKey((current) => current + 1);
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
    agentRunning,
    saveWarning,
    externalProgressAvailable: externalProgress !== null,
    agentMessagesRestoreKey,
    collapsed: ui.collapsed,
    toast: ui.toast,
    confirmation,
    selectWorkspace,
    toggleRail,
    updateProject,
    updateArtifact,
    updateWritingIntent,
    proposeWritingIntent,
    setAgentRunning,
    setAgentDraftActive,
    registerAgentReset,
    getAgentMessages,
    updateAgentMessages,
    loadExternalProgress,
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
