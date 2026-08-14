"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";

import { AgentCardShell } from "@/components/agent/AgentCardShell";

import { WritingIntentQuestionCard, WritingIntentQuestionPendingCard, writingIntentQuestionArgsSchema, type WritingIntentQuestionArgs } from "./WritingIntentQuestionCard";
import { WritingIntentConfirmCard, WritingIntentConfirmPendingCard, writingIntentConfirmationArgsSchema, type WritingIntentConfirmationArgs } from "./WritingIntentConfirmCard";
import type { IdeaCaptureState } from "./ideaCapture.types";

/**
 * 捕捉想法工作区的 ToolHost：只负责工具注册（useFrontendTool / useHumanInTheLoop）。
 * 挂载为 <AgentPanel> 的 children。
 */
export function IdeaCaptureCopilotTools({ controller }: { controller: IdeaCaptureState }) {
  const { phase } = controller;

  useHumanInTheLoop<WritingIntentQuestionArgs>(
    {
      name: "writingIntentQuestions",
      description: "Render structured writing intent questions and wait for the user's answers before continuing.",
      available: phase !== "card",
      parameters: writingIntentQuestionArgsSchema,
      render: ({ args, status, respond, result }) => (
        <AgentCardShell status={status} pending={<WritingIntentQuestionPendingCard title={args.title} />}>
          {/* AgentCardShell 只在非 inProgress 状态渲染 children，此时 CopilotKit 保证 args 是完整类型。 */}
          <WritingIntentQuestionCard
            args={args as unknown as WritingIntentQuestionArgs}
            respond={respond}
            disabled={status !== "executing"}
            result={status === "complete" ? result : undefined}
            onAnswered={() => controller.notify("已提交澄清回答")}
          />
        </AgentCardShell>
      ),
    },
    [controller],
  );

  useHumanInTheLoop<WritingIntentConfirmationArgs>(
    {
      name: "proposeWritingIntent",
      description: "Show the candidate writing intent for user review. This only generates or updates the candidate and never accepts the stage.",
      available: controller.editable,
      parameters: writingIntentConfirmationArgsSchema,
      render: ({ args, status, respond }) => (
        <AgentCardShell status={status} pending={<WritingIntentConfirmPendingCard title={args.title} />}>
          {/* AgentCardShell 只在非 inProgress 状态渲染 children，此时 CopilotKit 保证 args 是完整类型。 */}
          <WritingIntentConfirmCard
            args={args as unknown as WritingIntentConfirmationArgs}
            respond={respond}
            disabled={status !== "executing"}
            onPropose={controller.proposeWritingIntent}
            onContinueRequested={() => controller.notify("可以继续补充写作意图")}
          />
        </AgentCardShell>
      ),
    },
    [controller, phase],
  );

  return null;
}
