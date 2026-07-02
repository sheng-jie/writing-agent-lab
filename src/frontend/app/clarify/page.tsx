"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Material = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

type Brief = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: Material[];
  selectedDirection: keyof typeof presets | "";
};

type ChatItem =
  | { id: string; kind: "welcome"; locked?: boolean; selected?: string }
  | { id: string; kind: "message"; role: "agent" | "user"; text: string; meta: string }
  | { id: string; kind: "question"; step: 1 | 2 | 3; locked?: boolean; selected?: string }
  | { id: string; kind: "confirm"; locked?: boolean; selected?: "confirm" | "continue" };

const initialBrief: Brief = {
  rawNeed: "",
  topic: "",
  audience: "",
  thesis: "",
  materials: [],
  selectedDirection: "",
};

const presets = {
  method: {
    user: "我更想做成方法论型，让读者可以照着操作。",
    topic: "如何用 AI Agent 澄清选题：把模糊灵感变成可写文章的 5 步方法",
    audience: "刚开始做自媒体、经常卡在选题阶段的个人创作者和知识博主",
    thesis:
      "AI Agent 的真正价值，是通过连续追问把“我大概想写点什么”转化为主题、读者、观点、素材和结构，而不是跳过思考直接生成正文。",
    materials: [
      { title: "用户输入中提到的原始想法片段", url: "conversation://initial-idea", type: "对话素材" },
      { title: "AI 写作工具与创作流程相关资料", url: "https://openai.com/research/", type: "联网资料" },
      { title: "内容创作者工作流与产品实践参考", url: "https://developers.googleblog.com/", type: "联网资料" },
    ] satisfies Material[],
  },
  product: {
    user: "我想解释这个写作意图识别页面为什么是写作工作台的第一步。",
    topic: "为什么写作工作台需要写作意图识别：从模糊想法到结构化项目",
    audience: "内容产品设计者、AI 写作工具用户、希望搭建个人写作系统的创作者",
    thesis:
      "写作工作台的第一价值不是直接生成更多文本，而是建立一个能承接模糊想法、持续追问并沉淀结构化意图的入口。",
    materials: [
      { title: "当前页面需求澄清对话", url: "conversation://requirements-thread", type: "对话素材" },
      { title: "AI 产品交互与开发者生态资料", url: "https://developers.googleblog.com/", type: "联网资料" },
      { title: "AI Agent 与写作辅助相关资料", url: "https://openai.com/research/", type: "联网资料" },
    ] satisfies Material[],
  },
  opinion: {
    user: "我想更强调一个观点：AI 写作不是代写，而是帮人想清楚。",
    topic: "AI 写作的下一步：不是替你写，而是帮你想清楚",
    audience: "关注 AI 工具、内容创作效率和个人知识管理的读者",
    thesis:
      "真正有价值的 AI 写作助手，不是把模糊想法包装成流畅文字，而是先暴露问题、提出追问、帮助用户形成自己的判断。",
    materials: [
      { title: "用户关于“不是代写，而是澄清”的观点表达", url: "conversation://core-opinion", type: "对话素材" },
      { title: "AI 研究与应用趋势资料", url: "https://openai.com/research/", type: "联网资料" },
      { title: "创作者工具与开发者实践参考", url: "https://developers.googleblog.com/", type: "联网资料" },
    ] satisfies Material[],
  },
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

const directionOptions = [
  ["method", "方法论型", "让读者学会如何用 AI Agent 澄清选题、整理素材、形成文章结构。"],
  ["product", "产品解释型", "解释为什么写作工作台需要“写作意图识别”这个入口。"],
  ["opinion", "观点评论型", "表达“AI 写作不是代写，而是帮助人想清楚”的判断。"],
] as const;

const audienceOptions = [
  ["creator", "新手自媒体作者", "有想法，但经常卡在选题、观点和素材整理上。"],
  ["operator", "内容运营 / 新媒体团队", "需要把零散需求快速转成可执行的内容 Brief。"],
  ["builder", "AI 写作产品设计者", "关注如何把 Agent 对话转化成可复用的产品结构。"],
] as const;

const materialOptions = [
  ["conversation", "优先使用对话素材", "保留原始想法、关键回答和需求澄清过程。"],
  ["web", "优先使用联网资料", "补充 AI 写作、创作者工具、Agent 产品相关链接。"],
  ["mixed", "对话素材 + 联网资料混合", "既保留用户输入，也关联外部参考链接。"],
] as const;

const audienceMap = {
  creator: "刚开始做自媒体、经常卡在选题阶段的个人创作者和知识博主",
  operator: "内容运营、新媒体团队，以及需要把零散需求整理成内容 Brief 的协作者",
  builder: "AI 写作产品设计者、内容工具产品经理，以及关注 Agent 交互结构的团队",
};

function extractUrls(text: string): Material[] {
  return (text.match(/https?:\/\/[^\s，。；、)）]+/g) ?? []).map((url, index) => ({
    title: index === 0 ? "用户输入的参考链接" : "用户补充的参考链接",
    url,
    type: "用户链接",
  }));
}

