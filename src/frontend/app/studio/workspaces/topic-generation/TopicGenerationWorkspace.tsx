"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { useEffect, useRef } from "react";

import type { StageWorkspaceAdapter } from "../workspace.adapter";
import { StudioStepCopilotTools } from "../StudioStepAgent";
import { canAcceptTopicGeneration } from "./topicGeneration.rules";

export function TopicGenerationWorkspace({ workspace }: { workspace: StageWorkspaceAdapter<"topic-generation"> }) {
  const agentId = workspace.agentId;
  const agentPanelRef = useRef<import("@/components/agent/AgentPanel").AgentPanelRef>(null);
  const artifact = workspace.artifact;
  const readOnly = workspace.readOnly;

  useEffect(() => {
    workspace.reportComplete(canAcceptTopicGeneration(workspace.artifact));
  }, [workspace]);

  useEffect(() => workspace.agent.registerReset(() => agentPanelRef.current?.reset()), [workspace]);

  return (
    <>
      <article className="studio-stage">
        <section className="studio-panel">
          <header>
            <div>
              <h2>候选选题</h2>
              <p>{artifact?.candidates.length ? "选择一个选题，确定本阶段的写作方向。" : "让 Agent 先生成完整候选列表。"}</p>
            </div>
          </header>

          <div className="studio-panel-body">
            {artifact?.candidates.length ? (
              <fieldset className="grid gap-3" disabled={readOnly}>
                <legend className="sr-only">选择确定选题</legend>
                {artifact.candidates.map((candidate) => {
                  const selected = candidate.id === artifact.selectedCandidateId;
                  return (
                    <label
                      key={candidate.id}
                      className={`grid cursor-pointer gap-3 border p-4 transition-colors ${selected ? "border-[var(--teal)] bg-[var(--teal-soft)]" : "border-[var(--rule)] bg-white hover:border-[var(--muted)]"} ${readOnly ? "cursor-default" : ""}`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selected-topic"
                          value={candidate.id}
                          checked={selected}
                          onChange={() => workspace.updateArtifact({ selectedCandidateId: candidate.id })}
                          className="mt-1 size-4 accent-[var(--teal)]"
                        />
                        <span className="grid gap-1">
                          <strong className="text-base text-[var(--ink)]">{candidate.title}</strong>
                          <span className="text-sm leading-6 text-[var(--muted)]">写给 {candidate.audience} · {candidate.angle}</span>
                        </span>
                      </span>
                      <span className="grid gap-2 pl-7 text-sm leading-6 text-[var(--muted)]">
                        <span><b className="text-[var(--ink)]">核心判断：</b>{candidate.coreViewpoint}</span>
                        <span><b className="text-[var(--ink)]">不展开：</b>{candidate.excludedContent}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <div className="grid min-h-72 place-items-center border border-dashed border-[var(--rule)] px-6 text-center text-sm leading-6 text-[var(--muted)]">
                候选选题生成后会显示在这里。
              </div>
            )}
          </div>
        </section>
      </article>

      <AgentPanel
        ref={agentPanelRef}
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
        onError={() => workspace.notify("Agent 出错了，请稍后重试")}
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
