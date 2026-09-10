"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";

import type { StageWorkspaceAdapter } from "../workspace.adapter";
import { canAcceptImagePlanning } from "./imagePlanning.rules";
import { StudioStepCopilotTools } from "../StudioStepAgent";

export function ImagePlanningWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"image-planning"> }) {
  useEffect(() => {
    workspace.reportComplete(canAcceptImagePlanning(workspace.artifact));
  }, [workspace]);
  const agentId = workspace.agentId;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => workspace.agent.registerReset(() => agentPanelRef.current?.reset()), [workspace]);

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
        onRunningChange={workspace.agent.setRunning}
        initialMessages={workspace.agent.getMessages()}
        onMessagesChange={workspace.agent.updateMessages}
        onDraftChange={workspace.agent.setDraftActive}
        restoreKey={workspace.agent.restoreKey}
      >
        <StudioStepCopilotTools workspace={workspace} />
      </AgentPanel>
    </>
  );
}
