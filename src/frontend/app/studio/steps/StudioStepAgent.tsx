"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import type { StudioController } from "../studio.types";

export function StudioStepCopilotTools({ controller, toolName }: { controller: StudioController; toolName: string }) {
  const stepId = controller.activeStepId;

  useFrontendTool(
    {
      name: toolName,
      description: `Apply a focused update for the current FlowDraft writing workflow stage: ${controller.activeStep.title}.`,
      parameters: z.object({
        field: z.string().min(1),
        value: z.string().min(1),
      }),
      handler: async ({ field, value }) => {
        controller.updateArtifact(stepId, { [field]: value });
        controller.notify("已更新当前阶段产物");

        return {
          ok: true,
          stage: controller.activeStep.title,
          field,
        };
      },
    },
    [controller, stepId, toolName],
  );

  return null;
}
