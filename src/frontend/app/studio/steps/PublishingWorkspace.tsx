"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudioChecklist } from "../components/StudioChecklist";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function PublishingWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioChecklist publish />

          <StudioPanel title="发布预览" caption="公众号首屏摘要效果。">
            <article className="studio-publish-preview">
              <h2>把零散灵感变成可发布文章：一套自媒体写作工作台</h2>
              <p>
                灵感并不会自动变成文章。真正稳定的创作，往往来自一套固定流程：捕捉、选题、规划、初稿、润色、去 AI 味、配图和发布。
              </p>
            </article>
          </StudioPanel>
        </div>
      </article>

      <AgentPanel
        key="publishing"
        agentId="clarificationAgent"
        className="studio-agent-panel"
        title="发布编辑搭档"
        description="检查标题、摘要、排版与行动号召的最后风险。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="选择一个目标渠道，或说明想检查的发布风险…"
        welcome={{
          title: "完成文章的最后一公里。",
          description: "先确认标题承诺、摘要具体性、封面与文末行动。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "检查发布前风险。",
              value: "请检查当前发布准备。",
              mode: "send",
            },
          ],
        }}
      >
        <StudioStepCopilotTools controller={controller} toolName="preparePublishing" />
      </AgentPanel>
    </>
  );
}
