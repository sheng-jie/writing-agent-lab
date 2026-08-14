"use client";

import { z } from "zod";

export const writingIntentConfirmationArgsSchema = z.object({
  type: z.literal("WritingIntentConfirmation"),
  version: z.literal("1.0"),
  title: z.string().optional(),
  message: z.string().optional(),
  confirmLabel: z.string().optional(),
  continueLabel: z.string().optional(),
  writingIntent: z.object({
    rawIdea: z.string().optional(),
    topic: z.string().optional(),
    audience: z.string().optional(),
    purpose: z.string().optional(),
    platform: z.string().optional(),
    coreViewpoint: z.string().optional(),
    contentBoundary: z.string().optional(),
  }),
});

export type WritingIntentConfirmationArgs = z.infer<typeof writingIntentConfirmationArgsSchema>;

export type WritingIntentConfirmationResponse = {
  type: "WritingIntentConfirmationResponse";
  version: "1.0";
  action: "confirm" | "continue";
};

export function WritingIntentConfirmCard({ args, respond, disabled, onPropose, onContinueRequested }: {
  args: WritingIntentConfirmationArgs;
  respond?: (response: WritingIntentConfirmationResponse) => void | Promise<void>;
  disabled?: boolean;
  onPropose?: (writingIntent: WritingIntentConfirmationArgs["writingIntent"]) => void;
  onContinueRequested?: () => void;
}) {
  async function confirm() {
    if (!respond || disabled) return;

    onPropose?.(args.writingIntent);
    await respond({
      type: "WritingIntentConfirmationResponse",
      version: "1.0",
      action: "confirm",
    });
  }

  async function continueIdentifying() {
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
        <div><span>原始想法</span><span>{args.writingIntent.rawIdea || "—"}</span></div>
        <div><span>写作主题</span><span>{args.writingIntent.topic || "—"}</span></div>
        <div><span>目标读者</span><span>{args.writingIntent.audience || "—"}</span></div>
        <div><span>写作目的</span><span>{args.writingIntent.purpose || "—"}</span></div>
        <div><span>发布平台</span><span>{args.writingIntent.platform || "—"}</span></div>
        <div><span>核心观点</span><span>{args.writingIntent.coreViewpoint || "—"}</span></div>
        <div><span>内容边界</span><span>{args.writingIntent.contentBoundary || "—"}</span></div>
      </div>

      <div className="fdc-confirm-actions">
        <button className="fdc-primary-btn" type="button" disabled={disabled || !respond} onClick={() => void confirm()}>
          {disabled ? "已确认" : args.confirmLabel ?? "确认生成卡片"}
        </button>
        <button className="fdc-ghost-btn" type="button" disabled={disabled || !respond} onClick={() => void continueIdentifying()}>
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
      <p>Agent 正在整理结构化写作意图的 7 个字段，请稍候…</p>
    </div>
  );
}
