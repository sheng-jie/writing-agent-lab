"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef, useState } from "react";

import { StepWorkspacePlaceholder } from "../StepWorkspacePlaceholder";

import type { StageWorkspaceAdapter } from "../stageWorkspace.adapter";
import { canAcceptImagePlanning } from "./imagePlanning.rules";
import { stageArtifactSchemas } from "../../workflow/studio-artifact-schemas";
import type { ImagePlanningArtifact } from "../../workflow/studio-workflow";

export function ImagePlanningWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"image-planning"> }) {
  const [artifact, setDraftArtifact] = useState(workspace.artifact);

  useEffect(() => {
    workspace.reportArtifact(artifact, canAcceptImagePlanning(artifact));
  }, [artifact, workspace]);
  const agentId = workspace.agentId;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);

  useEffect(() => workspace.agent.registerReset(() => agentPanelRef.current?.reset()), [workspace]);

  useFrontendTool(
    {
      name: "generateIllustratedDraft",
      agentId,
      description: "Generate the complete illustrated draft with final title, content, and illustration plan.",
      parameters: stageArtifactSchemas["image-planning"],
      handler: async (generatedArtifact: ImagePlanningArtifact) => {
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
      </AgentPanel>
    </>
  );
}
