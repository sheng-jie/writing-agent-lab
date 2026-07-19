"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";

import { initialStudioProject, studioSteps } from "./studio.config";
import type { StudioController, StudioProject, StudioStepId } from "./studio.types";

const railStorageKey = "flowdraft-studio-rail";

export function useStudioState(): StudioController {
  const [activeStepId, setActiveStepId] = useState<StudioStepId>(studioSteps[0].id);
  const [collapsed, setCollapsed] = useState(false);
  const [project, setProject] = useState<StudioProject>(initialStudioProject);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [toast, setToast] = useState({ text: "", visible: false });
  const toastTimer = useRef<number | null>(null);
  const activeStep = studioSteps.find((step) => step.id === activeStepId) ?? studioSteps[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCollapsed(localStorage.getItem(railStorageKey) === "true"));
    return () => {
      window.cancelAnimationFrame(frame);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const agentContext = useMemo(
    () => ({
      page: "studio-writing-workflow",
      currentStage: activeStep.title,
      project,
      constraints: {
        toolPolicy: "Use only tools registered by the current stage. Keep suggestions scoped to the current writing workflow stage.",
      },
    }),
    [activeStep.title, project],
  );

  useAgentContext({
    description: "Current FlowDraft writing workflow state. Use it to understand the active stage and project artifacts before calling a stage tool.",
    value: agentContext,
  });

  function notify(text: string) {
    setToast({ text, visible: true });
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast((current) => ({ ...current, visible: false })), 1800);
  }

  function toggleRail() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(railStorageKey, String(next));
      return next;
    });
  }

  function updateProject(patch: Partial<StudioProject>) {
    setProject((current) => ({ ...current, ...patch }));
  }

  function updateArtifact(stepId: StudioStepId, patch: Record<string, string>) {
    setProject((current) => ({
      ...current,
      artifacts: {
        ...current.artifacts,
        [stepId]: {
          ...current.artifacts[stepId],
          ...patch,
        },
      },
    }));
  }

  function addIdea() {
    setProject((current) => ({
      ...current,
      ideas: ["新捕捉的灵感", ...current.ideas],
    }));
    notify("已加入素材卡片");
  }

  function selectStep(stepId: StudioStepId) {
    if (!isAdvancing) setActiveStepId(stepId);
  }

  function goBack() {
    const index = studioSteps.findIndex((step) => step.id === activeStepId);
    if (!isAdvancing && index > 0) setActiveStepId(studioSteps[index - 1].id);
  }

  function advance() {
    const index = studioSteps.findIndex((step) => step.id === activeStepId);
    setIsAdvancing(true);
    window.setTimeout(() => {
      setIsAdvancing(false);
      if (index >= studioSteps.length - 1) {
        notify("排版发布检查已打开，可以复制发布清单");
        return;
      }
      notify(`${activeStep.title}已保存，进入下一步`);
      setActiveStepId(studioSteps[index + 1].id);
    }, 420);
  }

  function save() {
    notify("草稿已保存");
  }

  async function copyStage() {
    try {
      await navigator.clipboard.writeText(`《${project.title}》\n当前步骤：${activeStep.title}\n阶段目标：${activeStep.hint}`);
      notify("阶段内容已复制");
    } catch {
      notify("复制失败，请手动复制阶段内容");
    }
  }

  return {
    activeStepId,
    activeStep,
    collapsed,
    project,
    isAdvancing,
    toast,
    selectStep,
    toggleRail,
    updateProject,
    updateArtifact,
    addIdea,
    goBack,
    advance,
    save,
    copyStage,
    notify,
  };
}
