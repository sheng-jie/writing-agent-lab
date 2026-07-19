"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudioChecklist } from "../components/StudioChecklist";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function PolishingWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel title="润色改写区" caption="对开头、标题、转场和句长做集中优化。">
            <label className="studio-field">
              <span>原句</span>
              <textarea
                value={controller.project.draft}
                onChange={(event) => controller.updateProject({ draft: event.target.value })}
              />
            </label>

            <label className="studio-field">
              <span>改写后</span>
              <textarea
                value={controller.project.polishedDraft}
                onChange={(event) => controller.updateProject({ polishedDraft: event.target.value })}
              />
            </label>

            <div className="studio-chips">
              <button className="selected" type="button">更口语</button>
              <button type="button">更克制</button>
              <button type="button">更犀利</button>
            </div>

            <div className="studio-inline-note">
              <b>去 AI 味检查</b>
              <p>在润色改写中处理空泛表达、模板化句式与缺少个人判断的问题。</p>
            </div>
          </StudioPanel>

          <StudioChecklist />
        </div>
      </article>

      <AgentPanel
        key="polishing"
        agentId="clarificationAgent"
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
      >
        <StudioStepCopilotTools controller={controller} toolName="polishDraft" />
      </AgentPanel>
    </>
  );
}
