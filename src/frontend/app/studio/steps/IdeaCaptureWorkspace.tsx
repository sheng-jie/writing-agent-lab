"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StepWorkspacePlaceholder } from "@/app/studio/steps/StepWorkspacePlaceholder";

import { studioAgentByStage } from "../studio.config";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function IdeaCaptureWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage["idea-capture"];

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
        key={agentId}
        agentId={agentId}
        className="studio-agent-panel"
        title="想法编辑搭档"
        description="整理素材，并把零散观察沉淀为写作意图。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="补充一个观察、读者提问或案例…"
        welcome={{
          title: "先放进一个粗糙想法。",
          description: "当前阶段先保留素材和来源，不急着判断好坏。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "结合当前素材给出一个可执行动作。",
              value: "请根据当前想法给出下一步建议。",
              mode: "send",
            },
          ],
        }}
        onError={() => controller.notify("Agent 出错了，请稍后重试")}
      >
        <StudioStepCopilotTools agentId={agentId} controller={controller} toolName="addIdeaMaterial" />
      </AgentPanel>
    </>
  );
}
