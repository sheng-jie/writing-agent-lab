"use client";

import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function TopicGenerationWorkspace({ controller }: { controller: StudioController }) {
  const artifact = controller.project.artifacts["topic-generation"] ?? {};
  const fields = [
    ["目标读者", "audience", "刚开始稳定输出的知识型自媒体作者"],
    ["读者当前困惑", "problem", "灵感很多，但每次写作都卡在整理和推进"],
    ["确定选题", "confirmedTopic", controller.project.confirmedTopic],
  ] as const;

  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel title="选题生成画布" caption="用 4 个问题锁定文章方向。">
            <div className="studio-fields">
              {fields.map(([label, field, fallback]) => (
                <label className="studio-field" key={field}>
                  <span>{label}</span>
                  <input
                    value={field === "confirmedTopic" ? controller.project.confirmedTopic : artifact[field] ?? fallback}
                    onChange={(event) =>
                      field === "confirmedTopic"
                        ? controller.updateProject({ confirmedTopic: event.target.value })
                        : controller.updateArtifact("topic-generation", { [field]: event.target.value })
                    }
                  />
                </label>
              ))}

              <label className="studio-field">
                <span>差异化角度</span>
                <textarea
                  value={artifact.angle ?? "不讲泛泛的写作效率，而是把创作拆成 8 个固定工作区：每一步都有输入、处理动作和输出。"}
                  onChange={(event) => controller.updateArtifact("topic-generation", { angle: event.target.value })}
                />
              </label>
            </div>
          </StudioPanel>

          <StudioPanel title="选题健康度" caption="用于判断是否值得进入大纲规划。">
            <div className="studio-metrics">
              {[
                ["读者清晰", "82"],
                ["收益明确", "76"],
                ["角度新鲜", "68"],
              ].map(([label, value]) => (
                <span key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                </span>
              ))}
            </div>
            <div className="studio-inline-note">
              <b>系统判断</b>
              <p>选题已具备进入大纲规划的基础，但标题可以进一步结果化。</p>
            </div>
          </StudioPanel>
        </div>
      </article>

      <AgentPanel
        key="topic-generation"
        agentId="clarificationAgent"
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
        onError={() => controller.notify("Agent 出错了，请稍后重试")}
      >
        <StudioStepCopilotTools controller={controller} toolName="updateTopicCandidates" />
      </AgentPanel>
    </>
  );
}
