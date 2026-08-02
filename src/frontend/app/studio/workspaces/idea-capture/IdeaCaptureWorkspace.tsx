"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import "./idea-capture.css";

import { IdeaCaptureIntentPanel } from "./IdeaCaptureIntentPanel";
import { IdeaCaptureCopilotTools } from "./IdeaCaptureCopilotTools";
import type { IdeaCaptureState, WritingIntentDraft } from "./ideaCapture.types";

import type { StudioController } from "../../studio.types";

export function IdeaCaptureWorkspace({ controller }: { controller: StudioController }) {
  const [resetKey, setResetKey] = useState(0);
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const phase = controller.workflow.stages["idea-capture"].status === "accepted"
    ? "card"
    : hasWritingIntent(controller.project.writingIntent) ? "clarifying" : "initial";
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (prevPhaseRef.current === "card" && phase !== "card") {
      setUpdatedCards(new Set());
      setResetKey((key) => key + 1);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  function flashCard(name: string) {
    setUpdatedCards((current) => new Set(current).add(name));
    window.setTimeout(() => {
      setUpdatedCards((current) => {
        const next = new Set(current);
        next.delete(name);
        return next;
      });
    }, 920);
  }

  const ideaCaptureController: IdeaCaptureState = {
    phase,
    writingIntent: controller.project.writingIntent,
    setWritingIntent: (updater) => {
      const next = typeof updater === "function" ? updater(controller.project.writingIntent) : updater;
      controller.updateWritingIntent(next);
    },
    resetKey,
    toast: controller.toast,
    updatedCards,
    notify: controller.notify,
    flashCard,
    flashCards: (names) => names.forEach(flashCard),
    updateWritingIntent: (patch) => {
      if (!controller.updateWritingIntent(patch)) return [];
      const changedCards = Object.keys(patch).flatMap((key) => {
        const cardByField: Record<string, string> = {
          rawIdea: "raw",
          topic: "topic",
          audience: "audience",
          purpose: "purpose",
          platform: "platform",
          coreViewpoint: "coreViewpoint",
          contentBoundary: "contentBoundary",
        };
        return cardByField[key] ? [cardByField[key]] : [];
      });
      changedCards.forEach(flashCard);
      controller.notify(changedCards.length ? "已同步更新写作意图" : "写作意图已检查");
      return changedCards;
    },
    confirmWritingIntent: (writingIntent) => controller.confirmWritingIntent(writingIntent),
    restart: () => {
      if (controller.restartIdeaCapture()) {
        setUpdatedCards(new Set());
        setResetKey((key) => key + 1);
      }
    },
  };

  return (
    <>
      <section className="studio-stage studio-idea-stage">
        <div className="studio-idea-heading">
        </div>
        <IdeaCaptureIntentPanel controller={ideaCaptureController} />
      </section>

      <AgentPanel
        key={resetKey}
        agentId="clarificationAgent"
        className="studio-agent-panel"
        title="写作意图编辑"
        description="通过关键追问补齐结构化写作意图的 7 个字段。"
        idleBadge={phase === "card" ? "已确认" : "识别中"}
        runningBadge="处理中"
        placeholder="输入一个模糊想法，例如：我想写一篇关于 AI Agent 如何帮助创作者理清想法的文章…"
        welcome={{
          title: "先说一个粗糙想法就可以。",
          description: "不必先整理成表格。Agent 会追问关键问题，并逐步沉淀写作意图。",
          examples: [
            {
              title: "观点型示例",
              copy: "从一个明确主张开始澄清文章的写作意图。",
              value: "我最近在研究 AI 写作工具，想写一篇文章讨论为什么真正重要的不是自动生成，而是帮助创作者想清楚。",
              mode: "send",
            },
          ],
        }}
        onError={() => controller.notify("Agent 出错了，请稍后重试")}
      >
        <IdeaCaptureCopilotTools controller={ideaCaptureController} />
      </AgentPanel>
    </>
  );
}

function hasWritingIntent(intent: WritingIntentDraft) {
  return Boolean(
    intent.rawIdea
      || intent.topic
      || intent.audience
      || intent.purpose
      || intent.platform
      || intent.coreViewpoint
      || intent.contentBoundary,
  );
}
