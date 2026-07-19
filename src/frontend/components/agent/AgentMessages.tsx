"use client";

import { CopilotChatAssistantMessage, CopilotChatUserMessage } from "@copilotkit/react-core/v2";
import type { ComponentProps } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import styles from "./AgentMessages.module.css";

/**
 * 通用消息区域容器 className。用户/助手消息气泡由本文件统一管理，
 * 不对外暴露 userMessage/assistantMessage 自定义 props。
 */
export const agentMessageViewClassName = styles.messageView;

export const AgentUserMessage = Object.assign(function AgentUserMessage(
  props: ComponentProps<typeof CopilotChatUserMessage>,
) {
  return (
    <div className={cn(styles.messageRow, styles.userRow)}>
      <CopilotChatUserMessage
        {...props}
        className={cn(styles.userMessage, props.className)}
        messageRenderer={({ content, className }) => (
          <CopilotChatUserMessage.MessageRenderer
            content={content}
            className={cn(styles.userBubble, className)}
          />
        )}
        toolbar={() => null}
      />
      <Avatar size="sm" className={styles.userAvatar}>
        <AvatarFallback className={styles.userAvatarFallback}>你</AvatarFallback>
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
      <div className={cn(styles.messageRow, styles.assistantRow, styles.toolRow)}>
        <Avatar size="sm">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <CopilotChatAssistantMessage
          {...props}
          className={cn(styles.assistantMessage, props.className)}
          markdownRenderer={() => null}
          toolbar={() => null}
        />
      </div>
    );
  }

  return (
    <div className={cn(styles.messageRow, styles.assistantRow)}>
      <Avatar size="sm">
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <CopilotChatAssistantMessage
        {...props}
        className={cn(styles.assistantMessage, props.className)}
        markdownRenderer={({ content, className, ...markdownProps }) => (
          <div className={styles.assistantBubble}>
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
