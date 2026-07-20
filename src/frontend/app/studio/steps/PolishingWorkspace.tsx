"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StepWorkspacePlaceholder } from "@/app/studio/steps/StepWorkspacePlaceholder";
import { studioAgentByStage } from "../studio.config";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function PolishingWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage.polishing;

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
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
      >
        <StudioStepCopilotTools agentId={agentId} controller={controller} toolName="polishDraft" />
      </AgentPanel>
    </>
  );
}
