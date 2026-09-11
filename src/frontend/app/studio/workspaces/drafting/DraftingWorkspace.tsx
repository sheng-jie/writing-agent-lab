"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";
import { stageArtifactSchemas } from "../../workflow/studio-artifact-schemas";
import type { StageWorkspaceAdapter } from "../stageWorkspace.adapter";
import { canAcceptDrafting } from "./drafting.rules";
import type { DraftArtifact } from "../../workflow/studio-workflow";

export function DraftingWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"drafting"> }) {
  const [artifact, setDraftArtifact] = useState(workspace.artifact);

  useEffect(() => {
    workspace.reportArtifact(artifact, canAcceptDrafting(artifact));
  }, [artifact, workspace]);
  const agentId = workspace.agentId;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => workspace.agent.registerReset(() => agentPanelRef.current?.reset()), [workspace]);

  useFrontendTool(
    {
      name: "generateArticleDraft",
      agentId,
      description: "Generate the complete first draft.",
      parameters: stageArtifactSchemas.drafting,
      handler: async (generatedArtifact: DraftArtifact) => {
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
