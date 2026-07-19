"use client";

import { Clipboard, Save } from "lucide-react";

import { studioSteps } from "../studio.config";
import type { StudioController } from "../studio.types";

export function StudioActionbar({ controller }: { controller: StudioController }) {
  const { activeStep } = controller;
  const isFirstStep = controller.activeStepId === studioSteps[0].id;

  return (
    <footer className="studio-actionbar">
      <div>
        <b>{activeStep.title}</b>
        <span>{activeStep.hint}</span>
      </div>

      <div className="studio-actions">
        <button type="button" disabled={isFirstStep} onClick={controller.goBack}>
          上一步
        </button>
        <button type="button" onClick={() => void controller.copyStage()}>
          <Clipboard />
          复制阶段内容
        </button>
        <button type="button" onClick={controller.save}>
          <Save />
          保存草稿
        </button>
        <button
          className="studio-primary"
          type="button"
          disabled={controller.isAdvancing}
          onClick={controller.advance}
        >
          {controller.isAdvancing ? "正在保存…" : activeStep.primaryAction}
        </button>
      </div>
    </footer>
  );
}
