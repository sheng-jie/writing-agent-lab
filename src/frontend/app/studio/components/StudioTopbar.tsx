"use client";

import type { StudioController } from "../studio.types";

export function StudioTopbar({ controller }: { controller: StudioController }) {
  const { activeStep, project } = controller;

  return (
    <header className="studio-topbar">
      <div className="studio-title-area">
        <p className="studio-save-state">
          <span />已自动保存 · 刚刚 <em>草稿 ID WX-2026-042</em>
        </p>
        <textarea
          value={project.title}
          rows={2}
          aria-label="文章标题"
          onChange={(event) => controller.updateProject({ title: event.target.value })}
        />
        <p className="studio-current-task">
          <b>当前任务</b>
          {activeStep.missing}
        </p>
      </div>

      <div className="studio-top-pills">
        <span>
          当前步骤 <b>{activeStep.title}</b>
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
