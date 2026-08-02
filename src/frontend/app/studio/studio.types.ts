import type { StageAction, StudioStageId, WritingWorkflowSnapshot } from "./studio.workflow";

export type IdeaMaterial = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

export type WritingIntent = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: IdeaMaterial[];
  selectedDirection: "method" | "product" | "opinion" | "";
};

export type StudioStep = {
  id: StudioStageId;
  title: string;
  icon: string;
  description: string;
  hint: string;
  missing: string;
  wordTarget: string;
};

export type StudioProject = {
  title: string;
  writingIntent: WritingIntent;
  confirmedTopic: string;
  outline: string[];
  draft: string;
  polishedDraft: string;
  imageBrief: string;
  artifacts: Partial<Record<StudioStageId, Record<string, string>>>;
};

export type StudioUiState = {
  activeWorkspaceId: StudioStageId;
  collapsed: boolean;
  toast: { text: string; visible: boolean };
};

export type StudioController = {
  activeWorkspaceId: StudioStageId;
  activeStep: StudioStep;
  workflow: WritingWorkflowSnapshot;
  stageAction: StageAction;
  ui: StudioUiState;
  project: StudioProject;
  articleSaved: boolean;
  collapsed: boolean;
  toast: { text: string; visible: boolean };
  selectWorkspace: (stageId: StudioStageId) => void;
  toggleRail: () => void;
  updateProject: (patch: Partial<StudioProject>) => void;
  updateArtifact: (stageId: StudioStageId, patch: Record<string, string>) => void;
  updateWritingIntent: (patch: Partial<WritingIntent>) => boolean;
  confirmWritingIntent: (patch: Partial<WritingIntent>) => void;
  restartIdeaCapture: () => boolean;
  goBack: () => void;
  runStageAction: () => void;
  resetStage: () => void;
  saveArticle: () => void;
  copyStage: () => Promise<void>;
  notify: (message: string) => void;
};
