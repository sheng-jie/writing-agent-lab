"use client";

import { AgentPanel, type AgentPanelRef } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import "./idea-capture.css";

import { IdeaCaptureCopilotContext } from "./IdeaCaptureCopilotContext";
import { IdeaCaptureIntentPanel } from "./IdeaCaptureIntentPanel";
import { IdeaCaptureCopilotTools } from "./IdeaCaptureCopilotTools";
import type { IdeaCaptureState, WritingIntentDraft } from "./ideaCapture.types";

import type { StudioController } from "../../studio.controller";

export function IdeaCaptureWorkspace({ controller }: { controller: StudioController }) {
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const agentPanelRef = useRef<AgentPanelRef>(null);
  const writingIntent = controller.workflow.getStageArtifact("idea-capture") ?? emptyWritingIntent;
  const phase = controller.workflow.snapshot.stages["idea-capture"].generatedAt !== null
    ? "card"
    : hasWritingIntent(writingIntent) ? "identifying" : "initial";
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    return controller.progress.registerAgentReset(() => agentPanelRef.current?.reset());
  }, [controller]);

  useEffect(() => {
    if (prevPhaseRef.current === "card" && phase !== "card") {
      setUpdatedCards(new Set());
      agentPanelRef.current?.reset();
    }
    prevPhaseRef.current = phase;
  }, [controller, phase]);

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
    editable: controller.workflow.snapshot.stages["idea-capture"].status !== "accepted",
    writingIntent,
    updatedCards,
    notify: controller.ui.notify,
    updateWritingIntent: (patch) => {
      if (!controller.workflow.updateStageArtifact("idea-capture", patch)) return [];
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
      controller.ui.notify(changedCards.length ? "已同步更新写作意图" : "写作意图已检查");
      return changedCards;
    },
    proposeWritingIntent: (candidate) => controller.workflow.generateStageArtifact("idea-capture", {
      ...writingIntent,
      ...candidate,
    }),
    restart: () => {
      if (controller.workflow.restartIdeaCapture()) {
        setUpdatedCards(new Set());
        agentPanelRef.current?.reset();
      }
    },
  };

  return (
    <>
      <IdeaCaptureCopilotContext controller={controller} />

      <section className="studio-stage studio-idea-stage">
        <div className="studio-idea-heading">
        </div>
        <IdeaCaptureIntentPanel controller={ideaCaptureController} />
      </section>

      <AgentPanel
        ref={agentPanelRef}
        agentId="ideaCaptureAgent"
        className="studio-agent-panel"
        title="意图识别 Agent"
        description="通过关键追问补齐结构化写作意图的 7 个字段。"
        idleBadge={phase === "card" ? "可继续修正" : "识别中"}
        runningBadge="处理中"
        placeholder="输入一个模糊想法，例如：我想写一篇关于 AI Agent 如何帮助创作者理清想法的文章…"
        welcome={{
          title: "先说一个粗糙想法就可以。",
          description: "不必先整理成表格。Agent 会追问关键问题，并逐步沉淀写作意图。",
          examples: [
            {
              title: "GPT-5.6 vs DeepSeek V4 Pro",
              copy: "先填入一个对比主题，再由你确认后发送给 Agent。",
              value: "写一篇文章介绍 GPT-5.6 vs DeepSeek V4 Pro",
            },
          ],
        }}
        onError={() => controller.ui.notify("Agent 出错了，请稍后重试")}
        onRunningChange={controller.progress.setAgentRunning}
        initialMessages={controller.progress.getAgentMessages("ideaCaptureAgent")}
        onMessagesChange={(messages) => controller.progress.updateAgentMessages("ideaCaptureAgent", messages)}
        onDraftChange={controller.progress.setAgentDraftActive}
        restoreKey={controller.progress.agentMessagesRestoreKey}
      >
        <IdeaCaptureCopilotTools controller={ideaCaptureController} />
      </AgentPanel>
    </>
  );
}

const emptyWritingIntent: WritingIntentDraft = {
  rawIdea: "",
  topic: "",
  audience: "",
  purpose: "",
  platform: "",
  coreViewpoint: "",
  contentBoundary: "",
};

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
