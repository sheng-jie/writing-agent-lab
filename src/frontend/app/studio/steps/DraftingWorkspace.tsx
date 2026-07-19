"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function DraftingWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <StudioPanel
          title="正文初稿编辑器"
          caption="先完成可编辑版本；AI 会在右侧提示薄弱段落。"
          action={<span className="studio-count">约 1260 字</span>}
        >
          <textarea
            className="studio-editor"
            value={controller.project.draft}
            onChange={(event) => controller.updateProject({ draft: event.target.value })}
            aria-label="初稿编辑器"
          />
        </StudioPanel>
      </article>

      <AgentPanel
        key="drafting"
        agentId="clarificationAgent"
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
      >
        <StudioStepCopilotTools controller={controller} toolName="updateArticleDraft" />
      </AgentPanel>
    </>
  );
}
