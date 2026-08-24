"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentMessage } from "@/components/agent/useAgentChat";

import { studioAgentByStage, studioSteps } from "./studio.config";
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
  completeWorkflow,
  createInitialWorkflow,
  getNextStageId,
  getStageAction,
  openWorkspace,
  proposeStageArtifact,
  resolveStageAcceptance,
  resetWorkflowFromStage,
  studioStageIds,
  updateStageArtifactDraft,
  type StageArtifactMap,
  type StudioStageId,
} from "./studio.workflow";
import type { StudioConfirmation, StudioController, StudioUiState } from "./studio.types";

const railStorageKey = "flowdraft-studio-rail";
const initialUiState: StudioUiState = {
  activeWorkspaceId: "idea-capture",
  collapsed: false,
  toast: { text: "", visible: false },
};

export function useStudioState(): StudioController {
  const [workflow, setWorkflow] = useState(createInitialWorkflow);
  const [ui, setUi] = useState(initialUiState);
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
  const externallyBusyRef = useRef(false);
  const activeStep = studioSteps.find((step) => step.id === ui.activeWorkspaceId) ?? studioSteps[0];
  externallyBusyRef.current = agentRunning || agentDraftActive;
  const stageAction = progressHydrated
    ? getStageAction(workflow.stages[ui.activeWorkspaceId], agentRunning, true, ui.activeWorkspaceId)
    : { kind: "blocked" as const, label: "下一步" as const, hint: "正在恢复上次进度。" };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hadStoredProgress = localStorage.getItem(studioProgressStorageKey) !== null;
      const progress = loadStudioProgress();
      if (progress) applyProgress(progress);
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
        saveStudioProgress({ workflow, activeWorkspaceId: ui.activeWorkspaceId, agentMessages });
        setSaveWarning(null);
      } catch {
        setSaveWarning("当前修改尚未保存");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [agentMessages, progressHydrated, ui.activeWorkspaceId, workflow]);

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

  function getStageArtifact<K extends StudioStageId>(stageId: K): StageArtifactMap[K] | null {
    return workflow.stages[stageId].artifact;
  }

  function updateStageArtifact<K extends StudioStageId>(stageId: K, patch: Partial<StageArtifactMap[K]>) {
    if (workflow.status === "completed" || workflow.stages[stageId].status === "accepted") {
      notify("当前阶段已确认，请先重置后再修改");
      return false;
    }
    setWorkflow((current) => updateStageArtifactDraft(current, stageId, patch, new Date().toISOString()));
    return true;
  }

  function generateStageArtifact<K extends StudioStageId>(stageId: K, artifact: StageArtifactMap[K]) {
    if (workflow.status === "completed" || workflow.stages[stageId].status !== "in-progress") return false;
    setWorkflow((current) => proposeStageArtifact(current, stageId, artifact, new Date().toISOString()));
    notify("候选阶段产物已生成，可以继续修正");
    return true;
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
    if (workflow.status === "completed") return false;
    const hasProgress = studioStageIds.some((stageId) => workflow.stages[stageId].artifact !== null);
    if (workflow.stages["idea-capture"].status === "accepted") {
      requestConfirmation(
        "重新开始写作意图识别",
        hasProgress ? "重新开始会清空当前写作工作流的全部阶段产物。" : "当前写作意图识别结果将被清空。",
        applyRestartIdeaCapture,
      );
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
    setWorkflow(createInitialWorkflow());
    setUi((current) => ({ ...current, activeWorkspaceId: "idea-capture" }));
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
    const action = getStageAction(workflow.stages[stageId], agentRunning, true, stageId);
    if (action.kind === "completed") {
      const nextStageId = getNextStageId(stageId);
      if (nextStageId) setUi((current) => ({ ...current, activeWorkspaceId: nextStageId }));
      return;
    }
    if (action.kind !== "advance") {
      notify("请先生成完整的候选阶段产物");
      return;
    }
    if (agentRunning) {
      notify("Agent 处理完成后才能进入下一步");
      return;
    }

    const description = stageId === "idea-capture"
      ? describeWritingIntent(workflow.stages["idea-capture"].artifact)
      : `确认后，${activeStep.title}阶段将锁定并进入下一阶段。`;
    requestConfirmation(`确认${activeStep.title}并进入下一阶段`, description, () => acceptCurrentStage(stageId));
  }

  function acceptCurrentStage(stageId: StudioStageId) {
    const acceptedWorkflow = resolveStageAcceptance(workflow, stageId, "confirm");
    if (acceptedWorkflow === workflow) return false;
    const nextStageId = getNextStageId(stageId);
    try {
      saveStudioProgress({
        workflow: acceptedWorkflow,
        activeWorkspaceId: nextStageId ?? stageId,
        agentMessages,
      });
      setSaveWarning(null);
    } catch {
      setSaveWarning("进度保存失败，尚未进入下一阶段");
      return false;
    }
    setWorkflow(acceptedWorkflow);
    if (nextStageId) setUi((current) => ({ ...current, activeWorkspaceId: nextStageId }));
    notify(nextStageId ? "当前阶段已确认，已进入下一阶段" : "文章配图已确认，可以保存文章");
    return true;
  }

  function resetStage() {
    const stageId = ui.activeWorkspaceId;
    if (workflow.status === "completed" || workflow.stages[stageId].status !== "accepted") {
      notify("仅已完成阶段可以重置");
      return;
    }
    const stageIndex = studioStageIds.indexOf(stageId);
    const hasDownstreamArtifacts = studioStageIds.slice(stageIndex + 1).some((id) => workflow.stages[id].artifact !== null);
    if (hasDownstreamArtifacts) {
      requestConfirmation("重置当前阶段", "重置会清空当前及后续流程的全部产物。", () => applyStageReset(stageId));
      return;
    }
    applyStageReset(stageId);
  }

  function applyStageReset(stageId: StudioStageId) {
    const resetIndex = studioStageIds.indexOf(stageId);
    const resetAgentIds = new Set(studioStageIds.slice(resetIndex).map((id) => studioAgentByStage[id]));
    setAgentMessages((current) => Object.fromEntries(Object.entries(current).filter(([agentId]) => !resetAgentIds.has(agentId))));
    setAgentMessagesRestoreKey((current) => current + 1);
    agentResetRef.current?.();
    setWorkflow((current) => resetWorkflowFromStage(current, stageId));
    setUi((current) => ({ ...current, activeWorkspaceId: stageId }));
    notify("当前及后续流程产物已清空");
  }

  async function saveArticle() {
    const imagePlanning = workflow.stages["image-planning"];
    if (workflow.status === "completed" || imagePlanning.status !== "accepted" || imagePlanning.artifact === null) {
      notify("请先完成文章配图");
      return;
    }

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: imagePlanning.artifact.title, content: imagePlanning.artifact.content }),
      });
      if (!response.ok) throw new Error("Article save failed");
      const article = await response.json() as { id: string };
      setWorkflow((current) => completeWorkflow(current, article.id));
      notify("文章已保存");
    } catch {
      setSaveWarning("文章保存失败，请重试");
    }
  }

  function startNewWorkflow() {
    if (workflow.status !== "completed") return;
    clearStudioProgress();
    setWorkflow(createInitialWorkflow());
    setAgentMessages({});
    setAgentMessagesRestoreKey((current) => current + 1);
    setUi((current) => ({ ...current, activeWorkspaceId: "idea-capture" }));
    notify("已开始新的写作工作流");
  }

  async function copyStage() {
    const artifact = workflow.stages[ui.activeWorkspaceId].artifact;
    try {
      await navigator.clipboard.writeText(`${activeStep.title}\n${JSON.stringify(artifact, null, 2)}`);
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
    articleSaved: workflow.status === "completed",
    agentRunning,
    saveWarning,
    externalProgressAvailable: externalProgress !== null,
    agentMessagesRestoreKey,
    collapsed: ui.collapsed,
    toast: ui.toast,
    confirmation,
    selectWorkspace,
    toggleRail,
    getStageArtifact,
    updateStageArtifact,
    generateStageArtifact,
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
    startNewWorkflow,
    copyStage,
    notify,
    confirmPendingAction,
    cancelPendingAction,
  };
}

function describeWritingIntent(intent: StageArtifactMap["idea-capture"] | null) {
  if (!intent) return "请先生成结构化写作意图。";
  return `确认后，捕捉想法阶段将锁定并进入选题生成。写作主题：${intent.topic}；目标读者：${intent.audience}；核心观点：${intent.coreViewpoint}。`;
}