function mergeMaterials(primary: Material[], secondary: Material[]) {
  const seen = new Set<string>();
  return primary.concat(secondary).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function inferDraftFromRaw(text: string): Brief {
  const urls = extractUrls(text);
  const key = /产品|页面|工作台|流程|Clarification|原型/.test(text)
    ? "product"
    : /观点|不是|代写|想清楚|判断|表达/.test(text)
      ? "opinion"
      : "method";
  const preset = presets[key];

  return {
    rawNeed: text,
    selectedDirection: key,
    topic: preset.topic,
    audience: preset.audience,
    thesis: preset.thesis,
    materials: urls.length ? mergeMaterials(urls, preset.materials) : preset.materials.slice(),
  };
}

function materialFallback(materials: Material[]) {
  return materials.length
    ? materials
    : [{ title: "原始需求与澄清对话", url: "conversation://initial-idea", type: "对话素材" } satisfies Material];
}

export default function ClarifyPage() {
  const [phase, setPhase] = useState<"initial" | "clarifying" | "card">("initial");
  const [questionCount, setQuestionCount] = useState(0);
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [chatItems, setChatItems] = useState<ChatItem[]>([{ id: "welcome-0", kind: "welcome" }]);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState("已更新");
  const [toastVisible, setToastVisible] = useState(false);
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const nextIdRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollEl = chatScrollRef.current;
    if (!scrollEl) return;

    requestAnimationFrame(() => {
      scrollEl.scrollTop = phase === "initial" ? 0 : scrollEl.scrollHeight;
    });
  }, [chatItems.length, phase]);

  function nextId(prefix: string) {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  }

  function showToast(text: string) {
    setToast(text);
    setToastVisible(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 1800);
  }

  function appendItems(items: ChatItem[]) {
    setChatItems((current) => current.concat(items));
  }

  function appendMessage(role: "agent" | "user", text: string, meta: string): ChatItem {
    return { id: nextId(role), kind: "message", role, text, meta };
  }

  function lockItem(id: string, selected?: string) {
    setChatItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (item.kind === "welcome" || item.kind === "question") return { ...item, locked: true, selected };
        if (item.kind === "confirm") return { ...item, locked: true, selected: selected as "confirm" | "continue" };
        return item;
      }),
    );
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

  function handleExample(itemId: string, value: string) {
    setInput(value);
    lockItem(itemId, value);
    showToast("已填入示例想法");
  }

  function handleInitialInput(text: string) {
    setPhase("clarifying");
    setBrief(inferDraftFromRaw(text));
    setQuestionCount(1);
    appendItems([
      appendMessage("user", text, "原始想法"),
      appendMessage("agent", "我已经捕捉到原始需求。接下来我最多追问 3 次。先确认第一点：这篇文章更像方法论、产品解释，还是观点评论？", "追问 1 / 3"),
      { id: nextId("question"), kind: "question", step: 1 },
    ]);
  }

  function selectDirection(itemId: string, key: keyof typeof presets) {
    const preset = presets[key];
    const nextBrief: Brief = {
      ...brief,
      selectedDirection: key,
      topic: preset.topic,
      audience: preset.audience,
      thesis: preset.thesis,
      materials: mergeMaterials(extractUrls(brief.rawNeed), preset.materials),
    };

    lockItem(itemId, key);
    setBrief(nextBrief);
    setQuestionCount(2);
    appendItems([
      appendMessage("user", preset.user, "回答追问 1"),
      appendMessage("agent", "收到。我会按这个方向收敛主题。接下来只再追问两个关键问题，避免澄清过程过长。", "继续澄清"),
      { id: nextId("question"), kind: "question", step: 2 },
    ]);
  }

  function selectAudience(itemId: string, key: keyof typeof audienceMap) {
    lockItem(itemId, key);
    setBrief((current) => ({ ...current, audience: audienceMap[key] }));
    setQuestionCount(3);
    appendItems([
      appendMessage("user", audienceOptions.find(([value]) => value === key)?.[1] ?? "已选择读者", "回答追问 2"),
      appendMessage("agent", "读者已经更明确。最后我需要确认素材来源，这会决定最终卡片里的材料清单如何组织。", "继续澄清"),
      { id: nextId("question"), kind: "question", step: 3 },
    ]);
  }

  function selectMaterial(itemId: string, key: "conversation" | "web" | "mixed") {
    lockItem(itemId, key);
    const nextMaterials: Material[] =
      key === "conversation"
        ? mergeMaterials([
            { title: "原始想法与需求澄清对话", url: "conversation://initial-idea", type: "对话素材" },
            { title: "用户关于目标读者与写作方向的回答", url: "conversation://clarification-answers", type: "对话素材" },
          ], extractUrls(brief.rawNeed))
        : key === "web"
          ? mergeMaterials([], [
              { title: "AI 写作与 Agent 能力相关资料", url: "https://openai.com/research/", type: "联网资料" },
              { title: "创作者工具与开发者实践参考", url: "https://developers.googleblog.com/", type: "联网资料" },
            ] satisfies Material[])
          : mergeMaterials(extractUrls(brief.rawNeed), brief.materials);

    setBrief((current) => ({ ...current, materials: nextMaterials }));
    appendItems([
      appendMessage("user", materialOptions.find(([value]) => value === key)?.[1] ?? "已选择素材来源", "回答追问 3"),
      appendMessage("agent", "五个字段已经识别完整：原始需求、写作主题、目标读者、核心观点和素材清单。请确认是否沉淀为写作意图卡片。", "澄清完成"),
      { id: nextId("confirm"), kind: "confirm" },
    ]);
  }

  function confirmCard(itemId: string) {
    lockItem(itemId, "confirm");
    setPhase("card");
    flashCards(["raw", "topic", "audience", "thesis", "materials"]);
    appendItems([appendMessage("agent", "已生成并保存到当前写作项目。你可以继续在右侧补充，我会把新的澄清结果同步更新到左侧卡片。", "已沉淀")]);
    showToast("写作意图卡片已生成");
  }

  function continueClarifying(itemId: string) {
    lockItem(itemId, "continue");
    appendItems([
      appendMessage("user", "我想再补充一句。", "继续澄清"),
      appendMessage("agent", "可以。你可以直接输入补充内容。如果补充会影响主题、读者、观点或素材，我会在生成卡片时一并吸收。", "等待补充"),
    ]);
  }

  function handleClarifyingSupplement(text: string) {
    const urls = extractUrls(text);
    setBrief((current) => {
      const next = { ...current };
      if (urls.length) next.materials = mergeMaterials(urls, next.materials);
      if (/读者|用户|人群|新手|创作者|运营|产品经理|团队/.test(text)) next.audience = text.replace(/^写给|^我想写给/, "");
      else if (/主题|标题|选题|写一篇|方向/.test(text)) next.topic = text;
      else if (/观点|主张|认为|不是|而是|核心|表达/.test(text)) next.thesis = text;
      else if (/素材|案例|链接|资料|参考|https?:\/\//.test(text)) next.materials = mergeMaterials(urls, next.materials);
      return next;
    });
    appendItems([
      appendMessage("user", text, "补充说明"),
      appendMessage("agent", "已吸收这条补充。当前五个字段已经足够完整，可以确认生成写作意图卡片。", "等待确认"),
      { id: nextId("confirm"), kind: "confirm" },
    ]);
  }

  function handleCardUpdate(text: string) {
    const urls = extractUrls(text);
    const changed: string[] = [];

    setBrief((current) => {
      const next = { ...current };
      if (urls.length) next.materials = mergeMaterials(urls, next.materials);
      if (/读者|用户|人群|新手|创作者|运营|产品经理|团队/.test(text)) {
        next.audience = text.replace(/^写给|^我想写给/, "");
        changed.push("目标读者");
      }
      if (/主题|标题|选题|写一篇|方向/.test(text)) {
        next.topic = text;
        changed.push("写作主题");
      }
      if (/观点|主张|认为|不是|而是|核心|表达/.test(text)) {
        next.thesis = text;
        changed.push("核心观点");
      }
      if (!changed.length && !urls.length) {
        next.rawNeed = `${next.rawNeed}\n补充：${text}`;
        changed.push("原始需求");
      }
      return next;
    });

    if (urls.length) flashCard("materials");
    if (changed.includes("目标读者")) flashCard("audience");
    if (changed.includes("写作主题")) flashCard("topic");
    if (changed.includes("核心观点")) flashCard("thesis");
    if (changed.includes("原始需求")) flashCard("raw");

    const changeText = changed.length ? changed.join("、") : "素材清单";
    appendItems([
      appendMessage("user", text, "补充澄清"),
      appendMessage("agent", `已根据你的补充更新左侧卡片：${changeText}。卡片仍保存在当前写作项目中。`, "已同步更新"),
    ]);
    showToast("已同步更新卡片");
  }

  function sendCurrentInput() {
    const text = input.trim();
    if (!text) {
      showToast("先输入一点原始想法");
      return;
    }

    setInput("");
    if (phase === "initial") handleInitialInput(text);
    else if (phase === "card") handleCardUpdate(text);
    else handleClarifyingSupplement(text);
  }

  function restart() {
    nextIdRef.current = 0;
    setPhase("initial");
    setQuestionCount(0);
    setBrief(initialBrief);
    setChatItems([{ id: "welcome-0", kind: "welcome" }]);
    setInput("");
    setUpdatedCards(new Set());
    showToast("已重新开始");
  }

  const statusText = phase === "initial" ? "等待输入原始想法" : phase === "card" ? "已保存到写作项目" : questionCount ? `动态澄清中 · ${questionCount} / 3` : "等待确认生成卡片";

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

        <section className="fdc-panel fdc-chat-panel" aria-label="右侧 Agent 对话区">
          <div className="fdc-panel-header">
            <div className="fdc-panel-title">
              <h2>Agent 对话</h2>
              <p>首条 Welcome 卡片默认在顶部；中间会话历史滚动；底部输入框固定。</p>
            </div>
            <span className="fdc-agent-badge">{phase === "card" ? "Saved Intent" : "Intent Agent"}</span>
          </div>

          <div className="fdc-chat-scroll" ref={chatScrollRef} aria-label="会话历史滚动区">
            <div className="fdc-chat-stack" aria-live="polite">
              {chatItems.map((item) => {
                if (item.kind === "welcome") return <WelcomeCard key={item.id} item={item} onExample={handleExample} />;
                if (item.kind === "message") return <ChatMessage key={item.id} item={item} />;
                if (item.kind === "question") return <QuestionCard key={item.id} item={item} onDirection={selectDirection} onAudience={selectAudience} onMaterial={selectMaterial} />;
                return <ConfirmCard key={item.id} item={item} brief={brief} onConfirm={confirmCard} onContinue={continueClarifying} />;
              })}
            </div>
          </div>

          <div className="fdc-bottom-dock" aria-label="固定底部输入区">
            <div className="fdc-composer">
              <div className="fdc-composer-box">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendCurrentInput();
                    }
                  }}
                  placeholder="输入模糊原始想法，例如：我想写一篇关于 AI Agent 如何帮助创作者澄清选题的文章…"
                />
                <div className="fdc-mini-tools" aria-label="输入工具">
                  <button className="fdc-icon-btn" type="button" title="添加链接" onClick={() => setInput((value) => `${value ? `${value} ` : ""}https://`)}>＋</button>
                  <button className="fdc-icon-btn" type="button" title="清空输入" onClick={() => setInput("")}>⌫</button>
                </div>
              </div>
              <button className="fdc-send-btn" type="button" aria-label="发送" onClick={sendCurrentInput}>↑</button>
            </div>
          </div>
        </section>
      </section>

      <div className={cn("fdc-toast", toastVisible && "show")} role="status">{toast}</div>
    </main>
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

