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
  workflow: {
    snapshot: WritingWorkflowSnapshot;
    stageAction: StageAction;
    articleSaved: boolean;
    getStageArtifact: <K extends StudioStageId>(stageId: K) => StageArtifactMap[K] | null;
    updateStageArtifact: <K extends StudioStageId>(stageId: K, patch: Partial<StageArtifactMap[K]>) => boolean;
    generateStageArtifact: <K extends StudioStageId>(stageId: K, artifact: StageArtifactMap[K]) => boolean;
    restartIdeaCapture: () => boolean;
    runStageAction: () => void;
    resetStage: () => void;
    saveArticle: () => Promise<void>;
    startNewWorkflow: () => void;
  };
  workspace: {
    activeWorkspaceId: StudioStageId;
    activeStep: StudioStep;
    selectWorkspace: (stageId: StudioStageId) => void;
    goBack: () => void;
  };
  progress: {
    agentRunning: boolean;
    agentDraftActive: boolean;
    saveWarning: string | null;
    externalProgressAvailable: boolean;
    agentMessagesRestoreKey: number;
    setAgentRunning: (running: boolean) => void;
    setAgentDraftActive: (active: boolean) => void;
    registerAgentReset: (reset: () => void) => () => void;
    getAgentMessages: (agentId: string) => AgentMessage[] | undefined;
    updateAgentMessages: (agentId: string, messages: AgentMessage[]) => void;
    loadExternalProgress: () => void;
  };
  ui: {
    collapsed: boolean;
    toast: { text: string; visible: boolean };
    confirmation: StudioConfirmation | null;
    toggleRail: () => void;
    notify: (message: string) => void;
    confirmPendingAction: () => void;
    cancelPendingAction: () => void;
  };
};