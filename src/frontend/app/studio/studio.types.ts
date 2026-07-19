export const studioStepIds = [
  "idea-capture",
  "topic-generation",
  "outline-planning",
  "drafting",
  "polishing",
  "humanizing",
  "image-planning",
  "publishing",
] as const;

export type StudioStepId = (typeof studioStepIds)[number];

export type StudioStep = {
  id: StudioStepId;
  title: string;
  icon: string;
  description: string;
  outcome: string;
  hint: string;
  missing: string;
  primaryAction: string;
  wordTarget: string;
  structure: string;
  natural: string;
  publish: string;
};

export type StudioProject = {
  title: string;
  ideas: string[];
  writingIntent: string;
  confirmedTopic: string;
  outline: string[];
  draft: string;
  polishedDraft: string;
  imageBrief: string;
  artifacts: Partial<Record<StudioStepId, Record<string, string>>>;
};

export type StudioController = {
  activeStepId: StudioStepId;
  activeStep: StudioStep;
  collapsed: boolean;
  project: StudioProject;
  isAdvancing: boolean;
  toast: { text: string; visible: boolean };
  selectStep: (stepId: StudioStepId) => void;
  toggleRail: () => void;
  updateProject: (patch: Partial<StudioProject>) => void;
  updateArtifact: (stepId: StudioStepId, patch: Record<string, string>) => void;
  addIdea: () => void;
  goBack: () => void;
  advance: () => void;
  save: () => void;
  copyStage: () => Promise<void>;
  notify: (message: string) => void;
};