function WelcomeCard({ item, onExample }: { item: Extract<ChatItem, { kind: "welcome" }>; onExample: (itemId: string, value: string) => void }) {
  return (
    <div className="fdc-welcome-message">
      <div className="fdc-avatar">AI</div>
      <section className={cn("fdc-welcome-card", "fdc-interaction-card", item.locked && "locked")} aria-label="Welcome 引导卡片">
        <div>
          <h3 className="fdc-welcome-title">先说一个粗糙想法就可以。</h3>
          <p className="fdc-welcome-copy">你不需要整理成字段。我会帮你判断：这篇文章想写什么、写给谁、核心观点是什么，以及有哪些可关联素材。</p>
          <div className="fdc-welcome-tags">
            <span>最多 3 次动态追问</span>
            <span>确认后生成卡片</span>
            <span>支持链接素材识别</span>
          </div>
        </div>
        <div className="fdc-example-grid" aria-label="示例想法">
          {exampleIdeas.map((example) => (
            <button
              className={cn("fdc-example-card", item.selected === example.value && "selected")}
              type="button"
              disabled={item.locked}
              key={example.title}
              onClick={() => onExample(item.id, example.value)}
            >
              <strong>{example.title}</strong>
              <span>{example.copy}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ item }: { item: Extract<ChatItem, { kind: "message" }> }) {
  return (
    <div className={cn("fdc-message", item.role)}>
      <div className="fdc-avatar">{item.role === "user" ? "你" : "AI"}</div>
      <div className="fdc-bubble">
        <p>{item.text}</p>
        <span>{item.meta}</span>
      </div>
    </div>
  );
}

function QuestionCard({ item, onDirection, onAudience, onMaterial }: { item: Extract<ChatItem, { kind: "question" }>; onDirection: (itemId: string, key: keyof typeof presets) => void; onAudience: (itemId: string, key: keyof typeof audienceMap) => void; onMaterial: (itemId: string, key: "conversation" | "web" | "mixed") => void }) {
  const title = item.step === 1 ? "追问 1 / 3：这篇文章更像哪种方向？" : item.step === 2 ? "追问 2 / 3：目标读者需要再收窄吗？" : "追问 3 / 3：素材来源优先使用哪类？";
  const copy = item.step === 1 ? "我会根据你的选择收敛写作主题。左侧仍保持引导说明，不展示草稿。" : item.step === 2 ? "如果读者越具体，后面的主题和观点会更稳定。" : "素材清单会关联用户输入链接、对话片段，以及 Agent 根据意图提取的联网资料链接。";

  return (
    <div className={cn("fdc-question-card", "fdc-interaction-card", item.locked && "locked")}>
      <h3>{title}</h3>
      <p>{copy}</p>
      <div className="fdc-option-grid">
        {item.step === 1
          ? directionOptions.map(([key, label, desc]) => <OptionButton key={key} selected={item.selected === key} disabled={item.locked} label={label} desc={desc} onClick={() => onDirection(item.id, key)} />)
          : item.step === 2
            ? audienceOptions.map(([key, label, desc]) => <OptionButton key={key} selected={item.selected === key} disabled={item.locked} label={label} desc={desc} onClick={() => onAudience(item.id, key)} />)
            : materialOptions.map(([key, label, desc]) => <OptionButton key={key} selected={item.selected === key} disabled={item.locked} label={label} desc={desc} onClick={() => onMaterial(item.id, key)} />)}
      </div>
    </div>
  );
}

function OptionButton({ label, desc, selected, disabled, onClick }: { label: string; desc: string; selected?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button className={cn("fdc-option-btn", selected && "selected")} type="button" disabled={disabled} onClick={onClick}>
      <strong>{label}</strong>
      <span>{desc}</span>
    </button>
  );
}

function ConfirmCard({ item, brief, onConfirm, onContinue }: { item: Extract<ChatItem, { kind: "confirm" }>; brief: Brief; onConfirm: (itemId: string) => void; onContinue: (itemId: string) => void }) {
  return (
    <div className={cn("fdc-confirm-card", "fdc-interaction-card", item.locked && "locked")}>
      <h3>可以沉淀为写作意图卡片了</h3>
      <p>Agent 已识别出完整字段。确认后，左侧将从引导说明切换为结构化卡片，并保存到当前写作项目。</p>
      <div className="fdc-draft-table">
        <div><span>写作主题</span><span>{brief.topic || "—"}</span></div>
        <div><span>目标读者</span><span>{brief.audience || "—"}</span></div>
        <div><span>核心观点</span><span>{brief.thesis || "—"}</span></div>
      </div>
      <div className="fdc-confirm-actions">
        <button className={cn("fdc-primary-btn", item.selected === "confirm" && "selected")} type="button" disabled={item.locked} onClick={() => onConfirm(item.id)}>确认生成卡片</button>
        <button className={cn("fdc-ghost-btn", item.selected === "continue" && "selected")} type="button" disabled={item.locked} onClick={() => onContinue(item.id)}>继续补充一句</button>
      </div>
    </div>
  );
}
