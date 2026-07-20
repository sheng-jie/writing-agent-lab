"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";
import { studioAgentByStage } from "../../studio.config";
import type { StudioController } from "../../studio.types";
import { StudioStepCopilotTools } from "../StudioStepAgent";

export function DraftingWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage.drafting;

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
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
      >
        <StudioStepCopilotTools agentId={agentId} controller={controller} toolName="updateArticleDraft" />
      </AgentPanel>
    </>
  );
}
