"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";

import { stageArtifactSchemas } from "../../workflow/studio-artifact-schemas";
import type { StageWorkspaceAdapter } from "../stageWorkspace.adapter";
import type { OutlineArtifact } from "../../workflow/studio-workflow";
import { canAcceptOutlinePlanning } from "./outlinePlanning.rules";

export function OutlinePlanningWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"outline-planning"> }) {
  const [artifact, setDraftArtifact] = useState(workspace.artifact);
  const agentId = workspace.agentId;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => {
    workspace.reportArtifact(artifact, canAcceptOutlinePlanning(artifact));
  }, [artifact, workspace]);

  useEffect(() => workspace.agent.registerReset(() => agentPanelRef.current?.reset()), [workspace]);

  useFrontendTool(
    {
      name: "generateWritingOutline",
      agentId,
      description: "Generate the complete writing outline with throughline, section tasks, and material gaps.",
      parameters: stageArtifactSchemas["outline-planning"],
      handler: async (generatedArtifact: OutlineArtifact) => {
        setDraftArtifact(generatedArtifact);
        return {
          ok: true,
        stage: workspace.step.title,
        };
      },
    },
    [agentId, workspace],
  );

  return (
    <>
      <StepWorkspacePlaceholder />

      <AgentPanel
        ref={agentPanelRef}
        key={agentId}
        agentId={agentId}
        className="studio-agent-panel"
        title="大纲编辑搭档"
        description="规划文章主线、章节任务和素材缺口。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="告诉我希望补强哪个章节或案例…"
        welcome={{
          title: "先搭文章骨架。",
          description: "每个章节都要说明它推动读者理解的具体任务。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "根据大纲补强一个章节。",
              value: "请检查当前大纲。",
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
      </AgentPanel>
    </>
  );
}
