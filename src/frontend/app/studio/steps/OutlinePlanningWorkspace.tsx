"use client";

import { Sparkles } from "lucide-react";
import { AgentPanel } from "@/components/agent/AgentPanel";

import { StudioChecklist } from "../components/StudioChecklist";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function OutlinePlanningWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel
            title="写作大纲"
            caption="每个章节都对应一个写作任务。"
            action={
              <button type="button" onClick={() => controller.notify("已基于当前选题刷新大纲建议")}>
                <Sparkles />
                重新生成
              </button>
            }
          >
            <ol className="studio-outline">
              {controller.project.outline.map((item, index) => (
                <li key={item}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>{item}</strong>
                    <span>
                      {index === 0
                        ? "用一个具体场景切入：灵感很多，但打开文档后无从下手。"
                        : "让这一段承担清晰任务，而不只是罗列工具功能。"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </StudioPanel>

          <StudioChecklist />
        </div>
      </article>

      <AgentPanel
        key="outline-planning"
        agentId="clarificationAgent"
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
      >
        <StudioStepCopilotTools controller={controller} toolName="updateWritingOutline" />
      </AgentPanel>
    </>
  );
}
