"use client";

import { CopilotChatMessageView, useDefaultRenderTool } from "@copilotkit/react-core/v2";
import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { AgentInput } from "./AgentInput";
import { AgentAssistantMessage, AgentUserMessage, agentMessageViewClassName } from "./AgentMessages";
import { AgentWelcome, type AgentWelcomeConfig } from "./AgentWelcome";
import { useAgentChat } from "./useAgentChat";

export interface AgentPanelProps {
  agentId: string;
  ref?: Ref<AgentPanelRef>;
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  idleBadge?: ReactNode;
  runningBadge?: ReactNode;
  placeholder?: string;
  /** 首屏欢迎引导：未产生任何消息前展示，有消息后自动退出。不是空状态提示，而是主动引导。 */
  welcome: AgentWelcomeConfig;
  onError?: (error: unknown) => void;
  onRunningChange?: (running: boolean) => void;
  /** 挂载该面板对应的业务 ToolHost（useFrontendTool / useHumanInTheLoop / useAgentContext 的调用方）。 */
  children?: ReactNode;
}

export interface AgentPanelRef {
  reset: () => void;
}

/**
 * 通用 Agent 对话面板：负责布局、消息渲染、空状态、输入区和运行状态展示。
 * 不感知任何具体业务字段或工具，业务能力通过 children（ToolHost）注入。
 */
export function AgentPanel({
  agentId,
  ref,
  className,
  title,
  description,
  idleBadge = "Idle",
  runningBadge = "Thinking",
  placeholder,
  welcome,
  onError,
  onRunningChange,
  children,
}: AgentPanelProps) {
  const chat = useAgentChat({ agentId, onError });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ reset: chat.clearMessages }), [chat.clearMessages]);

  // 通用兜底渲染：所有接入页面统一具备，不必在各自 ToolHost 里重复调用。
  useDefaultRenderTool();

  // CopilotChatMessageView 的自动滚动依赖库内部未对外导出的 ScrollElementContext
  // （只在 CopilotChatView 组合组件里可用），我们自建滚动容器时需要自己维护滚动到底部。
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.isRunning]);

  useEffect(() => {
    onRunningChange?.(chat.isRunning);
  }, [chat.isRunning, onRunningChange]);

  return (
    <section className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)} aria-label="Agent 对话区">
      {children}

      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 truncate text-xs leading-4 text-muted-foreground">{description}</p> : null}
        </div>
        <Badge variant={chat.isRunning ? "default" : "outline"} className="mt-0.5 shrink-0">
          {chat.isRunning ? runningBadge : idleBadge}
        </Badge>
      </header>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="会话历史滚动区">
        {chat.hasMessages ? (
          <CopilotChatMessageView
            className={agentMessageViewClassName}
            messages={[...chat.messages]}
            isRunning={chat.isRunning}
            userMessage={AgentUserMessage}
            assistantMessage={AgentAssistantMessage}
          />
        ) : (
          <AgentWelcome
            config={welcome}
            disabled={chat.isRunning}
            onFillExample={chat.setInput}
            onSendExample={(value) => void chat.send(value)}
          />
        )}
      </div>

      <AgentInput chat={chat} placeholder={placeholder} />
    </section>
  );
}
