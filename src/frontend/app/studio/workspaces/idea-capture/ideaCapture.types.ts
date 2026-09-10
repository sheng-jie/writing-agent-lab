"use client";

import type { WritingIntentArtifact } from "../../workflow/studio-workflow";

export type Phase = "initial" | "identifying" | "card";

export type WritingIntentDraft = WritingIntentArtifact;

export type IdeaCaptureState = {
  phase: Phase;
  editable: boolean;
  writingIntent: WritingIntentDraft;
  updatedCards: Set<string>;
  notify: (text: string) => void;
  updateWritingIntent: (patch: Partial<WritingIntentDraft>) => string[];
  proposeWritingIntent: (candidate: Partial<WritingIntentDraft>) => void;
  restart: () => void;
};