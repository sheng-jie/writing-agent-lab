import type { AgentMessage } from "@/components/agent/useAgentChat";

import { studioAgentByStage } from "../config/studio-config";
import type { StudioController, StudioStep } from "../types/studio-controller";
import type { StageArtifactMap, StageRecord, StudioStageId } from "../workflow/studio-workflow";

export type StageWorkspaceAdapter<K extends StudioStageId> = {
  step: StudioStep;
  agentId: string;
  stage: StageRecord<StageArtifactMap[K]>;
  artifact: StageArtifactMap[K] | null;
  resetKey: number;
  readOnly: boolean;
  reportComplete: (complete: boolean) => void;
  notify: (message: string) => void;
  updateArtifact: (patch: Partial<StageArtifactMap[K]>) => boolean;
  generateArtifact: (artifact: StageArtifactMap[K]) => boolean;
  restartIdeaCapture: () => boolean;
  agent: {
    restoreKey: number;
    setRunning: (running: boolean) => void;
    setDraftActive: (active: boolean) => void;
    registerReset: (reset: () => void) => () => void;
    getMessages: () => AgentMessage[] | undefined;
    updateMessages: (messages: AgentMessage[]) => void;
  };
};

export function createStageWorkspaceAdapter<K extends StudioStageId>(
  controller: StudioController,
  stageId: K,
  reportComplete: (complete: boolean) => void,
): StageWorkspaceAdapter<K> {
  const agentId = studioAgentByStage[stageId];
  const stage = controller.workflow.snapshot.stages[stageId];

  return {
    step: controller.workspace.activeStep,
    agentId,
    stage,
    artifact: controller.workflow.getStageArtifact(stageId),
    readOnly: controller.workflow.snapshot.status === "completed" || stage.status === "accepted",
    reportComplete,
    notify: controller.ui.notify,
    updateArtifact: (patch) => controller.workflow.updateStageArtifact(stageId, patch),
    generateArtifact: (artifact) => controller.workflow.generateStageArtifact(stageId, artifact),
    restartIdeaCapture: controller.workflow.restartIdeaCapture,
    resetKey: controller.progress.resetKey,
    agent: {
      restoreKey: controller.progress.agentMessagesRestoreKey,
      setRunning: controller.progress.setAgentRunning,
      setDraftActive: controller.progress.setAgentDraftActive,
      registerReset: controller.progress.registerAgentReset,
      getMessages: () => controller.progress.getAgentMessages(agentId),
      updateMessages: (messages) => controller.progress.updateAgentMessages(agentId, messages),
    },
  };
}