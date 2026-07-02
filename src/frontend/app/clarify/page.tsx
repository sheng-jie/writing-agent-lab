"use client";

import { CopilotChatMessageView, CopilotKit, UseAgentUpdate, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useRef, useState } from "react";

import { FlowDraftAssistantMessage, FlowDraftUserMessage, flowDraftMessageViewClassName } from "./ChatMessages";
import { ClarifyCopilotTools } from "./ClarifyCopilotTools";
import { cn } from "@/lib/utils";

type Material = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

type Direction = "method" | "product" | "opinion";

type Brief = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: Material[];
  selectedDirection: Direction | "";
};

const initialBrief: Brief = {
  rawNeed: "",
  topic: "",
  audience: "",
  thesis: "",
  materials: [],
  selectedDirection: "",
};

const exampleIdeas = [
  {
    title: "填入示例想法",
    copy: "适合快速体验从模糊想法到写作意图卡片的流程。",
    value:
      "我想写一篇关于 AI Agent 怎么帮助内容创作者把模糊想法变成可发布文章的内容，但还不知道该从产品角度写，还是从方法论角度写。",
  },
  {
    title: "观点型示例",
    copy: "更适合沉淀一篇带明确主张的观点文章。",
    value: "我最近在研究 AI 写作工具，想写一篇文章讨论为什么真正重要的不是自动生成，而是帮助创作者想清楚。",
  },
  {
    title: "带链接示例",
    copy: "用于演示素材清单如何关联用户输入链接。",
    value:
      "我想写给刚开始做自媒体的人，帮他们解决有想法但不知道怎么变成选题的问题。可以参考 https://developers.googleblog.com/ 和 https://openai.com/research/ 。",
  },
] as const;

function materialFallback(materials: Material[]) {
  return materials.length
    ? materials
    : [{ title: "原始需求与澄清对话", url: "conversation://initial-idea", type: "对话素材" } satisfies Material];
}

export default function ClarifyPage() {
  const [phase, setPhase] = useState<"initial" | "clarifying" | "card">("initial");
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [toast, setToast] = useState("已更新");
  const [toastVisible, setToastVisible] = useState(false);
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const [chatResetKey, setChatResetKey] = useState(0);
  const toastTimerRef = useRef<number | null>(null);

  function showToast(text: string) {
    setToast(text);
    setToastVisible(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 1800);
  }

  function flashCard(name: string) {
    setUpdatedCards((current) => {
      const next = new Set(current);
      next.add(name);
      return next;
    });
    window.setTimeout(() => {
      setUpdatedCards((current) => {
        const next = new Set(current);
        next.delete(name);
        return next;
      });
    }, 920);
  }

  function flashCards(names: string[]) {
    names.forEach(flashCard);
  }

  function restart() {
    setPhase("initial");
    setBrief(initialBrief);
    setUpdatedCards(new Set());
    setChatResetKey((key) => key + 1);
    showToast("已重新开始");
  }

  const statusText = phase === "initial" ? "等待输入原始想法" : phase === "card" ? "已保存到写作项目" : "动态澄清中";

  return (
    <main className="fd-clarify">
      <header className="fdc-topbar">
        <div className="fdc-brand">
          <div className="fdc-brand-mark" aria-hidden="true">意</div>
          <div>
            <h1>写作意图识别</h1>
            <p>从一句模糊想法开始，通过 Agent 澄清后沉淀为结构化写作意图卡片。</p>
          </div>
        </div>
        <div className="fdc-top-actions">
          <span className="fdc-status-pill"><span className="fdc-pulse" aria-hidden="true" />{statusText}</span>
          {phase === "card" ? <button className="fdc-ghost-btn" type="button" onClick={restart}>重新开始</button> : null}
        </div>
      </header>

      <section className="fdc-workspace" aria-label="写作意图识别工作区">
        <aside className="fdc-panel" aria-label="左侧写作意图沉淀区">
          <div className="fdc-panel-header">
            <div className="fdc-panel-title">
              <h2>{phase === "card" ? "写作意图卡片" : "写作意图沉淀区"}</h2>
              <p>{phase === "card" ? "由右侧 Agent 澄清确认后生成，可直接编辑；后续对话也可继续更新。" : "确认前显示引导；确认后生成写作意图卡片。"}</p>
            </div>
          </div>

          <div className="fdc-left-body">
            {phase !== "card" ? <GuideState /> : <IntentCards brief={brief} updatedCards={updatedCards} setBrief={setBrief} />}
          </div>

          {phase === "card" ? (
            <footer className="fdc-card-summary">
              <div className="fdc-saved-hint">写作意图卡片已保存到当前写作项目。你仍可以在右侧继续对话，新的澄清结果会同步更新卡片。</div>
            </footer>
          ) : null}
        </aside>

        <CopilotKit key={chatResetKey} runtimeUrl="/api/copilotkit" agent="clarificationAgent" useSingleEndpoint showDevConsole>
          <ClarifyCopilotTools
            brief={brief}
            phase={phase}
            setBrief={setBrief}
            setPhase={setPhase}
            showToast={showToast}
            flashCard={flashCard}
            flashCards={flashCards}
          />
          <CopilotShellPanel phase={phase} />
        </CopilotKit>
      </section>

      <div className={cn("fdc-toast", toastVisible && "show")} role="status">{toast}</div>
    </main>
  );
}

