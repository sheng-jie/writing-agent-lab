"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";
import type { StageWorkspaceAdapter } from "../stageWorkspace.adapter";
import { canAcceptPolishing } from "./polishing.rules";
import { StudioStepCopilotTools } from "../StudioStepCopilotTools";

export function PolishingWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"polishing"> }) {
  useEffect(() => {
    workspace.reportComplete(canAcceptPolishing(workspace.artifact));
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
