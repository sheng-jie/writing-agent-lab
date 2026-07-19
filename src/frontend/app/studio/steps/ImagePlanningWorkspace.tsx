"use client";

import { Lightbulb } from "lucide-react";
import { AgentPanel } from "@/components/agent/AgentPanel";

import { StudioPanel } from "../components/StudioPanel";
import type { StudioController } from "../studio.types";
import { StudioStepCopilotTools } from "./StudioStepAgent";

export function ImagePlanningWorkspace({ controller }: { controller: StudioController }) {
  return (
    <>
      <article className="studio-stage" aria-live="polite">
        <div className="studio-grid">
          <StudioPanel
            title="配图规划"
            caption="为文章生成封面与文内信息图需求。"
            action={
              <button type="button" onClick={() => controller.notify("已生成 4 条配图提示词")}>
                <Lightbulb />
                生成配图提示词
              </button>
            }
          >
            <div className="studio-images">
              {["封面图", "8 步流程图", "工作台界面图", "改写对比图"].map((name) => (
                <div key={name}>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </StudioPanel>

          <StudioPanel title="图片 brief" caption="可交给设计师或图像模型。">
            <textarea
              className="studio-brief"
              value={controller.project.imageBrief}
              onChange={(event) => controller.updateProject({ imageBrief: event.target.value })}
            />
          </StudioPanel>
        </div>
      </article>

      <AgentPanel
        key="image-planning"
        agentId="clarificationAgent"
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
      >
        <StudioStepCopilotTools controller={controller} toolName="updateIllustrationBrief" />
      </AgentPanel>
    </>
  );
}
