"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";

export type Material = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

export type Direction = "method" | "product" | "opinion";

export type Phase = "initial" | "clarifying" | "card";

export type Brief = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: Material[];
  selectedDirection: Direction | "";
};

export const initialBrief: Brief = {
  rawNeed: "",
  topic: "",
  audience: "",
  thesis: "",
  materials: [],
  selectedDirection: "",
};

function mergeMaterials(primary: Material[], secondary: Material[]) {
  const seen = new Set<string>();
  return primary.concat(secondary).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

/**
 * `/clarify` 页面的业务状态中心：写作意图 Brief、当前阶段、Toast、卡片高亮、
 * 会话重启 key，以及把状态同步给 Agent 的 useAgentContext 调用。
 * 必须在 <CopilotKit> 后代组件中调用。
 */
export function useClarifyBriefController() {
  const [phase, setPhase] = useState<Phase>("initial");
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [resetKey, setResetKey] = useState(0);
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: "已更新", visible: false });
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());

  const toastTimerRef = useRef<number | null>(null);
  const flashTimerIdsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      flashTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
      flashTimerIdsRef.current = [];
    };
  }, []);

  // 状态 + 同步给 Agent 合一：ClarifyCopilotTools 不再需要单独调用 useAgentContext。
  const contextValue = useMemo(
    () => ({
      page: "clarify-writing-intent",
      phase,
      brief,
      constraints: {
        maxClarifyingQuestions: 3,
        requiredFields: ["rawNeed", "topic", "audience", "thesis", "materials"],
        toolPolicy:
          "Use updateWritingBrief and addMaterials while clarifying. When required fields are complete, call confirmWritingIntent. Do not save the writing intent without confirmWritingIntent; saving is handled internally by the confirmation card after the user clicks confirm.",
      },
    }),
    [brief, phase],
  );

  useAgentContext({
    description:
      "Current writing intent recognition page state. Use this to understand the left-side card and current phase before asking follow-up questions or updating fields.",
    value: contextValue,
  });

  function notify(text: string) {
    setToast({ text, visible: true });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast((current) => ({ ...current, visible: false })), 1800);
  }

  function flashCard(name: string) {
    setUpdatedCards((current) => {
      const next = new Set(current);
      next.add(name);
      return next;
    });
    const timerId = window.setTimeout(() => {
      setUpdatedCards((current) => {
        const next = new Set(current);
        next.delete(name);
        return next;
      });
      flashTimerIdsRef.current = flashTimerIdsRef.current.filter((id) => id !== timerId);
    }, 920);
    flashTimerIdsRef.current.push(timerId);
  }

  function flashCards(names: string[]) {
    names.forEach(flashCard);
  }

  function updateBrief(patch: Partial<Brief>) {
    const changedCards: string[] = [];

    setBrief((current) => {
      const next: Brief = { ...current };

      if (typeof patch.rawNeed === "string") {
        next.rawNeed = patch.rawNeed;
        changedCards.push("raw");
      }
      if (typeof patch.topic === "string") {
        next.topic = patch.topic;
        changedCards.push("topic");
      }
      if (typeof patch.audience === "string") {
        next.audience = patch.audience;
        changedCards.push("audience");
      }
      if (typeof patch.thesis === "string") {
        next.thesis = patch.thesis;
        changedCards.push("thesis");
      }
      if (patch.selectedDirection) next.selectedDirection = patch.selectedDirection;
      if (patch.materials?.length) {
        next.materials = mergeMaterials(patch.materials, next.materials);
        changedCards.push("materials");
      }

      return next;
    });

    if (phase === "initial") setPhase("clarifying");

    const uniqueChanged = Array.from(new Set(changedCards));
    flashCards(uniqueChanged);
    notify(uniqueChanged.length ? "已同步更新写作意图" : "写作意图已检查");

    return uniqueChanged;
  }

  function addMaterials(materials: Material[]) {
    setBrief((current) => ({ ...current, materials: mergeMaterials(materials, current.materials) }));
    flashCard("materials");
    notify("已补充素材清单");
  }

  function confirmBrief(confirmed: Partial<Brief>) {
    setBrief((current) => ({
      rawNeed: confirmed.rawNeed ?? current.rawNeed,
      topic: confirmed.topic ?? current.topic,
      audience: confirmed.audience ?? current.audience,
      thesis: confirmed.thesis ?? current.thesis,
      materials: confirmed.materials?.length ? mergeMaterials(confirmed.materials, current.materials) : current.materials,
      selectedDirection: confirmed.selectedDirection ?? current.selectedDirection,
    }));
    setPhase("card");
    flashCards(["raw", "topic", "audience", "thesis", "materials"]);
    notify("写作意图卡片已生成");
  }

  function restart() {
    setPhase("initial");
    setBrief(initialBrief);
    setUpdatedCards(new Set());
    setResetKey((key) => key + 1);
    notify("已重新开始");
  }

  return {
    phase,
    brief,
    setBrief,
    resetKey,
    toast,
    updatedCards,
    notify,
    flashCard,
    flashCards,
    updateBrief,
    addMaterials,
    confirmBrief,
    restart,
  };
}

export type ClarifyBriefController = ReturnType<typeof useClarifyBriefController>;
