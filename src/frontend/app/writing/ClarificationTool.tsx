"use client";

import { useState } from "react";
import { ToolCallStatus, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

const clarificationArgsSchema = z.object({
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

type ClarificationArgs = z.infer<typeof clarificationArgsSchema>;

type ClarificationAnswer = {
  questionId: string;
  selectedOptionIds?: string[];
  text?: string;
};

type ClarificationResponse = {
  type: "ClarificationResponse";
  version: "2.0";
  answers: ClarificationAnswer[];
};

type ClarificationRendererProps = {
  args: ClarificationArgs;
  respond?: (response: ClarificationResponse) => void | Promise<void>;
};

function ClarificationRenderer({ args, respond }: ClarificationRendererProps) {
  const [singleSelected, setSingleSelected] = useState<Record<string, string>>({});
  const [multiSelected, setMultiSelected] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function toggleMultiChoice(questionId: string, optionId: string) {
    setMultiSelected((current) => {
      const values = current[questionId] ?? [];
      const nextValues = values.includes(optionId)
        ? values.filter((id) => id !== optionId)
        : [...values, optionId];

      return {
        ...current,
        [questionId]: nextValues,
      };
    });
  }

  async function submit() {
    if (!respond) return;

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
  }

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-900 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          Clarification
        </p>
        <h3 className="mt-1 text-base font-semibold">
          {args.title ?? "我需要再确认几个关键信息"}
        </h3>
      </div>

      <div className="space-y-4">
        {args.questions.map((question) => (
          <div key={question.id} className="rounded-xl bg-white p-3 ring-1 ring-sky-100">
            <p className="mb-2 text-sm font-medium">{question.title}</p>

            {question.kind === "single_choice" ? (
              <div className="flex flex-wrap gap-2">
                {(question.options ?? []).map((option) => {
                  const selected = singleSelected[question.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setSingleSelected((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-sm ring-1 transition ${
                        selected
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-white text-slate-700 ring-slate-200 hover:ring-sky-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {question.kind === "multi_choice" ? (
              <div className="flex flex-wrap gap-2">
                {(question.options ?? []).map((option) => {
                  const selected = (multiSelected[question.id] ?? []).includes(option.id);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleMultiChoice(question.id, option.id)}
                      className={`rounded-full px-3 py-1 text-sm ring-1 transition ${
                        selected
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-white text-slate-700 ring-slate-200 hover:ring-sky-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {question.kind === "text" ? (
              <textarea
                value={textAnswers[question.id] ?? ""}
                onChange={(event) =>
                  setTextAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                placeholder={question.placeholder ?? "请输入你的补充说明"}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        {args.submitLabel ?? "提交澄清回答"}
      </button>
    </div>
  );
}

export function ClarificationToolRegistration() {
  useHumanInTheLoop<ClarificationArgs>({
    name: "clarification",
    description: "展示结构化澄清问题，并等待用户回答。",
    parameters: clarificationArgsSchema,
    render: ({ args, respond, status }) => {
      if (status !== ToolCallStatus.Executing) return null;

      return <ClarificationRenderer args={args} respond={respond} />;
    },
  });

  return null;
}
