"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { IdeaCaptureState, WritingIntentDraft } from "./ideaCapture.types";

const intentCardConfigs = [
  {
    name: "raw",
    index: "01",
    label: "原始想法",
    state: "已确认",
    fieldKey: "rawIdea",
    chips: ["来自首轮输入", "可编辑"],
    accentChip: true,
  },
  {
    name: "topic",
    index: "02",
    label: "写作主题",
    state: "已识别",
    fieldKey: "topic",
    chips: ["主题可继续收窄"],
    accentChip: false,
  },
  {
    name: "audience",
    index: "03",
    label: "目标读者",
    state: "已明确",
    fieldKey: "audience",
    chips: ["面向创作决策"],
    accentChip: false,
  },
  {
    name: "purpose",
    index: "04",
    label: "写作目的",
    state: "已提炼",
    fieldKey: "purpose",
    chips: ["明确读者收益"],
    accentChip: true,
  },
  {
    name: "platform",
    index: "05",
    label: "发布平台",
    state: "已补齐",
    fieldKey: "platform",
    chips: ["影响表达形式"],
    accentChip: false,
  },
  {
    name: "coreViewpoint",
    index: "06",
    label: "核心观点",
    state: "已提炼",
    fieldKey: "coreViewpoint",
    chips: ["文章主论点"],
    accentChip: true,
  },
  {
    name: "contentBoundary",
    index: "07",
    label: "内容边界",
    state: "已约束",
    fieldKey: "contentBoundary",
    chips: ["避免话题失焦"],
    accentChip: true,
  },
] as const;

/**
 * 左侧写作意图沉淀区：确认前展示引导说明，确认后展示结构化写作意图卡片。
 * 纯展示 + 直接编辑，不感知 Agent/CopilotKit。
 */
export function IdeaCaptureIntentPanel({ controller }: { controller: IdeaCaptureState }) {
  const { phase, writingIntent, updatedCards, setWritingIntent } = controller;

  return (
    <aside className="fdc-panel" aria-label="左侧写作意图沉淀区">
      <div className="fdc-panel-header">
        <div className="fdc-panel-title">
          <h2>{phase === "card" ? "写作意图卡片" : "写作意图沉淀区"}</h2>
          <p>{phase === "card" ? "由右侧 Agent 澄清确认后生成，可直接编辑；后续对话也可继续更新。" : "确认前显示引导；确认后生成写作意图卡片。"}</p>
        </div>
      </div>

      <div className="fdc-left-body">
        {phase !== "card" ? <GuideState /> : <IntentCards writingIntent={writingIntent} updatedCards={updatedCards} setWritingIntent={setWritingIntent} />}
      </div>

      {phase === "card" ? (
        <footer className="fdc-card-summary">
          <div className="fdc-saved-hint">写作意图卡片已保存到当前写作项目。你仍可以在右侧继续对话，新的澄清结果会同步更新卡片。</div>
        </footer>
      ) : null}
    </aside>
  );
}

function GuideState() {
  return (
    <section className="fdc-guide-state" aria-label="引导说明">
      <div className="fdc-guide-hero">
        <p className="fdc-guide-kicker">Start</p>
        <h3>先说想法，不用填表。</h3>
        <p>在右侧输入一个粗糙想法。Agent 会追问并识别写作意图，确认后在这里生成卡片。</p>
      </div>
      <div className="fdc-guide-steps" aria-label="简要流程">
        {[
          ["01", "输入原始想法", "一句话或一段模糊描述都可以。"],
          ["02", "回答关键追问", "最多 3 次，收敛主题、读者和观点。"],
          ["03", "确认生成卡片", "沉淀为可编辑的写作意图卡片。"],
        ].map(([num, title, copy]) => (
          <div className="fdc-guide-step" key={num}>
            <div className="fdc-step-num">{num}</div>
            <div>
              <strong>{title}</strong>
              <span>{copy}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntentCards({ writingIntent, updatedCards, setWritingIntent }: { writingIntent: WritingIntentDraft; updatedCards: Set<string>; setWritingIntent: React.Dispatch<React.SetStateAction<WritingIntentDraft>> }) {
  const update = (key: keyof WritingIntentDraft, value: string) => setWritingIntent((current) => ({ ...current, [key]: value }));

  return (
    <section className="fdc-intent-state" aria-label="结构化写作意图卡片">
      <div className="fdc-intent-stack">
        {intentCardConfigs.map((cardConfig) => (
          <IntentCard
            key={cardConfig.name}
            name={cardConfig.name}
            index={cardConfig.index}
            label={cardConfig.label}
            state={cardConfig.state}
            updated={updatedCards.has(cardConfig.name)}
            chips={cardConfig.chips}
            accentChip={cardConfig.accentChip}
          >
            <EditableText
              value={writingIntent[cardConfig.fieldKey] || "—"}
              onBlur={(value) => update(cardConfig.fieldKey, value)}
            />
          </IntentCard>
        ))}
      </div>
    </section>
  );
}

function IntentCard({ name, index, label, state, updated, chips, accentChip, children }: { name: string; index: string; label: string; state: string; updated?: boolean; chips: readonly string[]; accentChip?: boolean; children: React.ReactNode }) {
  return (
    <article className={cn("fdc-intent-card", updated && "updated")} data-card={name}>
      <div className="fdc-card-head">
        <div className="fdc-card-label"><span className="fdc-card-index">{index}</span>{label}</div>
        <span className="fdc-card-state">{state}</span>
      </div>
      {children}
      <div className="fdc-chips">
        {chips.map((chip, index) => <span className={cn("fdc-chip", accentChip && index === 0 && "accent")} key={chip}>{chip}</span>)}
      </div>
    </article>
  );
}

function EditableText({ value, onBlur }: { value: string; onBlur: (value: string) => void }) {
  const normalizedValue = value === "—" ? "" : value;
  const [draft, setDraft] = useState(normalizedValue);
  const [syncedValue, setSyncedValue] = useState(normalizedValue);

  // 渲染期调整状态（而非 useEffect 里 setState）：当外部 value 变化时同步 draft，避免额外一次 effect 触发的级联重渲染。
  if (normalizedValue !== syncedValue) {
    setSyncedValue(normalizedValue);
    setDraft(normalizedValue);
  }

  function handleBlur() {
    const trimmed = draft.trim();
    onBlur(trimmed || "—");
  }

  return (
    <textarea
      className="fdc-editable"
      rows={1}
      value={draft}
      placeholder="—"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={handleBlur}
    />
  );
}
