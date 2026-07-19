"use client";

import { Clipboard, Save } from "lucide-react";

import { studioSteps } from "../studio.config";
import { getStageStateLabel } from "../studio.workflow";
import type { StudioController } from "../studio.types";

export function StudioActionbar({ controller }: { controller: StudioController }) {
  const { activeStep } = controller;
  const isFirstStep = controller.activeWorkspaceId === studioSteps[0].id;
  const stage = controller.workflow.stages[controller.activeWorkspaceId];

  return (
    <footer className="studio-actionbar">
      <div>
        <b>{activeStep.title}</b>
        <span>{getStageStateLabel(stage.status)} · {controller.stageAction.hint}</span>
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
          onClick={controller.runStageAction}
        >
          {controller.stageAction.label}
        </button>
      </div>
    </footer>
  );
}
