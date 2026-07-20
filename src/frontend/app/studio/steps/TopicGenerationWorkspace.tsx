"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StepWorkspacePlaceholder } from "@/app/studio/steps/StepWorkspacePlaceholder";
import { studioAgentByStage } from "../studio.config";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function TopicGenerationWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage["topic-generation"];

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
        key={agentId}
        agentId={agentId}
        className="studio-agent-panel"
        title="选题编辑搭档"
        description="明确读者、核心判断与选题候选。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="补充读者、观点或一个反常识角度…"
        welcome={{
          title: "把模糊想法收束成选题。",
          description: "先确认写给谁、读者会获得什么，以及你的独特判断。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "围绕当前选题提出一个下一步动作。",
              value: "请帮我补强当前选题。",
              mode: "send",
            },
          ],
        }}
        onError={() => controller.notify("Agent 出错了，请稍后重试")}
      >
        <StudioStepCopilotTools agentId={agentId} controller={controller} toolName="updateTopicCandidates" />
      </AgentPanel>
    </>
  );
}