function CopilotShellPanel({ phase }: { phase: "initial" | "clarifying" | "card" }) {
  const { agent } = useAgent({
    agentId: "clarificationAgent",
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 80,
  });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");

  async function submitToAgent(text: string) {
    const trimmed = text.trim();
    if (!trimmed || agent.isRunning) return;

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    });
    await copilotkit.runAgent({ agent });
  }

  async function sendCurrentInput() {
    const text = input.trim();
    if (!text || agent.isRunning) return;

    setInput("");
    await submitToAgent(text);
  }

  return (
    <section className="fdc-panel fdc-chat-panel" aria-label="右侧 Agent 对话区">
      <div className="fdc-panel-header">
        <div className="fdc-panel-title">
          <h2>Agent 对话</h2>
          <p>阶段 2：保留右侧面板结构，由 CopilotKit 管理消息与运行状态。</p>
        </div>
        <span className="fdc-agent-badge">{phase === "card" ? "Saved Intent" : agent.isRunning ? "Thinking" : "Intent Agent"}</span>
      </div>

      <div className="fdc-chat-scroll fdc-copilot-scroll" aria-label="会话历史滚动区">
        {agent.messages.length ? (
          <CopilotChatMessageView
            className={cn(flowDraftMessageViewClassName, "fdc-copilot-tool-scope")}
            messages={[...agent.messages]}
            isRunning={agent.isRunning}
            userMessage={FlowDraftUserMessage}
            assistantMessage={FlowDraftAssistantMessage}
          />
        ) : (
          <section className="fdc-copilot-empty" aria-label="CopilotKit 自定义外壳空状态">
            <div className="fdc-welcome-message">
              <div className="fdc-avatar">AI</div>
              <section className="fdc-welcome-card fdc-interaction-card" aria-label="Welcome 引导卡片">
                <div>
                  <h3 className="fdc-welcome-title">先说一个粗糙想法就可以。</h3>
                  <p className="fdc-welcome-copy">你可以直接输入，也可以点选一个示例。示例只会先填入底部输入框，确认后再由你手动发送给 Agent。</p>
                  <div className="fdc-welcome-tags">
                    <span>CopilotKit 驱动</span>
                    <span>示例填入草稿</span>
                    <span>支持链接素材识别</span>
                  </div>
                </div>
                <div className="fdc-example-grid" aria-label="示例想法">
                  {exampleIdeas.map((example) => (
                    <button
                      className="fdc-example-card"
                      type="button"
                      disabled={agent.isRunning}
                      key={example.title}
                      onClick={() => setInput(example.value)}
                    >
                      <strong>{example.title}</strong>
                      <span>{example.copy}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </div>

      <div className="fdc-bottom-dock" aria-label="固定底部输入区">
        <div className="fdc-composer">
          <div className="fdc-composer-box">
            <textarea
              rows={1}
              value={input}
              disabled={agent.isRunning}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendCurrentInput();
                }
              }}
              placeholder={agent.isRunning ? "Agent 正在思考…" : "输入模糊原始想法，例如：我想写一篇关于 AI Agent 如何帮助创作者澄清选题的文章…"}
            />
            <div className="fdc-mini-tools" aria-label="输入工具">
              <button className="fdc-icon-btn" type="button" title="添加链接" disabled={agent.isRunning} onClick={() => setInput((value) => `${value ? `${value} ` : ""}https://`)}>＋</button>
              <button className="fdc-icon-btn" type="button" title="清空输入" disabled={agent.isRunning} onClick={() => setInput("")}>⌫</button>
            </div>
          </div>
          <button className="fdc-send-btn" type="button" aria-label={agent.isRunning ? "停止" : "发送"} onClick={() => agent.isRunning ? agent.abortRun() : void sendCurrentInput()}>{agent.isRunning ? "■" : "↑"}</button>
        </div>
      </div>
    </section>
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

function IntentCards({ brief, updatedCards, setBrief }: { brief: Brief; updatedCards: Set<string>; setBrief: React.Dispatch<React.SetStateAction<Brief>> }) {
  const update = (key: keyof Brief, value: string) => setBrief((current) => ({ ...current, [key]: value }));

  return (
    <section className="fdc-intent-state" aria-label="结构化写作意图卡片">
      <div className="fdc-intent-stack">
        <IntentCard name="raw" index="01" label="原始需求" state="已确认" updated={updatedCards.has("raw")} chips={["来自首轮输入", "可编辑"]} accentChip>
          <EditableText value={brief.rawNeed || "—"} onBlur={(value) => update("rawNeed", value)} />
        </IntentCard>
        <IntentCard name="topic" index="02" label="写作主题" state="已识别" updated={updatedCards.has("topic")} chips={["主题可继续收窄"]}>
          <EditableText value={brief.topic || "—"} onBlur={(value) => update("topic", value)} />
        </IntentCard>
        <IntentCard name="audience" index="03" label="目标读者" state="已明确" updated={updatedCards.has("audience")} chips={["面向创作决策"]}>
          <EditableText value={brief.audience || "—"} onBlur={(value) => update("audience", value)} />
        </IntentCard>
        <IntentCard name="thesis" index="04" label="核心观点" state="已提炼" updated={updatedCards.has("thesis")} chips={["文章主论点"]} accentChip>
          <EditableText value={brief.thesis || "—"} onBlur={(value) => update("thesis", value)} />
        </IntentCard>
        <article className={cn("fdc-intent-card", updatedCards.has("materials") && "updated")} data-card="materials">
          <div className="fdc-card-head">
            <div className="fdc-card-label"><span className="fdc-card-index">05</span>素材清单</div>
            <span className="fdc-card-state">已关联</span>
          </div>
          <ul className="fdc-material-list">
            {materialFallback(brief.materials).map((item) => (
              <li key={item.url}>
                <span className="fdc-link-dot">{item.type === "用户链接" ? "U" : item.type === "联网资料" ? "W" : "C"}</span>
                <span>
                  <span className="fdc-material-title">{item.title}</span>
                  <span className="fdc-material-url">{item.url}</span>
                </span>
                <span className="fdc-tag">{item.type}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function IntentCard({ name, index, label, state, updated, chips, accentChip, children }: { name: string; index: string; label: string; state: string; updated?: boolean; chips: string[]; accentChip?: boolean; children: React.ReactNode }) {
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
  return (
    <div
      className="fdc-editable"
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => onBlur(event.currentTarget.textContent || "")}
    >
      {value}
    </div>
  );
}
