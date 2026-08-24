import type { AgentMessage } from "@/components/agent/useAgentChat";

import type { StageAction, StageArtifactMap, StudioStageId, WritingWorkflowSnapshot } from "./studio.workflow";

export type StudioStep = {
  id: StudioStageId;
  title: string;
  icon: string;
  description: string;
  hint: string;
  missing: string;
  wordTarget: string;
};

export type StudioUiState = {
  activeWorkspaceId: StudioStageId;
  collapsed: boolean;
  toast: { text: string; visible: boolean };
};

export type StudioConfirmation = {
  title: string;
  description: string;
};

export type StudioController = {
  activeWorkspaceId: StudioStageId;
  activeStep: StudioStep;
  workflow: WritingWorkflowSnapshot;
  stageAction: StageAction;
  ui: StudioUiState;
  articleSaved: boolean;
  agentRunning: boolean;
  saveWarning: string | null;
  externalProgressAvailable: boolean;
  agentMessagesRestoreKey: number;
  collapsed: boolean;
  toast: { text: string; visible: boolean };
  confirmation: StudioConfirmation | null;
  selectWorkspace: (stageId: StudioStageId) => void;
  toggleRail: () => void;
  getStageArtifact: <K extends StudioStageId>(stageId: K) => StageArtifactMap[K] | null;
  updateStageArtifact: <K extends StudioStageId>(stageId: K, patch: Partial<StageArtifactMap[K]>) => boolean;
  generateStageArtifact: <K extends StudioStageId>(stageId: K, artifact: StageArtifactMap[K]) => boolean;
  setAgentRunning: (running: boolean) => void;
  setAgentDraftActive: (active: boolean) => void;
  registerAgentReset: (reset: () => void) => () => void;
  getAgentMessages: (agentId: string) => AgentMessage[] | undefined;
  updateAgentMessages: (agentId: string, messages: AgentMessage[]) => void;
  loadExternalProgress: () => void;
  restartIdeaCapture: () => boolean;
  goBack: () => void;
  runStageAction: () => void;
  resetStage: () => void;
  saveArticle: () => Promise<void>;
  startNewWorkflow: () => void;
  copyStage: () => Promise<void>;
  notify: (message: string) => void;
  confirmPendingAction: () => void;
  cancelPendingAction: () => void;
};
