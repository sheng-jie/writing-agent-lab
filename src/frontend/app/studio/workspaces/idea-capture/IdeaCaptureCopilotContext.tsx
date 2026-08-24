"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

import type { StudioController } from "../../studio.types";

export function IdeaCaptureCopilotContext({ controller }: { controller: StudioController }) {
  const writingIntent = controller.getStageArtifact("idea-capture");
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