"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function HumanizingWorkspace({ controller }: { controller: StudioController }) {
  const findings = [
    ["空泛表达", "“提升效率”“形成闭环”需要替换为具体动作。"],
    ["缺少经验", "建议加入你自己使用工作台时的一个失败场景。"],
    ["过度完整", "可以补一句“不适合什么情况”。"],
    ["语气太平", "保留少量判断，比如“我不建议一开始就追求金句”。"],
  ] as const;

  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel title="去 AI 味诊断" caption="识别模板感、空泛词和过度顺滑的表达。">
            <div className="studio-tones">
              {findings.map(([title, text]) => (
                <article key={title}>
                  <b>{title}</b>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </StudioPanel>

          <StudioPanel title="前后对比" caption="用真实语气替换模板化句子。">
            <div className="studio-notes">
              <article>
                <b>润色稿</b>
                <p>{controller.project.polishedDraft}</p>
              </article>
              <article>
                <b>自然化后</b>
                <textarea
                  className="studio-brief"
                  value={controller.project.artifacts.humanizing?.draft ?? controller.project.polishedDraft}
                  onChange={(event) => controller.updateArtifact("humanizing", { draft: event.target.value })}
                />
              </article>
            </div>
          </StudioPanel>
        </div>
      </article>

      <AgentPanel
        key="humanizing"
        agentId="clarificationAgent"
        className="studio-agent-panel"
        title="表达编辑搭档"
        description="找出模板化表达，并建议加入真实判断和经验。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="指出一段想保留原意但更自然的文字…"
        welcome={{
          title: "让文章保留作者判断。",
          description: "少一点正确废话，多一点具体动作和真实限制。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "让当前表达更自然。",
              value: "请检查当前表达。",
              mode: "send",
            },
          ],
        }}
      >
        <StudioStepCopilotTools controller={controller} toolName="humanizeDraft" />
      </AgentPanel>
    </>
  );
}
