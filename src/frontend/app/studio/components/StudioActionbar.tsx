"use client";

import { studioSteps } from "../studio.config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const workflowCompleted = controller.workflow.status === "completed";

  return (
    <>
      <footer className="studio-actionbar">
        <div>
          <b>{activeStep.title}</b>
          <span>{controller.saveWarning ?? `${getStageStateLabel(stage.status)} · ${controller.stageAction.hint}`}</span>
        </div>

        <div className="studio-actions">
          {controller.externalProgressAvailable ? (
            <button type="button" onClick={controller.loadExternalProgress}>
              载入新进度
            </button>
          ) : null}
          <button type="button" disabled={isFirstStep} onClick={controller.goBack}>
            上一步
          </button>
          <button type="button" disabled={workflowCompleted || stage.status !== "accepted"} onClick={controller.resetStage}>
            重置
          </button>
          {workflowCompleted ? (
            <button className="studio-primary" type="button" onClick={controller.startNewWorkflow}>
              开始新的写作工作流
            </button>
          ) : (
            <button
              className="studio-primary"
              type="button"
              disabled={canSaveArticle ? false : !(canAdvance || canOpenNextStage)}
              onClick={canSaveArticle ? () => void controller.saveArticle() : controller.runStageAction}
            >
              {canSaveArticle ? "保存文章" : "下一步"}
            </button>
          )}
        </div>
      </footer>

      <AlertDialog open={controller.confirmation !== null} onOpenChange={(open) => { if (!open) controller.cancelPendingAction(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{controller.confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>{controller.confirmation?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={controller.cancelPendingAction}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={controller.confirmPendingAction}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
