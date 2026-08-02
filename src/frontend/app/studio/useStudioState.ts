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
  type StudioStageId,
} from "./studio.workflow";
import type { StudioController, StudioProject, StudioUiState } from "./studio.types";

const railStorageKey = "flowdraft-studio-rail";
const initialUiState: StudioUiState = {
  activeWorkspaceId: "idea-capture",
  collapsed: false,
  toast: { text: "", visible: false },
};

export function useStudioState(): StudioController {
  const [workflow, setWorkflow] = useState(() =>
    createInitialWorkflow({
      "idea-capture": { writingIntent: initialStudioProject.writingIntent },
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
  const toastTimer = useRef<number | null>(null);
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
      constraints: {
        toolPolicy: "Use only tools registered by the active Studio workspace. Suggestions must not confirm a stage or advance the writing workflow.",
      },
    }),
    [activeStep.title, workflow],
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

  function updateStageDraft(stageId: StudioStageId, patch: Record<string, string | string[]>) {
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

  function addIdea() {
    setProject((current) => ({ ...current, ideas: ["新捕捉的灵感", ...current.ideas] }));
    updateStageDraft("idea-capture", { ideas: ["新捕捉的灵感", ...project.ideas] });
    notify("已加入素材卡片");
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

    if (action.kind !== "advance") {
      notify(action.kind === "completed" ? "当前阶段已确认，如需修改请先重置" : "请先补齐当前阶段内容");
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

    if (hasDownstreamArtifacts && !window.confirm("重置会清空当前及后续流程的全部产物，是否继续？")) return;

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
    selectWorkspace,
    toggleRail,
    updateProject,
    updateArtifact,
    addIdea,
    goBack,
    runStageAction,
    resetStage,
    saveArticle,
    copyStage,
    notify,
  };
}

function clearProjectFromStage(project: StudioProject, stageId: StudioStageId): StudioProject {
  const resetIndex = studioStageIds.indexOf(stageId);
  const fieldsByStage: Record<StudioStageId, (keyof StudioProject)[]> = {
    "idea-capture": ["ideas", "writingIntent"],
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
    });
    delete nextProject.artifacts[id];
  });

  return nextProject;
}

function getActiveStageDraftPatch(stageId: StudioStageId, patch: Partial<StudioProject>): Record<string, string | string[]> | null {
  switch (stageId) {
    case "idea-capture":
      return patch.writingIntent === undefined ? null : { writingIntent: patch.writingIntent };
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
