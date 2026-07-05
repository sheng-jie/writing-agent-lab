"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { Fragment } from "react";

import { AgentChatPanel } from "@/components/agent/AgentChatPanel";
import { cn } from "@/lib/utils";

import "./clarify.css";
import { ClarifyBriefPanel } from "./ClarifyBriefPanel";
import { ClarifyCopilotTools } from "./ClarifyCopilotTools";
import { useClarifyBriefController } from "./useClarifyBriefController";

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
];

export default function ClarifyPage() {
  return (
    <main className="fd-clarify">
      <CopilotKit
        runtimeUrl="/api/copilotkit"
        agent="clarificationAgent"
        useSingleEndpoint
        showDevConsole={process.env.NODE_ENV !== "production"}
      >
        <ClarifyWorkspace />
      </CopilotKit>
    </main>
  );
}

// useClarifyBriefController 内部调用 useAgentContext，必须在 <CopilotKit> 后代组件中执行，
// 因此单独拆出这一层，page.tsx 本身不直接调用它。
function ClarifyWorkspace() {
  const brief = useClarifyBriefController();
  const statusText = brief.phase === "initial" ? "等待输入原始想法" : brief.phase === "card" ? "已保存到写作项目" : "动态澄清中";

  return (
    // 用 Fragment 而不是 div 承载 resetKey：.fd-clarify 的 CSS Grid（grid-template-rows: auto minmax(0,1fr)）
    // 依赖 header/section/toast 是它的直接子元素，多包一层 div 会让整个工作区失去高度约束而整页滚动。
    <Fragment key={brief.resetKey}>
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
          {brief.phase === "card" ? <button className="fdc-ghost-btn" type="button" onClick={brief.restart}>重新开始</button> : null}
        </div>
      </header>

      <section className="fdc-workspace" aria-label="写作意图识别工作区">
        <ClarifyBriefPanel controller={brief} />

        <AgentChatPanel
          agentId="clarificationAgent"
          className="fdc-panel fdc-chat-panel"
          title="Agent 对话"
          description="通过对话澄清写作意图。"
          placeholder="输入模糊原始想法，例如：我想写一篇关于 AI Agent 如何帮助创作者澄清选题的文章…"
          idleBadge={brief.phase === "card" ? "Saved Intent" : "Intent Agent"}
          runningBadge="Thinking"
          emptyState={{
            title: "先说一个粗糙想法就可以。",
            description: "你可以直接输入，也可以点选一个示例。示例只会先填入底部输入框，确认后再由你手动发送给 Agent。",
            examples: exampleIdeas,
          }}
          onError={() => brief.notify("Agent 出错了，请稍后重试")}
        >
          <ClarifyCopilotTools controller={brief} />
        </AgentChatPanel>
      </section>

      <div className={cn("fdc-toast", brief.toast.visible && "show")} role="status">{brief.toast.text}</div>
    </Fragment>
  );
}


