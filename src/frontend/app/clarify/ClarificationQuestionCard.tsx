"use client";

import { useState } from "react";
import { z } from "zod";

export const clarificationArgsSchema = z.object({
  type: z.literal("Clarification"),
  version: z.literal("2.0"),
  title: z.string().optional(),
  submitLabel: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["single_choice", "multi_choice", "text"]),
        title: z.string().min(1),
        options: z
          .array(
            z.object({
              id: z.string().min(1),
              label: z.string().min(1),
            }),
          )
          .optional(),
        placeholder: z.string().optional(),
        allowOtherText: z.boolean().optional(),
      }),
    )
    .min(1),
});

export type ClarificationArgs = z.infer<typeof clarificationArgsSchema>;

export type ClarificationAnswer = {
  questionId: string;
  selectedOptionIds?: string[];
  text?: string;
};

export type ClarificationResponse = {
  type: "ClarificationResponse";
  version: "2.0";
  answers: ClarificationAnswer[];
};

function parseSubmittedAnswers(result: string | undefined): Map<string, ClarificationAnswer> | null {
  if (!result) return null;

  try {
    const parsed = JSON.parse(result) as Partial<ClarificationResponse>;
    if (!Array.isArray(parsed.answers)) return null;
    return new Map(parsed.answers.map((answer) => [answer.questionId, answer]));
  } catch {
    return null;
  }
}

export function ClarificationQuestionCard({ args, respond, disabled, result, onAnswered }: {
  args: ClarificationArgs;
  respond?: (response: ClarificationResponse) => void | Promise<void>;
  disabled?: boolean;
  /**
   * 工具调用进入 complete 状态后，CopilotKit 会把 respond(...) 传入的内容序列化后
   * 通过 result 传回——这是来自 Agent 消息历史的权威数据，不依赖组件本地 state 是否存活，
   * 提交后的只读摘要优先用它渲染，避免因为重新渲染/重新实例化而显示为"未选中"。
   */
  result?: string;
  onAnswered?: () => void;
}) {
  const [singleSelected, setSingleSelected] = useState<Record<string, string>>({});
  const [multiSelected, setMultiSelected] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const submittedAnswers = disabled ? parseSubmittedAnswers(result) : null;

  function toggleMultiChoice(questionId: string, optionId: string) {
    setMultiSelected((current) => {
      const values = current[questionId] ?? [];
      const nextValues = values.includes(optionId)
        ? values.filter((id) => id !== optionId)
        : [...values, optionId];

      return { ...current, [questionId]: nextValues };
    });
  }

  async function submit() {
    if (!respond || disabled) return;

    const answers = args.questions.map((question) => {
      if (question.kind === "single_choice") {
        const selected = singleSelected[question.id];

        return {
          questionId: question.id,
          selectedOptionIds: selected ? [selected] : [],
        };
      }

      if (question.kind === "multi_choice") {
        return {
          questionId: question.id,
          selectedOptionIds: multiSelected[question.id] ?? [],
        };
      }

      return {
        questionId: question.id,
        text: (textAnswers[question.id] ?? "").trim(),
      };
    });

    const hasEmptyRequiredAnswer = answers.some((answer) => {
      const hasOptions = (answer.selectedOptionIds?.length ?? 0) > 0;
      const hasText = Boolean(answer.text?.trim());
      return !hasOptions && !hasText;
    });

    if (hasEmptyRequiredAnswer) {
      setError("请先回答所有问题，再提交给 Agent。");
      return;
    }

    setError(null);
    await respond({
      type: "ClarificationResponse",
      version: "2.0",
      answers,
    });
    onAnswered?.();
  }


  return (
    <div className="fdc-question-card fdc-interaction-card w-full max-w-[620px]">
      <h3>{args.title ?? "我需要再确认几个关键信息"}</h3>
      <p>
        {disabled
          ? "已提交以下回答，Agent 会基于此继续澄清写作意图。"
          : "回答后 Agent 会继续澄清并更新写作意图。当前卡片由 CopilotKit human-in-the-loop 工具渲染。"}
      </p>

      <div className="fdc-clarification-stack">
        {args.questions.map((question, index) => {
          // 提交后优先用 result（Agent 消息历史里的权威数据）渲染只读摘要，
          // 而不是继续渲染本地 state 驱动、可能因重新渲染而显示为"未选中"的表单控件。
          if (disabled) {
            const submittedAnswer = submittedAnswers?.get(question.id);
            const answerText =
              question.kind === "text"
                ? submittedAnswer?.text?.trim() || "（未填写）"
                : (submittedAnswer?.selectedOptionIds ?? [])
                    .map((optionId) => (question.options ?? []).find((option) => option.id === optionId)?.label)
                    .filter(Boolean)
                    .join("、") || "（未选择）";

            return (
              <section className="fdc-clarification-question" key={question.id}>
                <h4><span>{String(index + 1).padStart(2, "0")}</span>{question.title}</h4>
                <p className="fdc-clarification-answer">{answerText}</p>
              </section>
            );
          }

          return (
            <section className="fdc-clarification-question" key={question.id}>
              <h4><span>{String(index + 1).padStart(2, "0")}</span>{question.title}</h4>

              {question.kind === "single_choice" ? (
                <div className="fdc-option-grid">
                  {(question.options ?? []).map((option) => (
                    <button
                      className={`fdc-option-btn ${singleSelected[question.id] === option.id ? "selected" : ""}`}
                      type="button"
                      disabled={disabled}
                      key={option.id}
                      onClick={() => setSingleSelected((current) => ({ ...current, [question.id]: option.id }))}
                    >
                      <strong>{option.label}</strong>
                    </button>
                  ))}
                </div>
              ) : null}

              {question.kind === "multi_choice" ? (
                <div className="fdc-option-grid">
                  {(question.options ?? []).map((option) => (
                    <button
                      className={`fdc-option-btn ${(multiSelected[question.id] ?? []).includes(option.id) ? "selected" : ""}`}
                      type="button"
                      disabled={disabled}
                      key={option.id}
                      onClick={() => toggleMultiChoice(question.id, option.id)}
                    >
                      <strong>{option.label}</strong>
                    </button>
                  ))}
                </div>
              ) : null}

              {question.kind === "text" ? (
                <textarea
                  className="fdc-clarification-textarea"
                  disabled={disabled}
                  rows={3}
                  value={textAnswers[question.id] ?? ""}
                  placeholder={question.placeholder ?? "请输入你的补充说明"}
                  onChange={(event) => setTextAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              ) : null}
            </section>
          );
        })}
      </div>

      {error ? <p className="fdc-clarification-error">{error}</p> : null}

      {!disabled ? (
        <div className="fdc-confirm-actions">
          <button className="fdc-primary-btn" type="button" disabled={!respond} onClick={() => void submit()}>
            {args.submitLabel ?? "提交澄清回答"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ClarificationQuestionPendingCard({ title }: { title?: string }) {
  return (
    <div className="fdc-question-card fdc-interaction-card w-full max-w-[620px]">
      <h3>{title ?? "正在准备澄清问题"}</h3>
      <p>Agent 正在组织需要确认的信息，请稍候…</p>
    </div>
  );
}
