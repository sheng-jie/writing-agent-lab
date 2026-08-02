"use client";

import { studioSteps } from "../studio.config";
import { getStageStateLabel } from "../studio.workflow";
import type { StudioController } from "../studio.types";

export function StudioActionbar({ controller }: { controller: StudioController }) {
  const { activeStep } = controller;
  const isFirstStep = controller.activeWorkspaceId === studioSteps[0].id;
  const stage = controller.workflow.stages[controller.activeWorkspaceId];
  const isFinalStage = controller.activeWorkspaceId === studioSteps.at(-1)?.id;
  const canAdvance = controller.stageAction.kind === "advance";
  const canOpenNextStage = stage.status === "accepted" && !isFinalStage;
  const canSaveArticle = isFinalStage && stage.status === "accepted";

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
        <button type="button" disabled={stage.status !== "accepted"} onClick={controller.resetStage}>
          重置
        </button>
        <button
          className="studio-primary"
          type="button"
          disabled={canSaveArticle ? false : !(canAdvance || canOpenNextStage)}
          onClick={canSaveArticle ? controller.saveArticle : controller.runStageAction}
        >
          {canSaveArticle ? (controller.articleSaved ? "文章已保存" : "保存文章") : "下一步"}
        </button>
      </div>
    </footer>
  );
}
