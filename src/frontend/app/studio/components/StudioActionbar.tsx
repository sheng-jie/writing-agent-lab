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
import type { StudioController } from "../studio.controller";

export function StudioActionbar({ controller }: { controller: StudioController }) {
  const { activeStep, activeWorkspaceId } = controller.workspace;
  const isFirstStep = activeWorkspaceId === studioSteps[0].id;
  const stage = controller.workflow.snapshot.stages[activeWorkspaceId];
  const isFinalStage = activeWorkspaceId === studioSteps.at(-1)?.id;
  const canAdvance = controller.workflow.stageAction.kind === "advance";
  const canOpenNextStage = stage.status === "accepted" && !isFinalStage;
  const canSaveArticle = isFinalStage && stage.status === "accepted";
  const workflowCompleted = controller.workflow.snapshot.status === "completed";

  return (
    <>
      <footer className="studio-actionbar">
        <div>
          <b>{activeStep.title}</b>
          <span>{controller.progress.saveWarning ?? `${getStageStateLabel(stage.status)} · ${controller.workflow.stageAction.hint}`}</span>
        </div>

        <div className="studio-actions">
          {controller.progress.externalProgressAvailable ? (
            <button type="button" onClick={controller.progress.loadExternalProgress}>
              载入新进度
            </button>
          ) : null}
          <button type="button" disabled={isFirstStep} onClick={controller.workspace.goBack}>
            上一步
          </button>
          <button type="button" disabled={workflowCompleted || stage.status !== "accepted"} onClick={controller.workflow.resetStage}>
            重置
          </button>
          {workflowCompleted ? (
            <button className="studio-primary" type="button" onClick={controller.workflow.startNewWorkflow}>
              开始新的写作工作流
            </button>
          ) : (
            <button
              className="studio-primary"
              type="button"
              disabled={canSaveArticle ? false : !(canAdvance || canOpenNextStage)}
              onClick={canSaveArticle ? () => void controller.workflow.saveArticle() : controller.workflow.runStageAction}
            >
              {canSaveArticle ? "保存文章" : "下一步"}
            </button>
          )}
        </div>
      </footer>

      <AlertDialog open={controller.ui.confirmation !== null} onOpenChange={(open) => { if (!open) controller.ui.cancelPendingAction(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{controller.ui.confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>{controller.ui.confirmation?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={controller.ui.cancelPendingAction}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={controller.ui.confirmPendingAction}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
