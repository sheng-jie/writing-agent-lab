"use client";

import type { Dispatch, SetStateAction } from "react";

export type Material = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

export type Direction = "method" | "product" | "opinion";

export type Phase = "initial" | "clarifying" | "card";

export type Brief = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: Material[];
  selectedDirection: Direction | "";
};

export type IdeaCaptureState = {
  phase: Phase;
  brief: Brief;
  setBrief: Dispatch<SetStateAction<Brief>>;
  resetKey: number;
  toast: { text: string; visible: boolean };
  updatedCards: Set<string>;
  notify: (text: string) => void;
  flashCard: (name: string) => void;
  flashCards: (names: string[]) => void;
  updateBrief: (patch: Partial<Brief>) => string[];
  addMaterials: (materials: Material[]) => void;
  confirmBrief: (confirmed: Partial<Brief>) => void;
  restart: () => void;
};