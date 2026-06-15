"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

// 最小聊天页面组件：只负责展示 CopilotChat。
function ClarificationAgentChat() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-sm text-slate-500">.NET + AI Agent 最小网页闭环</p>
        <h1 className="text-3xl font-bold tracking-tight">Clarification Agent</h1>
        <p className="text-slate-600">
          输入一个模糊写作想法，让 CopilotKit 通过 AG-UI 调用 .NET Minimal API 中的 Clarification Agent，返回澄清问题或一份 Writing Brief。
        </p>
      </header>

      <div className="min-h-[560px] rounded-2xl border bg-white shadow-sm">
        <CopilotChat
          labels={{
            title: "写作意图澄清助手",
            initial: "你好，我可以帮你把模糊写作想法澄清成一份可执行的 Writing Brief。",
            placeholder: "例如：我想写一篇关于 DeepSeek 和 AI Coding 的文章……",
          }}
        />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    // runtimeUrl 指向 Next.js 中的 /api/copilotkit；agent 名称要和 route.ts 中注册的一致。
    <CopilotKit runtimeUrl="/api/copilotkit" agent="clarificationAgent">
      <ClarificationAgentChat />
    </CopilotKit>
  );
}
