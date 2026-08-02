"use client";

import { z } from "zod";

const confirmationMaterialSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["对话素材", "联网资料", "用户链接"]),
});

export const writingIntentConfirmationArgsSchema = z.object({
  type: z.literal("WritingIntentConfirmation"),
  version: z.literal("1.0"),
  title: z.string().optional(),
  message: z.string().optional(),
  confirmLabel: z.string().optional(),
  continueLabel: z.string().optional(),
  brief: z.object({
    rawNeed: z.string().optional(),
    topic: z.string().optional(),
    audience: z.string().optional(),
    thesis: z.string().optional(),
    materials: z.array(confirmationMaterialSchema).optional(),
    selectedDirection: z.enum(["method", "product", "opinion"]).optional(),
  }),
});

export type WritingIntentConfirmationArgs = z.infer<typeof writingIntentConfirmationArgsSchema>;

export type WritingIntentConfirmationResponse = {
  type: "WritingIntentConfirmationResponse";
  version: "1.0";
  action: "confirm" | "continue";
};

export function WritingIntentConfirmCard({ args, respond, disabled, onConfirmAccepted, onContinueRequested }: {
  args: WritingIntentConfirmationArgs;
  respond?: (response: WritingIntentConfirmationResponse) => void | Promise<void>;
  disabled?: boolean;
  onConfirmAccepted?: (brief: WritingIntentConfirmationArgs["brief"]) => void;
  onContinueRequested?: () => void;
}) {
  async function confirm() {
    if (!respond || disabled) return;

    onConfirmAccepted?.(args.brief);
    await respond({
      type: "WritingIntentConfirmationResponse",
      version: "1.0",
      action: "confirm",
    });
  }

  async function continueClarifying() {
    if (!respond || disabled) return;

    onContinueRequested?.();
    await respond({
      type: "WritingIntentConfirmationResponse",
      version: "1.0",
      action: "continue",
    });
  }

  return (
    <div className="fdc-confirm-card fdc-interaction-card w-full max-w-[620px]">
      <h3>{args.title ?? "可以沉淀为写作意图卡片了"}</h3>
      <p>{args.message ?? "Agent 已识别出完整字段。确认后，左侧将从引导说明切换为结构化卡片，并保存到当前写作项目。"}</p>

      <div className="fdc-draft-table">
        <div><span>写作主题</span><span>{args.brief.topic || "—"}</span></div>
        <div><span>目标读者</span><span>{args.brief.audience || "—"}</span></div>
        <div><span>核心观点</span><span>{args.brief.thesis || "—"}</span></div>
      </div>

      <div className="fdc-confirm-actions">
        <button className="fdc-primary-btn" type="button" disabled={disabled || !respond} onClick={() => void confirm()}>
          {disabled ? "已确认" : args.confirmLabel ?? "确认生成卡片"}
        </button>
        <button className="fdc-ghost-btn" type="button" disabled={disabled || !respond} onClick={() => void continueClarifying()}>
          {args.continueLabel ?? "继续补充一句"}
        </button>
      </div>
    </div>
  );
}

export function WritingIntentConfirmPendingCard({ title }: { title?: string }) {
  return (
    <div className="fdc-confirm-card fdc-interaction-card w-full max-w-[620px]">
      <h3>{title ?? "正在准备确认卡片"}</h3>
      <p>Agent 正在整理写作主题、目标读者和核心观点，请稍候…</p>
    </div>
  );
}
