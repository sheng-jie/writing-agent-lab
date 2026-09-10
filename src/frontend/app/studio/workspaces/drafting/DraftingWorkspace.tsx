"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";
import { studioAgentByStage } from "../../studio.config";
import type { StudioController } from "../../studio.controller";
import { StudioStepCopilotTools } from "../StudioStepAgent";

export function DraftingWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage.drafting;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => controller.progress.registerAgentReset(() => agentPanelRef.current?.reset()), [controller]);

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
        ref={agentPanelRef}
        key={agentId}
        agentId={agentId}
        className="studio-agent-panel"
        title="初稿编辑搭档"
        description="补齐段落、延展案例，并标记薄弱的位置。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="说明想续写或补强哪一段…"
        welcome={{
          title: "先完成一份可编辑初稿。",
          description: "每段先给出结论，再补充一个具体场景。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "为当前初稿提出一个补强点。",
              value: "请检查当前初稿。",
              mode: "send",
            },
          ],
        }}
        onRunningChange={controller.progress.setAgentRunning}
        initialMessages={controller.progress.getAgentMessages(agentId)}
        onMessagesChange={(messages) => controller.progress.updateAgentMessages(agentId, messages)}
        onDraftChange={controller.progress.setAgentDraftActive}
        restoreKey={controller.progress.agentMessagesRestoreKey}
      >
        <StudioStepCopilotTools stageId="drafting" agentId={agentId} controller={controller} />
      </AgentPanel>
    </>
  );
}
