"use client";

import type { Dispatch, SetStateAction } from "react";

export type Phase = "initial" | "clarifying" | "card";

export type WritingIntentDraft = {
  rawIdea: string;
  topic: string;
  audience: string;
  purpose: string;
  platform: string;
  coreViewpoint: string;
  contentBoundary: string;
};

export type IdeaCaptureState = {
  phase: Phase;
  writingIntent: WritingIntentDraft;
  setWritingIntent: Dispatch<SetStateAction<WritingIntentDraft>>;
  toast: { text: string; visible: boolean };
  updatedCards: Set<string>;
  notify: (text: string) => void;
  flashCard: (name: string) => void;
  flashCards: (names: string[]) => void;
  updateWritingIntent: (patch: Partial<WritingIntentDraft>) => string[];
  confirmWritingIntent: (confirmed: Partial<WritingIntentDraft>) => void;
  restart: () => void;
};