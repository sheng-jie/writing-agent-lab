"use client";

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { AgentCardShell } from "@/components/agent/AgentCardShell";

import { ClarificationQuestionCard, ClarificationQuestionPendingCard, clarificationArgsSchema, type ClarificationArgs } from "./ClarificationQuestionCard";
import { WritingIntentConfirmCard, WritingIntentConfirmPendingCard, writingIntentConfirmationArgsSchema, type WritingIntentConfirmationArgs } from "./WritingIntentConfirmCard";
import type { ClarifyState } from "./useClarifyState";

const materialSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["对话素材", "联网资料", "用户链接"]),
});

const briefPatchSchema = z.object({
  rawNeed: z.string().optional(),
  topic: z.string().optional(),
  audience: z.string().optional(),
  thesis: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  selectedDirection: z.enum(["method", "product", "opinion"]).optional(),
});

const intentCardNameSchema = z.enum(["raw", "topic", "audience", "thesis", "materials"]);

/**
 * `/clarify` 的业务 ToolHost：只负责工具注册（useFrontendTool / useHumanInTheLoop）。
 * 状态存储与 useAgentContext 同步已下沉到 useClarifyState。
 * 挂载为 <AgentPanel> 的 children。
 */
export function ClarifyCopilotTools({ controller }: { controller: ClarifyState }) {
  const { phase } = controller;

  useFrontendTool(
    {
      name: "updateWritingBrief",
      description: "Patch one or more fields of the left-side writing intent brief. Use this when the conversation identifies raw need, topic, audience, thesis, selected direction, or materials.",
      available: phase !== "card",
      parameters: briefPatchSchema,
      handler: async (patch) => {
        const changedCards = controller.updateBrief(patch);
        return { ok: true, changedCards };
      },
    },
    [],
  );

  useFrontendTool(
    {
      name: "addMaterials",
      description: "Add material links or conversation references to the left-side material list without replacing existing materials.",
      available: phase !== "card",
      parameters: z.object({ materials: z.array(materialSchema).min(1) }),
      handler: async ({ materials }) => {
        controller.addMaterials(materials);
        return { ok: true, added: materials.length };
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
      description: "Render structured clarification questions and wait for the user's answers before continuing the writing brief flow.",
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
            onConfirmAccepted={controller.confirmBrief}
            onContinueRequested={() => controller.notify("可以继续补充澄清")}
          />
        </AgentCardShell>
      ),
    },
    [],
  );

  return null;
}
