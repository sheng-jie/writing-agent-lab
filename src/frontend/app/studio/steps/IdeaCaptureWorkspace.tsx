"use client";

import { Plus } from "lucide-react";

import { AgentPanel } from "@/components/agent/AgentPanel";

import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function IdeaCaptureWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel
            title="灵感收集箱"
            caption="把碎片想法、读者问题和素材链接先放进来。"
            action={
              <button type="button" onClick={controller.addIdea}>
                <Plus />
                新增灵感
              </button>
            }
          >
            <label className="studio-field">
              <span>写作意图</span>
              <textarea
                value={controller.project.writingIntent}
                onChange={(event) => controller.updateProject({ writingIntent: event.target.value })}
              />
            </label>

            <div className="studio-chips">
              <button className="selected" type="button">读者痛点</button>
              <button type="button">个人观察</button>
              <button type="button">案例素材</button>
              <button type="button">待验证观点</button>
            </div>
          </StudioPanel>

          <StudioPanel title="素材卡片" caption="系统自动按用途归类。">
            <div className="studio-notes">
              {controller.project.ideas.map((idea, index) => (
                <article key={`${idea}-${index}`}>
                  <b>{idea}</b>
                  <p>
                    {index === 0
                      ? "选题、写作、配图、发布分散在不同工具，导致每次都像从零开始。"
                      : index === 1
                        ? "把流程固定下来，降低启动成本，同时保留每一步的判断空间。"
                        : "写作不是灵感爆发，而是一条有质检点的生产线。"}
                  </p>
                </article>
              ))}
            </div>
          </StudioPanel>
        </div>
      </article>

      <AgentPanel
        key="idea-capture"
        agentId="clarificationAgent"
        className="studio-agent-panel"
        title="想法编辑搭档"
        description="整理素材，并把零散观察沉淀为写作意图。"
        idleBadge="当前步骤"
        runningBadge="处理中"
        placeholder="补充一个观察、读者提问或案例…"
        welcome={{
          title: "先放进一个粗糙想法。",
          description: "当前阶段先保留素材和来源，不急着判断好坏。",
          examples: [
            {
              title: "获取下一步建议",
              copy: "结合当前素材给出一个可执行动作。",
              value: "请根据当前想法给出下一步建议。",
              mode: "send",
            },
          ],
        }}
        onError={() => controller.notify("Agent 出错了，请稍后重试")}
      >
        <StudioStepCopilotTools controller={controller} toolName="addIdeaMaterial" />
      </AgentPanel>
    </>
  );
}
