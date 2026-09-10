"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";
import { studioAgentByStage } from "../../studio.config";
import type { StudioController } from "../../studio.controller";
import { StudioStepCopilotTools } from "../StudioStepAgent";

export function PolishingWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage.polishing;
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
        title="润色编辑搭档"
        description="从标题、开头、转场和句长四个方向优化表达。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="粘贴一句想改写的文字…"
        welcome={{
          title: "优先处理读者最早看到的文字。",
          description: "删除绕路表达，让重点更早出现。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "为当前表达提出润色建议。",
              value: "请润色当前文字。",
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
        <StudioStepCopilotTools stageId="polishing" agentId={agentId} controller={controller} />
      </AgentPanel>
    </>
  );
}
