"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";

import { studioAgentByStage } from "../../studio.config";
import type { StudioController } from "../../studio.types";
import { StudioStepCopilotTools } from "../StudioStepAgent";

export function ImagePlanningWorkspace({ controller }: { controller: StudioController }) {
  const agentId = studioAgentByStage["image-planning"];
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => controller.registerAgentReset(() => agentPanelRef.current?.reset()), [controller]);

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
        ref={agentPanelRef}
        key={agentId}
        agentId={agentId}
        className="studio-agent-panel"
        title="配图编辑搭档"
        description="把文章结构转成封面、信息图与文内图需求。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="说明希望图片解释的段落或概念…"
        welcome={{
          title: "图片需要承担解释任务。",
          description: "封面吸引点击，文内图帮助读者理解，而不是只做装饰。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "生成配图方向。",
              value: "请规划当前文章配图。",
              mode: "send",
            },
          ],
        }}
        onRunningChange={controller.setAgentRunning}
        initialMessages={controller.getAgentMessages(agentId)}
        onMessagesChange={(messages) => controller.updateAgentMessages(agentId, messages)}
        onDraftChange={controller.setAgentDraftActive}
        restoreKey={controller.agentMessagesRestoreKey}
      >
        <StudioStepCopilotTools agentId={agentId} controller={controller} toolName="updateIllustrationBrief" />
      </AgentPanel>
    </>
  );
}
