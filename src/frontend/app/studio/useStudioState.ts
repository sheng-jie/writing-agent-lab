"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";

import { initialStudioProject, studioSteps } from "./studio.config";
import { createInitialWorkflow, getNextStageId, getStageAction, openWorkspace, type StudioStageId } from "./studio.workflow";
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
    setProject((current) => ({ ...current, ...patch }));
    const stagePatch = getActiveStageDraftPatch(ui.activeWorkspaceId, patch);
    if (stagePatch) updateStageDraft(ui.activeWorkspaceId, stagePatch);
  }

  function updateArtifact(stageId: StudioStageId, patch: Record<string, string>) {
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
    setUi((current) => ({ ...current, ...openWorkspace(current, stageId) }));
  }

  function goBack() {
    const index = studioSteps.findIndex((step) => step.id === ui.activeWorkspaceId);
    if (index > 0) selectWorkspace(studioSteps[index - 1].id);
  }

  function runStageAction() {
    const stageId = ui.activeWorkspaceId;
    const action = getStageAction(workflow.stages[stageId]);

    if (action.kind === "blocked") {
      notify("请先确认前一阶段产物");
      return;
    }

    if (action.kind === "reopen" || action.kind === "review-stale" || action.kind === "revise") {
      setWorkflow((current) => ({
        ...current,
        currentStageId: stageId,
        stages: {
          ...current.stages,
          [stageId]: { ...current.stages[stageId], status: "in-progress" },
        },
      }));
      notify(action.kind === "reopen" ? "已重新打开当前阶段" : "已进入编辑状态，请处理当前产物");
      return;
    }

    if (action.kind === "submit-for-review") {
      setWorkflow((current) => ({
        ...current,
        stages: {
          ...current.stages,
          [stageId]: { ...current.stages[stageId], status: "ready-for-review" },
        },
      }));
      notify("当前草稿已提交审阅");
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
          ...(nextStageId && current.stages[nextStageId].status === "locked"
            ? { [nextStageId]: { ...current.stages[nextStageId], status: "in-progress" } }
            : {}),
        },
      };
    });
    notify("当前阶段产物已确认");
  }

  function save() {
    notify("当前工作区草稿已保留在本次会话中");
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
    collapsed: ui.collapsed,
    toast: ui.toast,
    selectWorkspace,
    toggleRail,
    updateProject,
    updateArtifact,
    addIdea,
    goBack,
    runStageAction,
    save,
    copyStage,
    notify,
  };
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
