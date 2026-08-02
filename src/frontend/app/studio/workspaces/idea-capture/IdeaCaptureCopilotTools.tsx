"use client";

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { AgentCardShell } from "@/components/agent/AgentCardShell";

import { ClarificationQuestionCard, ClarificationQuestionPendingCard, clarificationArgsSchema, type ClarificationArgs } from "./ClarificationQuestionCard";
import { WritingIntentConfirmCard, WritingIntentConfirmPendingCard, writingIntentConfirmationArgsSchema, type WritingIntentConfirmationArgs } from "./WritingIntentConfirmCard";
import type { IdeaCaptureState } from "./ideaCapture.types";

const writingIntentPatchSchema = z.object({
  rawIdea: z.string().optional(),
  topic: z.string().optional(),
  audience: z.string().optional(),
  purpose: z.string().optional(),
  platform: z.string().optional(),
  coreViewpoint: z.string().optional(),
  contentBoundary: z.string().optional(),
});

const intentCardNameSchema = z.enum(["raw", "topic", "audience", "purpose", "platform", "coreViewpoint", "contentBoundary"]);

/**
 * 捕捉想法工作区的 ToolHost：只负责工具注册（useFrontendTool / useHumanInTheLoop）。
 * 挂载为 <AgentPanel> 的 children。
 */
export function IdeaCaptureCopilotTools({ controller }: { controller: IdeaCaptureState }) {
  const { phase } = controller;

  useFrontendTool(
    {
      name: "updateWritingIntent",
      description: "Patch one or more fields of the left-side writing intent. The patch keys must be from: rawIdea, topic, audience, purpose, platform, coreViewpoint, contentBoundary.",
      available: true,
      parameters: writingIntentPatchSchema,
      handler: async (patch) => {
        const changedCards = controller.updateWritingIntent(patch);
        return { ok: true, changedCards };
      },
    },
    [],
  );

  useFrontendTool(
    {
      name: "highlightIntentCard",
      description: "Highlight one left-side writing intent card after it has been updated or should draw user attention.",
      parameters: z.object({ cardName: intentCardNameSchema }),
      handler: async ({ cardName }) => {
        controller.flashCard(cardName);
        return { ok: true, highlighted: cardName };
      },
    },
    [],
  );

  useHumanInTheLoop<ClarificationArgs>(
    {
      name: "clarification",
      description: "Render structured clarification questions and wait for the user's answers before continuing the writing intent flow.",
      available: phase !== "card",
      parameters: clarificationArgsSchema,
      render: ({ args, status, respond, result }) => (
        <AgentCardShell status={status} pending={<ClarificationQuestionPendingCard title={args.title} />}>
          {/* AgentCardShell 只在非 inProgress 状态渲染 children，此时 CopilotKit 保证 args 是完整类型。 */}
          <ClarificationQuestionCard
            args={args as unknown as ClarificationArgs}
            respond={respond}
            disabled={status !== "executing"}
            result={status === "complete" ? result : undefined}
            onAnswered={() => controller.notify("已提交澄清回答")}
          />
        </AgentCardShell>
      ),
    },
    [],
  );

  useHumanInTheLoop<WritingIntentConfirmationArgs>(
    {
      name: "confirmWritingIntent",
      description: "Ask the user to confirm whether the identified writing intent should be saved as the left-side writing intent card, or whether the agent should continue clarifying.",
      available: phase === "clarifying",
      parameters: writingIntentConfirmationArgsSchema,
      render: ({ args, status, respond }) => (
        <AgentCardShell status={status} pending={<WritingIntentConfirmPendingCard title={args.title} />}>
          {/* AgentCardShell 只在非 inProgress 状态渲染 children，此时 CopilotKit 保证 args 是完整类型。 */}
          <WritingIntentConfirmCard
            args={args as unknown as WritingIntentConfirmationArgs}
            respond={respond}
            disabled={status !== "executing"}
            onConfirmAccepted={controller.confirmWritingIntent}
            onContinueRequested={() => controller.notify("可以继续补充澄清")}
          />
        </AgentCardShell>
      ),
    },
    [],
  );

  return null;
}
