"use client";

import type { StudioController } from "../studio.types";
import { getStageStateLabel } from "../studio.workflow";

export function StudioTopbar({ controller }: { controller: StudioController }) {
  const { activeStep, project } = controller;
  const stage = controller.workflow.stages[controller.activeWorkspaceId];

  return (
    <header className="studio-topbar">
      <div className="studio-title-area">
        <p className="studio-save-state">
          <span />当前会话草稿 <em>持久化将在下一阶段接入</em>
        </p>
        <textarea
          value={project.title}
          rows={2}
          aria-label="文章标题"
          onChange={(event) => controller.updateProject({ title: event.target.value })}
        />
        <p className="studio-current-task">
          <b>当前任务</b>
          {controller.stageAction.hint}
        </p>
      </div>

      <div className="studio-top-pills">
        <span>
          当前步骤 <b>{activeStep.title}</b>
        </span>
        <span>
          阶段状态 <b>{getStageStateLabel(stage.status)}</b>
        </span>
        <span>
          目标渠道 <b>公众号 / 小红书</b>
        </span>
        <span>
          预计字数 <b>{activeStep.wordTarget}</b>
        </span>
      </div>
    </header>
  );
}
