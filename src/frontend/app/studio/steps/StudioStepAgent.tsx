"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";
import { z } from "zod";

import type { StudioController } from "../studio.types";

export function StudioStepCopilotTools({ agentId, controller, toolName }: { agentId: string; controller: StudioController; toolName: string }) {
  const stageId = controller.activeWorkspaceId;
  const controllerRef = useRef(controller);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  useFrontendTool(
    {
      name: toolName,
      agentId,
      description: `Apply a focused update for the current FlowDraft writing workflow stage: ${controller.activeStep.title}.`,
      parameters: z.object({
        field: z.string().min(1),
        value: z.string().min(1),
      }),
      handler: async ({ field, value }) => {
        controllerRef.current.updateArtifact(stageId, { [field]: value });
        controllerRef.current.notify("已更新当前阶段产物");

        return {
          ok: true,
          stage: controllerRef.current.activeStep.title,
          field,
        };
      },
    },
    [agentId, stageId, toolName],
  );

  return null;
}
