"use client";

import { AgentPanel, type AgentPanelRef } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import "./idea-capture.css";

import { IdeaCaptureCopilotContext } from "./IdeaCaptureCopilotContext";
import { IdeaCaptureIntentPanel } from "./IdeaCaptureIntentPanel";
import { IdeaCaptureCopilotTools } from "./IdeaCaptureCopilotTools";
import type { IdeaCaptureState, WritingIntentDraft } from "./ideaCapture.types";

import type { StageWorkspaceAdapter } from "../stageWorkspace.adapter";
import { canAcceptWritingIntent } from "./ideaCapture.rules";

export function IdeaCaptureWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"idea-capture"> }) {
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const agentPanelRef = useRef<AgentPanelRef>(null);
  const writingIntent = workspace.artifact ?? emptyWritingIntent;
  const phase = workspace.stage.generatedAt !== null
    ? "card"
    : hasWritingIntent(writingIntent) ? "identifying" : "initial";
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    workspace.reportComplete(canAcceptWritingIntent(workspace.artifact));
  }, [workspace]);

  useEffect(() => {
    return workspace.agent.registerReset(() => agentPanelRef.current?.reset());
  }, [workspace]);

  useEffect(() => {
    if (prevPhaseRef.current === "card" && phase !== "card") {
      setUpdatedCards(new Set());
      agentPanelRef.current?.reset();
    }
    prevPhaseRef.current = phase;
  }, [phase, workspace]);

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
    editable: !workspace.readOnly,
    writingIntent,
    updatedCards,
    notify: workspace.notify,
    updateWritingIntent: (patch) => {
      if (!workspace.updateArtifact(patch)) return [];
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
      workspace.notify(changedCards.length ? "已同步更新写作意图" : "写作意图已检查");
      return changedCards;
    },
    proposeWritingIntent: (candidate) => workspace.generateArtifact({
      ...writingIntent,
      ...candidate,
    }),
  };

  return (
    <>
      <IdeaCaptureCopilotContext workspace={workspace} />

      <section className="studio-stage studio-idea-stage">
        <div className="studio-idea-heading">
        </div>
        <IdeaCaptureIntentPanel controller={ideaCaptureController} />
      </section>

      <AgentPanel
        ref={agentPanelRef}
        agentId={workspace.agentId}
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
        onError={() => workspace.notify("Agent 出错了，请稍后重试")}
        onRunningChange={workspace.agent.setRunning}
        initialMessages={workspace.agent.getMessages()}
        onMessagesChange={workspace.agent.updateMessages}
        onDraftChange={workspace.agent.setDraftActive}
        restoreKey={workspace.agent.restoreKey}
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
