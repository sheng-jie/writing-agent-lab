"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

import type { StageWorkspaceAdapter } from "../workspace.adapter";

export function IdeaCaptureCopilotContext({ workspace }: { workspace: StageWorkspaceAdapter<"idea-capture"> }) {
  const writingIntent = workspace.artifact;
  const context = useMemo(
    () => ({
      currentWritingIntentDraft: writingIntent,
    }),
    [writingIntent],
  );

  useAgentContext({
    description: "The latest writing intent draft shown in the workspace. It may include manual edits or restored progress not present in the conversation.",
    value: context,
  });

  return null;
}