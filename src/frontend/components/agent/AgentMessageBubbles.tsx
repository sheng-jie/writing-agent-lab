"use client";

import { CopilotChatAssistantMessage, CopilotChatUserMessage } from "@copilotkit/react-core/v2";
import type { ComponentProps } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * 通用消息区域容器 className。用户/助手消息气泡由本文件统一管理，
 * 不对外暴露 userMessage/assistantMessage 自定义 props。
 */
export const agentMessageViewClassName = "flex min-h-full flex-col gap-3";

export const AgentUserMessage = Object.assign(function AgentUserMessage(
  props: ComponentProps<typeof CopilotChatUserMessage>,
) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_34px] items-start gap-2.5 self-end">
      <CopilotChatUserMessage
        {...props}
        className={cn("col-start-1 row-start-1 min-w-0", props.className)}
        messageRenderer={({ content, className }) => (
          <CopilotChatUserMessage.MessageRenderer
            content={content}
            className={cn(
              "ml-auto w-fit max-w-full rounded-2xl border border-primary bg-primary px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground shadow-xs",
              className,
            )}
          />
        )}
        toolbar={() => null}
      />
      <Avatar size="sm" className="col-start-2">
        <AvatarFallback className="bg-primary text-primary-foreground">你</AvatarFallback>
      </Avatar>
    </div>
  );
}, CopilotChatUserMessage);

export const AgentAssistantMessage = Object.assign(function AgentAssistantMessage(
  props: ComponentProps<typeof CopilotChatAssistantMessage>,
) {
  const content = typeof props.message.content === "string" ? props.message.content.trim() : "";
  const hasToolCalls = Boolean(props.message.toolCalls?.length);

  if (!content && !hasToolCalls) {
    return null;
  }

  if (!content && hasToolCalls) {
    return (
      <div className="my-1 grid grid-cols-[34px_minmax(0,1fr)] items-start gap-2.5">
        <Avatar size="sm">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <CopilotChatAssistantMessage
          {...props}
          className={cn("min-w-0", props.className)}
          markdownRenderer={() => null}
          toolbar={() => null}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] items-start gap-2.5">
      <Avatar size="sm">
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <CopilotChatAssistantMessage
        {...props}
        className={cn("min-w-0", props.className)}
        markdownRenderer={({ content, className, ...markdownProps }) => (
          <div className="w-fit max-w-full rounded-2xl border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-card-foreground shadow-xs [&_:where(p+p,p+ul,p+ol,ul+p,ol+p)]:mt-2">
            <CopilotChatAssistantMessage.MarkdownRenderer
              {...markdownProps}
              content={content}
              className={className}
            />
          </div>
        )}
        toolbar={() => null}
      />
    </div>
  );
}, CopilotChatAssistantMessage);
