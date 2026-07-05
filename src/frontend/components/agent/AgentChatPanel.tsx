"use client";

import { CopilotChatMessageView, useDefaultRenderTool } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { AgentAssistantMessage, AgentUserMessage, agentMessageViewClassName } from "./AgentMessageBubbles";
import { useAgentChatController, type AgentChatController } from "./useAgentChatController";

export interface AgentChatExample {
  title: string;
  copy: string;
  value: string;
}

export interface AgentChatEmptyStateConfig {
  title: string;
  description: string;
  examples: AgentChatExample[];
}

export interface AgentChatPanelProps {
  agentId: string;
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  idleBadge?: ReactNode;
  runningBadge?: ReactNode;
  placeholder?: string;
  emptyState: AgentChatEmptyStateConfig;
  onError?: (error: unknown) => void;
  /** 挂载该面板对应的业务 ToolHost（useFrontendTool / useHumanInTheLoop / useAgentContext 的调用方）。 */
  children?: ReactNode;
}

/**
 * 通用 Agent 对话面板：负责布局、消息渲染、空状态、输入区和运行状态展示。
 * 不感知任何具体业务字段或工具，业务能力通过 children（ToolHost）注入。
 */
export function AgentChatPanel({
  agentId,
  className,
  title,
  description,
  idleBadge = "Idle",
  runningBadge = "Thinking",
  placeholder,
  emptyState,
  onError,
  children,
}: AgentChatPanelProps) {
  const chat = useAgentChatController({ agentId, onError });

  // 通用兜底渲染：所有接入页面统一具备，不必在各自 ToolHost 里重复调用。
  useDefaultRenderTool();

  return (
    <section className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)} aria-label="Agent 对话区">
      {children}

      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Badge variant={chat.isRunning ? "default" : "outline"} className="shrink-0">
          {chat.isRunning ? runningBadge : idleBadge}
        </Badge>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="会话历史滚动区">
        {chat.hasMessages ? (
          <CopilotChatMessageView
            className={agentMessageViewClassName}
            messages={[...chat.messages]}
            isRunning={chat.isRunning}
            userMessage={AgentUserMessage}
            assistantMessage={AgentAssistantMessage}
          />
        ) : (
          <AgentChatEmptyState config={emptyState} disabled={chat.isRunning} onPickExample={chat.setInput} />
        )}
      </div>

      <AgentChatComposer chat={chat} placeholder={placeholder} />
    </section>
  );
}

function AgentChatEmptyState({
  config,
  disabled,
  onPickExample,
}: {
  config: AgentChatEmptyStateConfig;
  disabled: boolean;
  onPickExample: (value: string) => void;
}) {
  return (
    <section className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center" aria-label="空状态">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 text-left shadow-xs">
        <h3 className="text-base font-semibold text-card-foreground">{config.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{config.description}</p>

        {config.examples.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="示例想法">
            {config.examples.map((example) => (
              <button
                key={example.title}
                type="button"
                disabled={disabled}
                onClick={() => onPickExample(example.value)}
                className="rounded-xl border border-border bg-background p-3 text-left text-sm transition hover:border-primary/50 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <strong className="block text-foreground">{example.title}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{example.copy}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AgentChatComposer({ chat, placeholder }: { chat: AgentChatController; placeholder?: string }) {
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <Textarea
          rows={1}
          value={chat.input}
          disabled={chat.isRunning}
          placeholder={chat.isRunning ? "Agent 正在思考…" : placeholder}
          onChange={(event) => chat.setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void chat.sendCurrentInput();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          aria-label={chat.isRunning ? "停止生成" : "发送消息"}
          title={chat.isRunning ? "停止生成" : "发送消息 (Enter)"}
          onClick={() => (chat.isRunning ? chat.abort() : void chat.sendCurrentInput())}
        >
          {chat.isRunning ? "■" : "↑"}
        </Button>
      </div>
    </div>
  );
}
